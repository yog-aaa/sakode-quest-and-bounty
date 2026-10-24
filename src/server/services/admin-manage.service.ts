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
import { USER_ROLES } from '@/lib/constants';
import {
  adminRoleManagementSchema,
  type AdminRoleManagementInput,
} from '@/lib/validations/report';
import type { UserDocument, FirestoreDate } from '@/types/database';

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
