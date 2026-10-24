import { z } from 'zod';

// Allowed MIME types and extensions for MVP evidence upload
export const ALLOWED_EVIDENCE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

export const ALLOWED_EVIDENCE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'] as const;
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_EVIDENCE_FILES = 5;

// Evidence file schema
export const evidenceFileSchema = z.object({
  url: z.string().url('URL file bukti tidak valid'),
  publicId: z.string().min(1, 'Public ID Cloudinary wajib ada'),
  fileName: z.string().min(1, 'Nama file wajib ada'),
  fileType: z
    .string()
    .refine(
      (type) =>
        ALLOWED_EVIDENCE_MIME_TYPES.includes(type as (typeof ALLOWED_EVIDENCE_MIME_TYPES)[number]) ||
        ['jpg', 'jpeg', 'png', 'webp', 'pdf'].some((ext) => type.toLowerCase().includes(ext)),
      'Format file tidak didukung. Hanya JPG, PNG, WebP, dan PDF yang diperbolehkan.'
    )
    .refine((type) => !type.toLowerCase().includes('video'), {
      message: 'Format video dilarang untuk bukti pekerjaan MVP.',
    }),
  fileSize: z
    .number()
    .positive('Ukuran file tidak valid')
    .max(MAX_FILE_SIZE_BYTES, 'Ukuran file maksimal 10 MB per file'),
});

/**
 * 1. Skema Pengiriman Hasil Pekerjaan (createSubmissionSchema)
 */
export const createSubmissionSchema = z.object({
  taskId: z.string().min(1, 'ID Task wajib disertakan'),
  notes: z
    .string()
    .trim()
    .min(15, 'Catatan hasil pekerjaan minimal 15 karakter')
    .max(3000, 'Catatan hasil pekerjaan maksimal 3000 karakter'),
  deliverableLinks: z
    .array(
      z
        .string()
        .trim()
        .url('Format URL deliverable tidak valid (wajib menyertakan http:// atau https://)')
    )
    .min(1, 'Wajib menyertakan minimal 1 tautan hasil pekerjaan (misal: GitHub repository, live staging demo)'),
  evidenceFiles: z
    .array(evidenceFileSchema)
    .max(MAX_EVIDENCE_FILES, `Maksimal ${MAX_EVIDENCE_FILES} file bukti diperbolehkan`)
    .default([]),
});

export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;

/**
 * 2. Skema Penilaian Submission oleh Admin (reviewSubmissionSchema)
 */
export const reviewSubmissionSchema = z
  .object({
    submissionId: z.string().min(1, 'ID Submission wajib disertakan'),
    action: z.enum(['APPROVE', 'REQUEST_REVISION', 'EXTEND_DEADLINE', 'REJECT']),
    revisionNotes: z.string().trim().optional(),
    revisionDeadline: z.string().trim().optional(),
    extensionDays: z.number().int().min(1, 'Minimal perpanjangan 1 hari').max(30, 'Maksimal perpanjangan 30 hari').optional(),
    reason: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.action === 'REQUEST_REVISION') {
      if (!data.revisionNotes || data.revisionNotes.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['revisionNotes'],
          message: 'Catatan perbaikan revisi wajib diisi minimal 10 karakter.',
        });
      }
    }

    if (data.action === 'EXTEND_DEADLINE') {
      if (!data.extensionDays || data.extensionDays < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['extensionDays'],
          message: 'Jumlah hari perpanjangan wajib diisi minimal 1 hari.',
        });
      }
      if (!data.reason || data.reason.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reason'],
          message: 'Alasan perpanjangan deadline wajib diisi minimal 10 karakter untuk audit trail.',
        });
      }
    }

    if (data.action === 'REJECT') {
      if (!data.reason || data.reason.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['reason'],
          message: 'Alasan penolakan hasil wajib diisi minimal 10 karakter.',
        });
      }
    }
  });

export type ReviewSubmissionInput = z.infer<typeof reviewSubmissionSchema>;

/**
 * 3. Skema Penguncian Review (acquireReviewLockSchema)
 */
export const acquireReviewLockSchema = z.object({
  submissionId: z.string().min(1, 'ID Submission wajib disertakan'),
});

export type AcquireReviewLockInput = z.infer<typeof acquireReviewLockSchema>;
