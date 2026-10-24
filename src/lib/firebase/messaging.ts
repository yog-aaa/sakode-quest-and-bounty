'use client';

/**
 * SAKODE Task & Reward Platform - Firebase Client Messaging Helper
 * Menangani permintaan izin notifikasi browser, pendaftaran service worker, dan pengambilan token FCM.
 */

import { getMessaging, getToken, onMessage, type Messaging, type MessagePayload } from 'firebase/messaging';
import { getClientApp } from './client';

let messagingInstance: Messaging | null = null;

function getSafeClientMessaging(): Messaging | null {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return null;
  }

  if (!messagingInstance) {
    try {
      messagingInstance = getMessaging(getClientApp());
    } catch (e) {
      console.warn('[FCM Client] Gagal menginisialisasi messaging client:', e);
      return null;
    }
  }

  return messagingInstance;
}

/**
 * Meminta izin notifikasi browser dan mengambil FCM Device Token
 */
export async function requestNotificationPermissionAndToken(): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    console.info('[FCM Client] Browser ini tidak mendukung Web Push Notification.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.info('[FCM Client] Izin notifikasi browser tidak diberikan oleh pengguna.');
      return null;
    }

    // Registrasi service worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const messaging = getSafeClientMessaging();
    if (!messaging) return null;

    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

    const token = await getToken(messaging, {
      serviceWorkerRegistration: registration,
      vapidKey: vapidKey || undefined,
    });

    if (token) {
      console.info('[FCM Client] FCM Device Token berhasil diperoleh.');
      return token;
    }

    return null;
  } catch (error) {
    console.warn('[FCM Client] Gagal mendapatkan FCM token:', error);
    return null;
  }
}

/**
 * Mendengarkan pesan yang tiba saat aplikasi sedang aktif di foreground
 */
export function listenForegroundNotifications(
  callback: (payload: MessagePayload) => void
): (() => void) | null {
  const messaging = getSafeClientMessaging();
  if (!messaging) return null;

  try {
    const unsubscribe = onMessage(messaging, (payload) => {
      console.info('[FCM Client] Pesan foreground diterima:', payload);
      callback(payload);
    });
    return unsubscribe;
  } catch (e) {
    console.warn('[FCM Client] Gagal memasang foreground listener:', e);
    return null;
  }
}
