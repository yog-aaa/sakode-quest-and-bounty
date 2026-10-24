/**
 * SAKODE Task & Reward Platform - Firebase Cloud Messaging (FCM) Web Push Service
 * Menangani pengiriman push notification ke browser pengguna secara non-blocking.
 * 
 * STRICT INVARIANT: Non-Blocking Architecture
 * Kegagalan pengiriman push notification (token kedaluwarsa, izin diblokir pengguna, dll)
 * MUTLAK TIDAK BOLEH membatalkan alur transaksi atau mutasi status database utama.
 */

import { getAdminMessaging, getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface FCMPushPayload {
  title: string;
  body: string;
  link?: string | null;
  category?: string;
  data?: Record<string, string>;
}

export interface FCMPushResult {
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
}

/**
 * Mengirim notifikasi push ke daftar token perangkat terdaftar
 */
export async function sendFCMWebPush(
  userId: string,
  fcmTokens: string[] | undefined | null,
  payload: FCMPushPayload
): Promise<FCMPushResult> {
  const result: FCMPushResult = {
    successCount: 0,
    failureCount: 0,
    invalidTokens: [],
  };

  if (!fcmTokens || fcmTokens.length === 0) {
    return result;
  }

  // Deduplikasi token
  const uniqueTokens = Array.from(new Set(fcmTokens.filter(Boolean)));
  if (uniqueTokens.length === 0) {
    return result;
  }

  try {
    const messaging = getAdminMessaging();
    const destinationUrl = payload.link || '/';

    const response = await messaging.sendEachForMulticast({
      tokens: uniqueTokens,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: {
        title: payload.title,
        body: payload.body,
        link: destinationUrl,
        category: payload.category || 'SYSTEM',
        ...(payload.data || {}),
      },
      webpush: {
        fcmOptions: {
          link: destinationUrl,
        },
        notification: {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
        },
      },
    });

    result.successCount = response.successCount;
    result.failureCount = response.failureCount;

    // Bersihkan token yang sudah tidak valid/kedaluwarsa
    if (response.failureCount > 0) {
      response.responses.forEach((resp, idx) => {
        if (!resp.success && resp.error) {
          const errorCode = resp.error.code;
          if (
            errorCode === 'messaging/invalid-registration-token' ||
            errorCode === 'messaging/registration-token-not-registered'
          ) {
            result.invalidTokens.push(uniqueTokens[idx]);
          }
        }
      });

      if (result.invalidTokens.length > 0 && userId) {
        // Hapus token tidak valid secara aman di background
        try {
          const db = getAdminFirestore();
          await db
            .collection('users')
            .doc(userId)
            .update({
              fcmTokens: FieldValue.arrayRemove(...result.invalidTokens),
            });
          console.info(
            `[FCM] Ditemukan & dihapus ${result.invalidTokens.length} token usang untuk user ${userId}`
          );
        } catch (cleanupErr) {
          console.warn('[FCM] Gagal membersihkan token usang:', cleanupErr);
        }
      }
    }

    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.warn('[FCM] Gagal mengirim Web Push Notification:', errorMsg);
    return {
      successCount: 0,
      failureCount: uniqueTokens.length,
      invalidTokens: [],
    };
  }
}
