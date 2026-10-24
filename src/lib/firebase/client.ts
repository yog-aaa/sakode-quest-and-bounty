/**
 * SAKODE Task & Reward Platform - Firebase Client SDK
 * Lazy & Safe initialization untuk client-side (Browser / Client Components)
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaMockKeyForBuildAndDev123456789',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'sakode-task-reward.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'sakode-task-reward',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'sakode-task-reward.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789012',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:123456789012:web:abcdef123456',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function initFirebaseClient() {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  return { app, auth, db, storage };
}

export function getClientApp(): FirebaseApp {
  if (!app) initFirebaseClient();
  return app;
}

export function getClientAuth(): Auth {
  if (!auth) initFirebaseClient();
  return auth;
}

export function getClientFirestore(): Firestore {
  if (!db) initFirebaseClient();
  return db;
}

export function getClientStorage(): FirebaseStorage {
  if (!storage) initFirebaseClient();
  return storage;
}

// Inisialisasi default instance
const client = initFirebaseClient();
export const firebaseApp = client.app;
export const firebaseAuth = client.auth;
export const firestore = client.db;
export const firebaseStorage = client.storage;
