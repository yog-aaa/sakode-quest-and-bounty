/**
 * SAKODE Task & Reward Platform - Firebase Cloud Messaging Service Worker
 * Menangani penerimaan background push notification dan interaksi klik pengguna.
 */

// Import library Firebase Compat SDK untuk Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaMockKeyForBuildAndDev123456789",
  authDomain: "sakode-task-reward.firebaseapp.com",
  projectId: "sakode-task-reward",
  storageBucket: "sakode-task-reward.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
};

try {
  if (firebase.apps.length === 0) {
    firebase.initializeApp(firebaseConfig);
  }
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.info('[firebase-messaging-sw.js] Notifikasi latar belakang diterima:', payload);
    const notificationTitle =
      payload.notification?.title || payload.data?.title || 'SAKODE Academy';

    const notificationOptions = {
      body:
        payload.notification?.body ||
        payload.data?.body ||
        'Anda memiliki pemberitahuan baru di platform SAKODE.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        link: payload.data?.link || payload.fcmOptions?.link || '/',
      },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (error) {
  console.warn('[firebase-messaging-sw.js] Inisialisasi Firebase Messaging SW gagal:', error);
}

// Fallback pendengar event Push bawaan browser
self.addEventListener('push', (event) => {
  if (!event.data) return;
  try {
    const data = event.data.json();
    const title = data.notification?.title || data.data?.title || 'SAKODE Academy';
    const options = {
      body: data.notification?.body || data.data?.body || 'Notifikasi baru tersedia.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      data: {
        link: data.data?.link || '/',
      },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch {
    // Abaikan jika bukan JSON
  }
});

// Penanganan navigasi saat notifikasi diklik
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.link || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Fokus ke tab yang sudah terbuka jika URL sama
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Buka tab baru jika belum terbuka
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
