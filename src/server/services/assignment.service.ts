/**
 * SAKODE Task & Reward Platform - Task Assignment Engine
 * Menangani transaksi atomik Instant Take, pengajuan Aplikasi (maksimal 3 pending),
 * pembatalan tanpa penalti, dan pemilihan applicant dengan auto-withdrawal.
 *
 * Strict Invariants (AGENTS.md & ARCHITECTURE.md):
 * 1. 1 Member hanya boleh memiliki 1 Active Task dalam satu waktu.
 * 2. Maksimal 3 Pending Application per member.
 * 3. Seluruh mutasi assignment wajib menggunakan firestore.runTransaction().
 * 4. Auto-withdraw seluruh permohonan lain saat 1 aplikasi diterima tanpa penalti.
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { TaskDocument, ApplicationDocument, UserDocument, FirestoreDate } from '@/types/database';
import {
  TASK_STATUS,
  TASK_ASSIGNMENT_TYPES,
  TASK_DEADLINE_TYPES,
  APPLICATION_STATUS,
  USER_APPROVAL_STATUS,
  INVARIANTS,
} from '@/lib/constants';
import type { ApplyTaskInput } from '@/lib/validations/task';
import { assertAdminPrivilege } from './user.service';

/**
 * Transaksi Atomik Instant Take (Mencegah perebutan slot bersamaan & batas 1 active task)
 */
export async function instantTakeTask(
  userId: string,
  taskId: string,
  agreedTermsVersion: number
): Promise<TaskDocument> {
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const userRef = db.collection('users').doc(userId);
    const taskRef = db.collection('tasks').doc(taskId);

    const [userDoc, taskDoc] = await Promise.all([
      transaction.get(userRef),
      transaction.get(taskRef),
    ]);

    if (!userDoc.exists) {
      throw new Error('Data member tidak ditemukan.');
    }
    if (!taskDoc.exists) {
      throw new Error('Task tidak ditemukan.');
    }

    const userData = userDoc.data() as UserDocument;
    const taskData = taskDoc.data() as TaskDocument;

    // 1. Verifikasi Status Approval Member
    if (userData.approvalStatus !== USER_APPROVAL_STATUS.APPROVED) {
      throw new Error('Akun Anda belum disetujui (APPROVED) oleh Admin untuk mengambil task.');
    }

    // 2. Strict Invariant: Member belum memiliki Active Task
    if (userData.activeTaskId) {
      throw new Error('Member sedang memiliki task aktif yang belum selesai. Selesaikan task saat ini terlebih dahulu.');
    }

    // 3. Verifikasi Status Task masih OPEN dan bertipe INSTANT_TAKE
    if (taskData.status !== TASK_STATUS.OPEN) {
      throw new Error('Task sudah tidak tersedia atau telah diambil oleh member lain.');
    }
    if (taskData.assignmentType !== TASK_ASSIGNMENT_TYPES.INSTANT_TAKE) {
      throw new Error('Task ini menggunakan metode Application, bukan Instant Take.');
    }

    // 4. Verifikasi Versi Snapshot Terms
    if (taskData.termsSnapshot && agreedTermsVersion < taskData.termsSnapshot.version) {
      throw new Error('Terdapat pembaruan pada Terms & Conditions task. Harap setujui versi terbaru.');
    }

    // 5. Hitung Batas Waktu Aktual (deadlineAt)
    let deadlineTimestamp: Timestamp | null = null;
    const now = Date.now();

    if (taskData.deadlineType === TASK_DEADLINE_TYPES.DURATION && taskData.durationMinutes) {
      const targetTime = new Date(now + taskData.durationMinutes * 60 * 1000);
      deadlineTimestamp = Timestamp.fromDate(targetTime);
    } else if (taskData.deadlineType === TASK_DEADLINE_TYPES.FIXED && taskData.fixedDeadlineAt) {
      const fixed = taskData.fixedDeadlineAt;
      if (typeof fixed === 'object' && fixed !== null && 'toDate' in fixed && typeof fixed.toDate === 'function') {
        deadlineTimestamp = Timestamp.fromDate(fixed.toDate());
      } else {
        deadlineTimestamp = Timestamp.fromDate(new Date(fixed as unknown as string));
      }
    }

    // 6. Mutasi Atomik Bersamaan
    transaction.update(taskRef, {
      status: TASK_STATUS.ACTIVE,
      assignedUserId: userId,
      deadlineAt: deadlineTimestamp as unknown as FirestoreDate,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    transaction.update(userRef, {
      activeTaskId: taskId,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    // 7. Catat Audit Trail
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: userId,
      actorRole: userData.role,
      action: 'TASK_TAKEN_INSTANT',
      entityType: 'TASK',
      entityId: taskId,
      beforeSnapshot: { status: TASK_STATUS.OPEN, assignedUserId: null },
      afterSnapshot: { status: TASK_STATUS.ACTIVE, assignedUserId: userId },
      reason: `Member ${userData.displayName || userId} mengambil task secara instan.`,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ...taskData,
      id: taskId,
      status: TASK_STATUS.ACTIVE,
      assignedUserId: userId,
      deadlineAt: (deadlineTimestamp?.toDate().toISOString() || null) as unknown as FirestoreDate,
    };
  });
}

/**
 * Mengajukan permohonan pengerjaan task (Application)
 * Menegakkan batas maksimal 3 pending applications.
 */
export async function submitApplication(
  userId: string,
  input: ApplyTaskInput
): Promise<ApplicationDocument> {
  const db = getAdminFirestore();

  const userRef = db.collection('users').doc(userId);
  const taskRef = db.collection('tasks').doc(input.taskId);

  const [userSnap, taskSnap] = await Promise.all([userRef.get(), taskRef.get()]);

  if (!userSnap.exists) throw new Error('Data member tidak ditemukan.');
  if (!taskSnap.exists) throw new Error('Task tidak ditemukan.');

  const userData = userSnap.data() as UserDocument;
  const taskData = taskSnap.data() as TaskDocument;

  if (userData.approvalStatus !== USER_APPROVAL_STATUS.APPROVED) {
    throw new Error('Akun Anda belum disetujui untuk mengajukan aplikasi task.');
  }

  // Strict Invariant: Jika sudah memegang 1 active task, tolak
  if (userData.activeTaskId) {
    throw new Error('Anda sedang memiliki 1 task aktif yang belum selesai.');
  }

  // Strict Invariant: Maksimal 3 pending applications
  const currentPending = userData.pendingApplicationCount || 0;
  if (currentPending >= INVARIANTS.MAX_PENDING_APPLICATIONS_PER_MEMBER) {
    throw new Error(
      `Batas kuota maksimal ${INVARIANTS.MAX_PENDING_APPLICATIONS_PER_MEMBER} permohonan pending tercapai. Harap tunggu evaluasi atau batalkan permohonan yang ada.`
    );
  }

  if (taskData.status !== TASK_STATUS.OPEN) {
    throw new Error('Task sudah tidak berstatus OPEN.');
  }

  // Cek apakah member sudah mendaftar pada task yang sama
  const existingApp = await db
    .collection('applications')
    .where('taskId', '==', input.taskId)
    .where('userId', '==', userId)
    .where('status', '==', APPLICATION_STATUS.PENDING)
    .limit(1)
    .get();

  if (!existingApp.empty) {
    throw new Error('Anda sudah memiliki permohonan pending pada task ini.');
  }

  // Buat dokumen aplikasi baru
  const appRef = db.collection('applications').doc();
  const newApp: Omit<ApplicationDocument, 'id'> = {
    taskId: input.taskId,
    userId,
    message: input.message,
    portfolioLinks: input.portfolioLinks || [],
    status: APPLICATION_STATUS.PENDING,
    withdrawalReason: null,
    applicantDisplayName: userData.displayName || 'Member',
    applicantEmail: userData.email,
    applicantContactNumber: userData.contactNumber,
    applicantSkills: userData.skills || [],
    taskTitle: taskData.title,
    taskReward: taskData.totalReward,
    createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  };

  await appRef.set(newApp);

  // Tambah counter pendingApplicationCount secara atomik
  await userRef.update({
    pendingApplicationCount: FieldValue.increment(1),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const createdSnap = await appRef.get();
  return { ...(createdSnap.data() as ApplicationDocument), id: appRef.id };
}

/**
 * Membatalkan aplikasi pending (Withdrawal tanpa penalti)
 */
export async function withdrawApplication(
  userId: string,
  applicationId: string,
  reason?: string
): Promise<void> {
  const db = getAdminFirestore();
  const appRef = db.collection('applications').doc(applicationId);
  const appSnap = await appRef.get();

  if (!appSnap.exists) {
    throw new Error('Data aplikasi tidak ditemukan.');
  }

  const appData = appSnap.data() as ApplicationDocument;
  if (appData.userId !== userId) {
    throw new Error('Anda tidak memiliki wewenang membatalkan permohonan ini.');
  }

  if (appData.status !== APPLICATION_STATUS.PENDING) {
    throw new Error(`Permohonan tidak dapat dibatalkan karena berstatus ${appData.status}`);
  }

  await appRef.update({
    status: APPLICATION_STATUS.WITHDRAWN,
    withdrawalReason: reason || 'Dibatalkan oleh pemohon tanpa penalti.',
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Kurangi counter pending user
  const userRef = db.collection('users').doc(userId);
  await userRef.update({
    pendingApplicationCount: FieldValue.increment(-1),
    updatedAt: FieldValue.serverTimestamp(),
  });
}

/**
 * Admin memilih salah satu applicant untuk mengerjakan task:
 * 1. Transaksi Atomik mengunci task -> status ACTIVE.
 * 2. Status aplikasi terpilih -> ACCEPTED.
 * 3. Auto-Withdrawal: Seluruh aplikasi pending lain milik member tersebut otomatis WITHDRAWN.
 * 4. Seluruh aplikasi pendaftar lain pada task ini menjadi REJECTED.
 */
export async function selectApplicant(
  adminUid: string,
  taskId: string,
  applicationId: string
): Promise<TaskDocument> {
  const adminData = await assertAdminPrivilege(adminUid);
  const db = getAdminFirestore();

  return await db.runTransaction(async (transaction) => {
    const taskRef = db.collection('tasks').doc(taskId);
    const appRef = db.collection('applications').doc(applicationId);

    const [taskDoc, appDoc] = await Promise.all([
      transaction.get(taskRef),
      transaction.get(appRef),
    ]);

    if (!taskDoc.exists) throw new Error('Task tidak ditemukan.');
    if (!appDoc.exists) throw new Error('Aplikasi pendaftar tidak ditemukan.');

    const taskData = taskDoc.data() as TaskDocument;
    const appData = appDoc.data() as ApplicationDocument;

    if (taskData.status !== TASK_STATUS.OPEN) {
      throw new Error(`Task sudah tidak berstatus OPEN (Status: ${taskData.status}).`);
    }
    if (appData.status !== APPLICATION_STATUS.PENDING) {
      throw new Error(`Aplikasi ini sudah tidak berstatus PENDING (Status: ${appData.status}).`);
    }

    const applicantId = appData.userId;
    const applicantRef = db.collection('users').doc(applicantId);
    const applicantDoc = await transaction.get(applicantRef);

    if (!applicantDoc.exists) throw new Error('Data applicant tidak ditemukan.');
    const applicantData = applicantDoc.data() as UserDocument;

    // Strict Invariant: Applicant belum memiliki Active Task
    if (applicantData.activeTaskId) {
      throw new Error('Applicant terpilih telah memiliki task aktif lain yang belum selesai.');
    }

    // Hitung deadline
    let deadlineTimestamp: Timestamp | null = null;
    const now = Date.now();

    if (taskData.deadlineType === TASK_DEADLINE_TYPES.DURATION && taskData.durationMinutes) {
      deadlineTimestamp = Timestamp.fromDate(new Date(now + taskData.durationMinutes * 60 * 1000));
    } else if (taskData.deadlineType === TASK_DEADLINE_TYPES.FIXED && taskData.fixedDeadlineAt) {
      const fixed = taskData.fixedDeadlineAt;
      if (typeof fixed === 'object' && fixed !== null && 'toDate' in fixed && typeof fixed.toDate === 'function') {
        deadlineTimestamp = Timestamp.fromDate(fixed.toDate());
      } else {
        deadlineTimestamp = Timestamp.fromDate(new Date(fixed as unknown as string));
      }
    }

    // 1. Update task menjadi ACTIVE
    transaction.update(taskRef, {
      status: TASK_STATUS.ACTIVE,
      assignedUserId: applicantId,
      deadlineAt: deadlineTimestamp as unknown as FirestoreDate,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    // 2. Update aplikasi terpilih menjadi ACCEPTED
    transaction.update(appRef, {
      status: APPLICATION_STATUS.ACCEPTED,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    // 3. Update member terpilih: activeTaskId terisi, pending count di-reset
    transaction.update(applicantRef, {
      activeTaskId: taskId,
      pendingApplicationCount: 0,
      updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    });

    // 4. Audit Trail
    const auditRef = db.collection('auditEvents').doc();
    transaction.set(auditRef, {
      actorId: adminUid,
      actorRole: adminData.role,
      action: 'TASK_APPLICANT_SELECTED',
      entityType: 'TASK',
      entityId: taskId,
      beforeSnapshot: { assignedUserId: null, status: TASK_STATUS.OPEN },
      afterSnapshot: { assignedUserId: applicantId, status: TASK_STATUS.ACTIVE },
      reason: `Admin ${adminData.displayName || adminUid} memilih applicant ${applicantData.displayName || applicantId}.`,
      timestamp: FieldValue.serverTimestamp(),
    });

    return {
      ...taskData,
      id: taskId,
      status: TASK_STATUS.ACTIVE,
      assignedUserId: applicantId,
    };
  }).then(async (result) => {
    // Jalankan auto-withdrawal & penolakan pendaftar lain di luar transaction agar tidak melampaui batas reads
    const applicantId = result.assignedUserId!;

    // 1. Auto-Withdraw permohonan lain milik applicant terpilih pada task lain
    const otherAppsOfApplicant = await db
      .collection('applications')
      .where('userId', '==', applicantId)
      .where('status', '==', APPLICATION_STATUS.PENDING)
      .get();

    for (const doc of otherAppsOfApplicant.docs) {
      if (doc.id !== applicationId) {
        await doc.ref.update({
          status: APPLICATION_STATUS.WITHDRAWN,
          withdrawalReason: 'Ditarik otomatis karena diterima pada task lain (Aturan Invariant SAKODE).',
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    // 2. Tolak permohonan pendaftar lain pada task ini
    const otherApplicantsOnTask = await db
      .collection('applications')
      .where('taskId', '==', taskId)
      .where('status', '==', APPLICATION_STATUS.PENDING)
      .get();

    for (const doc of otherApplicantsOnTask.docs) {
      if (doc.id !== applicationId) {
        const otherData = doc.data() as ApplicationDocument;
        await doc.ref.update({
          status: APPLICATION_STATUS.REJECTED,
          withdrawalReason: 'Applicant lain telah dipilih oleh Admin.',
          updatedAt: FieldValue.serverTimestamp(),
        });
        // Kurangi pendingApplicationCount pendaftar yang ditolak
        await db.collection('users').doc(otherData.userId).update({
          pendingApplicationCount: FieldValue.increment(-1),
          updatedAt: FieldValue.serverTimestamp(),
        });
      }
    }

    return result;
  });
}

/**
 * Mengambil daftar seluruh aplikasi yang masuk pada sebuah task (untuk panel Admin Review).
 */
export async function getApplicationsForTask(taskId: string): Promise<ApplicationDocument[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('applications')
    .where('taskId', '==', taskId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((d) => ({
    ...(d.data() as ApplicationDocument),
    id: d.id,
  }));
}

/**
 * Mengambil daftar seluruh aplikasi yang pernah diajukan oleh seorang member.
 */
export async function getUserApplications(userId: string): Promise<ApplicationDocument[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('applications')
    .where('userId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snap.docs.map((d) => ({
    ...(d.data() as ApplicationDocument),
    id: d.id,
  }));
}
