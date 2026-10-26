/**
 * SAKODE Task & Reward Platform - Firebase Admin SDK
 * Server-side only (Server Actions, Route Handlers, Background Services)
 * Menggunakan modular imports & lazy-initialization yang aman dari runtime crash saat build.
 */

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';

let adminApp: App | null = null;

export function getAdminApp(): App {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0]!;
    return adminApp;
  }

  let projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (projectId) {
    projectId = projectId.trim().replace(/^["']|["']$/g, '');
  }

  let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  if (clientEmail) {
    clientEmail = clientEmail.trim().replace(/^["']|["']$/g, '');
  }

  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.trim();
    while (
      (privateKey.startsWith('"') && privateKey.endsWith('"')) ||
      (privateKey.startsWith("'") && privateKey.endsWith("'"))
    ) {
      privateKey = privateKey.slice(1, -1).trim();
    }
    // Normalisasi newline escapes yang sering terjadi di environment variables Vercel
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (projectId && clientEmail && privateKey) {
    try {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
      return adminApp;
    } catch (certErr: unknown) {
      console.warn('Gagal inisialisasi Firebase Admin dengan cert(), fallback ke projectId default:', certErr);
    }
  }

  // Fallback untuk development lokal / emulator / build time
  try {
    adminApp = initializeApp({
      projectId: projectId || 'sakode-task-reward',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } catch (fallbackErr: unknown) {
    console.warn('Fallback initializeApp warning:', fallbackErr);
    const apps = getApps();
    if (apps.length > 0) {
      adminApp = apps[0]!;
    }
  }

  return adminApp!;
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getAdminApp());
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getAdminApp());
}

export function getAdminMessaging(): Messaging {
  return getMessaging(getAdminApp());
}
