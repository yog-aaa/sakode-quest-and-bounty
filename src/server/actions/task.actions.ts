'use server';

import {
  createTask,
  publishTask,
  getAvailableTasks,
  getAllTasksForAdmin,
  getTaskDetail,
  getActiveTaskForUser,
} from '@/server/services/task.service';
import type { CreateTaskInput } from '@/lib/validations/task';
import type { TaskDocument } from '@/types/database';
import { serializeTaskDoc } from '@/server/serializers';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export async function createTaskAction(
  adminUid: string,
  input: CreateTaskInput
): Promise<{ success: boolean; task?: TaskDocument; error?: string }> {
  try {
    const task = await createTask(adminUid, input);
    return { success: true, task: serializeTaskDoc(task) };
  } catch (error: unknown) {
    console.error('Error on createTaskAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal membuat task baru.') };
  }
}

export async function publishTaskAction(
  adminUid: string,
  taskId: string
): Promise<{ success: boolean; task?: TaskDocument; error?: string }> {
  try {
    const task = await publishTask(adminUid, taskId);
    return { success: true, task: serializeTaskDoc(task) };
  } catch (error: unknown) {
    console.error('Error on publishTaskAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal mempublikasikan task.') };
  }
}

export async function getAvailableTasksAction(filters?: {
  mode?: string;
  assignmentType?: string;
}): Promise<{ success: boolean; tasks?: TaskDocument[]; error?: string }> {
  try {
    const tasks = await getAvailableTasks(filters);
    return { success: true, tasks: tasks.map(serializeTaskDoc) };
  } catch (error: unknown) {
    console.error('Error on getAvailableTasksAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memuat task tersedia.') };
  }
}

export async function getAllTasksForAdminAction(
  adminUid: string,
  statusFilter?: string
): Promise<{ success: boolean; tasks?: TaskDocument[]; error?: string }> {
  try {
    const tasks = await getAllTasksForAdmin(adminUid, statusFilter);
    return { success: true, tasks: tasks.map(serializeTaskDoc) };
  } catch (error: unknown) {
    console.error('Error on getAllTasksForAdminAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memuat daftar task admin.') };
  }
}

export async function getTaskDetailAction(
  taskId: string
): Promise<{ success: boolean; task?: TaskDocument | null; error?: string }> {
  try {
    const task = await getTaskDetail(taskId);
    return { success: true, task: task ? serializeTaskDoc(task) : null };
  } catch (error: unknown) {
    console.error('Error on getTaskDetailAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memuat rincian task.') };
  }
}

export async function getActiveTaskForUserAction(
  userId: string
): Promise<{ success: boolean; task?: TaskDocument | null; error?: string }> {
  try {
    const task = await getActiveTaskForUser(userId);
    return { success: true, task: task ? serializeTaskDoc(task) : null };
  } catch (error: unknown) {
    console.error('Error on getActiveTaskForUserAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memuat task aktif.') };
  }
}
