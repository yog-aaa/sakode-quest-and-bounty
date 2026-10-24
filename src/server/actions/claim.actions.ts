'use server';

/**
 * SAKODE Task & Reward Platform - Financial Ledger & Claim Server Actions
 * App Router server actions untuk Reward Ledger, Batch Solo Claim, dan Team 100% Consensus Distribution.
 */

import {
  getUserRewardLedgers,
  getUserClaims,
  getAllClaimsForAdmin,
  submitBatchClaim,
  adminProcessClaim,
  confirmClaimReceipt,
  getTeamDistribution,
  proposeTeamSplitDistribution,
  voteTeamSplitDistribution,
  uploadTeamLeadMemberProof,
  confirmTeamMemberDistribution,
} from '@/server/services/claim.service';
import {
  type CreateClaimInput,
  type ProcessClaimInput,
  type ProposeTeamSplitInput,
  type VoteTeamSplitInput,
  type UploadLeadTransferProofInput,
} from '@/lib/validations/claim';
import {
  serializeRewardLedgerDoc,
  serializeClaimDoc,
  serializeTeamDistributionDoc,
} from '@/server/serializers';
import type {
  RewardLedgerDocument,
  ClaimDocument,
  TeamDistributionDocument,
} from '@/types/database';
import type { ClaimStatus } from '@/lib/constants';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * 1. Mengambil seluruh Reward Ledger milik user
 */
export async function getUserRewardLedgersAction(
  userId: string
): Promise<{ success: boolean; ledgers?: RewardLedgerDocument[]; error?: string }> {
  try {
    const list = await getUserRewardLedgers(userId);
    return {
      success: true,
      ledgers: list.map(serializeRewardLedgerDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getUserRewardLedgersAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengambil data saldo reward.'),
    };
  }
}

/**
 * 2. Mengambil seluruh Riwayat Klaim milik user
 */
export async function getUserClaimsAction(
  userId: string
): Promise<{ success: boolean; claims?: ClaimDocument[]; error?: string }> {
  try {
    const list = await getUserClaims(userId);
    return {
      success: true,
      claims: list.map(serializeClaimDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getUserClaimsAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengambil riwayat permohonan klaim.'),
    };
  }
}

/**
 * 3. Mengajukan Batch Claim Reward oleh Member
 */
export async function submitBatchClaimAction(
  userId: string,
  input: CreateClaimInput
): Promise<{ success: boolean; claim?: ClaimDocument; error?: string }> {
  try {
    const claim = await submitBatchClaim(userId, input);
    return {
      success: true,
      claim: serializeClaimDoc(claim),
    };
  } catch (error: unknown) {
    console.error('Error on submitBatchClaimAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengajukan pencairan reward.'),
    };
  }
}

/**
 * 4. Mengambil Antrean Seluruh Klaim untuk Admin
 */
export async function getAllClaimsForAdminAction(
  adminUid: string,
  filterStatus?: ClaimStatus
): Promise<{ success: boolean; claims?: ClaimDocument[]; error?: string }> {
  try {
    const list = await getAllClaimsForAdmin(adminUid, filterStatus);
    return {
      success: true,
      claims: list.map(serializeClaimDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getAllClaimsForAdminAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat daftar antrean klaim admin.'),
    };
  }
}

/**
 * 5. Admin Memproses / Membayarkan Klaim
 */
export async function adminProcessClaimAction(
  adminUid: string,
  input: ProcessClaimInput
): Promise<{ success: boolean; claim?: ClaimDocument; error?: string }> {
  try {
    const claim = await adminProcessClaim(adminUid, input);
    return {
      success: true,
      claim: serializeClaimDoc(claim),
    };
  } catch (error: unknown) {
    console.error('Error on adminProcessClaimAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memperbarui status permohonan klaim.'),
    };
  }
}

/**
 * 6. Member Mengonfirmasi Penerimaan Dana Klaim Solo
 */
export async function confirmClaimReceiptAction(
  userId: string,
  claimId: string
): Promise<{ success: boolean; claim?: ClaimDocument; error?: string }> {
  try {
    const claim = await confirmClaimReceipt(userId, claimId);
    return {
      success: true,
      claim: serializeClaimDoc(claim),
    };
  } catch (error: unknown) {
    console.error('Error on confirmClaimReceiptAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengonfirmasi penerimaan klaim.'),
    };
  }
}

/**
 * 7. Mengambil Data Distribusi Reward Tim
 */
export async function getTeamDistributionAction(
  teamId: string
): Promise<{ success: boolean; distribution?: TeamDistributionDocument | null; error?: string }> {
  try {
    const dist = await getTeamDistribution(teamId);
    return {
      success: true,
      distribution: dist ? serializeTeamDistributionDoc(dist) : null,
    };
  } catch (error: unknown) {
    console.error('Error on getTeamDistributionAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat status pembagian reward tim.'),
    };
  }
}

/**
 * 8. Team Lead Mengajukan Proposal Pembagian Reward Tim (Konsensus 100%)
 */
export async function proposeTeamSplitAction(
  teamLeadUid: string,
  input: ProposeTeamSplitInput
): Promise<{ success: boolean; distribution?: TeamDistributionDocument; error?: string }> {
  try {
    const dist = await proposeTeamSplitDistribution(teamLeadUid, input);
    return {
      success: true,
      distribution: serializeTeamDistributionDoc(dist),
    };
  } catch (error: unknown) {
    console.error('Error on proposeTeamSplitAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengajukan proposal pembagian reward tim.'),
    };
  }
}

/**
 * 9. Anggota Tim Memberikan Suara Persetujuan / Penolakan Pembagian Reward
 */
export async function voteTeamSplitAction(
  userId: string,
  input: VoteTeamSplitInput
): Promise<{ success: boolean; distribution?: TeamDistributionDocument; error?: string }> {
  try {
    const dist = await voteTeamSplitDistribution(userId, input);
    return {
      success: true,
      distribution: serializeTeamDistributionDoc(dist),
    };
  } catch (error: unknown) {
    console.error('Error on voteTeamSplitAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengirimkan keputusan suara pembagian reward.'),
    };
  }
}

/**
 * 10. Team Lead Mengunggah Bukti Transfer per Anggota Tim
 */
export async function uploadLeadTransferProofAction(
  teamLeadUid: string,
  input: UploadLeadTransferProofInput
): Promise<{ success: boolean; distribution?: TeamDistributionDocument; error?: string }> {
  try {
    const dist = await uploadTeamLeadMemberProof(teamLeadUid, input);
    return {
      success: true,
      distribution: serializeTeamDistributionDoc(dist),
    };
  } catch (error: unknown) {
    console.error('Error on uploadLeadTransferProofAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengunggah bukti transfer anggota.'),
    };
  }
}

/**
 * 11. Anggota Tim Mengonfirmasi Penerimaan Honor dari Team Lead
 */
export async function confirmTeamMemberDistributionAction(
  userId: string,
  teamId: string
): Promise<{ success: boolean; distribution?: TeamDistributionDocument; error?: string }> {
  try {
    const dist = await confirmTeamMemberDistribution(userId, teamId);
    return {
      success: true,
      distribution: serializeTeamDistributionDoc(dist),
    };
  } catch (error: unknown) {
    console.error('Error on confirmTeamMemberDistributionAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mengonfirmasi penerimaan honor tim.'),
    };
  }
}
