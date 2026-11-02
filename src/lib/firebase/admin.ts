/**
 * SAKODE Task & Reward Platform - Firebase Admin SDK
 * Server-side only (Server Actions, Route Handlers, Background Services)
 * Menggunakan modular imports & lazy-initialization yang aman dari runtime crash saat build.
 */

import { getApps, initializeApp, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import type { Auth } from 'firebase-admin/auth';
import type { Storage } from 'firebase-admin/storage';
import type { Messaging } from 'firebase-admin/messaging';

let adminApp: App | null = null;

function parsePrivateKey(rawKey?: string): string | undefined {
  if (!rawKey) return undefined;
  let key = rawKey.trim();

  // Jika user memasukkan JSON utuh ke variabel private key
  if (key.startsWith('{') && key.endsWith('}')) {
    try {
      const parsed = JSON.parse(key);
      if (parsed.private_key) return parsePrivateKey(parsed.private_key);
    } catch {}
  }

  // Bersihkan kutip luar
  while (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1).trim();
  }

  // Normalisasi newline escapes yang sering terjadi di environment variables hosting
  key = key.replace(/\\r\\n/g, '\n');
  key = key.replace(/\\n/g, '\n');
  key = key.replace(/\r\n/g, '\n');

  // Jika newline hilang saat copy-paste ke input satu baris
  if (!key.includes('\n') && key.includes('-----BEGIN PRIVATE KEY-----')) {
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    const body = key.replace(header, '').replace(footer, '').trim();
    key = `${header}\n${body}\n${footer}\n`;
  }

  return key;
}

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

  let privateKey = parsePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  // Opsi fleksibel: Dukungan FIREBASE_SERVICE_ACCOUNT_KEY (JSON langsung atau Base64)
  const rawServiceAccount =
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (rawServiceAccount) {
    try {
      let jsonStr = rawServiceAccount.trim();
      if (!jsonStr.startsWith('{')) {
        try {
          jsonStr = Buffer.from(jsonStr, 'base64').toString('utf8');
        } catch {}
      }
      if (jsonStr.startsWith('{')) {
        const parsed = JSON.parse(jsonStr);
        if (parsed.project_id) projectId = parsed.project_id;
        if (parsed.client_email) clientEmail = parsed.client_email;
        if (parsed.private_key) privateKey = parsePrivateKey(parsed.private_key);
      }
    } catch (e) {
      console.warn('Gagal membaca FIREBASE_SERVICE_ACCOUNT_KEY:', e);
    }
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
      console.error('Gagal inisialisasi Firebase Admin dengan cert():', certErr);
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `Firebase Admin cert() error: ${certErr instanceof Error ? certErr.message : String(certErr)}. Periksa format FIREBASE_PRIVATE_KEY atau FIREBASE_CLIENT_EMAIL di environment variables.`
        );
      }
    }
  } else if (process.env.NODE_ENV === 'production') {
    const missing = [];
    if (!projectId) missing.push('FIREBASE_PROJECT_ID');
    if (!clientEmail) missing.push('FIREBASE_CLIENT_EMAIL');
    if (!privateKey) missing.push('FIREBASE_PRIVATE_KEY');
    console.warn(`[Firebase Admin] Environment variables belum lengkap di production: ${missing.join(', ')}`);
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
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuth } = require('firebase-admin/auth');
  return getAuth(getAdminApp());
}

export function getAdminStorage(): Storage {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getStorage } = require('firebase-admin/storage');
  return getStorage(getAdminApp());
}

export function getAdminMessaging(): Messaging {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getMessaging } = require('firebase-admin/messaging');
  return getMessaging(getAdminApp());
}
