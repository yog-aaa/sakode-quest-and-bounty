import { z } from 'zod';
import {
  REPORT_TARGET_TYPES,
  PENALTY_TYPES,
  REPORT_CATEGORIES,
  type PenaltyType,
} from '@/lib/constants';
import { evidenceFileSchema } from './submission';

/**
 * 1. Skema Pelaporan Sengketa / Masalah oleh Pengguna (createReportSchema)
 */
export const createReportSchema = z.object({
  targetType: z.enum([
    REPORT_TARGET_TYPES.TASK,
    REPORT_TARGET_TYPES.SUBMISSION,
    REPORT_TARGET_TYPES.CLAIM,
    REPORT_TARGET_TYPES.TEAM_DISTRIBUTION,
  ]),
  targetId: z.string().min(1, 'Target ID sengketa wajib disertakan.'),
  targetTitle: z.string().optional(),
  category: z
    .string()
    .min(1, 'Kategori sengketa wajib dipilih.')
    .refine(
      (cat) => (REPORT_CATEGORIES as readonly string[]).includes(cat),
      'Kategori laporan harus memilih salah satu dari 6 kategori resmi SAKODE.'
    ),
  chronology: z
    .string()
    .trim()
    .min(25, 'Kronologi sengketa wajib diisi minimal 25 karakter secara jelas.')
    .max(4000, 'Kronologi sengketa maksimal 4000 karakter.'),
  evidenceFiles: z
    .array(evidenceFileSchema)
    .max(5, 'Maksimal 5 berkas bukti yang diperbolehkan.')
    .default([]),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

/**
 * 2. Skema Resolusi Laporan & Penjatuhan Sanksi oleh Admin / Super Admin (resolveReportSchema)
 */
export const resolveReportSchema = z
  .object({
    reportId: z.string().min(1, 'ID Laporan wajib disertakan.'),
    action: z.enum(['RESOLVE', 'REJECT', 'REQUEST_EVIDENCE']),
    resolutionNotes: z
      .string()
      .trim()
      .min(15, 'Catatan resolusi wajib diisi minimal 15 karakter secara jelas.'),
    applyPenalty: z.boolean().default(false),
    penaltyType: z
      .enum([
        PENALTY_TYPES.WARNING,
        PENALTY_TYPES.COOLDOWN,
        PENALTY_TYPES.TEAM_ONLY,
        PENALTY_TYPES.NO_LEAD,
        PENALTY_TYPES.TEMPORARY_SUSPEND,
        PENALTY_TYPES.ACCOUNT_SUSPEND,
      ])
      .optional(),
    penaltyDurationDays: z
      .number()
      .int('Durasi penalti harus berupa bilangan bulat.')
      .positive('Durasi penalti hari harus lebih dari 0.')
      .optional(),
    penaltyTargetUserId: z.string().optional(),
    isOverride: z.boolean().default(false),
    overrideReason: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.applyPenalty) {
        return Boolean(data.penaltyType && data.penaltyTargetUserId);
      }
      return true;
    },
    {
      message: 'Jenis sanksi dan ID pengguna terlapor wajib disertakan jika menerapkan penalti.',
      path: ['penaltyType'],
    }
  )
  .refine(
    (data) => {
      // STRICT INVARIANT: Alasan Wajib Override (min 15 karakter)
      if (data.isOverride) {
        return Boolean(data.overrideReason && data.overrideReason.length >= 15);
      }
      return true;
    },
    {
      message: 'Alasan penulisan override rekomendasi sistem wajib diisi minimal 15 karakter.',
      path: ['overrideReason'],
    }
  );

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;

/**
 * 3. Skema Manajemen Role Staf Administrator oleh Super Admin (adminRoleManagementSchema)
 */
export const adminRoleManagementSchema = z.object({
  targetUserId: z.string().min(1, 'ID Pengguna target wajib diisi.'),
  action: z.enum(['PROMOTE', 'DEMOTE']),
  reason: z
    .string()
    .trim()
    .min(15, 'Alasan pengangkatan atau pencabutan role admin wajib diisi minimal 15 karakter.'),
});

export type AdminRoleManagementInput = z.infer<typeof adminRoleManagementSchema>;

/**
 * 4. Helper Sistem: Menentukan Rekomendasi Penalti Progresif Berdasarkan Kategori & Riwayat
 */
export function getRecommendedPenalty(
  category: string,
  userReportCount = 0
): {
  penaltyType: PenaltyType;
  durationDays: number | null;
  explanation: string;
} {
  // Pelanggaran pertama vs berulang
  if (category === 'Bukti pembayaran tidak valid.') {
    return {
      penaltyType: PENALTY_TYPES.TEMPORARY_SUSPEND,
      durationDays: 14,
      explanation: 'Pemalsuan struk pembayaran merupakan pelanggaran berat integritas sistem.',
    };
  }

  if (category === 'Team Lead tidak membagikan reward sesuai kesepakatan.') {
    return {
      penaltyType: PENALTY_TYPES.NO_LEAD,
      durationDays: null,
      explanation: 'Pencabutan wewenang Team Lead akibat pengingkaran konsensus alokasi bounty.',
    };
  }

  if (category === 'Anggota team tidak menjalankan tanggung jawab.') {
    return {
      penaltyType: userReportCount > 0 ? PENALTY_TYPES.COOLDOWN : PENALTY_TYPES.WARNING,
      durationDays: userReportCount > 0 ? 5 : null,
      explanation:
        userReportCount > 0
          ? 'Pelanggaran tanggung jawab berulang; jeda cooldown 5 hari.'
          : 'Peringatan tertulis pertama untuk menjaga komitmen kolaborasi tim.',
    };
  }

  if (category === 'Perilaku atau keputusan melanggar Terms.') {
    return {
      penaltyType: PENALTY_TYPES.TEMPORARY_SUSPEND,
      durationDays: 7,
      explanation: 'Pelanggaran langsung terhadap Syarat & Ketentuan platform SAKODE.',
    };
  }

  // Default untuk scope/hasil tidak sesuai atau administrasi
  return {
    penaltyType: PENALTY_TYPES.WARNING,
    durationDays: null,
    explanation: 'Peringatan awal evaluasi deliverable dan kepatuhan prosedur.',
  };
}
