'use server';

/**
 * SAKODE Task & Reward Platform - Notification Server Actions
 * App Router server actions untuk manajemen notifikasi realtime, penandaan baca, dan pendaftaran FCM.
 */

import { revalidatePath } from 'next/cache';
import {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  registerDeviceToken,
} from '@/server/services/notification.service';
import {
  markNotificationReadSchema,
  registerFCMTokenSchema,
} from '@/lib/validations/notification';
import { serializeNotificationDoc } from '@/server/serializers';
import type { NotificationDocument } from '@/types/database';

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  return fallback;
}

/**
 * 1. Mengambil Daftar Notifikasi Milik Pengguna
 */
export async function getUserNotificationsAction(
  userId: string,
  limitCount = 30
): Promise<{ success: boolean; notifications?: NotificationDocument[]; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID tidak ditemukan.' };
    }
    const notifs = await getUserNotifications(userId, limitCount);
    return {
      success: true,
      notifications: notifs.map(serializeNotificationDoc),
    };
  } catch (error: unknown) {
    console.error('Error on getUserNotificationsAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memuat daftar notifikasi.'),
    };
  }
}

/**
 * 2. Menandai Satu Notifikasi Sebagai Sudah Dibaca
 */
export async function markNotificationReadAction(
  userId: string,
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID tidak ditemukan.' };
    }
    const validated = markNotificationReadSchema.parse({ notificationId });
    await markAsRead(userId, validated.notificationId);

    revalidatePath('/member/notifications');
    revalidatePath('/admin/notifications');

    return { success: true };
  } catch (error: unknown) {
    console.error('Error on markNotificationReadAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal memperbarui status notifikasi.'),
    };
  }
}

/**
 * 3. Menandai Seluruh Notifikasi Sebagai Sudah Dibaca (Mark All as Read)
 */
export async function markAllNotificationsReadAction(
  userId: string
): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID tidak ditemukan.' };
    }
    const result = await markAllAsRead(userId);

    revalidatePath('/member/notifications');
    revalidatePath('/admin/notifications');

    return {
      success: true,
      updatedCount: result.updatedCount,
    };
  } catch (error: unknown) {
    console.error('Error on markAllNotificationsReadAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal menandai semua notifikasi.'),
    };
  }
}

/**
 * 4. Mendaftarkan FCM Device Token Perangkat
 */
export async function registerFCMTokenAction(
  userId: string,
  token: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!userId) {
      return { success: false, error: 'User ID tidak ditemukan.' };
    }
    const validated = registerFCMTokenSchema.parse({ token });
    await registerDeviceToken(userId, validated.token);

    return { success: true };
  } catch (error: unknown) {
    console.error('Error on registerFCMTokenAction:', error);
    return {
      success: false,
      error: getErrorMessage(error, 'Gagal mendaftarkan token notifikasi push.'),
    };
  }
}
