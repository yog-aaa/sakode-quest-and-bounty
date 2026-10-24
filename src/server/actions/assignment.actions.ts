'use server';

import {
  instantTakeTask,
  submitApplication,
  withdrawApplication,
  selectApplicant,
  getApplicationsForTask,
  getUserApplications,
} from '@/server/services/assignment.service';
import type { ApplyTaskInput, InstantTakeInput } from '@/lib/validations/task';
import type { TaskDocument, ApplicationDocument } from '@/types/database';
import { serializeTaskDoc, serializeApplicationDoc } from '@/server/serializers';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export async function instantTakeTaskAction(
  userId: string,
  input: InstantTakeInput
): Promise<{ success: boolean; task?: TaskDocument; error?: string }> {
  try {
    const task = await instantTakeTask(userId, input.taskId, input.agreedTermsVersion);
    return { success: true, task: serializeTaskDoc(task) };
  } catch (error: unknown) {
    console.error('Error on instantTakeTaskAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal mengambil task secara instan.') };
  }
}

export async function submitApplicationAction(
  userId: string,
  input: ApplyTaskInput
): Promise<{ success: boolean; application?: ApplicationDocument; error?: string }> {
  try {
    const app = await submitApplication(userId, input);
    return { success: true, application: serializeApplicationDoc(app) };
  } catch (error: unknown) {
    console.error('Error on submitApplicationAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal mengajukan permohonan task.') };
  }
}

export async function withdrawApplicationAction(
  userId: string,
  applicationId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await withdrawApplication(userId, applicationId, reason);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error on withdrawApplicationAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal membatalkan permohonan.') };
  }
}

export async function selectApplicantAction(
  adminUid: string,
  taskId: string,
  applicationId: string
): Promise<{ success: boolean; task?: TaskDocument; error?: string }> {
  try {
    const task = await selectApplicant(adminUid, taskId, applicationId);
    return { success: true, task: serializeTaskDoc(task) };
  } catch (error: unknown) {
    console.error('Error on selectApplicantAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memilih applicant.') };
  }
}

export async function getApplicationsForTaskAction(
  taskId: string
): Promise<{ success: boolean; applications?: ApplicationDocument[]; error?: string }> {
  try {
    const apps = await getApplicationsForTask(taskId);
    return { success: true, applications: apps.map(serializeApplicationDoc) };
  } catch (error: unknown) {
    console.error('Error on getApplicationsForTaskAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memuat daftar applicant.') };
  }
}

export async function getUserApplicationsAction(
  userId: string
): Promise<{ success: boolean; applications?: ApplicationDocument[]; error?: string }> {
  try {
    const apps = await getUserApplications(userId);
    return { success: true, applications: apps.map(serializeApplicationDoc) };
  } catch (error: unknown) {
    console.error('Error on getUserApplicationsAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memuat permohonan Anda.') };
  }
}
