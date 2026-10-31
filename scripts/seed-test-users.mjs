/**
 * SAKODE Task & Reward Platform - Test Users Seeder & Cleanup Script
 * 
 * Membuat akun pengujian admin & member:
 * 1. Admin: admin@sakode.com | pass: admin@sakode (role: SUPER_ADMIN, status: APPROVED)
 * 2. User:  user@sakode.com  | pass: user@sakode  (role: MEMBER, status: APPROVED)
 * 
 * Menghapus akun pengujian:
 *   node scripts/seed-test-users.mjs --delete
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';

// Load .env.local
function loadEnv() {
  const rootDir = path.resolve(__dirname, '..');
  const envFiles = ['.env.local', '.env'];

  for (const envFile of envFiles) {
    const fullPath = path.join(rootDir, envFile);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const rawLine of content.split('\n')) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx === -1) continue;
        const key = line.slice(0, eqIdx).trim();
        let val = line.slice(eqIdx + 1).trim();

        if (
          (val.startsWith('"') && val.endsWith('"')) ||
          (val.startsWith("'") && val.endsWith("'"))
        ) {
          val = val.slice(1, -1);
        }

        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

function initFirebase() {
  const existingApps = getApps();
  let app;
  if (existingApps.length > 0) {
    app = existingApps[0];
  } else {
    let projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    let clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (privateKey) {
      privateKey = privateKey.replace(/\\n/g, '\n').replace(/^["']|["']$/g, '');
    }

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        'Kredensial Firebase Admin tidak lengkap di .env.local (wajib FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
      );
    }

    app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return {
    auth: getAuth(app),
    db: getFirestore(app),
  };
}

const TEST_USERS = [
  {
    email: 'admin@sakode.com',
    password: 'admin@sakode',
    displayName: 'Admin Sakode',
    contactNumber: '081234567890',
    role: 'SUPER_ADMIN',
    approvalStatus: 'APPROVED',
    skills: ['Project Management', 'Fullstack Architecture', 'DevOps', 'Security Audit'],
    paymentAccountEncrypted: 'mock_aes256_admin_account_encrypted_token',
    paymentAccountMasked: 'BCA •••• 8899',
  },
  {
    email: 'user@sakode.com',
    password: 'user@sakode',
    displayName: 'User Sakode',
    contactNumber: '081298765432',
    role: 'MEMBER',
    approvalStatus: 'APPROVED',
    skills: ['React', 'Next.js', 'Tailwind CSS', 'TypeScript', 'Flutter'],
    paymentAccountEncrypted: 'mock_aes256_member_account_encrypted_token',
    paymentAccountMasked: 'BCA •••• 1234',
  },
];

async function seedTestUsers() {
  const { auth, db } = initFirebase();
  const isDeleteMode = process.argv.includes('--delete') || process.argv.includes('-d');

  if (isDeleteMode) {
    console.log(`\n${YELLOW}${BOLD}Menghapus akun-akun pengujian SAKODE...${RESET}\n`);
    for (const u of TEST_USERS) {
      try {
        const existing = await auth.getUserByEmail(u.email);
        await auth.deleteUser(existing.uid);
        await db.collection('users').doc(existing.uid).delete();
        console.log(`  ${GREEN}✓ Berhasil menghapus:${RESET} ${u.email} (UID: ${existing.uid})`);
      } catch (err) {
        if (err.code === 'auth/user-not-found') {
          console.log(`  ${GRAY}• Akun ${u.email} tidak ditemukan (sudah terhapus).${RESET}`);
        } else {
          console.error(`  ${RED}✗ Gagal menghapus ${u.email}:${RESET}`, err.message);
        }
      }
    }
    console.log(`\n${GREEN}${BOLD}Pembersihan akun testing selesai!${RESET}\n`);
    return;
  }

  console.log(`\n${CYAN}${BOLD}================================================================================${RESET}`);
  console.log(`${BOLD}INJEKSI AKUN PENGUJIAN (TESTING ACCOUNTS) SAKODE${RESET}`);
  console.log(`${CYAN}${BOLD}================================================================================${RESET}\n`);

  for (const u of TEST_USERS) {
    let uid;
    try {
      const existing = await auth.getUserByEmail(u.email);
      uid = existing.uid;
      // Perbarui password dan status verified
      await auth.updateUser(uid, {
        password: u.password,
        displayName: u.displayName,
        emailVerified: true,
      });
      console.log(`  ${YELLOW}↻ Akun Auth diperbarui:${RESET} ${BOLD}${u.email}${RESET} (UID: ${uid})`);
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        const created = await auth.createUser({
          email: u.email,
          password: u.password,
          displayName: u.displayName,
          emailVerified: true,
        });
        uid = created.uid;
        console.log(`  ${GREEN}✓ Akun Auth dibuat baru:${RESET} ${BOLD}${u.email}${RESET} (UID: ${uid})`);
      } else {
        throw err;
      }
    }

    // Set Custom Claims
    await auth.setCustomUserClaims(uid, {
      role: u.role,
      approvalStatus: u.approvalStatus,
    });
    console.log(`    ↳ Custom claims diset: role=${u.role}, approvalStatus=${u.approvalStatus}`);

    // Sinkronkan ke Firestore `users/{uid}`
    const userDocRef = db.collection('users').doc(uid);
    const existingDoc = await userDocRef.get();

    const docData = {
      id: uid,
      email: u.email,
      displayName: u.displayName,
      contactNumber: u.contactNumber,
      skills: u.skills,
      role: u.role,
      approvalStatus: u.approvalStatus,
      paymentAccountEncrypted: u.paymentAccountEncrypted,
      paymentAccountMasked: u.paymentAccountMasked,
      activeTaskId: null,
      pendingApplicationCount: 0,
      stats: {
        completedTasks: 0,
        onTimeTasks: 0,
        failedTasks: 0,
        provenReports: 0,
      },
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (!existingDoc.exists) {
      docData.createdAt = FieldValue.serverTimestamp();
    }

    await userDocRef.set(docData, { merge: true });
    console.log(`    ↳ Firestore users/${uid} tersinkronisasi (Status: ${u.approvalStatus}, Role: ${u.role})`);
  }

  console.log(`\n${CYAN}${BOLD}================================================================================${RESET}`);
  console.log(`${GREEN}${BOLD}AKUN PENGUJIAN SIAP DIGUNAKAN!${RESET}`);
  console.log(`${BOLD}1. Akun Admin:${RESET}`);
  console.log(`   Email   : ${CYAN}admin@sakode.com${RESET}`);
  console.log(`   Password: ${CYAN}admin@sakode${RESET}`);
  console.log(`   Hak     : SUPER_ADMIN (Akses Penuh /admin)`);
  console.log(`\n${BOLD}2. Akun User/Member:${RESET}`);
  console.log(`   Email   : ${CYAN}user@sakode.com${RESET}`);
  console.log(`   Password: ${CYAN}user@sakode${RESET}`);
  console.log(`   Hak     : MEMBER APPROVED (Akses Penuh /member, Siap Ambil Task)`);
  console.log(`\n${YELLOW}Catatan Pembersihan:${RESET}`);
  console.log(`Untuk menghapus kedua akun ini sewaktu-waktu, jalankan:`);
  console.log(`  node scripts/seed-test-users.mjs --delete`);
  console.log(`${CYAN}${BOLD}================================================================================${RESET}\n`);
}

seedTestUsers().catch((err) => {
  console.error(`\n${RED}Fatal Seeder Error: ${err.message}${RESET}`);
  process.exit(1);
});
