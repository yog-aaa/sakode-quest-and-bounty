import { z } from 'zod';

/**
 * Daftar bank dan e-wallet resmi yang didukung SAKODE
 */
export const SUPPORTED_PAYMENT_PROVIDERS = [
  'BCA',
  'Mandiri',
  'BNI',
  'BRI',
  'BSI',
  'Bank Jago',
  'SeaBank',
  'GoPay',
  'OVO',
  'DANA',
] as const;

export type SupportedPaymentProvider =
  (typeof SUPPORTED_PAYMENT_PROVIDERS)[number];

/**
 * Validasi nomor kontak WhatsApp / Telegram Indonesia (08xxx atau +62xxx)
 */
const indonesiaPhoneRegex = /^(\+628|08)[0-9]{8,12}$/;

/**
 * 1. Skema Registrasi Akun Baru (Email & Password)
 */
export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Alamat email wajib diisi')
      .email('Format alamat email tidak valid')
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .regex(/[a-zA-Z]/, 'Password harus mengandung huruf')
      .regex(/[0-9]/, 'Password harus mengandung angka'),
    confirmPassword: z
      .string()
      .min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Konfirmasi password tidak cocok dengan password di atas',
    path: ['confirmPassword'],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

/**
 * 2. Skema Masuk Akun (Login)
 */
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Alamat email wajib diisi')
    .email('Format alamat email tidak valid')
    .trim()
    .toLowerCase(),
  password: z
    .string()
    .min(1, 'Password wajib diisi'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * 3. Skema Kelengkapan Profil (Onboarding & Data Rekening)
 */
export const profileCompletionSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(60, 'Nama lengkap maksimal 60 karakter'),
  contactNumber: z
    .string()
    .trim()
    .min(1, 'Nomor WhatsApp / Telegram wajib diisi')
    .regex(
      indonesiaPhoneRegex,
      'Nomor kontak tidak valid. Gunakan format 08xxxxxxxx atau +628xxxxxxxx'
    ),
  skills: z
    .array(z.string().trim().min(1))
    .min(1, 'Pilih minimal 1 keahlian / skill tag')
    .max(10, 'Maksimal 10 keahlian'),
  bankName: z.enum(SUPPORTED_PAYMENT_PROVIDERS),
  accountNumber: z
    .string()
    .trim()
    .min(5, 'Nomor rekening minimal 5 digit')
    .max(25, 'Nomor rekening maksimal 25 digit')
    .regex(/^[0-9]+$/, 'Nomor rekening hanya boleh berisi angka tanpa spasi atau tanda hubung'),
  accountHolderName: z
    .string()
    .trim()
    .min(3, 'Nama pemilik rekening minimal 3 karakter')
    .max(60, 'Nama pemilik rekening maksimal 60 karakter'),
});

export type ProfileCompletionInput = z.infer<typeof profileCompletionSchema>;

/**
 * 4. Skema Alasan Penolakan / Revisi dari Admin
 */
export const reviewActionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Alasan minimal 5 karakter')
    .max(500, 'Alasan maksimal 500 karakter'),
});

export type ReviewActionInput = z.infer<typeof reviewActionSchema>;

/**
 * 5. Skema Pembaruan Profil Mandiri (Admin / User)
 */
export const adminProfileUpdateSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(3, 'Nama lengkap minimal 3 karakter')
    .max(60, 'Nama lengkap maksimal 60 karakter'),
  contactNumber: z
    .string()
    .trim()
    .min(1, 'Nomor WhatsApp / kontak wajib diisi')
    .regex(
      indonesiaPhoneRegex,
      'Nomor kontak tidak valid. Gunakan format 08xxxxxxxx atau +628xxxxxxxx'
    ),
  bankName: z.enum(SUPPORTED_PAYMENT_PROVIDERS).optional(),
  accountNumber: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || (val.length >= 5 && val.length <= 25 && /^[0-9]+$/.test(val)), {
      message: 'Nomor rekening harus 5-25 digit angka',
    }),
  accountHolderName: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || (val.length >= 3 && val.length <= 60), {
      message: 'Nama pemilik rekening minimal 3 karakter',
    }),
});

export type AdminProfileUpdateInput = z.infer<typeof adminProfileUpdateSchema>;

