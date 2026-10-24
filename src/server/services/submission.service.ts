/**
 * SAKODE Task & Reward Platform - Submission & Review Service
 * Menangani siklus pengiriman hasil kerja, validasi batas waktu Zero-Cron,
 * antrean bersama (Shared Review Queue) dengan penguncian atomik (Review Locking 15 menit),
 * dan keputusan evaluasi Admin (Approve, Request Revision, Extend Deadline, Reject).
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  SubmissionDocument,
  TaskDocument,
  UserDocument,
  TeamDocument,
  FirestoreDate,
} from '@/types/database';
import {
  TASK_STATUS,
  TASK_MODES,
  SUBMISSION_STATUS,
  USER_ROLES,
  NOTIFICATION_CATEGORIES,
} from '@/lib/constants';
import {
  createSubmissionSchema,
  type CreateSubmissionInput,
  reviewSubmissionSchema,
  type ReviewSubmissionInput,
} from '@/lib/validations/submission';
import { assertAdminPrivilege } from './user.service';
import { createRewardLedgerInsideTransaction } from './claim.service';
import { dispatchNotification } from './notification.service';
import { revisionRequestedEmail } from './email/templates';
import { formatDateWIB } from '@/lib/utils';

/**
 * Mengirimkan hasil pekerjaan (Deliverable Submission).
 * Hanya dapat dipanggil oleh Assigned Member (Solo) atau Team Lead (Team).
 * Menegakkan Single Active Submission & Zero-Cron Invariant.
 */
export async function submitTaskWork(
  userId: string,
  input: CreateSubmissionInput
): Promise<SubmissionDocument> {
  const validated = createSubmissionSchema.parse(input);
  const db = getAdminFirestore();

  // 1. Ambil data User pengirim
  const userRef = db.collection('users').doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    throw new Error('Data pengguna tidak ditemukan.');
  }
  const userData = userSnap.data() as UserDocument;

  // 2. Ambil data Task
  const taskRef = db.collection('tasks').doc(validated.taskId);
  const taskSnap = await taskRef.get();
  if (!taskSnap.exists) {
    throw new Error('Data task tidak ditemukan.');
  }
  const taskData = taskSnap.data() as TaskDocument;

  // 3. Verifikasi Status Task: Hanya ACTIVE atau REVISION yang boleh mengirim deliverable
  if (
    taskData.status !== TASK_STATUS.ACTIVE &&
    taskData.status !== TASK_STATUS.REVISION
  ) {
    throw new Error(
      `Task ini sedang berstatus "${taskData.status}". Pengiriman hasil hanya diizinkan untuk task ACTIVE atau REVISION.`
    );
  }

  // 4. Verifikasi Hak Pemanggil (Assignee Solo vs Team Lead)
  if (taskData.mode === TASK_MODES.SOLO) {
    if (taskData.assignedUserId !== userId) {
      throw new Error('Hanya member penerima resmi task yang berhak mengirimkan hasil pekerjaan.');
    }
  } else if (taskData.mode === TASK_MODES.TEAM) {
    if (!taskData.assignedTeamId) {
      throw new Error('Task tim ini belum memiliki tim yang terdaftar.');
    }
    const teamRef = db.collection('teams').doc(taskData.assignedTeamId);
    const teamSnap = await teamRef.get();
    if (!teamSnap.exists) {
      throw new Error('Data tim tidak ditemukan.');
    }
    const teamData = teamSnap.data() as TeamDocument;
    if (teamData.teamLeadUserId !== userId) {
      throw new Error('Hanya Team Lead yang berwenang mengirimkan hasil pekerjaan tim.');
    }
  }

  // 5. Zero-Cron Invariant Check: Batas waktu tidak boleh terlampaui
  if (taskData.deadlineAt) {
    const deadlineDate =
      typeof (taskData.deadlineAt as { toDate?: () => Date }).toDate === 'function'
        ? (taskData.deadlineAt as { toDate: () => Date }).toDate()
        : new Date(taskData.deadlineAt as unknown as string);

    if (new Date() > deadlineDate) {
      throw new Error(
        'Batas waktu pengerjaan task telah berakhir (Zero-Cron Deadline Exceeded). Pengiriman ditolak.'
      );
    }
  }

  // 6. Single Active Submission Check & Versioning
  const existingSubsQuery = await db
    .collection('submissions')
    .where('taskId', '==', validated.taskId)
    .get();

  for (const doc of existingSubsQuery.docs) {
    const existing = doc.data() as SubmissionDocument;
    if (
      existing.status === SUBMISSION_STATUS.SUBMITTED ||
      existing.status === SUBMISSION_STATUS.IN_REVIEW
    ) {
      throw new Error(
        'Submission sebelumnya masih dalam proses evaluasi. Anda belum dapat mengirimkan versi baru.'
      );
    }
  }

  const nextVersion = existingSubsQuery.size + 1;

  // 7. Simpan Dokumen Submission Baru
  const newSubRef = db.collection('submissions').doc();
  const newSubmissionData: Omit<SubmissionDocument, 'id'> = {
    taskId: validated.taskId,
    submittedByUserId: userId,
    teamId: taskData.assignedTeamId || null,
    version: nextVersion,
    notes: validated.notes,
    deliverableLinks: validated.deliverableLinks,
    evidenceFiles: validated.evidenceFiles,
    status: SUBMISSION_STATUS.SUBMITTED,
    revisionNotes: null,
    revisionDeadlineAt: null,
    extensionReason: null,
    appeal: null,
    reviewedByAdminId: null,
    reviewedAt: null,
    reviewLockedByAdminId: null,
    reviewLockedUntil: null,
    reviewerDisplayName: null,
    taskTitle: taskData.title,
    taskTotalReward: taskData.totalReward,
    submitterDisplayName: userData.displayName || 'Member SAKODE',
    submitterEmail: userData.email,
    createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  };

  const batch = db.batch();
  batch.set(newSubRef, newSubmissionData);

  // 8. Perbarui status Task menjadi SUBMITTED
  batch.update(taskRef, {
    status: TASK_STATUS.SUBMITTED,
    reviewLockedByAdminId: null,
    reviewLockedUntil: null,
    updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  });

  // 9. Audit Event
  const auditRef = db.collection('auditEvents').doc();
  batch.set(auditRef, {
    actorId: userId,
    actorRole: userData.role,
    action: 'SUBMISSION_CREATED',
    entityType: 'SUBMISSION',
    entityId: newSubRef.id,
    metadata: {
      taskId: validated.taskId,
      version: nextVersion,
      evidenceFileCount: validated.evidenceFiles.length,
      linksCount: validated.deliverableLinks.length,
    },
    timestamp: FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    id: newSubRef.id,
    ...newSubmissionData,
  };
}

/**
 * Memperoleh Kunci Evaluasi Sementara (Review Lock 15 menit).
 * Mencegah tabrakan evaluasi antar 4 Admin secara atomik.
 */
export async function acquireReviewLock(
  adminUid: string,
  submissionId: string
): Promise<{
  locked: boolean;
  lockedByOther?: boolean;
  lockedByAdminName?: string;
  expiresAt?: string;
}> {
  const adminData = await assertAdminPrivilege(adminUid);
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const subRef = db.collection('submissions').doc(submissionId);
    const subSnap = await transaction.get(subRef);
    if (!subSnap.exists) {
      throw new Error('Data submission tidak ditemukan.');
    }
    const subData = subSnap.data() as SubmissionDocument;

    const taskRef = db.collection('tasks').doc(subData.taskId);
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists) {
      throw new Error('Data task terkait tidak ditemukan.');
    }

    const now = new Date();
    const existingLockUntil = subData.reviewLockedUntil
      ? typeof (subData.reviewLockedUntil as { toDate?: () => Date }).toDate === 'function'
        ? (subData.reviewLockedUntil as { toDate: () => Date }).toDate()
        : new Date(subData.reviewLockedUntil as unknown as string)
      : null;

    const isLockActive =
      subData.reviewLockedByAdminId &&
      existingLockUntil &&
      existingLockUntil > now;

    // Jika dikunci oleh admin lain dan belum kedaluwarsa
    if (isLockActive && subData.reviewLockedByAdminId !== adminUid) {
      return {
        locked: false,
        lockedByOther: true,
        lockedByAdminName: subData.reviewerDisplayName || 'Admin Lain',
        expiresAt: existingLockUntil.toISOString(),
      };
    }

    // Tempatkan / perbarui lock 15 menit ke depan
    const lockExpires = new Date(now.getTime() + 15 * 60 * 1000);
    const lockExpiresTimestamp = Timestamp.fromDate(lockExpires);

    transaction.update(subRef, {
      reviewLockedByAdminId: adminUid,
      reviewLockedUntil: lockExpiresTimestamp as unknown as FirestoreDate,
      reviewerDisplayName: adminData.displayName || adminData.email,
      status:
        subData.status === SUBMISSION_STATUS.SUBMITTED
          ? SUBMISSION_STATUS.IN_REVIEW
          : subData.status,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    transaction.update(taskRef, {
      reviewLockedByAdminId: adminUid,
      reviewLockedUntil: lockExpiresTimestamp as unknown as FirestoreDate,
      status:
        taskSnap.data()?.status === TASK_STATUS.SUBMITTED
          ? TASK_STATUS.IN_REVIEW
          : taskSnap.data()?.status,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    return {
      locked: true,
      expiresAt: lockExpires.toISOString(),
    };
  });
}

/**
 * Melepaskan Kunci Evaluasi (Release Review Lock).
 * Dipanggil saat Admin menutup halaman penilaian atau setelah submit keputusan.
 */
export async function releaseReviewLock(
  adminUid: string,
  submissionId: string
): Promise<void> {
  await assertAdminPrivilege(adminUid);
  const db = getAdminFirestore();

  const subRef = db.collection('submissions').doc(submissionId);
  const subSnap = await subRef.get();
  if (!subSnap.exists) return;

  const subData = subSnap.data() as SubmissionDocument;
  if (subData.reviewLockedByAdminId === adminUid) {
    const taskRef = db.collection('tasks').doc(subData.taskId);
    const batch = db.batch();

    batch.update(subRef, {
      reviewLockedByAdminId: null,
      reviewLockedUntil: null,
      reviewerDisplayName: null,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    batch.update(taskRef, {
      reviewLockedByAdminId: null,
      reviewLockedUntil: null,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    await batch.commit();
  }
}

/**
 * Mengevaluasi Submission secara Atomik (Review Submission).
 * Mendukung 4 Aksi: APPROVE, REQUEST_REVISION, EXTEND_DEADLINE, REJECT.
 * WAJIB menggunakan firestore.runTransaction().
 */
export async function reviewSubmission(
  adminUid: string,
  input: ReviewSubmissionInput
): Promise<{ submission: SubmissionDocument; task: TaskDocument }> {
  const adminData = await assertAdminPrivilege(adminUid);
  const validated = reviewSubmissionSchema.parse(input);
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    // 1. Ambil Submission
    const subRef = db.collection('submissions').doc(validated.submissionId);
    const subSnap = await transaction.get(subRef);
    if (!subSnap.exists) {
      throw new Error('Data submission tidak ditemukan.');
    }
    const subData = subSnap.data() as SubmissionDocument;

    // 2. Ambil Task
    const taskRef = db.collection('tasks').doc(subData.taskId);
    const taskSnap = await transaction.get(taskRef);
    if (!taskSnap.exists) {
      throw new Error('Data task terkait tidak ditemukan.');
    }
    const taskData = taskSnap.data() as TaskDocument;

    // 3. Verifikasi Lock Kepemilikan (Cegah Tabrakan Antar Admin)
    const now = new Date();
    const lockUntil = subData.reviewLockedUntil
      ? typeof (subData.reviewLockedUntil as { toDate?: () => Date }).toDate === 'function'
        ? (subData.reviewLockedUntil as { toDate: () => Date }).toDate()
        : new Date(subData.reviewLockedUntil as unknown as string)
      : null;

    if (
      subData.reviewLockedByAdminId &&
      subData.reviewLockedByAdminId !== adminUid &&
      lockUntil &&
      lockUntil > now
    ) {
      throw new Error(
        `Submission ini sedang dikunci oleh ${subData.reviewerDisplayName || 'Admin lain'}. Anda tidak dapat mengevaluasi submission ini.`
      );
    }

    // 4. Proses Keputusan Berdasarkan Aksi
    const subUpdates: Record<string, unknown> = {
      reviewedByAdminId: adminUid,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewLockedByAdminId: null,
      reviewLockedUntil: null,
      reviewerDisplayName: null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    const taskUpdates: Record<string, unknown> = {
      reviewLockedByAdminId: null,
      reviewLockedUntil: null,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (validated.action === 'APPROVE') {
      subUpdates.status = SUBMISSION_STATUS.APPROVED;
      taskUpdates.status = TASK_STATUS.APPROVED;

      // Solo Task Reward Generator
      if (taskData.mode === 'SOLO' || !taskData.assignedTeamId) {
        const recipientUserId = taskData.assignedUserId || subData.submittedByUserId;
        if (recipientUserId) {
          createRewardLedgerInsideTransaction(transaction, {
            taskId: taskData.id,
            ownerUserId: recipientUserId,
            amount: taskData.totalReward,
            taskTitle: taskData.title,
          });
        }
      }
    } else if (validated.action === 'REQUEST_REVISION') {
      subUpdates.status = SUBMISSION_STATUS.REVISION_REQUESTED;
      subUpdates.revisionNotes = validated.revisionNotes;

      taskUpdates.status = TASK_STATUS.REVISION;

      if (validated.revisionDeadline) {
        const revDate = new Date(validated.revisionDeadline);
        const revTimestamp = Timestamp.fromDate(revDate);
        subUpdates.revisionDeadlineAt = revTimestamp;
        taskUpdates.deadlineAt = revTimestamp;
      }
    } else if (validated.action === 'EXTEND_DEADLINE') {
      const extensionDays = validated.extensionDays || 1;
      const currentDeadline = taskData.deadlineAt
        ? typeof (taskData.deadlineAt as { toDate?: () => Date }).toDate === 'function'
          ? (taskData.deadlineAt as { toDate: () => Date }).toDate()
          : new Date(taskData.deadlineAt as unknown as string)
        : now;

      // Jika deadline lama sudah lewat, perpanjang dari now
      const baseDate = currentDeadline > now ? currentDeadline : now;
      const newDeadline = new Date(baseDate.getTime() + extensionDays * 24 * 60 * 60 * 1000);
      const newDeadlineTimestamp = Timestamp.fromDate(newDeadline);

      subUpdates.extensionReason = validated.reason;
      taskUpdates.deadlineAt = newDeadlineTimestamp;
      // Task tetap berstatus ACTIVE atau REVISION sesuai kondisi sebelum submit
      taskUpdates.status = TASK_STATUS.ACTIVE;
    } else if (validated.action === 'REJECT') {
      subUpdates.status = SUBMISSION_STATUS.REJECTED;
      subUpdates.revisionNotes = validated.reason;
      subUpdates.firstReviewerAdminId = adminUid;
      taskUpdates.status = TASK_STATUS.FAILED;
      taskUpdates.firstReviewerAdminId = adminUid;
    }

    // 5. Eksekusi Pembaruan Dokumen
    transaction.update(subRef, subUpdates);
    transaction.update(taskRef, taskUpdates);

    // 6. Catat Audit Trail Permanen
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: adminUid,
      actorRole: adminData.role || USER_ROLES.ADMIN,
      action: 'SUBMISSION_REVIEWED',
      entityType: 'SUBMISSION',
      entityId: validated.submissionId,
      metadata: {
        action: validated.action,
        taskId: taskData.id,
        reason: validated.reason || validated.revisionNotes || null,
        extensionDays: validated.extensionDays || null,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    const updatedSub: SubmissionDocument = {
      ...subData,
      ...subUpdates,
      id: subSnap.id,
      createdAt: subData.createdAt,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as SubmissionDocument;

    const updatedTask: TaskDocument = {
      ...taskData,
      ...taskUpdates,
      id: taskSnap.id,
      createdAt: taskData.createdAt,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as TaskDocument;

    return {
      submission: updatedSub,
      task: updatedTask,
    };
  }).then(async (result) => {
    // Strict Invariant: Non-blocking Notification Dispatch
    try {
      const recipientUid = result.submission.submittedByUserId;
      if (recipientUid) {
        if (validated.action === 'APPROVE') {
          dispatchNotification(recipientUid, {
            title: `Deliverable Disetujui: ${result.task.title}`,
            message: `Pengerjaan tugas "${result.task.title}" telah diverifikasi dan disetujui oleh Administrator SAKODE. Reward kini siap diklaim!`,
            category: NOTIFICATION_CATEGORIES.SUBMISSION,
            link: '/member/rewards',
          }).catch((err) => console.warn('[reviewSubmission] approve notif error:', err));
        } else if (validated.action === 'REQUEST_REVISION') {
          const deadlineText = validated.revisionDeadline
            ? formatDateWIB(new Date(validated.revisionDeadline))
            : 'Sesuai instruksi';
          const taskUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://sakode.id'}/member/tasks/${result.task.id}`;
          const emailData = revisionRequestedEmail(
            'Member SAKODE',
            result.task.title,
            validated.revisionNotes || 'Harap periksa kelengkapan kriteria pengerjaan.',
            deadlineText,
            taskUrl
          );

          dispatchNotification(recipientUid, {
            title: `Revisi Diminta: ${result.task.title}`,
            message: `Administrator meminta revisi untuk tugas "${result.task.title}". Catatan: "${validated.revisionNotes}".`,
            category: NOTIFICATION_CATEGORIES.REVISION,
            link: `/member/tasks/${result.task.id}`,
            emailPayload: {
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text,
            },
          }).catch((err) => console.warn('[reviewSubmission] revision notif error:', err));
        }
      }
    } catch (notifErr) {
      console.warn('[reviewSubmission] Notification non-blocking error:', notifErr);
    }
    return result;
  });
}

/**
 * Mengambil seluruh submission untuk suatu task (diurutkan berdasarkan versi descending).
 */
export async function getSubmissionsForTask(
  taskId: string
): Promise<SubmissionDocument[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('submissions')
    .where('taskId', '==', taskId)
    .orderBy('version', 'desc')
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<SubmissionDocument, 'id'>),
  }));
}

/**
 * Mengambil antrean submission yang menunggu penilaian Admin (SUBMITTED / IN_REVIEW).
 */
export async function getPendingSubmissionsQueue(): Promise<SubmissionDocument[]> {
  const db = getAdminFirestore();

  // Ambil submission status SUBMITTED dan IN_REVIEW
  const snap = await db
    .collection('submissions')
    .where('status', 'in', [SUBMISSION_STATUS.SUBMITTED, SUBMISSION_STATUS.IN_REVIEW])
    .orderBy('createdAt', 'asc')
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<SubmissionDocument, 'id'>),
  }));
}

/**
 * Mengambil semua submission (untuk Admin monitoring seluruh riwayat review).
 */
export async function getAllSubmissionsForAdmin(): Promise<SubmissionDocument[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('submissions')
    .orderBy('createdAt', 'desc')
    .limit(100)
    .get();

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<SubmissionDocument, 'id'>),
  }));
}

/**
 * Mengambil detail satu submission beserta task terkait.
 */
export async function getSubmissionDetail(
  submissionId: string
): Promise<{ submission: SubmissionDocument; task: TaskDocument }> {
  const db = getAdminFirestore();

  const subSnap = await db.collection('submissions').doc(submissionId).get();
  if (!subSnap.exists) {
    throw new Error('Data submission tidak ditemukan.');
  }
  const submission = {
    id: subSnap.id,
    ...(subSnap.data() as Omit<SubmissionDocument, 'id'>),
  };

  const taskSnap = await db.collection('tasks').doc(submission.taskId).get();
  if (!taskSnap.exists) {
    throw new Error('Data task terkait tidak ditemukan.');
  }
  const task = {
    id: taskSnap.id,
    ...(taskSnap.data() as Omit<TaskDocument, 'id'>),
  };

  return { submission, task };
}
