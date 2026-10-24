'use server';

/**
 * SAKODE Task & Reward Platform - Submission Server Actions
 * App Router server actions untuk pengiriman hasil kerja, review lock, dan evaluasi admin.
 */

import {
  submitTaskWork,
  acquireReviewLock,
  releaseReviewLock,
  reviewSubmission,
  getSubmissionsForTask,
  getPendingSubmissionsQueue,
  getAllSubmissionsForAdmin,
  getSubmissionDetail,
} from '@/server/services/submission.service';
import {
  type CreateSubmissionInput,
  type ReviewSubmissionInput,
} from '@/lib/validations/submission';
import { serializeSubmissionDoc, serializeTaskDoc } from '@/server/serializers';
import type { SubmissionDocument, TaskDocument } from '@/types/database';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function submitTaskWorkAction(
  userId: string,
  input: CreateSubmissionInput
): Promise<{ success: boolean; submission?: SubmissionDocument; error?: string }> {
  try {
    const doc = await submitTaskWork(userId, input);
    return {
      success: true,
      submission: serializeSubmissionDoc(doc),
    };
  } catch (error: unknown) {
    console.error('Error on submitTaskWorkAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengirimkan hasil pekerjaan.'),
    };
  }
}

export async function acquireReviewLockAction(
  adminUid: string,
  submissionId: string
): Promise<{
  success: boolean;
  locked: boolean;
  lockedByOther?: boolean;
  lockedByAdminName?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const res = await acquireReviewLock(adminUid, submissionId);
    return {
      success: true,
      ...res,
    };
  } catch (error: unknown) {
    console.error('Error on acquireReviewLockAction:', error);
    return {
      success: false,
      locked: false,
      error: getErrorMessage(error, 'Gagal mengamankan kunci evaluasi.'),
    };
  }
}

export async function releaseReviewLockAction(
  adminUid: string,
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await releaseReviewLock(adminUid, submissionId);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error on releaseReviewLockAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal melepaskan kunci evaluasi.'),
    };
  }
}

export async function reviewSubmissionAction(
  adminUid: string,
  input: ReviewSubmissionInput
): Promise<{
  success: boolean;
  submission?: SubmissionDocument;
  task?: TaskDocument;
  error?: string;
}> {
  try {
    const res = await reviewSubmission(adminUid, input);
    return {
      success: true,
      submission: serializeSubmissionDoc(res.submission),
      task: serializeTaskDoc(res.task),
    };
  } catch (error: unknown) {
    console.error('Error on reviewSubmissionAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memproses evaluasi submission.'),
    };
  }
}

export async function getSubmissionsForTaskAction(
  taskId: string
): Promise<{ success: boolean; submissions?: SubmissionDocument[]; error?: string }> {
  try {
    const docs = await getSubmissionsForTask(taskId);
    return {
      success: true,
      submissions: docs.map(serializeSubmissionDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getSubmissionsForTaskAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat riwayat submission.'),
    };
  }
}

export async function getPendingSubmissionsQueueAction(): Promise<{
  success: boolean;
  submissions?: SubmissionDocument[];
  error?: string;
}> {
  try {
    const docs = await getPendingSubmissionsQueue();
    return {
      success: true,
      submissions: docs.map(serializeSubmissionDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getPendingSubmissionsQueueAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat antrean review submission.'),
    };
  }
}

export async function getAllSubmissionsForAdminAction(): Promise<{
  success: boolean;
  submissions?: SubmissionDocument[];
  error?: string;
}> {
  try {
    const docs = await getAllSubmissionsForAdmin();
    return {
      success: true,
      submissions: docs.map(serializeSubmissionDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getAllSubmissionsForAdminAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat daftar submission.'),
    };
  }
}

export async function getSubmissionDetailAction(
  submissionId: string
): Promise<{
  success: boolean;
  submission?: SubmissionDocument;
  task?: TaskDocument;
  error?: string;
}> {
  try {
    const res = await getSubmissionDetail(submissionId);
    return {
      success: true,
      submission: serializeSubmissionDoc(res.submission),
      task: serializeTaskDoc(res.task),
    };
  } catch (error: unknown) {
    console.error('Error on getSubmissionDetailAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat data detail submission.'),
    };
  }
}
