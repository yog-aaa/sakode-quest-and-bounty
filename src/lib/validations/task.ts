import { z } from 'zod';
import { TASK_MODES, TASK_ASSIGNMENT_TYPES, TASK_DEADLINE_TYPES, TASK_STATUS } from '@/lib/constants';

/**
 * 1. Skema Pembuatan & Pembaruan Task oleh Admin (createTaskSchema)
 */
export const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, 'Judul task minimal 5 karakter')
      .max(120, 'Judul task maksimal 120 karakter'),
    description: z
      .string()
      .trim()
      .min(20, 'Deskripsi task minimal 20 karakter'),
    scope: z
      .string()
      .trim()
      .min(10, 'Lingkup pekerjaan (scope) minimal 10 karakter'),
    deliverableGuidelines: z
      .string()
      .trim()
      .min(10, 'Panduan deliverable minimal 10 karakter'),
    acceptanceCriteria: z
      .array(z.string().trim().min(3, 'Kriteria minimal 3 karakter'))
      .min(1, 'Wajib memiliki minimal 1 kriteria penerimaan'),
    mode: z.enum([TASK_MODES.SOLO, TASK_MODES.TEAM]),
    minTeamSize: z.number().int().positive().optional().nullable(),
    maxTeamSize: z.number().int().positive().optional().nullable(),
    assignmentType: z.enum([
      TASK_ASSIGNMENT_TYPES.INSTANT_TAKE,
      TASK_ASSIGNMENT_TYPES.APPLICATION,
    ]),
    requiredSkills: z
      .array(z.string().trim().min(1))
      .min(1, 'Pilih minimal 1 tag keahlian'),
    totalReward: z
      .number()
      .int('Total reward harus berupa bilangan bulat integer tanpa desimal')
      .min(10000, 'Total bounty reward minimal Rp 10.000')
      .refine(
        (val) => val % 1000 === 0,
        'Nominal reward harus merupakan kelipatan Rp 1.000'
      ),
    deadlineType: z.enum([TASK_DEADLINE_TYPES.FIXED, TASK_DEADLINE_TYPES.DURATION]),
    fixedDeadline: z.string().optional().nullable(),
    durationMinutes: z.number().int().positive().optional().nullable(),
    termsContent: z
      .string()
      .trim()
      .min(10, 'Terms & Conditions snapshot minimal 10 karakter'),
    status: z.enum([TASK_STATUS.DRAFT, TASK_STATUS.OPEN]).default(TASK_STATUS.DRAFT),
  })
  .refine(
    (data) => {
      if (data.deadlineType === TASK_DEADLINE_TYPES.FIXED) {
        return !!data.fixedDeadline && !isNaN(new Date(data.fixedDeadline).getTime());
      }
      return true;
    },
    {
      message: 'Tanggal fixed deadline wajib diisi dengan format tanggal yang valid',
      path: ['fixedDeadline'],
    }
  )
  .refine(
    (data) => {
      if (data.deadlineType === TASK_DEADLINE_TYPES.DURATION) {
        return typeof data.durationMinutes === 'number' && data.durationMinutes > 0;
      }
      return true;
    },
    {
      message: 'Durasi pengerjaan dalam menit wajib diisi positif',
      path: ['durationMinutes'],
    }
  );

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

/**
 * 2. Skema Pengajuan Aplikasi Task oleh Member (applyTaskSchema)
 */
export const applyTaskSchema = z.object({
  taskId: z.string().trim().min(1, 'ID task wajib disertakan'),
  message: z
    .string()
    .trim()
    .min(10, 'Pesan perkenalan atau motivasi minimal 10 karakter')
    .max(1000, 'Pesan maksimal 1000 karakter'),
  portfolioLinks: z
    .array(z.string().trim().url('Format tautan portofolio tidak valid'))
    .optional()
    .default([]),
});

export type ApplyTaskInput = z.infer<typeof applyTaskSchema>;

/**
 * 3. Skema Instant Take Task
 */
export const instantTakeSchema = z.object({
  taskId: z.string().trim().min(1, 'ID task wajib disertakan'),
  agreedTermsVersion: z
    .number()
    .int()
    .min(1, 'Versi persetujuan terms wajib disertakan'),
});

export type InstantTakeInput = z.infer<typeof instantTakeSchema>;
