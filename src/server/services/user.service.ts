/**
 * SAKODE Task & Reward Platform - User Management & Admin Approval Service
 * Mematuhi invariants di AGENTS.md, ARCHITECTURE.md, dan skill security-threat-model.
 *
 * Strict Invariants:
 * 1. Data perbankan wajib dienkripsi (AES-256-GCM) sebelum disimpan.
 * 2. Seluruh mutasi persetujuan & akses data rekening wajib tercatat di auditEvents (append-only).
 * 3. Proteksi RBAC: Operasi approval hanya dapat dipanggil oleh ADMIN atau SUPER_ADMIN.
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserDocument } from '@/types/database';
import { USER_APPROVAL_STATUS, USER_ROLES } from '@/lib/constants';
import {
  profileCompletionSchema,
  type ProfileCompletionInput,
} from '@/lib/validations/auth';
import {
  encryptBankAccount,
  decryptBankAccount,
  type BankAccountDetails,
} from '@/lib/crypto';
import { formatMaskedPaymentAccount } from '@/lib/utils';
import { setCustomUserClaims } from './auth.service';

/**
 * Memverifikasi apakah pengguna memiliki hak akses Admin atau Super Admin.
 */
export async function assertAdminPrivilege(adminUid: string): Promise<UserDocument> {
  const db = getAdminFirestore();
  const adminDoc = await db.collection('users').doc(adminUid).get();

  if (!adminDoc.exists) {
    throw new Error('Akses ditolak: Data pengguna admin tidak ditemukan.');
  }

  const adminData = adminDoc.data() as UserDocument;
  const isAdmin =
    adminData.role === USER_ROLES.ADMIN ||
    adminData.role === USER_ROLES.SUPER_ADMIN;

  if (!isAdmin) {
    throw new Error(
      'Akses ditolak: Operasi ini hanya dapat dilakukan oleh Admin atau Super Admin SAKODE.'
    );
  }

  return adminData;
}

/**
 * Mengambil profil pengguna dari Firestore berdasarkan UID.
 */
export async function getUserProfile(uid: string): Promise<UserDocument | null> {
  const db = getAdminFirestore();
  const docSnap = await db.collection('users').doc(uid).get();

  if (!docSnap.exists) {
    return null;
  }

  return { ...(docSnap.data() as UserDocument), id: uid };
}

/**
 * Melengkapi profil member baru dan mengenkripsi data rekening bank / e-wallet.
 */
export async function completeUserProfile(
  uid: string,
  input: ProfileCompletionInput
): Promise<UserDocument> {
  // 1. Validasi input Zod di sisi server
  const validated = profileCompletionSchema.parse(input);

  const db = getAdminFirestore();
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();

  if (!userSnap.exists) {
    throw new Error('Pengguna tidak ditemukan dalam sistem.');
  }

  // 2. Enkripsi informasi rekening menggunakan AES-256-GCM
  const paymentDetails: BankAccountDetails = {
    bankName: validated.bankName,
    accountNumber: validated.accountNumber,
    accountHolderName: validated.accountHolderName,
  };
  const encryptedPayment = encryptBankAccount(paymentDetails);

  // 3. Format masked rekening untuk tampilan umum yang aman
  const maskedPayment = formatMaskedPaymentAccount(
    validated.bankName,
    validated.accountNumber,
    validated.accountHolderName
  );

  // 4. Perbarui dokumen pengguna di Firestore
  const updateData = {
    displayName: validated.displayName,
    contactNumber: validated.contactNumber,
    skills: validated.skills,
    paymentAccountEncrypted: encryptedPayment,
    paymentAccountMasked: maskedPayment,
    approvalStatus: USER_APPROVAL_STATUS.PENDING,
    rejectionReason: null, // Reset status penolakan jika sebelumnya ditolak
    updatedAt: FieldValue.serverTimestamp(),
  };

  await userRef.update(updateData);

  // Perbarui custom claims
  await setCustomUserClaims(uid, {
    role: USER_ROLES.MEMBER,
    approvalStatus: USER_APPROVAL_STATUS.PENDING,
  });

  const updatedSnap = await userRef.get();
  return { ...(updatedSnap.data() as UserDocument), id: uid };
}

/**
 * Mengambil daftar seluruh pendaftar yang berstatus PENDING untuk antrean evaluasi Admin.
 */
export async function getPendingUsers(adminUid: string): Promise<UserDocument[]> {
  await assertAdminPrivilege(adminUid);

  const db = getAdminFirestore();
  const snapshot = await db
    .collection('users')
    .where('approvalStatus', '==', USER_APPROVAL_STATUS.PENDING)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as UserDocument),
    id: doc.id,
  }));
}

/**
 * Mengambil daftar seluruh pengguna terdaftar dengan filter status.
 */
export async function getUsersList(
  adminUid: string,
  statusFilter?: string
): Promise<UserDocument[]> {
  await assertAdminPrivilege(adminUid);

  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection('users');

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.where('approvalStatus', '==', statusFilter);
  }

  const snapshot = await query.orderBy('createdAt', 'desc').get();
  return snapshot.docs.map((doc) => ({
    ...(doc.data() as UserDocument),
    id: doc.id,
  }));
}

/**
 * Menyetujui pendaftaran member (Set status ke APPROVED).
 * Mencatat audit event pada koleksi auditEvents secara append-only.
 */
export async function approveUser(
  adminUid: string,
  targetUserId: string
): Promise<void> {
  const adminData = await assertAdminPrivilege(adminUid);

  const db = getAdminFirestore();
  const targetRef = db.collection('users').doc(targetUserId);
  const targetSnap = await targetRef.get();

  if (!targetSnap.exists) {
    throw new Error('Member yang akan disetujui tidak ditemukan.');
  }

  const beforeData = targetSnap.data() as UserDocument;

  // Mutasi status pengguna
  await targetRef.update({
    approvalStatus: USER_APPROVAL_STATUS.APPROVED,
    approvedByAdminId: adminUid,
    approvedAt: FieldValue.serverTimestamp(),
    rejectionReason: null,
    revisionNotes: null,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Sinkronisasi Custom Claims di Firebase Auth
  await setCustomUserClaims(targetUserId, {
    role: beforeData.role || USER_ROLES.MEMBER,
    approvalStatus: USER_APPROVAL_STATUS.APPROVED,
  });

  // Strict Invariant: Append-only audit trail
  await db.collection('auditEvents').add({
    actorId: adminUid,
    actorRole: adminData.role,
    action: 'USER_APPROVED',
    entityType: 'USER',
    entityId: targetUserId,
    beforeSnapshot: {
      approvalStatus: beforeData.approvalStatus,
    },
    afterSnapshot: {
      approvalStatus: USER_APPROVAL_STATUS.APPROVED,
      approvedByAdminId: adminUid,
    },
    reason: 'Pendaftaran member disetujui setelah verifikasi kelengkapan profil.',
    timestamp: FieldValue.serverTimestamp(),
  });
}

/**
 * Menolak pendaftaran member (Set status ke REJECTED) dengan alasan eksplisit.
 */
export async function rejectUser(
  adminUid: string,
  targetUserId: string,
  reason: string
): Promise<void> {
  const adminData = await assertAdminPrivilege(adminUid);

  if (!reason || reason.trim().length < 5) {
    throw new Error('Alasan penolakan wajib diisi (minimal 5 karakter).');
  }

  const db = getAdminFirestore();
  const targetRef = db.collection('users').doc(targetUserId);
  const targetSnap = await targetRef.get();

  if (!targetSnap.exists) {
    throw new Error('Member tidak ditemukan.');
  }

  const beforeData = targetSnap.data() as UserDocument;

  await targetRef.update({
    approvalStatus: USER_APPROVAL_STATUS.REJECTED,
    rejectionReason: reason.trim(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  await setCustomUserClaims(targetUserId, {
    role: beforeData.role || USER_ROLES.MEMBER,
    approvalStatus: USER_APPROVAL_STATUS.REJECTED,
  });

  // Append-only audit event
  await db.collection('auditEvents').add({
    actorId: adminUid,
    actorRole: adminData.role,
    action: 'USER_REJECTED',
    entityType: 'USER',
    entityId: targetUserId,
    beforeSnapshot: {
      approvalStatus: beforeData.approvalStatus,
    },
    afterSnapshot: {
      approvalStatus: USER_APPROVAL_STATUS.REJECTED,
      rejectionReason: reason.trim(),
    },
    reason: reason.trim(),
    timestamp: FieldValue.serverTimestamp(),
  });
}

/**
 * Meminta perbaikan profil kepada member yang belum memenuhi syarat.
 */
export async function requestProfileRevision(
  adminUid: string,
  targetUserId: string,
  notes: string
): Promise<void> {
  const adminData = await assertAdminPrivilege(adminUid);

  if (!notes || notes.trim().length < 5) {
    throw new Error('Catatan perbaikan wajib diisi minimal 5 karakter.');
  }

  const db = getAdminFirestore();
  const targetRef = db.collection('users').doc(targetUserId);
  const targetSnap = await targetRef.get();

  if (!targetSnap.exists) {
    throw new Error('Member tidak ditemukan.');
  }

  const beforeData = targetSnap.data() as UserDocument;

  await targetRef.update({
    revisionNotes: notes.trim(),
    approvalStatus: USER_APPROVAL_STATUS.PENDING,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Append-only audit event
  await db.collection('auditEvents').add({
    actorId: adminUid,
    actorRole: adminData.role,
    action: 'USER_REVISION_REQUESTED',
    entityType: 'USER',
    entityId: targetUserId,
    beforeSnapshot: {
      approvalStatus: beforeData.approvalStatus,
    },
    afterSnapshot: {
      revisionNotes: notes.trim(),
    },
    reason: notes.trim(),
    timestamp: FieldValue.serverTimestamp(),
  });
}

/**
 * Membuka dekripsi nomor rekening asli untuk verifikasi administratif.
 * Operasi ini diaudit secara ketat di auditEvents.
 */
export async function revealUserPaymentAccount(
  adminUid: string,
  targetUserId: string
): Promise<BankAccountDetails> {
  const adminData = await assertAdminPrivilege(adminUid);

  const db = getAdminFirestore();
  const targetDoc = await db.collection('users').doc(targetUserId).get();

  if (!targetDoc.exists) {
    throw new Error('Data member tidak ditemukan.');
  }

  const userData = targetDoc.data() as UserDocument;

  if (!userData.paymentAccountEncrypted) {
    throw new Error('Member belum mengisi informasi rekening bank.');
  }

  const decrypted = decryptBankAccount(userData.paymentAccountEncrypted);

  // Catat audit event saat data sensitif rekening dibuka oleh Admin
  await db.collection('auditEvents').add({
    actorId: adminUid,
    actorRole: adminData.role,
    action: 'PAYMENT_ACCOUNT_UNMASKED_BY_ADMIN',
    entityType: 'USER',
    entityId: targetUserId,
    beforeSnapshot: null,
    afterSnapshot: {
      action: 'REVEAL_PAYMENT_DETAILS',
    },
    reason: `Admin ${adminData.displayName || adminUid} membuka data rekening untuk verifikasi pencairan/pendaftaran.`,
    timestamp: FieldValue.serverTimestamp(),
  });

  return decrypted;
}
