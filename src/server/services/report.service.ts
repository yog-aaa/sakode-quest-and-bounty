/**
 * SAKODE Task & Reward Platform - Report & Progressive Penalty Service
 * Menangani pelaporan sengketa berbukti, penegakan aturan Anti-Konflik Kepentingan,
 * eskalasi otomatis ke Super Admin, dan rekomendasi sanksi penalti progresif.
 * 
 * Strict Invariants:
 * 1. Anti-Konflik Kepentingan: Admin terlibat DILARANG menyelesaikan laporannya sendiri.
 * 2. Laporan melibatkan Admin otomatis dialihkan ke Super Admin (escalatedToSuperAdmin = true).
 * 3. Seluruh override penalti WAJIB menyertakan alasan tertulis (min 15 karakter).
 * 4. Append-Only Audit Trail: Seluruh aksi dicatat permanen di auditEvents.
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import {
  REPORT_STATUS,
  PENALTY_TYPES,
  USER_ROLES,
} from '@/lib/constants';
import {
  createReportSchema,
  resolveReportSchema,
  type CreateReportInput,
  type ResolveReportInput,
} from '@/lib/validations/report';
import type {
  ReportDocument,
  PenaltyDocument,
  UserDocument,
  TaskDocument,
  SubmissionDocument,
  ClaimDocument,
  TeamDistributionDocument,
  FirestoreDate,
} from '@/types/database';

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
 * 1. Membuat Laporan Sengketa Baru (createReport)
 * Menjalankan inspeksi Anti-Konflik Kepentingan: jika entitas target melibatkan Admin,
 * laporan otomatis ditandai `involvesAdmin = true` dan `escalatedToSuperAdmin = true`.
 */
export async function createReport(
  reporterUid: string,
  input: CreateReportInput
): Promise<ReportDocument> {
  const validated = createReportSchema.parse(input);
  const db = getAdminFirestore();

  // 1. Ambil data profil pelapor
  const reporterSnap = await db.collection('users').doc(reporterUid).get();
  if (!reporterSnap.exists) {
    throw new Error('Data pengguna pelapor tidak ditemukan.');
  }
  const reporterData = reporterSnap.data() as UserDocument;

  // 2. Periksa eksistensi entitas target & evaluasi keterlibatan Admin
  let involvesAdmin = false;
  let involvedAdminId: string | null = null;
  let targetTitle = validated.targetTitle || '';

  if (validated.targetType === 'TASK') {
    const taskSnap = await db.collection('tasks').doc(validated.targetId).get();
    if (!taskSnap.exists) {
      throw new Error('Task yang dilaporkan tidak ditemukan.');
    }
    const taskData = taskSnap.data() as TaskDocument;
    targetTitle = targetTitle || taskData.title;

    if (taskData.createdByAdminId) {
      involvesAdmin = true;
      involvedAdminId = taskData.createdByAdminId;
    }
  } else if (validated.targetType === 'SUBMISSION') {
    const subSnap = await db.collection('submissions').doc(validated.targetId).get();
    if (!subSnap.exists) {
      throw new Error('Hasil submission yang dilaporkan tidak ditemukan.');
    }
    const subData = subSnap.data() as SubmissionDocument;
    targetTitle = targetTitle || subData.taskTitle || 'Submission Deliverable';

    if (subData.reviewedByAdminId || subData.firstReviewerAdminId) {
      involvesAdmin = true;
      involvedAdminId = subData.reviewedByAdminId || subData.firstReviewerAdminId || null;
    }
  } else if (validated.targetType === 'CLAIM') {
    const claimSnap = await db.collection('claims').doc(validated.targetId).get();
    if (!claimSnap.exists) {
      throw new Error('Klaim reward yang dilaporkan tidak ditemukan.');
    }
    const claimData = claimSnap.data() as ClaimDocument;
    targetTitle = targetTitle || `Klaim Reward #${claimData.id.slice(0, 8)}`;

    if (claimData.processedByAdminId) {
      involvesAdmin = true;
      involvedAdminId = claimData.processedByAdminId;
    }
  } else if (validated.targetType === 'TEAM_DISTRIBUTION') {
    const distSnap = await db.collection('teamDistributions').doc(validated.targetId).get();
    if (!distSnap.exists) {
      throw new Error('Distribusi reward tim yang dilaporkan tidak ditemukan.');
    }
    const distData = distSnap.data() as TeamDistributionDocument;
    targetTitle = targetTitle || distData.taskTitle || 'Distribusi Reward Tim';
  }

  // Jika kategori spesifik mencatut admin, tandai eskalasi
  if (
    validated.category === 'Pembayaran Admin belum diterima.' ||
    validated.category === 'Perilaku atau keputusan melanggar Terms.'
  ) {
    if (involvedAdminId) {
      involvesAdmin = true;
    }
  }

  const escalatedToSuperAdmin = involvesAdmin;

  // 3. Simpan dokumen report
  const reportRef = db.collection('reports').doc();
  const reportPayload: Omit<ReportDocument, 'id'> = {
    reporterUserId: reporterUid,
    reporterDisplayName: reporterData.displayName || reporterData.email || 'Member',
    reporterEmail: reporterData.email,
    targetType: validated.targetType,
    targetId: validated.targetId,
    targetTitle,
    category: validated.category,
    chronology: validated.chronology,
    evidenceFiles: validated.evidenceFiles,
    status: REPORT_STATUS.SUBMITTED,
    involvesAdmin,
    involvedAdminId,
    escalatedToSuperAdmin,
    assignedAdminId: null,
    assignedAdminName: null,
    resolutionNotes: null,
    penaltyId: null,
    createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  };

  await reportRef.set(reportPayload);

  // 4. Catat Audit Event
  await db.collection('auditEvents').add({
    actorId: reporterUid,
    actorRole: reporterData.role || USER_ROLES.MEMBER,
    actorName: reporterData.displayName || reporterData.email,
    action: 'REPORT_SUBMITTED',
    entityType: 'REPORT',
    entityId: reportRef.id,
    beforeSnapshot: null,
    afterSnapshot: {
      targetType: validated.targetType,
      targetId: validated.targetId,
      category: validated.category,
      involvesAdmin,
      escalatedToSuperAdmin,
    },
    metadata: {
      involvesAdmin,
      involvedAdminId,
      evidenceCount: validated.evidenceFiles.length,
    },
    reason: validated.chronology.slice(0, 100),
    timestamp: FieldValue.serverTimestamp(),
  });

  return {
    ...reportPayload,
    id: reportRef.id,
    createdAt: Timestamp.now() as unknown as FirestoreDate,
    updatedAt: Timestamp.now() as unknown as FirestoreDate,
  };
}

/**
 * 2. Mengambil Antrean Laporan (getReportsQueue)
 * Menegakkan STRICT INVARIANT Anti-Konflik Kepentingan:
 * - Super Admin melihat seluruh laporan (termasuk yang dieskalasi).
 * - Admin biasa disaring: dilarang melihat laporan yang mencatut dirinya sendiri
 *   dan dilarang melihat laporan yang dieskalasi ke Super Admin.
 */
export async function getReportsQueue(adminUid: string): Promise<ReportDocument[]> {
  const adminData = await assertAdminPrivilege(adminUid);
  const db = getAdminFirestore();
  const isSuperAdmin = adminData.role === USER_ROLES.SUPER_ADMIN;

  const snapshot = await db.collection('reports').orderBy('createdAt', 'desc').get();

  const allReports = snapshot.docs.map((doc) => ({
    ...(doc.data() as ReportDocument),
    id: doc.id,
  }));

  if (isSuperAdmin) {
    return allReports;
  }

  // Filter untuk Admin biasa (Anti-Conflict of Interest)
  return allReports.filter((report) => {
    // 1. Sembunyikan laporan yang mencatut admin ini
    if (report.involvedAdminId === adminUid) return false;
    // 2. Sembunyikan laporan yang dieskalasi khusus Super Admin
    if (report.escalatedToSuperAdmin) return false;
    return true;
  });
}

/**
 * 3. Mengambil Detail Laporan Sengketa (getReportDetail)
 */
export async function getReportDetail(
  adminUid: string,
  reportId: string
): Promise<ReportDocument> {
  const adminData = await assertAdminPrivilege(adminUid);
  const db = getAdminFirestore();

  const docSnap = await db.collection('reports').doc(reportId).get();
  if (!docSnap.exists) {
    throw new Error('Data laporan sengketa tidak ditemukan.');
  }

  const report = {
    ...(docSnap.data() as ReportDocument),
    id: docSnap.id,
  };

  // Anti-Conflict Rule Check
  if (adminData.role !== USER_ROLES.SUPER_ADMIN) {
    if (report.involvedAdminId === adminUid) {
      throw new Error(
        'Akses Ditolak: Anda terlibat langsung dalam laporan ini (Aturan Anti-Konflik Kepentingan SAKODE).'
      );
    }
    if (report.escalatedToSuperAdmin) {
      throw new Error(
        'Akses Ditolak: Laporan ini telah dieskalasi secara eksklusif ke Super Administrator.'
      );
    }
  }

  return report;
}

export { getRecommendedPenalty } from '@/lib/validations/report';

/**
 * 5. Menyelesaikan Laporan & Menjatuhkan Penalti Progresif (resolveReport)
 * WAJIB: firestore.runTransaction()
 * Menegakkan:
 * - Anti-Konflik Kepentingan (Admin terlibat dilarang menyelesaikan)
 * - Eskalasi Super Admin jika melibatkan Admin
 * - Validasi alasan wajib override (min 15 karakter)
 * - Rekaman append-only audit trail
 */
export async function resolveReport(
  adminUid: string,
  input: ResolveReportInput
): Promise<ReportDocument> {
  const adminData = await assertAdminPrivilege(adminUid);
  const validated = resolveReportSchema.parse(input);
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    // 1. Ambil Dokumen Laporan
    const reportRef = db.collection('reports').doc(validated.reportId);
    const reportSnap = await transaction.get(reportRef);
    if (!reportSnap.exists) {
      throw new Error('Data laporan tidak ditemukan.');
    }
    const reportData = reportSnap.data() as ReportDocument;

    // 2. PENEGAKAN ANTI-KONFLIK KEPENTINGAN
    if (reportData.involvedAdminId === adminUid) {
      throw new Error(
        'Akses Ditolak: Anda terlibat langsung dalam sengketa ini dan dilarang menjadi penyelesai akhir laporan.'
      );
    }

    if (reportData.escalatedToSuperAdmin || reportData.involvesAdmin) {
      if (adminData.role !== USER_ROLES.SUPER_ADMIN) {
        throw new Error(
          'Akses Ditolak: Laporan yang melibatkan Administrator hanya dapat diselesaikan oleh Super Admin.'
        );
      }
    }

    // 3. Tentukan Status Akhir Laporan
    let newStatus: (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS] = REPORT_STATUS.RESOLVED;
    if (validated.action === 'REJECT') {
      newStatus = REPORT_STATUS.REJECTED;
    } else if (validated.action === 'REQUEST_EVIDENCE') {
      newStatus = REPORT_STATUS.NEED_MORE_EVIDENCE;
    }

    let penaltyDocId: string | null = null;

    // 4. Proses Penjatuhan Sanksi (Jika Diberlakukan)
    if (validated.applyPenalty && validated.penaltyType && validated.penaltyTargetUserId) {
      const penaltyRef = db.collection('penalties').doc();
      penaltyDocId = penaltyRef.id;

      // Ambil data user yang dijatuhi sanksi
      const targetUserRef = db.collection('users').doc(validated.penaltyTargetUserId);
      const targetUserSnap = await transaction.get(targetUserRef);
      if (!targetUserSnap.exists) {
        throw new Error('Pengguna yang akan dijatuhi sanksi tidak ditemukan.');
      }
      const targetUserData = targetUserSnap.data() as UserDocument;

      // Hitung batas waktu penalti
      let validUntilTimestamp: Timestamp | null = null;
      if (validated.penaltyDurationDays && validated.penaltyDurationDays > 0) {
        const untilDate = new Date(Date.now() + validated.penaltyDurationDays * 24 * 60 * 60 * 1000);
        validUntilTimestamp = Timestamp.fromDate(untilDate);
      }

      const penaltyPayload: Omit<PenaltyDocument, 'id'> = {
        userId: validated.penaltyTargetUserId,
        userDisplayName: targetUserData.displayName || targetUserData.email,
        userEmail: targetUserData.email,
        reportId: validated.reportId,
        type: validated.penaltyType,
        durationDays: validated.penaltyDurationDays || null,
        validUntil: validUntilTimestamp as unknown as FirestoreDate,
        reason: validated.resolutionNotes,
        issuedByAdminId: adminUid,
        issuedByAdminName: adminData.displayName || adminData.email,
        isOverridden: Boolean(validated.isOverride),
        overrideReason: validated.isOverride ? validated.overrideReason || null : null,
        isSystemRecommended: !validated.isOverride,
        createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
      };

      transaction.set(penaltyRef, penaltyPayload);

      // Mutasi Status Pengguna Terkait Penalti
      const userUpdates: Record<string, unknown> = {
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (validated.penaltyType === PENALTY_TYPES.COOLDOWN) {
        userUpdates.cooldownUntil = validUntilTimestamp;
      } else if (validated.penaltyType === PENALTY_TYPES.TEMPORARY_SUSPEND) {
        userUpdates.isSuspended = true;
        userUpdates.suspendedUntil = validUntilTimestamp;
      } else if (validated.penaltyType === PENALTY_TYPES.ACCOUNT_SUSPEND) {
        userUpdates.isSuspended = true;
        userUpdates.suspendedUntil = null;
      } else if (
        validated.penaltyType === PENALTY_TYPES.NO_LEAD ||
        validated.penaltyType === PENALTY_TYPES.TEAM_ONLY
      ) {
        userUpdates.penaltyRestriction = validated.penaltyType;
      }

      transaction.update(targetUserRef, userUpdates);

      // Audit Event: PENALTY_ISSUED
      const auditPenaltyRef = db.collection('auditEvents').doc();
      transaction.set(auditPenaltyRef, {
        actorId: adminUid,
        actorRole: adminData.role || USER_ROLES.ADMIN,
        actorName: adminData.displayName || adminData.email,
        action: 'PENALTY_ISSUED',
        entityType: 'PENALTY',
        entityId: penaltyDocId,
        beforeSnapshot: null,
        afterSnapshot: {
          targetUserId: validated.penaltyTargetUserId,
          penaltyType: validated.penaltyType,
          durationDays: validated.penaltyDurationDays || null,
          isOverride: validated.isOverride || false,
          overrideReason: validated.overrideReason || null,
        },
        metadata: {
          reportId: validated.reportId,
          targetUserEmail: targetUserData.email,
        },
        reason: validated.isOverride ? validated.overrideReason : validated.resolutionNotes,
        timestamp: FieldValue.serverTimestamp(),
      });
    }

    // 5. Perbarui Dokumen Report
    const reportUpdates: Record<string, unknown> = {
      status: newStatus,
      resolutionNotes: validated.resolutionNotes,
      assignedAdminId: adminUid,
      assignedAdminName: adminData.displayName || adminData.email,
      penaltyId: penaltyDocId,
      updatedAt: FieldValue.serverTimestamp(),
    };

    transaction.update(reportRef, reportUpdates);

    // 6. Audit Event: REPORT_RESOLVED
    const auditReportRef = db.collection('auditEvents').doc();
    transaction.set(auditReportRef, {
      actorId: adminUid,
      actorRole: adminData.role || USER_ROLES.ADMIN,
      actorName: adminData.displayName || adminData.email,
      action: 'REPORT_RESOLVED',
      entityType: 'REPORT',
      entityId: validated.reportId,
      beforeSnapshot: {
        status: reportData.status,
      },
      afterSnapshot: {
        status: newStatus,
        resolutionNotes: validated.resolutionNotes,
        penaltyId: penaltyDocId,
      },
      metadata: {
        action: validated.action,
        applyPenalty: validated.applyPenalty,
      },
      reason: validated.resolutionNotes,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ...reportData,
      ...reportUpdates,
      id: reportSnap.id,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as ReportDocument;
  });
}
