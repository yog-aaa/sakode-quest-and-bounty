/**
 * SAKODE Task & Reward Platform - Authentication Service
 * Menangani sinkronisasi akun Firebase Auth, inisialisasi dokumen pengguna di Firestore,
 * verifikasi token server-side, dan penautan akun (Account Linking).
 */

import { getAdminAuth, getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { UserDocument } from '@/types/database';
import { USER_ROLES, USER_APPROVAL_STATUS } from '@/lib/constants';

export interface SyncUserInput {
  uid: string;
  email: string;
  displayName?: string | null;
  photoURL?: string | null;
}

/**
 * Sinkronisasi akun Firebase Auth ke Firestore `users/{uid}`.
 * Menjamin setiap pengguna terdaftar memiliki 1 dokumen unik di Firestore.
 */
export async function syncUserRecord(input: SyncUserInput): Promise<UserDocument> {
  const db = getAdminFirestore();
  const userRef = db.collection('users').doc(input.uid);
  const snapshot = await userRef.get();

  if (snapshot.exists) {
    const data = snapshot.data() as UserDocument;
    // Jika display name atau email diperbarui di provider, perbarui secara non-intrusif
    if ((input.displayName && !data.displayName) || (input.email && input.email !== data.email)) {
      await userRef.update({
        displayName: data.displayName || input.displayName || '',
        email: input.email || data.email,
        updatedAt: FieldValue.serverTimestamp(),
      });
    }
    return { ...data, id: input.uid };
  }

  // Buat profil pengguna baru jika belum ada
  const newUser: Omit<UserDocument, 'createdAt' | 'updatedAt'> & {
    createdAt: FieldValue;
    updatedAt: FieldValue;
  } = {
    id: input.uid,
    email: input.email,
    displayName: input.displayName || '',
    contactNumber: '',
    skills: [],
    role: USER_ROLES.MEMBER,
    approvalStatus: USER_APPROVAL_STATUS.PENDING,
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
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await userRef.set(newUser);
  const createdSnap = await userRef.get();
  return { ...(createdSnap.data() as UserDocument), id: input.uid };
}

/**
 * Verifikasi Session Cookie atau Bearer ID Token di sisi server.
 */
export async function verifyServerAuthToken(token: string) {
  try {
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Gagal memverifikasi token autentikasi:', error);
    return null;
  }
}

/**
 * Mengatur Custom User Claims di Firebase Auth untuk sinkronisasi role & approval state.
 */
export async function setCustomUserClaims(
  uid: string,
  claims: { role: string; approvalStatus: string }
): Promise<void> {
  const auth = getAdminAuth();
  await auth.setCustomUserClaims(uid, claims);
}
