'use server';

/**
 * SAKODE Task & Reward Platform - Appeal Server Actions
 * App Router server actions untuk Partial Completion, One-Time Appeal, dan Keputusan Sanggahan Independen.
 */

import {
  setPartialCompletion,
  fileSubmissionAppeal,
  decideAppeal,
  getAppealsQueue,
} from '@/server/services/appeal.service';
import {
  type PartialCompletionInput,
  type SubmitAppealInput,
  type DecideAppealInput,
} from '@/lib/validations/appeal';
import { serializeSubmissionDoc, serializeTaskDoc } from '@/server/serializers';
import type { SubmissionDocument, TaskDocument } from '@/types/database';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

export async function setPartialCompletionAction(
  adminUid: string,
  input: PartialCompletionInput
): Promise<{
  success: boolean;
  originalTask?: TaskDocument;
  continuationTask?: TaskDocument;
  submission?: SubmissionDocument;
  error?: string;
}> {
  try {
    const res = await setPartialCompletion(adminUid, input);
    return {
      success: true,
      originalTask: serializeTaskDoc(res.originalTask),
      continuationTask: serializeTaskDoc(res.continuationTask),
      submission: serializeSubmissionDoc(res.submission),
    };
  } catch (error: unknown) {
    console.error('Error on setPartialCompletionAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal menetapkan partial completion.'),
    };
  }
}

export async function fileSubmissionAppealAction(
  userId: string,
  input: SubmitAppealInput
): Promise<{
  success: boolean;
  submission?: SubmissionDocument;
  task?: TaskDocument;
  error?: string;
}> {
  try {
    const res = await fileSubmissionAppeal(userId, input);
    return {
      success: true,
      submission: serializeSubmissionDoc(res.submission),
      task: serializeTaskDoc(res.task),
    };
  } catch (error: unknown) {
    console.error('Error on fileSubmissionAppealAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengajukan sanggahan.'),
    };
  }
}

export async function decideAppealAction(
  adminUid: string,
  input: DecideAppealInput
): Promise<{
  success: boolean;
  submission?: SubmissionDocument;
  task?: TaskDocument;
  error?: string;
}> {
  try {
    const res = await decideAppeal(adminUid, input);
    return {
      success: true,
      submission: serializeSubmissionDoc(res.submission),
      task: serializeTaskDoc(res.task),
    };
  } catch (error: unknown) {
    console.error('Error on decideAppealAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memutuskan sanggahan.'),
    };
  }
}

export async function getAppealsQueueAction(): Promise<{
  success: boolean;
  submissions?: SubmissionDocument[];
  error?: string;
}> {
  try {
    const docs = await getAppealsQueue();
    return {
      success: true,
      submissions: docs.map(serializeSubmissionDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getAppealsQueueAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat antrean sanggahan.'),
    };
  }
}
