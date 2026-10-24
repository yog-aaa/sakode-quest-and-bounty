# PLANNING.md — Rencana Eksekusi Menyeluruh (Start to Finish)

Dokumen ini memuat peta rencana kerja menyeluruh dari awal hingga peluncuran produksi (*end-to-end plan*), mencakup 10 sprint pengembangan, pemetaan dependensi, dan matriks validasi 15 Acceptance Criteria MVP resmi SAKODE Academy.

---

## 1. Peta Jalur Eksekusi (Sprint Timeline & Dependencies)

```mermaid
gantt
    title Roadmap Eksekusi SAKODE Task & Reward Platform
    dateFormat  YYYY-MM-DD
    section Fondasi & Akses
    Sprint 0 : Fondasi & Design System SAKODE    :done, s0, 2026-10-23, 2d
    Sprint 1 : Identitas, Autentikasi & Approval :active, s1, after s0, 3d
    section Manajemen Task
    Sprint 2 : Task Management & Solo Assignment :s2, after s1, 3d
    Sprint 3 : Team Task & Roster Consensus      :s3, after s2, 3d
    section Evaluasi & Kualitas
    Sprint 4 : Submission, Upload & Review Queue :s4, after s3, 3d
    Sprint 5 : Partial Completion & Sanggahan    :s5, after s4, 2d
    section Finansial & Tata Kelola
    Sprint 6 : Finansial, Claim Solo & Team      :s6, after s5, 4d
    Sprint 7 : Laporan, Penalti & Audit Trail    :s7, after s6, 3d
    section Notifikasi & Rilis
    Sprint 8 : Notifikasi Realtime & FCM/Email   :s8, after s7, 2d
    Sprint 9 : Concurrency Test & Final QA       :s9, after s8, 3d
```

---

## 2. Rincian Sprint 0 s.d. Sprint 9

### Sprint 0: Fondasi Proyek, Konfigurasi & Design System SAKODE
* **Prasyarat**: None.
* **Skill Rujukan**: `tailwind-design-system`, `frontend-design`.
* **Deliverables**:
  * Inisialisasi Next.js 14+ / 15 (App Router), TypeScript, Tailwind CSS, Lucide Icons.
  * Setup token warna resmi SAKODE (`sakode-cyan`, `sakode-purple`, `sakode-orange`, `sakode-border`, `sakode-bg`, `sakode-card`, dll) dan font Nunito.
  * Helper `src/lib/utils.ts`: formatting IDR integer, formatting tanggal WIB, helper classes.
  * Type definition komprehensif `src/types/database.ts`.
  * Komponen UI primitif: `Button`, `Card`, `Badge`, `StatusPill`.
  * Halaman demo visual identitas SAKODE di `src/app/page.tsx`.
* **QA Gate**: `npm run build` dan `npm run lint` lolos bersih.

---

### Sprint 1: Identity, Auth & Onboarding Flow
* **Prasyarat**: Sprint 0 selesai.
* **Skill Rujukan**: `security-best-practices`, `web-design-guidelines`.
* **Deliverables**:
  * Integrasi Firebase Auth: Email/Password (dengan verifikasi email), Google Login, dan Account Linking.
  * Form pengisian profil: Nama, kontak WhatsApp/Telegram, tag skill, dan nomor rekening/e-wallet (dienkripsi AES-256).
  * Alur status user: `DRAFT` -> `PENDING_APPROVAL` -> `APPROVED` (atau `REJECTED`).
  * Antrean approval Admin: Halaman bagi admin untuk menyetujui, menolak, atau meminta revisi data pendaftar.
  * Proteksi route: Hanya user `APPROVED` yang dapat mengakses fitur operasional task.
* **QA Gate**: Uji pendaftaran email, Google login, enkripsi rekening tersimpan aman, dan admin approval berfungsi.

---

### Sprint 2: Task Management & Solo Assignment Core
* **Prasyarat**: Sprint 1 selesai.
* **Skill Rujukan**: `security-threat-model`, `frontend-design`.
* **Deliverables**:
  * Task creation wizard (Admin): Judul, scope, kriteria penerimaan, mode (Solo/Team), metode assignment (Instant Take/Application), reward IDR integer, batas waktu (Fixed atau Duration), snapshot Terms.
  * Logika **Instant Take**: Firestore transaction atomik memeriksa: `user.activeTaskId === null` dan `task.status === 'OPEN'`.
  * Logika **Application**: Maksimal 3 pending application per member. Fitur pembatalan aplikasi tanpa penalti. Auto-withdraw ketika 1 aplikasi disetujui.
  * Validasi deadline tanpa cron: Server timestamp check pada setiap aksi.
* **QA Gate**: Uji batas 1 active task & 3 application, uji deadline server-side.

---

### Sprint 3: Team Task Lifecycle, Recruitment & Roster Locking
* **Prasyarat**: Sprint 2 selesai.
* **Skill Rujukan**: `web-design-guidelines`, `animate`.
* **Deliverables**:
  * Penetapan Team Lead (pengambil pertama atau applicant terpilih).
  * Sistem undangan tim via shareable link / kode undangan.
  * Persetujuan Terms oleh semua anggota tim & kesepakatan prinsip pembagian (rata atau kontribusi).
  * Transisi status ke `Active` ketika batas minimum anggota terpenuhi dan semua anggota setuju.
  * Penguncian roster anggota tim saat task `Active`. Timer durasi dimulai pada detik ini.
* **QA Gate**: Uji tim tidak bisa aktif jika anggota belum setuju terms, uji roster terkunci.

---

### Sprint 4: Submission, Cloudinary Upload & Shared Review Queue
* **Prasyarat**: Sprint 3 selesai.
* **Skill Rujukan**: `security-best-practices`, `frontend-design`.
* **Deliverables**:
  * Form submission hasil: Catatan kerja, link deliverable, upload bukti file (JPG, PNG, WebP, PDF max 10MB) via Cloudinary signed upload.
  * Shared Review Queue Admin dengan **Atomic Review Locking** (kunci 15 menit agar 2 admin tidak bertabrakan).
  * Opsi evaluasi Admin: Setujui, Minta Revisi (dengan batas waktu revisi), Beri Perpanjangan Waktu Manual (dengan alasan wajib), Tolak.
* **QA Gate**: Uji signed upload Cloudinary, pencegahan tabrakan review dua admin.

---

### Sprint 5: Partial Completion, Linked Continuation Task & One-Time Appeal
* **Prasyarat**: Sprint 4 selesai.
* **Skill Rujukan**: `security-threat-model`.
* **Deliverables**:
  * Fitur **Partial Completion**: Admin menetapkan porsi diterima, porsi tersisa, nilai nominal reward parsial, dan alasan.
  * Otomatis melahirkan **Continuation Task** yang tertaut (`parentTaskId`) dengan sisa bounty.
  * Fitur **Sanggahan (1x Appeal)**: Member/tim mengajukan bukti baru; sistem mengalihkan review ke Admin lain (bukan admin pertama). Penahanan reward selama appeal.
* **QA Gate**: Uji nominal partial + continuation tidak melebihi bounty awal, uji appeal hanya bisa 1x dan ditinjau admin berbeda.

---

### Sprint 6: Financial Ledger, Solo Claim & Team 100% Consensus Distribution
* **Prasyarat**: Sprint 5 selesai.
* **Skill Rujukan**: `security-best-practices`.
* **Deliverables**:
  * Pembuatan dokumen `rewardLedgers` saat task disetujui.
  * Fitur **Solo Claim**: Pilihan satuan atau `Claim All` (batch), snapshot rekening tersimpan di dokumen claim, status berjenjang (`Available` -> `Claimed` -> `Processing` -> `Paid` -> `Confirmed`).
  * Idempotency key pada setiap pembayaran admin untuk mencegah transfer ganda.
  * **Distribusi Tim**:
    1. Team Lead mengajukan proposal alokasi nominal final.
    2. Konsensus 100% wajib dicapai (seluruh anggota setuju).
    3. Admin mentransfer 1 kali ke rekening Team Lead.
    4. Team Lead mentransfer ke masing-masing anggota dan mengunggah bukti per anggota.
    5. Seluruh anggota mengonfirmasi penerimaan -> Task status `Closed`.
* **QA Gate**: Uji konsensus tim (1 penolakan menggagalkan proposal), uji idempotency pencegahan pembayaran ganda.

---

### Sprint 7: Conflict-of-Interest Reports, Progressive Penalties & Append-Only Audit Trail
* **Prasyarat**: Sprint 6 selesai.
* **Skill Rujukan**: `security-threat-model`.
* **Deliverables**:
  * Form Report terhubung ke Task/Claim/Distribution dengan upload bukti.
  * Penegakan **Conflict of Interest**: Admin yang terlibat dilarang memproses laporannya sendiri; laporan terkait admin otomatis ditangani Super Admin.
  * Sistem Penalti Progresif: Rekomendasi otomatis (Warning, Cooldown, Team-only, Disallow Lead, Suspend). Admin override wajib mencantumkan alasan.
  * Koleksi `auditEvents` yang *append-only* (mencatat aktor, aksi, before/after, timestamp, alasan).
* **QA Gate**: Uji admin tidak bisa review laporannya sendiri, uji audit log append-only.

---

### Sprint 8: Realtime In-App Notification Center, FCM & Email Adapter
* **Prasyarat**: Sprint 7 selesai.
* **Skill Rujukan**: `web-design-guidelines`.
* **Deliverables**:
  * Realtime notification inbox di Firestore (read/unread, filter kategori, badge lonceng).
  * Web Push Notification via Firebase Cloud Messaging (FCM).
  * Decoupled Email Provider Adapter (Resend / SendGrid / Nodemailer) untuk kejadian krusial (approval akun, deadline, status transfer).
  * Arsitektur non-blocking: Kegagalan push/email tidak membatalkan mutasi transaksi utama.
* **QA Gate**: Uji notifikasi realtime muncul tanpa delay, uji transaksi tetap sukses meskipun adapter email disimulasikan gagal.

---

### Sprint 9: Quality Gate, Concurrency Tests & Final MVP Sign-Off
* **Prasyarat**: Seluruh sprint 0-8 selesai.
* **Skill Rujukan**: `web-design-guidelines`, `security-best-practices`.
* **Deliverables**:
  * Concurrency test suite: Dua member mengambil Instant Take bersamaan, dua admin mereview submission bersamaan, double claim pada reward yang sama.
  * Audit Firestore Security Rules.
  * Audit aksesibilitas (kontras warna, navigasi keyboard, responsivitas ponsel, tablet, desktop).
  * UAT simulasi operasional lengkap 4 Admin dan 20 Member.
* **QA Gate**: Lulus seluruh 15 Kriteria Penerimaan MVP resmi SAKODE.

---

## 3. Matriks 15 Acceptance Criteria MVP (Halaman 16 Spesifikasi)

| No | Kriteria Penerimaan MVP Resmi | Sprint Pemenuhan | Metode Verifikasi QA |
|---|---|---|---|
| **1** | Pengguna dapat mendaftar, verifikasi email, login Google, menautkan akun, menunggu approval. | **Sprint 1** | E2E Auth test & verifikasi state profile di Firestore. |
| **2** | Super Admin dapat mengelola Admin; Admin dapat mengelola Member. | **Sprint 1, 7** | Role checking & RBAC middleware test. |
| **3** | Admin dapat membuat semua kombinasi task yang disepakati. | **Sprint 2** | Pengujian form task wizard dengan seluruh variasi kombinasi. |
| **4** | Sistem menegakkan 1 Active Task dan maksimal 3 Application. | **Sprint 2** | Transaksi Firestore unit test & simultaneous request test. |
| **5** | Solo dan Team Task dapat berjalan sampai submission dan review. | **Sprint 2, 3, 4** | E2E scenario dari Open hingga Approved/Revision. |
| **6** | Team recruitment, Terms consent, roster locking, dan reward consensus berfungsi. | **Sprint 3, 6** | Uji alur tim dari undangan hingga konsensus 100%. |
| **7** | Revision, Partial Completion, continuation task, dan 1 appeal berfungsi. | **Sprint 4, 5** | Skenario review parsial & appeal ke admin sekunder. |
| **8** | Solo reward dapat dikumpulkan dan diclaim dalam batch. | **Sprint 6** | Uji `Claim All` multi-item reward dalam satu claim snapshot. |
| **9** | Team reward dibayar sekali ke Team Lead lalu dibuktikan per anggota. | **Sprint 6** | Uji upload bukti per anggota & konfirmasi penerimaan. |
| **10** | Report dan penalti dapat diproses dengan conflict-of-interest rule. | **Sprint 7** | Uji isolasi review report bagi admin yang bersangkutan. |
| **11** | Semua aksi sensitif tercatat di audit trail. | **Sprint 7** | Verifikasi append-only log pada mutasi status dan finansial. |
| **12** | In-app notification realtime dan event-based FCM/email berfungsi non-blocking. | **Sprint 8** | Uji realtime listener dan simulasi fallback kegagalan external. |
| **13** | File evidence hanya dapat diakses pihak yang berwenang. | **Sprint 4** | Verifikasi authenticated/signed URL Cloudinary. |
| **14** | Seluruh alur kritis lulus unit, integration, concurrency, dan end-to-end test. | **Sprint 9** | Automated test suite run dengan status 100% pass. |
| **15** | Aplikasi nyaman digunakan pada HP dan desktop serta mengikuti identitas visual SAKODE. | **Sprint 0, 9** | Audit visual token SAKODE & responsivitas layar HP/Desktop. |
