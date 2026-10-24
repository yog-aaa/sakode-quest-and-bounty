import { z } from 'zod';
import { evidenceFileSchema } from './submission';

/**
 * 1. Skema Penetapan Selesai Sebagian & Pembuatan Task Lanjutan (partialCompletionSchema)
 */
export const partialCompletionSchema = z.object({
  submissionId: z.string().min(1, 'ID Submission wajib disertakan'),
  acceptedNotes: z
    .string()
    .trim()
    .min(15, 'Deskripsi bagian deliverable yang diterima minimal 15 karakter')
    .max(2000, 'Deskripsi bagian yang diterima maksimal 2000 karakter'),
  remainingScope: z
    .string()
    .trim()
    .min(15, 'Deskripsi ruang lingkup pekerjaan yang tersisa minimal 15 karakter')
    .max(2000, 'Deskripsi ruang lingkup tersisa maksimal 2000 karakter'),
  partialRewardAmount: z
    .number()
    .int('Nominal reward parsial harus berupa bilangan bulat integer tanpa desimal')
    .positive('Nominal reward parsial harus lebih besar dari 0')
    .min(1000, 'Nominal reward parsial minimal Rp 1.000'),
  reason: z
    .string()
    .trim()
    .min(10, 'Alasan evaluasi partial completion minimal 10 karakter'),
  publishContinuationNow: z.boolean().default(false),
});

export type PartialCompletionInput = z.infer<typeof partialCompletionSchema>;

/**
 * 2. Skema Pengajuan Sanggahan Satu Kali (submitAppealSchema)
 * Menegakkan 1-Time Appeal Invariant
 */
export const submitAppealSchema = z.object({
  submissionId: z.string().min(1, 'ID Submission wajib disertakan'),
  appealReason: z
    .string()
    .trim()
    .min(20, 'Kronologi dan alasan sanggahan minimal 20 karakter')
    .max(3000, 'Alasan sanggahan maksimal 3000 karakter'),
  evidenceFiles: z
    .array(evidenceFileSchema)
    .max(5, 'Maksimal 5 berkas bukti sanggahan diperbolehkan')
    .default([]),
});

export type SubmitAppealInput = z.infer<typeof submitAppealSchema>;

/**
 * 3. Skema Keputusan Sanggahan oleh Admin Kedua / Independen (decideAppealSchema)
 * Menegakkan Anti-Conflict of Interest Invariant
 */
export const decideAppealSchema = z.object({
  submissionId: z.string().min(1, 'ID Submission wajib disertakan'),
  decision: z.enum(['APPROVE', 'REJECT']),
  resolutionNotes: z
    .string()
    .trim()
    .min(15, 'Catatan resolusi sanggahan minimal 15 karakter')
    .max(2000, 'Catatan resolusi maksimal 2000 karakter'),
});

export type DecideAppealInput = z.infer<typeof decideAppealSchema>;
