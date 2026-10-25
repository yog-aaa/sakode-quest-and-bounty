/**
 * SAKODE Task & Reward Platform - Notification Service & Unified Dispatcher
 * Mengelola penyimpanan notifikasi in-app realtime, Web Push FCM, serta Adapter Email.
 * 
 * STRICT INVARIANT: Non-Blocking Architecture
 * Pengiriman notifikasi (in-app, push FCM, maupun email) berjalan terisolasi
 * dan MUTLAK TIDAK BOLEH membatalkan atau me-rollback mutasi database pemanggil.
 */

import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { NOTIFICATION_CATEGORIES, type NotificationCategory } from '@/lib/constants';
import type { NotificationDocument, UserDocument, FirestoreDate } from '@/types/database';
import { sendFCMWebPush } from './fcm.service';
import { sendEmailSafe } from './email/email.adapter';
import { toDateSafe } from '@/lib/utils';

export interface CreateNotificationParams {
  title: string;
  message: string;
  category: NotificationCategory;
  link?: string | null;
}

export interface EmailDispatchPayload {
  toEmail?: string;
  subject: string;
  html: string;
  text?: string;
}

export interface DispatchNotificationOptions {
  title: string;
  message: string;
  category: NotificationCategory;
  link?: string | null;
  emailPayload?: EmailDispatchPayload;
}

/**
 * 1. Menyimpan Notifikasi Baru ke Firestore (In-App)
 */
export async function createNotification(
  recipientUid: string,
  payload: CreateNotificationParams
): Promise<NotificationDocument> {
  const db = getAdminFirestore();
  const notifRef = db.collection('notifications').doc();

  const data: Omit<NotificationDocument, 'id'> = {
    userId: recipientUid,
    title: payload.title,
    message: payload.message,
    category: payload.category || NOTIFICATION_CATEGORIES.ACCOUNT,
    link: payload.link || null,
    isRead: false,
    createdAt: FieldValue.serverTimestamp() as unknown as FirestoreDate,
  };

  await notifRef.set(data);

  return {
    ...data,
    id: notifRef.id,
    createdAt: Timestamp.now() as unknown as FirestoreDate,
  };
}

/**
 * 2. Mengambil Notifikasi Milik Pengguna
 */
export async function getUserNotifications(
  userId: string,
  limitCount = 30
): Promise<NotificationDocument[]> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('notifications')
    .where('userId', '==', userId)
    .get();

  const items = snap.docs.map((doc) => ({
    ...(doc.data() as NotificationDocument),
    id: doc.id,
  }));

  return items
    .sort((a, b) => {
      const timeA = toDateSafe(a.createdAt)?.getTime() || 0;
      const timeB = toDateSafe(b.createdAt)?.getTime() || 0;
      return timeB - timeA;
    })
    .slice(0, limitCount);
}

/**
 * 3. Menandai Satu Notifikasi Sudah Dibaca
 */
export async function markAsRead(
  userId: string,
  notificationId: string
): Promise<{ success: boolean }> {
  const db = getAdminFirestore();
  const docRef = db.collection('notifications').doc(notificationId);
  const snap = await docRef.get();

  if (!snap.exists) {
    throw new Error('Notifikasi tidak ditemukan.');
  }

  const notifData = snap.data() as NotificationDocument;
  if (notifData.userId !== userId) {
    throw new Error('Akses ditolak: Notifikasi ini bukan milik Anda.');
  }

  await docRef.update({
    isRead: true,
  });

  return { success: true };
}

/**
 * 4. Menandai Seluruh Notifikasi Pengguna Sudah Dibaca (Mark All as Read)
 */
export async function markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
  const db = getAdminFirestore();
  const snap = await db
    .collection('notifications')
    .where('userId', '==', userId)
    .where('isRead', '==', false)
    .limit(100)
    .get();

  if (snap.empty) {
    return { updatedCount: 0 };
  }

  const batch = db.batch();
  snap.docs.forEach((doc) => {
    batch.update(doc.ref, { isRead: true });
  });

  await batch.commit();
  return { updatedCount: snap.size };
}

/**
 * 5. Mendaftarkan FCM Device Token ke Profil Pengguna
 */
export async function registerDeviceToken(
  userId: string,
  fcmToken: string
): Promise<{ success: boolean }> {
  if (!userId || !fcmToken) {
    throw new Error('User ID dan FCM Token wajib diisi.');
  }

  const db = getAdminFirestore();
  await db
    .collection('users')
    .doc(userId)
    .update({
      fcmTokens: FieldValue.arrayUnion(fcmToken),
      updatedAt: FieldValue.serverTimestamp(),
    });

  return { success: true };
}

/**
 * 6. UNIFIED DISPATCHER (Non-Blocking)
 * Menjalankan pengiriman In-App, Web Push FCM, dan Email secara paralel dan independen.
 * Kegagalan salah satu channel tidak akan memengaruhi channel lain maupun proses utama.
 */
export async function dispatchNotification(
  recipientUid: string,
  options: DispatchNotificationOptions
): Promise<{ inApp: boolean; push: boolean; email: boolean }> {
  const results = {
    inApp: false,
    push: false,
    email: false,
  };

  if (!recipientUid) {
    return results;
  }

  // Siapkan promises paralel
  const promises: Promise<void>[] = [];

  // A. In-App Notification (Firestore)
  promises.push(
    (async () => {
      try {
        await createNotification(recipientUid, {
          title: options.title,
          message: options.message,
          category: options.category,
          link: options.link,
        });
        results.inApp = true;
      } catch (inAppErr) {
        console.warn(`[dispatchNotification] Gagal simpan In-App notif untuk ${recipientUid}:`, inAppErr);
      }
    })()
  );

  // B. Ambil Profil User untuk FCM & Email
  promises.push(
    (async () => {
      try {
        const db = getAdminFirestore();
        const userDoc = await db.collection('users').doc(recipientUid).get();
        if (!userDoc.exists) return;

        const userData = userDoc.data() as UserDocument;

        // B1. Push FCM jika ada token terdaftar
        if (userData.fcmTokens && userData.fcmTokens.length > 0) {
          try {
            const pushResult = await sendFCMWebPush(recipientUid, userData.fcmTokens, {
              title: options.title,
              body: options.message,
              link: options.link,
              category: options.category,
            });
            results.push = pushResult.successCount > 0;
          } catch (fcmErr) {
            console.warn(`[dispatchNotification] FCM push error untuk ${recipientUid}:`, fcmErr);
          }
        }

        // B2. Email Transaksional jika payload email disertakan
        if (options.emailPayload) {
          const targetEmail = options.emailPayload.toEmail || userData.email;
          if (targetEmail) {
            try {
              const emailResult = await sendEmailSafe(
                targetEmail,
                options.emailPayload.subject,
                options.emailPayload.html,
                options.emailPayload.text
              );
              results.email = emailResult.success;
            } catch (emailErr) {
              console.warn(`[dispatchNotification] Email dispatch error ke ${targetEmail}:`, emailErr);
            }
          }
        }
      } catch (userFetchErr) {
        console.warn(`[dispatchNotification] Gagal fetch user data untuk notifikasi ${recipientUid}:`, userFetchErr);
      }
    })()
  );

  // Tunggu seluruh kanal selesai dengan perlindungan non-blocking
  await Promise.allSettled(promises);
  return results;
}
