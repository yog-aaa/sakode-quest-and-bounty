/**
 * SAKODE Task & Reward Platform - Append-Only Audit Trail Service
 * Menyediakan pembacaan log historis mutasi data untuk Administrator & Super Administrator.
 * 
 * Strict Invariants:
 * 1. Audit Immutability: DILARANG membuat fungsi update, edit, atau delete pada auditEvents.
 * 2. Koleksi auditEvents adalah append-only murni untuk integritas forensik platform.
 * 3. Seluruh pencatatan timestamp menggunakan UTC Firestore Timestamp.
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { USER_ROLES } from '@/lib/constants';
import type { AuditEventDocument, UserDocument } from '@/types/database';

export interface AuditFilterParams {
  actorId?: string;
  action?: string;
  entityType?: string;
  limit?: number;
}

/**
 * Helper untuk verifikasi hak akses Admin / Super Admin
 */
async function assertAdminPrivilege(adminUid: string): Promise<UserDocument> {
  const db = getAdminFirestore();
  const userSnap = await db.collection('users').doc(adminUid).get();
  if (!userSnap.exists) {
    throw new Error('Data admin tidak ditemukan.');
  }
  const userData = userSnap.data() as UserDocument;
  if (userData.role !== USER_ROLES.ADMIN && userData.role !== USER_ROLES.SUPER_ADMIN) {
    throw new Error('Akses ditolak: Operasi ini membutuhkan hak istimewa Admin.');
  }
  return userData;
}

/**
 * Mengambil Riwayat Log Audit Permanen (getAuditEvents)
 * Mendukung filter berdasarkan aktor, tipe aksi, entitas, dan batas jumlah.
 */
export async function getAuditEvents(
  adminUid: string,
  filters: AuditFilterParams = {}
): Promise<AuditEventDocument[]> {
  await assertAdminPrivilege(adminUid);
  const db = getAdminFirestore();

  let query = db.collection('auditEvents').orderBy('timestamp', 'desc');

  if (filters.actorId) {
    query = query.where('actorId', '==', filters.actorId);
  }

  if (filters.action) {
    query = query.where('action', '==', filters.action);
  }

  if (filters.entityType) {
    query = query.where('entityType', '==', filters.entityType);
  }

  const limitCount = filters.limit && filters.limit > 0 ? filters.limit : 100;
  query = query.limit(limitCount);

  const snapshot = await query.get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as AuditEventDocument),
    id: doc.id,
  }));
}
