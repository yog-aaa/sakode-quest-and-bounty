import { z } from 'zod';
import { NOTIFICATION_CATEGORIES, type NotificationCategory } from '@/lib/constants';

/**
 * 1. Skema Menandai Notifikasi Dibaca (markNotificationReadSchema)
 */
export const markNotificationReadSchema = z.object({
  notificationId: z.string().min(1, 'ID notifikasi wajib disertakan.'),
});

export type MarkNotificationReadInput = z.infer<typeof markNotificationReadSchema>;

/**
 * 2. Skema Registrasi FCM Device Token (registerFCMTokenSchema)
 */
export const registerFCMTokenSchema = z.object({
  token: z.string().min(10, 'FCM device token tidak valid.'),
});

export type RegisterFCMTokenInput = z.infer<typeof registerFCMTokenSchema>;

/**
 * 3. Skema Input Pengiriman Notifikasi Internal (createNotificationSchema)
 */
export const createNotificationSchema = z.object({
  title: z.string().min(1, 'Judul notifikasi wajib diisi.').max(150),
  message: z.string().min(1, 'Pesan notifikasi wajib diisi.').max(1000),
  category: z.nativeEnum(NOTIFICATION_CATEGORIES as Record<string, NotificationCategory>),
  link: z.string().nullable().optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
