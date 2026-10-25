/**
 * SAKODE Task & Reward Platform - Database Seeding & Master Data Script
 * 
 * Menginjeksi 8 variasi katalog task IT realistis berstatus OPEN ke Firestore
 * Mematuhi spesifikasi ARCHITECTURE.md, AGENTS.md, dan database_seeding_and_icon_fix_spec.md
 * 
 * Penggunaan:
 *   node scripts/seed-database.mjs                   -> Menjalankan seeding ke database Firestore
 *   node scripts/seed-database.mjs --dry-run         -> Pratinjau data tanpa menulis ke Firestore
 *   node scripts/seed-database.mjs --approve-member <email> -> Mengubah approvalStatus akun menjadi APPROVED
 * 
 * Script shortcut: `npm run db:seed`
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI Colors
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GRAY = '\x1b[90m';
const MAGENTA = '\x1b[35m';

// =============================================================================
// 1. Load Environment Variables (.env.local & .env)
// =============================================================================
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

// =============================================================================
// 2. Initialize Firebase Admin SDK
// =============================================================================
function initFirestore() {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return getFirestore(existingApps[0]);
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (privateKey) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      'Kredensial Firebase Admin tidak lengkap di .env.local (wajib FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY).'
    );
  }

  const app = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  });

  return getFirestore(app);
}

// =============================================================================
// 3. Definisi 8 Katalog Task IT Realistis (Deterministic IDs)
// =============================================================================
const SEED_TASKS = [
  {
    id: 'seed_task_fe_001',
    title: 'Slicing UI Responsive Dashboard & Dark Mode',
    description:
      'Slicing desain Figma ke komponen React Tailwind yang responsif (mobile, tablet, desktop) dengan integrasi switch Dark Mode.',
    scope:
      'Halaman Dashboard Utama, Sidebar Navigasi, Widget Statistik Transaksi, dan Modul Kartu Tugas Interaktif.',
    deliverableGuidelines:
      'Repositori GitHub berisi source code rapi, tautan live preview Vercel, dan dokumentasi singkat cara instalasi.',
    acceptanceCriteria: [
      'Tampilan 100% pixel-perfect sesuai desain Figma pada breakpoint 375px, 768px, dan 1440px.',
      'Transisi dark mode berjalan mulus tanpa flash (FOUC).',
      'Lolos pengujian aksesibilitas WCAG AA dengan skor Lighthouse > 90.',
      'Komponen modular dan reusable menggunakan TypeScript props yang ketat.',
    ],
    mode: 'SOLO',
    assignmentType: 'INSTANT_TAKE',
    requiredSkills: ['React', 'Tailwind CSS', 'Next.js', 'TypeScript'],
    totalReward: 450000, // Rp 450.000
    deadlineType: 'DURATION',
    durationMinutes: 2880, // 48 jam
    status: 'OPEN',
  },
  {
    id: 'seed_task_be_002',
    title: 'Integrasi Webhook Gateway & Payment Callback',
    description:
      'Implementasi endpoint REST API untuk menerima webhook notifikasi pembayaran dari payment gateway (Midtrans / Xendit) dengan verifikasi signature kriptografis.',
    scope:
      'Endpoint webhook POST /api/payment/webhook, verifikasi SHA-512 signature, pembaruan status transaksi atomik, dan retry mechanism.',
    deliverableGuidelines:
      'Pull Request / Repositori Git, file unit test mock webhook, dokumentasi API (Postman Collection / OpenAPI).',
    acceptanceCriteria: [
      'Signature webhook diverifikasi menggunakan secret key dengan penanganan timing-attack safe.',
      'Idempotensi: request webhook ganda dengan order ID yang sama tidak menduplikasi pembaruan status.',
      'Unit test coverage minimal 85% untuk skenario sukses, signature tidak valid, dan timeout.',
      'Error handling terstruktur dengan logging audit trail.',
    ],
    mode: 'SOLO',
    assignmentType: 'APPLICATION',
    requiredSkills: ['Node.js', 'TypeScript', 'PostgreSQL', 'REST API'],
    totalReward: 750000, // Rp 750.000
    deadlineType: 'DURATION',
    durationMinutes: 4320, // 72 jam
    status: 'OPEN',
  },
  {
    id: 'seed_task_mb_003',
    title: 'Perbaikan Bug FCM Push Notification & Deep Link',
    description:
      'Investigasi dan perbaikan masalah token FCM yang tidak ter-refresh saat background/killed state di Android 14+ serta implementasi routing deep link.',
    scope:
      'Aplikasi Flutter Android & iOS, modul Firebase Messaging Service, dan intent filter routing.',
    deliverableGuidelines:
      'Pull Request berisi perbaikan kode, video screen recording demonstrasi notifikasi masuk dan deep link routing di emulator/device.',
    acceptanceCriteria: [
      'Push notification muncul andal saat aplikasi dalam kondisi foreground, background, dan terminated.',
      'Tapping notifikasi membuka layar detail task secara presisi sesuai payload taskId.',
      'Meminta izin POST_NOTIFICATIONS runtime secara elegan di Android 13+.',
      'Tidak terjadi memory leak atau crash saat penanganan token refresh.',
    ],
    mode: 'SOLO',
    assignmentType: 'INSTANT_TAKE',
    requiredSkills: ['Flutter', 'Dart', 'Firebase Cloud Messaging', 'Android'],
    totalReward: 600000, // Rp 600.000
    deadlineType: 'DURATION',
    durationMinutes: 2880, // 48 jam
    status: 'OPEN',
  },
  {
    id: 'seed_task_team_004',
    title: 'Pembangunan Modul E-Commerce B2B Wholesale',
    description:
      'Pengerjaan kolaboratif modul katalog grosir, tiered pricing, checkout purchase order (PO), dan manajemen faktur pajak.',
    scope:
      'Frontend katalog & keranjang, Backend microservice order & pricing engine, dan skema database relasional.',
    deliverableGuidelines:
      'Repositori monorepo terpadu, demo deployment, dokumentasi arsitektur modul, dan panduan splitting konsensus tim.',
    acceptanceCriteria: [
      'Perhitungan tiered pricing berdasarkan kuantitas akurat tanpa celah pembulatan float.',
      'Workflow approval Purchase Order oleh Admin Finance berfungsi end-to-end.',
      'Sinkronisasi status stok menggunakan transaksi database berisolasi tinggi.',
      'Dikerjakan oleh tim 2-4 orang dengan pembagian deliverable yang terdokumentasi jelas.',
    ],
    mode: 'TEAM',
    minTeamSize: 2,
    maxTeamSize: 4,
    assignmentType: 'APPLICATION',
    requiredSkills: ['Next.js', 'Go', 'PostgreSQL', 'Team Collaboration'],
    totalReward: 2500000, // Rp 2.500.000
    deadlineType: 'DURATION',
    durationMinutes: 10080, // 7 hari
    status: 'OPEN',
  },
  {
    id: 'seed_task_devops_005',
    title: 'Setup CI/CD Pipeline GitHub Actions & Docker',
    description:
      'Otomasi build, test, multi-stage Docker build, vulnerability scanning dengan Trivy, dan deployment otomatis ke cloud container registry.',
    scope:
      'Workflow YAML GitHub Actions, optimasi Dockerfile, setup secrets management, dan webhook notification callback.',
    deliverableGuidelines:
      'File .github/workflows/ci-cd.yml, Dockerfile teroptimasi (<150MB), dan bukti log pipeline sukses.',
    acceptanceCriteria: [
      'Pipeline otomatis terpicu saat push ke branch main dan pull request.',
      'Multi-stage build mengurangi ukuran image final tanpa menyertakan dev dependencies.',
      'Trivy scan memblokir pipeline jika terdeteksi kerentanan CVE berstatus CRITICAL.',
      'Cache layer Docker diaktifkan untuk mempercepat durasi build di bawah 3 menit.',
    ],
    mode: 'SOLO',
    assignmentType: 'INSTANT_TAKE',
    requiredSkills: ['Docker', 'GitHub Actions', 'Linux', 'DevOps'],
    totalReward: 500000, // Rp 500.000
    deadlineType: 'DURATION',
    durationMinutes: 2880, // 48 jam
    status: 'OPEN',
  },
  {
    id: 'seed_task_design_006',
    title: 'Penyusunan Design System Figma & Toko Komponen',
    description:
      'Membuat library desain UI yang komprehensif mencakup color tokens, tipografi, grid system, 40+ varian tombol, input field, modal, dan dokumentasi pemakaian.',
    scope:
      'Figma Community Library / Master File, auto-layout 5.0, variables (modes light/dark), dan interactive component states.',
    deliverableGuidelines:
      'Tautan file Figma edit access, halaman panduan design tokens, dan video walkthrough interaktif.',
    acceptanceCriteria: [
      '100% komponen menggunakan Auto Layout dan responsif terhadap perubahan ukuran frame.',
      'Color tokens dan spacing menggunakan Figma Variables yang terstruktur rapi.',
      'Mencakup semua state interaktif: default, hover, focused, active, dan disabled.',
      'Memenuhi kontras warna WCAG 2.1 level AAA untuk teks dan komponen utama.',
    ],
    mode: 'SOLO',
    assignmentType: 'APPLICATION',
    requiredSkills: ['Figma', 'UI/UX', 'Design System', 'Accessibility'],
    totalReward: 800000, // Rp 800.000
    deadlineType: 'DURATION',
    durationMinutes: 5760, // 4 hari
    status: 'OPEN',
  },
  {
    id: 'seed_task_qa_007',
    title: 'Pembuatan E2E Automated Test Suite Playwright',
    description:
      'Mengembangkan script pengujian end-to-end otomatis untuk alur kritis: pendaftaran akun, login, pencarian task, klaim voucher, dan form pengajuan reward.',
    scope:
      'Playwright Test Framework, Page Object Model (POM), cross-browser testing (Chromium, Firefox, WebKit), dan pelaporan HTML.',
    deliverableGuidelines:
      'Repositori test suite, Playwright configuration, file artefak laporan HTML dan trace viewer.',
    acceptanceCriteria: [
      'Test suite mencakup minimal 5 user journey utama dengan assertion yang deterministik.',
      'Implementasi Page Object Model yang rapi dan mudah dirawat.',
      'Semua pengujian berjalan sukses secara headless dan menghasilkan trace bila terjadi kegagalan.',
      'Terintegrasi dengan mock API data untuk pengujian yang konsisten tanpa ketergantungan live backend.',
    ],
    mode: 'SOLO',
    assignmentType: 'INSTANT_TAKE',
    requiredSkills: ['Playwright', 'TypeScript', 'QA Automation', 'Testing'],
    totalReward: 550000, // Rp 550.000
    deadlineType: 'DURATION',
    durationMinutes: 2880, // 48 jam
    status: 'OPEN',
  },
  {
    id: 'seed_task_sec_008',
    title: 'Vulnerability Assessment & Penetrasi OWASP Top 10',
    description:
      'Pengujian keamanan mendalam terhadap API dan aplikasi web mencakup Broken Access Control, Injection, SSRF, IDOR, dan verifikasi validasi server-side.',
    scope:
      'Seluruh endpoint autentikasi, assignment, submission review, dan klaim ledger finansial.',
    deliverableGuidelines:
      'Laporan resmi Penetration Testing (PDF), PoC (Proof of Concept) teknis, severity rating CVSS v3.1, dan rekomendasi mitigasi.',
    acceptanceCriteria: [
      'Pengujian mencakup seluruh vektor risiko dalam OWASP Top 10 2021.',
      'Analisis mendalam pada otorisasi RBAC (Role-Based Access Control) untuk mencegah privilege escalation.',
      'Pemeriksaan integritas concurrency race condition pada operasi finansial.',
      'Rekomendasi mitigasi praktis dengan contoh perbaikan kode yang dapat langsung diterapkan.',
    ],
    mode: 'SOLO',
    assignmentType: 'APPLICATION',
    requiredSkills: ['Security', 'OWASP', 'Penetration Testing', 'Security Audit'],
    totalReward: 1200000, // Rp 1.200.000
    deadlineType: 'DURATION',
    durationMinutes: 7200, // 5 hari
    status: 'OPEN',
  },
];

const OFFICIAL_TERMS_SNAPSHOT = {
  version: 1,
  content:
    'Syarat & Ketentuan Pengerjaan Task SAKODE Academy v1:\n' +
    '1. Seluruh nominal reward merupakan integer Rupiah dan dicairkan 100% setelah lolos review.\n' +
    '2. Waktu pengerjaan mengikuti zona waktu resmi WIB (Waktu Indonesia Barat).\n' +
    '3. Dilarang keras melakukan plagiarisme atau mengunggah source code yang melanggar hak cipta.\n' +
    '4. Pengerjaan task tim mewajibkan kesepakatan pembagian konsensus 100% dari seluruh anggota.\n' +
    '5. Zero-Cron Invariant: Keterlambatan deliverable tanpa perpanjangan resmi otomatis membatalkan task.',
};

// =============================================================================
// 4. CLI Runner
// =============================================================================
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const approveMemberIdx = args.indexOf('--approve-member');

  console.log(`\n${CYAN}${BOLD}================================================================================${RESET}`);
  console.log(`${CYAN}${BOLD}       SAKODE TASK & REWARD - DATABASE SEEDING & MASTER DATA TOOL       ${RESET}`);
  console.log(`${CYAN}${BOLD}================================================================================${RESET}\n`);

  // Opsi Khusus: Approve Member Account
  if (approveMemberIdx !== -1 && args[approveMemberIdx + 1]) {
    const targetEmail = args[approveMemberIdx + 1].trim().toLowerCase();
    console.log(`${YELLOW}${BOLD}Mode Operasi: Menyetujui Akun Member (${targetEmail})${RESET}\n`);

    const db = initFirestore();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', targetEmail).get();

    if (snapshot.empty) {
      console.error(`${RED}✗ Akun dengan email "${targetEmail}" tidak ditemukan di database Firestore.${RESET}`);
      console.log(`${GRAY}Pastikan user telah mendaftar terlebih dahulu via formulir Register.${RESET}\n`);
      process.exit(1);
    }

    const doc = snapshot.docs[0];
    const userData = doc.data();

    await doc.ref.update({
      approvalStatus: 'APPROVED',
      approvedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`${GREEN}✓ BERHASIL:${RESET} Akun member "${userData.displayName || targetEmail}" (ID: ${doc.id})`);
    console.log(`  Status diubah dari "${userData.approvalStatus}" menjadi ${GREEN}${BOLD}APPROVED${RESET}.`);
    console.log(`  User kini memiliki akses penuh untuk mengambil task dan berkolaborasi!\n`);
    process.exit(0);
  }

  // Operasi Seeding Task
  if (isDryRun) {
    console.log(`${YELLOW}${BOLD}Mode Operasi: DRY-RUN (Pratinjau Data - Tidak Menulis ke Database)${RESET}\n`);
  } else {
    console.log(`${GREEN}${BOLD}Mode Operasi: LIVE SEED (Menulis ke Cloud Firestore)${RESET}\n`);
  }

  let db = null;
  if (!isDryRun) {
    try {
      db = initFirestore();
      console.log(`  ${GREEN}✓ Terhubung ke Cloud Firestore Project: ${process.env.FIREBASE_PROJECT_ID || 'sakode-task-reward'}${RESET}\n`);
    } catch (err) {
      console.error(`${RED}✗ Gagal menginisialisasi Firestore Admin: ${err.message}${RESET}\n`);
      process.exit(1);
    }
  }

  let totalRewardSum = 0;
  let seededCount = 0;

  for (const task of SEED_TASKS) {
    totalRewardSum += task.totalReward;

    const taskDocData = {
      id: task.id,
      title: task.title,
      description: task.description,
      scope: task.scope,
      deliverableGuidelines: task.deliverableGuidelines,
      acceptanceCriteria: task.acceptanceCriteria,
      mode: task.mode,
      minTeamSize: task.minTeamSize || null,
      maxTeamSize: task.maxTeamSize || null,
      assignmentType: task.assignmentType,
      requiredSkills: task.requiredSkills,
      totalReward: task.totalReward,
      deadlineType: task.deadlineType,
      fixedDeadlineAt: null,
      durationMinutes: task.durationMinutes,
      deadlineAt: null,
      status: task.status,
      assignedUserId: null,
      assignedTeamId: null,
      termsSnapshot: {
        ...OFFICIAL_TERMS_SNAPSHOT,
        capturedAt: isDryRun ? new Date().toISOString() : FieldValue.serverTimestamp(),
      },
      createdAt: isDryRun ? new Date().toISOString() : FieldValue.serverTimestamp(),
      updatedAt: isDryRun ? new Date().toISOString() : FieldValue.serverTimestamp(),
    };

    if (isDryRun) {
      console.log(`  ${CYAN}[DRY-RUN]${RESET} Task ${BOLD}${task.id}${RESET}: "${task.title}"`);
      console.log(`    Mode: ${task.mode} • Tipe: ${task.assignmentType} • Reward: Rp ${task.totalReward.toLocaleString('id-ID')}`);
      console.log(`    Skills: ${task.requiredSkills.join(', ')} • Kriteria: ${task.acceptanceCriteria.length} item`);
      seededCount++;
    } else {
      const docRef = db.collection('tasks').doc(task.id);
      await docRef.set(taskDocData, { merge: true });
      console.log(`  ${GREEN}✓ Seeding [${task.id}]:${RESET} "${task.title}" (Rp ${task.totalReward.toLocaleString('id-ID')} • ${task.mode} • ${task.assignmentType})`);
      seededCount++;
    }
  }

  console.log(`\n${CYAN}${BOLD}================================================================================${RESET}`);
  console.log(`${BOLD}RINGKASAN DATABASE SEEDING:${RESET}`);
  console.log(`Total Task Diinjeksi   : ${GREEN}${BOLD}${seededCount} Task${RESET}`);
  console.log(`Total Akumulasi Bounty : ${GREEN}${BOLD}Rp ${totalRewardSum.toLocaleString('id-ID')}${RESET}`);
  console.log(`Status Task Default    : ${GREEN}${BOLD}OPEN (Siap Diambil/Diajukan)${RESET}`);
  console.log(`Idempotency Check      : ${GREEN}${BOLD}Deterministic Doc IDs (Aman dijalankan berulang)${RESET}`);
  console.log(`${CYAN}${BOLD}================================================================================${RESET}\n`);

  if (isDryRun) {
    console.log(`${YELLOW}Pratinjau selesai. Jalankan tanpa flag --dry-run untuk menerapkan ke database.${RESET}\n`);
  } else {
    console.log(`${GREEN}${BOLD}DATABASE FIRESTORE BERHASIL DIIJNEKSI 100%!${RESET}\n`);
  }
}

main().catch((err) => {
  console.error(`\n${RED}Fatal Seeder Error: ${err.message}${RESET}`);
  process.exit(1);
});
