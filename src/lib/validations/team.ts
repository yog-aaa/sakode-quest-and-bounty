import { z } from 'zod';
import { INITIAL_SPLIT_PRINCIPLES } from '@/lib/constants';

/**
 * 1. Skema Permintaan Bergabung Tim dengan Kode Undangan (joinTeamSchema)
 */
export const joinTeamSchema = z.object({
  teamId: z.string().trim().optional(),
  inviteCode: z
    .string()
    .trim()
    .min(5, 'Kode undangan minimal 5 karakter')
    .max(10, 'Kode undangan maksimal 10 karakter')
    .toUpperCase(),
  message: z.string().trim().max(300, 'Pesan maksimal 300 karakter').optional(),
});

export type JoinTeamInput = z.infer<typeof joinTeamSchema>;

/**
 * 2. Skema Persetujuan Calon Anggota oleh Team Lead (approveMemberSchema)
 */
export const approveMemberSchema = z.object({
  teamId: z.string().trim().min(1, 'ID tim wajib diisi'),
  memberUserId: z.string().trim().min(1, 'ID calon anggota wajib diisi'),
});

export type ApproveMemberInput = z.infer<typeof approveMemberSchema>;

/**
 * 3. Skema Penolakan Calon Anggota oleh Team Lead (rejectMemberSchema)
 */
export const rejectMemberSchema = z.object({
  teamId: z.string().trim().min(1, 'ID tim wajib diisi'),
  memberUserId: z.string().trim().min(1, 'ID calon anggota wajib diisi'),
  reason: z.string().trim().max(200, 'Alasan maksimal 200 karakter').optional(),
});

export type RejectMemberInput = z.infer<typeof rejectMemberSchema>;

/**
 * 4. Skema Persetujuan Terms & Voting Prinsip Pembagian Awal (teamConsentSchema)
 */
export const teamConsentSchema = z.object({
  teamId: z.string().trim().min(1, 'ID tim wajib diisi'),
  agreedTermsVersion: z
    .number()
    .int('Versi terms harus berupa bilangan bulat')
    .min(1, 'Versi terms minimal 1'),
  agreedSplitPrinciple: z.enum([
    INITIAL_SPLIT_PRINCIPLES.EQUAL,
    INITIAL_SPLIT_PRINCIPLES.CONTRIBUTION_BASED,
  ]),
});

export type TeamConsentInput = z.infer<typeof teamConsentSchema>;

/**
 * 5. Skema Admin Override Roster Tim untuk Keadaan Darurat (adminOverrideRosterSchema)
 */
export const adminOverrideRosterSchema = z.object({
  teamId: z.string().trim().min(1, 'ID tim wajib diisi'),
  action: z.enum(['ADD', 'REMOVE']),
  targetUserId: z.string().trim().min(1, 'ID target user wajib diisi'),
  reason: z
    .string()
    .trim()
    .min(10, 'Alasan override wajib diisi minimal 10 karakter untuk audit trail'),
});

export type AdminOverrideRosterInput = z.infer<typeof adminOverrideRosterSchema>;
