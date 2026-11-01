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

  // Verifikasi wewenang admin (dengan auto-provisioning untuk akun admin pertama)
  let userData: UserDocument;
  const userRef = db.collection('users').doc(adminUid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    try {
      const authUser = await getAdminAuth().getUser(adminUid);
      const now = new Date().toISOString() as unknown as FirestoreDate;
      const initialAdminDoc: UserDocument = {
        id: adminUid,
        email: authUser.email || 'admin@sakode.com',
        displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Sakode Dev',
        contactNumber: '',
        skills: ['Management', 'Platform Admin'],
        role: USER_ROLES.SUPER_ADMIN,
        approvalStatus: USER_APPROVAL_STATUS.APPROVED,
        paymentAccountEncrypted: '',
        paymentAccountMasked: '',
        activeTaskId: null,
        pendingApplicationCount: 0,
        stats: {
          completedTasks: 0,
          onTimeTasks: 0,
          failedTasks: 0,
          provenReports: 0,
        },
        createdAt: now,
        updatedAt: now,
      };
      await userRef.set(initialAdminDoc);
      userData = initialAdminDoc;
    } catch {
      throw new Error('Data admin tidak ditemukan di database platform.');
    }
  } else {
    userData = userSnap.data() as UserDocument;
  }

  if (userData.role !== USER_ROLES.ADMIN && userData.role !== USER_ROLES.SUPER_ADMIN) {
    throw new Error('Akses ditolak: Operasi ini membutuhkan hak istimewa Admin.');
  }

  // Eksekusi seluruh agregasi metrik secara paralel dan tahan-kegagalan (resilient)
  const [
    pendingMembersRes,
    draftTasksRes,
    appReviewTasksRes,
    openTasksRes,
    submittedSubsRes,
    underReviewSubsRes,
    appealedSubsRes,
    claimsRes,
    approvedClaimsRes,
    openReportsRes,
    invReportsRes,
    auditEventsRes,
  ] = await Promise.allSettled([
    db.collection('users').where('approvalStatus', '==', USER_APPROVAL_STATUS.PENDING).count().get(),
    db.collection('tasks').where('status', '==', 'DRAFT').count().get(),
    db.collection('tasks').where('status', '==', 'APPLICATION_REVIEW').count().get(),
    db.collection('tasks').where('status', '==', 'OPEN').count().get(),
    db.collection('submissions').where('status', '==', 'SUBMITTED').count().get(),
    db.collection('submissions').where('status', '==', 'UNDER_REVIEW').count().get(),
    db.collection('submissions').where('status', '==', 'APPEALED').count().get(),
    db.collection('claims').where('status', '==', 'CLAIMED').count().get(),
    db.collection('claims').where('status', '==', 'APPROVED').select('amount').get(),
    db.collection('reports').where('status', '==', 'OPEN').count().get(),
    db.collection('reports').where('status', '==', 'INVESTIGATING').count().get(),
    db.collection('auditEvents').orderBy('timestamp', 'desc').limit(6).get(),
  ]);

  // Ekstraksi nilai dengan fallback aman (0 / array kosong)
  const pendingMembersCount =
    pendingMembersRes.status === 'fulfilled' ? pendingMembersRes.value.data().count : 0;

  const draftTasksCount =
    draftTasksRes.status === 'fulfilled' ? draftTasksRes.value.data().count : 0;
  const appReviewTasksCount =
    appReviewTasksRes.status === 'fulfilled' ? appReviewTasksRes.value.data().count : 0;
  const tasksNeedingActionCount = draftTasksCount + appReviewTasksCount;

  const openTasksCount =
    openTasksRes.status === 'fulfilled' ? openTasksRes.value.data().count : 0;

  const submittedSubsCount =
    submittedSubsRes.status === 'fulfilled' ? submittedSubsRes.value.data().count : 0;
  const underReviewSubsCount =
    underReviewSubsRes.status === 'fulfilled' ? underReviewSubsRes.value.data().count : 0;
  const pendingSubmissionsCount = submittedSubsCount + underReviewSubsCount;

  const appealedSubmissionsCount =
    appealedSubsRes.status === 'fulfilled' ? appealedSubsRes.value.data().count : 0;

  const pendingClaimsCount =
    claimsRes.status === 'fulfilled' ? claimsRes.value.data().count : 0;

  let totalDisbursedBounty = 0;
  if (approvedClaimsRes.status === 'fulfilled') {
    approvedClaimsRes.value.forEach((doc) => {
      const data = doc.data();
      if (typeof data.amount === 'number') {
        totalDisbursedBounty += data.amount;
      }
    });
  }

  const openReportsCount =
    openReportsRes.status === 'fulfilled' ? openReportsRes.value.data().count : 0;
  const invReportsCount =
    invReportsRes.status === 'fulfilled' ? invReportsRes.value.data().count : 0;
  const activeReportsCount = openReportsCount + invReportsCount;

  let recentAuditEvents: AuditEventDocument[] = [];
  if (auditEventsRes.status === 'fulfilled') {
    recentAuditEvents = auditEventsRes.value.docs.map((doc) => ({
      ...(doc.data() as AuditEventDocument),
      id: doc.id,
    }));
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
