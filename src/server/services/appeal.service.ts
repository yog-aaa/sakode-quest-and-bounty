/**
 * SAKODE Task & Reward Platform - Partial Completion & One-Time Appeal Service
 * Mematuhi invariants di AGENTS.md, ARCHITECTURE.md, dan DESIGN.md:
 * 1. Batas Bounty Awal: partialReward + continuationBounty <= initialBounty.
 * 2. Auto-generation Linked Continuation Task (parentTaskId = originalTaskId).
 * 3. One-Time Appeal Engine (maksimal 1 kali kesempatan sanggahan per submission).
 * 4. Anti-Conflict of Interest: Admin pemutus awal dilarang meninjau sanggahan yang sama.
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type {
  SubmissionDocument,
  TaskDocument,
  TeamDocument,
  FirestoreDate,
} from '@/types/database';
import {
  TASK_STATUS,
  TASK_MODES,
  SUBMISSION_STATUS,
  USER_ROLES,
} from '@/lib/constants';
import {
  partialCompletionSchema,
  type PartialCompletionInput,
  submitAppealSchema,
  type SubmitAppealInput,
  decideAppealSchema,
  type DecideAppealInput,
} from '@/lib/validations/appeal';
import { assertAdminPrivilege } from './user.service';

/**
 * 1. Menetapkan Selesai Sebagian (Partial Completion) & Auto-Generate Continuation Task.
 * Hanya dapat dipanggil oleh Admin via review lock.
 * WAJIB firestore.runTransaction().
 */
export async function setPartialCompletion(
  adminUid: string,
  input: PartialCompletionInput
): Promise<{
  originalTask: TaskDocument;
  continuationTask: TaskDocument;
  submission: SubmissionDocument;
}> {
  const adminData = await assertAdminPrivilege(adminUid);
  const validated = partialCompletionSchema.parse(input);
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

    // 3. Verifikasi Review Lock
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
        `Submission sedang dikunci oleh ${subData.reviewerDisplayName || 'Admin lain'}. Anda tidak dapat mengevaluasi submission ini.`
      );
    }

    // 4. STRICT INVARIANT: Batas Bounty Awal
    // partialRewardAmount MUTLAK harus lebih kecil dari totalReward awal
    if (validated.partialRewardAmount >= taskData.totalReward) {
      throw new Error(
        `Nominal reward parsial (Rp ${validated.partialRewardAmount.toLocaleString(
          'id-ID'
        )}) harus lebih kecil dari total bounty task (Rp ${taskData.totalReward.toLocaleString(
          'id-ID'
        )}). Jika hasil diterima penuh, gunakan opsi Setujui Penuh (Approve).`
      );
    }

    const remainingBounty = taskData.totalReward - validated.partialRewardAmount;

    // 5. Auto-Generate Linked Continuation Task
    const continuationTaskRef = db.collection('tasks').doc();
    const continuationStatus = validated.publishContinuationNow
      ? TASK_STATUS.OPEN
      : TASK_STATUS.DRAFT;

    const continuationTaskData: Omit<TaskDocument, 'id'> = {
      title: `[Lanjutan] ${taskData.title}`,
      description: `Kelanjutan dari task "${taskData.title}". Porsi pekerjaan yang telah selesai diterima: "${validated.acceptedNotes}". Sisa ruang lingkup ini diterbitkan kembali sebagai Continuation Task resmi.`,
      scope: validated.remainingScope,
      deliverableGuidelines: taskData.deliverableGuidelines,
      acceptanceCriteria: [
        `Menyelesaikan sisa pekerjaan: ${validated.remainingScope.slice(0, 80)}...`,
        ...taskData.acceptanceCriteria,
      ],
      mode: taskData.mode,
      minTeamSize: taskData.minTeamSize || null,
      maxTeamSize: taskData.maxTeamSize || null,
      assignmentType: taskData.assignmentType,
      requiredSkills: taskData.requiredSkills,
      totalReward: remainingBounty, // Integer Rupiah sisa
      deadlineType: taskData.deadlineType,
      fixedDeadlineAt: null,
      durationMinutes: taskData.durationMinutes || null,
      deadlineAt: null,
      status: continuationStatus,
      termsSnapshot: taskData.termsSnapshot,
      assignedUserId: null,
      assignedTeamId: null,
      reviewLockedByAdminId: null,
      reviewLockedUntil: null,
      parentTaskId: taskData.id, // Terhubung ke task induk
      continuationTaskId: null,
      createdByAdminId: adminUid,
      createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    };

    transaction.set(continuationTaskRef, continuationTaskData);

    // 6. Update Submission Dokumen Asal
    const subUpdates: Record<string, unknown> = {
      status: SUBMISSION_STATUS.PARTIAL,
      partialAcceptedNotes: validated.acceptedNotes,
      partialRemainingScope: validated.remainingScope,
      partialRewardAmount: validated.partialRewardAmount,
      continuationTaskId: continuationTaskRef.id,
      firstReviewerAdminId: adminUid,
      reviewedByAdminId: adminUid,
      reviewedAt: FieldValue.serverTimestamp(),
      reviewLockedByAdminId: null,
      reviewLockedUntil: null,
      reviewerDisplayName: null,
      updatedAt: FieldValue.serverTimestamp(),
    };
    transaction.update(subRef, subUpdates);

    // 7. Update Task Dokumen Asal
    const taskUpdates: Record<string, unknown> = {
      status: TASK_STATUS.PARTIAL,
      continuationTaskId: continuationTaskRef.id,
      partialRewardAmount: validated.partialRewardAmount,
      firstReviewerAdminId: adminUid,
      reviewLockedByAdminId: null,
      reviewLockedUntil: null,
      updatedAt: FieldValue.serverTimestamp(),
    };
    transaction.update(taskRef, taskUpdates);

    // 8. Audit Trail (Append-Only)
    const auditRef1 = db.collection('auditEvents').doc();
    transaction.set(auditRef1, {
      actorId: adminUid,
      actorRole: adminData.role || USER_ROLES.ADMIN,
      action: 'TASK_PARTIAL_COMPLETED',
      entityType: 'TASK',
      entityId: taskData.id,
      metadata: {
        partialRewardAmount: validated.partialRewardAmount,
        remainingBounty,
        acceptedNotes: validated.acceptedNotes,
        remainingScope: validated.remainingScope,
        continuationTaskId: continuationTaskRef.id,
        reason: validated.reason,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    const auditRef2 = db.collection('auditEvents').doc();
    transaction.set(auditRef2, {
      actorId: adminUid,
      actorRole: adminData.role || USER_ROLES.ADMIN,
      action: 'CONTINUATION_TASK_CREATED',
      entityType: 'TASK',
      entityId: continuationTaskRef.id,
      metadata: {
        parentTaskId: taskData.id,
        totalReward: remainingBounty,
        status: continuationStatus,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    const updatedOrigTask: TaskDocument = {
      ...taskData,
      ...taskUpdates,
      id: taskSnap.id,
      createdAt: taskData.createdAt,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as TaskDocument;

    const createdContTask: TaskDocument = {
      ...continuationTaskData,
      id: continuationTaskRef.id,
      createdAt: Timestamp.now() as unknown as FirestoreDate,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as TaskDocument;

    const updatedSub: SubmissionDocument = {
      ...subData,
      ...subUpdates,
      id: subSnap.id,
      createdAt: subData.createdAt,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as SubmissionDocument;

    return {
      originalTask: updatedOrigTask,
      continuationTask: createdContTask,
      submission: updatedSub,
    };
  });
}

/**
 * 2. Mengajukan Sanggahan (One-Time Appeal Engine).
 * Member / Team Lead mengajukan banding atas keputusan FAILED atau PARTIAL.
 * Dibatasi tepat 1 kali per submission.
 */
export async function fileSubmissionAppeal(
  userId: string,
  input: SubmitAppealInput
): Promise<{ submission: SubmissionDocument; task: TaskDocument }> {
  const validated = submitAppealSchema.parse(input);
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

    // 3. Verifikasi Hak Pemanggil (Assignee Solo vs Team Lead)
    if (taskData.mode === TASK_MODES.SOLO) {
      if (taskData.assignedUserId !== userId) {
        throw new Error('Hanya member yang ditugaskan yang berhak mengajukan sanggahan.');
      }
    } else if (taskData.mode === TASK_MODES.TEAM) {
      if (!taskData.assignedTeamId) {
        throw new Error('Data tim tidak valid.');
      }
      const teamRef = db.collection('teams').doc(taskData.assignedTeamId);
      const teamSnap = await transaction.get(teamRef);
      if (!teamSnap.exists) {
        throw new Error('Data tim tidak ditemukan.');
      }
      const teamData = teamSnap.data() as TeamDocument;
      if (teamData.teamLeadUserId !== userId) {
        throw new Error('Hanya Team Lead yang berwenang mengajukan sanggahan tim.');
      }
    }

    // 4. Verifikasi Status Kelayakan Appeal: Hanya FAILED atau PARTIAL
    if (taskData.status !== TASK_STATUS.FAILED && taskData.status !== TASK_STATUS.PARTIAL) {
      throw new Error(
        `Sanggahan hanya dapat diajukan untuk task dengan status FAILED (ditolak) atau PARTIAL (disetujui sebagian). Status task saat ini adalah "${taskData.status}".`
      );
    }

    // 5. STRICT INVARIANT: One-Time Appeal Engine (Maksimal 1 Kali Sanggahan)
    if (subData.appealed || subData.appeal !== null) {
      throw new Error(
        'Hak sanggahan (Appeal) telah digunakan untuk submission ini. Sesuai regulasi sistem SAKODE, setiap pengerjaan hanya memiliki maksimal 1 kali kesempatan sanggah.'
      );
    }

    // 6. Buat Data Appeal & Perbarui Dokumen
    const appealData = {
      appealedByUserId: userId,
      reason: validated.appealReason,
      evidenceFiles: validated.evidenceFiles,
      filedAt: FieldValue.serverTimestamp(),
      reviewedByAdminId: null,
      reviewedAt: null,
      resolutionStatus: null,
      resolutionNotes: null,
    };

    transaction.update(subRef, {
      appeal: appealData,
      appealed: true,
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.update(taskRef, {
      status: TASK_STATUS.APPEALED,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 7. Catat Audit Event
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: userId,
      action: 'SUBMISSION_APPEAL_FILED',
      entityType: 'SUBMISSION',
      entityId: subData.id,
      metadata: {
        taskId: taskData.id,
        reason: validated.appealReason,
        evidenceCount: validated.evidenceFiles.length,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    const updatedSub: SubmissionDocument = {
      ...subData,
      appealed: true,
      appeal: {
        appealedByUserId: userId,
        reason: validated.appealReason,
        evidenceFiles: validated.evidenceFiles,
        filedAt: Timestamp.now() as unknown as FirestoreDate,
        reviewedByAdminId: null,
        reviewedAt: null,
        resolutionStatus: undefined,
        resolutionNotes: null,
      },
      id: subSnap.id,
      createdAt: subData.createdAt,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as SubmissionDocument;

    const updatedTask: TaskDocument = {
      ...taskData,
      status: TASK_STATUS.APPEALED,
      id: taskSnap.id,
      createdAt: taskData.createdAt,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as TaskDocument;

    return {
      submission: updatedSub,
      task: updatedTask,
    };
  });
}

/**
 * 3. Menilai dan Memutuskan Sanggahan (Decide Appeal).
 * STRICT INVARIANT: Aturan Anti-Konflik Kepentingan (Admin pemutus awal DILARANG memutuskan appeal).
 * WAJIB firestore.runTransaction().
 */
export async function decideAppeal(
  adminUid: string,
  input: DecideAppealInput
): Promise<{ submission: SubmissionDocument; task: TaskDocument }> {
  const adminData = await assertAdminPrivilege(adminUid);
  const validated = decideAppealSchema.parse(input);
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

    // 3. Verifikasi Keberadaan Appeal
    if (!subData.appeal) {
      throw new Error('Tidak ada data sanggahan yang diajukan pada submission ini.');
    }

    if (taskData.status !== TASK_STATUS.APPEALED) {
      throw new Error(
        `Task ini tidak sedang dalam status APPEALED (status saat ini: ${taskData.status}).`
      );
    }

    // 4. STRICT INVARIANT: Anti-Conflict of Interest (Independent Reviewer)
    // Admin pemutus awal MUTLAK dilarang mengevaluasi appeal-nya sendiri
    const firstReviewerAdminId =
      subData.firstReviewerAdminId ||
      subData.reviewedByAdminId ||
      taskData.firstReviewerAdminId;

    if (firstReviewerAdminId && adminUid === firstReviewerAdminId) {
      throw new Error(
        'Aturan Anti-Konflik Kepentingan: Anda adalah Admin yang memberikan evaluasi awal pada task ini. Peninjauan dan keputusan sanggahan (Appeal) MUTLAK harus dilakukan oleh Admin lain.'
      );
    }

    // 5. Eksekusi Keputusan Banding Final
    const isApproved = validated.decision === 'APPROVE';
    const resolutionStatus: 'APPROVED' | 'REJECTED' = isApproved ? 'APPROVED' : 'REJECTED';

    let finalTaskStatus: (typeof TASK_STATUS)[keyof typeof TASK_STATUS];
    let finalSubStatus: (typeof SUBMISSION_STATUS)[keyof typeof SUBMISSION_STATUS];

    if (isApproved) {
      // Jika banding diterima: status dipulihkan menjadi APPROVED penuh
      finalTaskStatus = TASK_STATUS.APPROVED;
      finalSubStatus = SUBMISSION_STATUS.APPROVED;
    } else {
      // Jika banding ditolak: status kembali ke FAILED atau PARTIAL sebelumnya
      finalTaskStatus = taskData.partialRewardAmount ? TASK_STATUS.PARTIAL : TASK_STATUS.FAILED;
      finalSubStatus = subData.partialRewardAmount ? SUBMISSION_STATUS.PARTIAL : SUBMISSION_STATUS.REJECTED;
    }

    const updatedAppeal = {
      ...subData.appeal,
      reviewedByAdminId: adminUid,
      reviewedAt: FieldValue.serverTimestamp(),
      resolutionStatus,
      resolutionNotes: validated.resolutionNotes,
    };

    transaction.update(subRef, {
      status: finalSubStatus,
      appeal: updatedAppeal,
      reviewLockedByAdminId: null,
      reviewLockedUntil: null,
      reviewerDisplayName: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    transaction.update(taskRef, {
      status: finalTaskStatus,
      reviewLockedByAdminId: null,
      reviewLockedUntil: null,
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 6. Catat Audit Event Permanen
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: adminUid,
      actorRole: adminData.role || USER_ROLES.ADMIN,
      action: 'APPEAL_DECIDED',
      entityType: 'SUBMISSION',
      entityId: subData.id,
      metadata: {
        decision: validated.decision,
        resolutionStatus,
        resolutionNotes: validated.resolutionNotes,
        firstReviewerAdminId: firstReviewerAdminId || null,
        appealReviewerAdminId: adminUid,
        finalTaskStatus,
        taskId: taskData.id,
      },
      timestamp: FieldValue.serverTimestamp(),
    });

    const updatedSub: SubmissionDocument = {
      ...subData,
      status: finalSubStatus,
      appeal: {
        ...subData.appeal,
        reviewedByAdminId: adminUid,
        reviewedAt: Timestamp.now() as unknown as FirestoreDate,
        resolutionStatus,
        resolutionNotes: validated.resolutionNotes,
      },
      id: subSnap.id,
      createdAt: subData.createdAt,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as SubmissionDocument;

    const updatedTask: TaskDocument = {
      ...taskData,
      status: finalTaskStatus,
      id: taskSnap.id,
      createdAt: taskData.createdAt,
      updatedAt: Timestamp.now() as unknown as FirestoreDate,
    } as TaskDocument;

    return {
      submission: updatedSub,
      task: updatedTask,
    };
  });
}

/**
 * 4. Mengambil Antrean Sanggahan (Appeals Queue) untuk Admin.
 */
export async function getAppealsQueue(): Promise<SubmissionDocument[]> {
  const db = getAdminFirestore();

  // Query task yang berstatus APPEALED
  const tasksSnap = await db
    .collection('tasks')
    .where('status', '==', TASK_STATUS.APPEALED)
    .get();

  if (tasksSnap.empty) return [];

  const taskIds = tasksSnap.docs.map((doc) => doc.id);

  // Ambil submissions terkait yang berstatus APPEALED / memiliki appeal aktif
  const subSnap = await db
    .collection('submissions')
    .where('taskId', 'in', taskIds)
    .get();

  return subSnap.docs
    .map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<SubmissionDocument, 'id'>),
    }))
    .filter((sub) => sub.appeal && sub.appeal.resolutionStatus === undefined || sub.appeal?.resolutionStatus === null);
}
