'use server';

import {
  completeUserProfile,
  getUsersList,
  approveUser,
  rejectUser,
  requestProfileRevision,
  revealUserPaymentAccount,
  getUserProfile,
  updateSelfUserProfile,
} from '@/server/services/user.service';
import type { ProfileCompletionInput, AdminProfileUpdateInput } from '@/lib/validations/auth';
import type { UserDocument } from '@/types/database';
import type { BankAccountDetails } from '@/lib/crypto';
import { serializeUserDoc } from '@/server/serializers';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

export async function getUserProfileAction(
  uid: string
): Promise<{ success: boolean; user?: UserDocument | null; error?: string }> {
  try {
    const user = await getUserProfile(uid);
    return { success: true, user: user ? serializeUserDoc(user) : null };
  } catch (error: unknown) {
    console.error('Error on getUserProfileAction:', error);
    return { success: false, error: getErrorMessage(error, 'Gagal memuat profil.') };
  }
}

export async function completeProfileAction(
  uid: string,
  input: ProfileCompletionInput
): Promise<{ success: boolean; user?: UserDocument; error?: string }> {
  try {
    const user = await completeUserProfile(uid, input);
    return { success: true, user: serializeUserDoc(user) };
  } catch (error: unknown) {
    console.error('Error on completeProfileAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal melengkapi profil pendaftaran.'),
    };
  }
}

export async function getUsersListAction(
  adminUid: string,
  statusFilter?: string
): Promise<{ success: boolean; users?: UserDocument[]; error?: string }> {
  try {
    const users = await getUsersList(adminUid, statusFilter);
    return {
      success: true,
      users: users.map(serializeUserDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getUsersListAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat antrean anggota.'),
    };
  }
}

export async function approveMemberAction(
  adminUid: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await approveUser(adminUid, targetUserId);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error on approveMemberAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal menyetujui member.'),
    };
  }
}

export async function rejectMemberAction(
  adminUid: string,
  targetUserId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await rejectUser(adminUid, targetUserId, reason);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error on rejectMemberAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal menolak member.'),
    };
  }
}

export async function requestRevisionAction(
  adminUid: string,
  targetUserId: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requestProfileRevision(adminUid, targetUserId, notes);
    return { success: true };
  } catch (error: unknown) {
    console.error('Error on requestRevisionAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal meminta perbaikan.'),
    };
  }
}

export async function revealPaymentAction(
  adminUid: string,
  targetUserId: string
): Promise<{ success: boolean; payment?: BankAccountDetails; error?: string }> {
  try {
    const payment = await revealUserPaymentAccount(adminUid, targetUserId);
    return { success: true, payment };
  } catch (error: unknown) {
    console.error('Error on revealPaymentAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal membuka data rekening.'),
    };
  }
}

export async function updateSelfProfileAction(
  uid: string,
  input: AdminProfileUpdateInput
): Promise<{ success: boolean; user?: UserDocument; error?: string }> {
  try {
    const updated = await updateSelfUserProfile(uid, input);
    return { success: true, user: serializeUserDoc(updated) };
  } catch (error: unknown) {
    console.error('Error on updateSelfProfileAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memperbarui profil.'),
    };
  }
}
