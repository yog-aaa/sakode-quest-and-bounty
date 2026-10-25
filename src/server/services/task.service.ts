/**
 * SAKODE Task & Reward Platform - Task Management Service
 * Mengelola pembuatan task, snapshot Terms, publikasi task, dan penegakan deadline.
 * Mematuhi invariants di AGENTS.md, ARCHITECTURE.md, dan DESIGN.md.
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import type { TaskDocument, FirestoreDate } from '@/types/database';
import { TASK_STATUS, TASK_DEADLINE_TYPES, TASK_MODES } from '@/lib/constants';
import { createTaskSchema, type CreateTaskInput } from '@/lib/validations/task';
import { assertAdminPrivilege } from './user.service';
import { toDateSafe } from '@/lib/utils';

/**
 * Membuat task baru (DRAFT atau langsung OPEN) dengan snapshot Terms & Conditions resmi.
 * Hanya dapat dipanggil oleh Admin atau Super Admin.
 */
export async function createTask(
  adminUid: string,
  input: CreateTaskInput
): Promise<TaskDocument> {
  const adminData = await assertAdminPrivilege(adminUid);
  const validated = createTaskSchema.parse(input);

  const db = getAdminFirestore();
  const taskRef = db.collection('tasks').doc();

  const fixedDeadlineTimestamp =
    validated.deadlineType === TASK_DEADLINE_TYPES.FIXED && validated.fixedDeadline
      ? Timestamp.fromDate(new Date(validated.fixedDeadline))
      : null;

  // Jika fixed deadline dan langsung OPEN, deadlineAt = fixedDeadlineTimestamp
  const initialDeadlineAt =
    validated.deadlineType === TASK_DEADLINE_TYPES.FIXED && validated.status === TASK_STATUS.OPEN
      ? fixedDeadlineTimestamp
      : null;

  const newTaskData: Omit<TaskDocument, 'id'> = {
    title: validated.title,
    description: validated.description,
    scope: validated.scope,
    deliverableGuidelines: validated.deliverableGuidelines,
    acceptanceCriteria: validated.acceptanceCriteria,
    mode: validated.mode,
    minTeamSize: validated.mode === TASK_MODES.TEAM ? validated.minTeamSize || 2 : null,
    maxTeamSize: validated.mode === TASK_MODES.TEAM ? validated.maxTeamSize || 4 : null,
    assignmentType: validated.assignmentType,
    requiredSkills: validated.requiredSkills,
    totalReward: validated.totalReward, // Integer Rupiah
    deadlineType: validated.deadlineType,
    fixedDeadlineAt: fixedDeadlineTimestamp as unknown as FirestoreDate,
    durationMinutes: validated.durationMinutes || null,
    deadlineAt: initialDeadlineAt as unknown as FirestoreDate,
    status: validated.status,
    termsSnapshot: {
      version: 1,
      content: validated.termsContent,
      capturedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    },
    assignedUserId: null,
    assignedTeamId: null,
    reviewLockedByAdminId: null,
    reviewLockedUntil: null,
    parentTaskId: null,
    continuationTaskId: null,
    createdByAdminId: adminUid,
    createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
    updatedAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  };

  await taskRef.set(newTaskData);

  // Append-only audit trail
  await db.collection('auditEvents').add({
    actorId: adminUid,
    actorRole: adminData.role,
    action: 'TASK_CREATED',
    entityType: 'TASK',
    entityId: taskRef.id,
    beforeSnapshot: null,
    afterSnapshot: {
      title: validated.title,
      totalReward: validated.totalReward,
      mode: validated.mode,
      assignmentType: validated.assignmentType,
      status: validated.status,
    },
    reason: `Admin ${adminData.displayName || adminUid} membuat task baru bertipe ${validated.mode} (${validated.assignmentType}).`,
    timestamp: FieldValue.serverTimestamp(),
  });

  const createdSnap = await taskRef.get();
  return { ...(createdSnap.data() as TaskDocument), id: taskRef.id };
}

/**
 * Mempublikasikan task dari status DRAFT menjadi OPEN.
 */
export async function publishTask(adminUid: string, taskId: string): Promise<TaskDocument> {
  const adminData = await assertAdminPrivilege(adminUid);
  const db = getAdminFirestore();
  const taskRef = db.collection('tasks').doc(taskId);
  const snap = await taskRef.get();

  if (!snap.exists) {
    throw new Error('Task tidak ditemukan.');
  }

  const taskData = snap.data() as TaskDocument;
  if (taskData.status !== TASK_STATUS.DRAFT) {
    throw new Error(`Hanya task berstatus DRAFT yang dapat dipublikasikan. Status saat ini: ${taskData.status}`);
  }

  const deadlineUpdate: Record<string, unknown> = {
    status: TASK_STATUS.OPEN,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (taskData.deadlineType === TASK_DEADLINE_TYPES.FIXED && taskData.fixedDeadlineAt) {
    deadlineUpdate.deadlineAt = taskData.fixedDeadlineAt;
  }

  await taskRef.update(deadlineUpdate);

  // Audit event
  await db.collection('auditEvents').add({
    actorId: adminUid,
    actorRole: adminData.role,
    action: 'TASK_PUBLISHED',
    entityType: 'TASK',
    entityId: taskId,
    beforeSnapshot: { status: TASK_STATUS.DRAFT },
    afterSnapshot: { status: TASK_STATUS.OPEN },
    reason: 'Task resmi dipublikasikan dan terbuka untuk diambil/diajukan member.',
    timestamp: FieldValue.serverTimestamp(),
  });

  const updatedSnap = await taskRef.get();
  return { ...(updatedSnap.data() as TaskDocument), id: taskId };
}

/**
 * Mengambil daftar task berstatus OPEN untuk dijelajahi oleh member.
 */
export async function getAvailableTasks(filters?: {
  mode?: string;
  assignmentType?: string;
}): Promise<TaskDocument[]> {
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection('tasks').where('status', '==', TASK_STATUS.OPEN);

  if (filters?.mode && filters.mode !== 'ALL') {
    query = query.where('mode', '==', filters.mode);
  }

  if (filters?.assignmentType && filters.assignmentType !== 'ALL') {
    query = query.where('assignmentType', '==', filters.assignmentType);
  }

  const snap = await query.get();
  const tasks = snap.docs.map((d) => ({
    ...(d.data() as TaskDocument),
    id: d.id,
  }));

  return tasks.sort((a, b) => {
    const timeA = toDateSafe(a.createdAt)?.getTime() || 0;
    const timeB = toDateSafe(b.createdAt)?.getTime() || 0;
    return timeB - timeA;
  });
}

/**
 * Mengambil seluruh task untuk antrean kelola Admin.
 */
export async function getAllTasksForAdmin(
  adminUid: string,
  statusFilter?: string
): Promise<TaskDocument[]> {
  await assertAdminPrivilege(adminUid);
  const db = getAdminFirestore();
  let query: FirebaseFirestore.Query = db.collection('tasks');

  if (statusFilter && statusFilter !== 'ALL') {
    query = query.where('status', '==', statusFilter);
  }

  const snap = await query.get();
  const tasks = snap.docs.map((d) => ({
    ...(d.data() as TaskDocument),
    id: d.id,
  }));

  return tasks.sort((a, b) => {
    const timeA = toDateSafe(a.createdAt)?.getTime() || 0;
    const timeB = toDateSafe(b.createdAt)?.getTime() || 0;
    return timeB - timeA;
  });
}

/**
 * Mengambil rincian task lengkap beserta snapshot terms.
 */
export async function getTaskDetail(taskId: string): Promise<TaskDocument | null> {
  const db = getAdminFirestore();
  const snap = await db.collection('tasks').doc(taskId).get();
  if (!snap.exists) return null;
  return { ...(snap.data() as TaskDocument), id: taskId };
}

/**
 * Mengambil task aktif yang sedang dipegang oleh member (jika ada).
 */
export async function getActiveTaskForUser(userId: string): Promise<TaskDocument | null> {
  const db = getAdminFirestore();
  const userSnap = await db.collection('users').doc(userId).get();
  if (!userSnap.exists) return null;

  const userData = userSnap.data();
  if (!userData?.activeTaskId) return null;

  const taskSnap = await db.collection('tasks').doc(userData.activeTaskId).get();
  if (!taskSnap.exists) return null;

  return { ...(taskSnap.data() as TaskDocument), id: taskSnap.id };
}

/**
 * Zero-Cron Rule: Memeriksa apakah batas waktu task telah terlewati saat aksi diproses di server.
 */
export function checkIsOverdue(task: TaskDocument): boolean {
  if (!task.deadlineAt) return false;
  const d = task.deadlineAt;
  let targetMs: number;
  if (typeof d === 'number') {
    targetMs = d;
  } else if (typeof d === 'string') {
    targetMs = new Date(d).getTime();
  } else if (d instanceof Date) {
    targetMs = d.getTime();
  } else if (typeof d === 'object' && d !== null) {
    if ('toDate' in d && typeof (d as { toDate: () => Date }).toDate === 'function') {
      targetMs = (d as { toDate: () => Date }).toDate().getTime();
    } else if ('seconds' in d && typeof (d as { seconds: number }).seconds === 'number') {
      targetMs = (d as { seconds: number }).seconds * 1000;
    } else {
      targetMs = new Date(d as unknown as string).getTime();
    }
  } else {
    targetMs = 0;
  }
  return Date.now() > targetMs;
}
