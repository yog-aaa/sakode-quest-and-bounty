/**
 * SAKODE Task & Reward Platform - Super Admin Management Service
 * Menangani wewenang khusus Super Administrator:
 * - Pengangkatan & pencabutan hak akses staf Administrator (promoteToAdmin, demoteToMember)
 * - Perekaman alasan wajib pada audit log permanen
 * - Pengawasan konfigurasi operasional platform
 * 
 * Strict Invariants:
 * 1. Hanya akun SUPER_ADMIN yang berhak memutasi role admin.
 * 2. Seluruh mutasi hak akses WAJIB mencantumkan alasan tertulis (min 15 karakter).
 * 3. Super Admin dilarang mencabut akses dirinya sendiri untuk mencegah lockout sistem.
 * 4. Audit Immutability: Mutasi role dicatat secara append-only di auditEvents.
 */

import { getAdminFirestore, getAdminAuth } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { USER_ROLES, USER_APPROVAL_STATUS } from '@/lib/constants';
import {
  adminRoleManagementSchema,
  type AdminRoleManagementInput,
} from '@/lib/validations/report';
import type { UserDocument, FirestoreDate, AuditEventDocument } from '@/types/database';

/**
 * Helper untuk verifikasi hak akses eksklusif Super Admin
 */
async function assertSuperAdminPrivilege(superAdminUid: string): Promise<UserDocument> {
  const db = getAdminFirestore();
  const userSnap = await db.collection('users').doc(superAdminUid).get();
  if (!userSnap.exists) {
    throw new Error('Data pengguna tidak ditemukan.');
  }
  const userData = userSnap.data() as UserDocument;
  if (userData.role !== USER_ROLES.SUPER_ADMIN) {
    throw new Error('Akses ditolak: Operasi ini membutuhkan hak istimewa Super Administrator.');
  }
  return userData;
}

/**
 * 1. Mengangkat atau Mencabut Hak Akses Staf Admin (manageAdminRole)
 */
export async function manageAdminRole(
  superAdminUid: string,
  input: AdminRoleManagementInput
): Promise<UserDocument> {
  const superAdminData = await assertSuperAdminPrivilege(superAdminUid);
  const validated = adminRoleManagementSchema.parse(input);
  const db = getAdminFirestore();

  // Cegah lockout: Super Admin dilarang mendemote dirinya sendiri
  if (superAdminUid === validated.targetUserId && validated.action === 'DEMOTE') {
    throw new Error(
      'Tindakan Ditolak: Anda tidak dapat mencabut hak akses Super Admin pada akun Anda sendiri demi mencegah lockout sistem.'
    );
  }

  return await db.runTransaction(async (transaction) => {
    const targetUserRef = db.collection('users').doc(validated.targetUserId);
    const targetUserSnap = await transaction.get(targetUserRef);

    if (!targetUserSnap.exists) {
      throw new Error('Pengguna target tidak ditemukan.');
    }

    const targetUserData = targetUserSnap.data() as UserDocument;

    const newRole =
      validated.action === 'PROMOTE' ? USER_ROLES.ADMIN : USER_ROLES.MEMBER;

    if (targetUserData.role === newRole) {
      throw new Error(`Pengguna sudah memiliki role ${newRole}.`);
    }

    const beforeSnapshot = {
      role: targetUserData.role,
      email: targetUserData.email,
      displayName: targetUserData.displayName,
    };

    const afterSnapshot = {
      role: newRole,
      email: targetUserData.email,
      displayName: targetUserData.displayName,
    };

    // Update Firestore Document
    transaction.update(targetUserRef, {
      role: newRole,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Catat Audit Trail Permanen
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: superAdminUid,
      actorRole: USER_ROLES.SUPER_ADMIN,
      actorName: superAdminData.displayName || superAdminData.email,
      action: validated.action === 'PROMOTE' ? 'ADMIN_PROMOTED' : 'ADMIN_DEMOTED',
      entityType: 'USER_ROLE',
      entityId: validated.targetUserId,
      beforeSnapshot,
      afterSnapshot,
      metadata: {
        action: validated.action,
        targetEmail: targetUserData.email,
      },
      reason: validated.reason,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ...targetUserData,
      role: newRole,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    };
  }).then(async (updatedUser) => {
    // Sinkronisasi Firebase Auth Custom Claims di luar transaksi
    try {
      await getAdminAuth().setCustomUserClaims(validated.targetUserId, {
        role: updatedUser.role,
        approvalStatus: updatedUser.approvalStatus,
      });
    } catch (authError) {
      console.warn('Gagal memperbarui Auth Custom Claims pengguna:', authError);
    }
    return updatedUser;
  });
}

/**
 * 2. Mengambil Seluruh Staf Admin & Super Admin (getAdminStaffList)
 */
export async function getAdminStaffList(superAdminUid: string): Promise<UserDocument[]> {
  await assertSuperAdminPrivilege(superAdminUid);
  const db = getAdminFirestore();

  const snapshot = await db
    .collection('users')
    .where('role', 'in', [USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN])
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as UserDocument),
    id: doc.id,
  }));
}

/**
 * 3. Mengambil Anggota Layak untuk Promosi Menjadi Admin (getEligibleMembersForPromotion)
 */
export async function getEligibleMembersForPromotion(
  superAdminUid: string
): Promise<UserDocument[]> {
  await assertSuperAdminPrivilege(superAdminUid);
  const db = getAdminFirestore();

  const snapshot = await db
    .collection('users')
    .where('role', '==', USER_ROLES.MEMBER)
    .where('approvalStatus', '==', 'APPROVED')
    .limit(30)
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as UserDocument),
    id: doc.id,
  }));
}

export interface AdminDashboardOverviewData {
  pendingMembersCount: number;
  tasksNeedingActionCount: number;
  openTasksCount: number;
  pendingSubmissionsCount: number;
  pendingClaimsCount: number;
  totalDisbursedBounty: number;
  activeReportsCount: number;
  appealedSubmissionsCount: number;
  recentAuditEvents: AuditEventDocument[];
}

/**
 * 4. Agregasi Metrik Operasional Real-time Dashboard Admin
 */
export async function getAdminDashboardOverview(
  adminUid: string
): Promise<AdminDashboardOverviewData> {
  const db = getAdminFirestore();

  // Verifikasi wewenang admin
  const userSnap = await db.collection('users').doc(adminUid).get();
  if (!userSnap.exists) {
    throw new Error('Data admin tidak ditemukan.');
  }
  const userData = userSnap.data() as UserDocument;
  if (userData.role !== USER_ROLES.ADMIN && userData.role !== USER_ROLES.SUPER_ADMIN) {
    throw new Error('Akses ditolak: Operasi ini membutuhkan hak istimewa Admin.');
  }

  // 1. Pending members
  let pendingMembersCount = 0;
  try {
    const snap = await db
      .collection('users')
      .where('approvalStatus', '==', USER_APPROVAL_STATUS.PENDING)
      .count()
      .get();
    pendingMembersCount = snap.data().count;
  } catch (e) {
    console.warn('Count pending members fallback:', e);
  }

  // 2. Tasks needing action (Draft or Application Review) & Open
  let tasksNeedingActionCount = 0;
  let openTasksCount = 0;
  try {
    const draftSnap = await db.collection('tasks').where('status', '==', 'DRAFT').count().get();
    const appSnap = await db
      .collection('tasks')
      .where('status', '==', 'APPLICATION_REVIEW')
      .count()
      .get();
    const openSnap = await db.collection('tasks').where('status', '==', 'OPEN').count().get();
    tasksNeedingActionCount = draftSnap.data().count + appSnap.data().count;
    openTasksCount = openSnap.data().count;
  } catch (e) {
    console.warn('Count tasks fallback:', e);
  }

  // 3. Submissions needing review & Appeals
  let pendingSubmissionsCount = 0;
  let appealedSubmissionsCount = 0;
  try {
    const submittedSnap = await db
      .collection('submissions')
      .where('status', '==', 'SUBMITTED')
      .count()
      .get();
    const underReviewSnap = await db
      .collection('submissions')
      .where('status', '==', 'UNDER_REVIEW')
      .count()
      .get();
    const appealedSnap = await db
      .collection('submissions')
      .where('status', '==', 'APPEALED')
      .count()
      .get();
    pendingSubmissionsCount = submittedSnap.data().count + underReviewSnap.data().count;
    appealedSubmissionsCount = appealedSnap.data().count;
  } catch (e) {
    console.warn('Count submissions fallback:', e);
  }

  // 4. Pending Claims
  let pendingClaimsCount = 0;
  try {
    const claimSnap = await db.collection('claims').where('status', '==', 'CLAIMED').count().get();
    pendingClaimsCount = claimSnap.data().count;
  } catch (e) {
    console.warn('Count claims fallback:', e);
  }

  // 5. Total Disbursed Bounty
  let totalDisbursedBounty = 0;
  try {
    const approvedClaimsSnap = await db
      .collection('claims')
      .where('status', '==', 'APPROVED')
      .select('amount')
      .get();
    approvedClaimsSnap.forEach((doc) => {
      const data = doc.data();
      if (typeof data.amount === 'number') {
        totalDisbursedBounty += data.amount;
      }
    });
  } catch (e) {
    console.warn('Sum disbursed claims fallback:', e);
  }

  // 6. Active Reports
  let activeReportsCount = 0;
  try {
    const openRepSnap = await db.collection('reports').where('status', '==', 'OPEN').count().get();
    const invRepSnap = await db
      .collection('reports')
      .where('status', '==', 'INVESTIGATING')
      .count()
      .get();
    activeReportsCount = openRepSnap.data().count + invRepSnap.data().count;
  } catch (e) {
    console.warn('Count reports fallback:', e);
  }

  // 7. Recent Audit Events
  let recentAuditEvents: AuditEventDocument[] = [];
  try {
    const auditSnap = await db
      .collection('auditEvents')
      .orderBy('timestamp', 'desc')
      .limit(6)
      .get();
    recentAuditEvents = auditSnap.docs.map((doc) => ({
      ...(doc.data() as AuditEventDocument),
      id: doc.id,
    }));
  } catch (e) {
    console.warn('Fetch recent audit events fallback:', e);
  }

  return {
    pendingMembersCount,
    tasksNeedingActionCount,
    openTasksCount,
    pendingSubmissionsCount,
    pendingClaimsCount,
    totalDisbursedBounty,
    activeReportsCount,
    appealedSubmissionsCount,
    recentAuditEvents,
  };
}
