# PROMPT EKSEKUSI TAHAP 3: SPRINT 2 - TASK MANAGEMENT & SOLO ASSIGNMENT CORE

> **Instruksi untuk User**: Salin seluruh teks prompt di bawah ini dan berikan langsung kepada Agent Programmer (Coder Agent) Anda.

---

```markdown
### TUGAS EKSEKUSI: SPRINT 2 - TASK MANAGEMENT & SOLO ASSIGNMENT CORE

Halo Coder Agent! Hasil Sprint 1 telah diverifikasi dan dinyatakan **APPROVED** oleh Orchestrator / QA.
Sekarang saatnya mengeksekusi **Sprint 2: Task Management & Solo Assignment Core** pada repositori `sakode-task-reward`.

Sebelum menulis kode, Anda **DIHARUSKAN** membaca dan mematuhi:
1. `AGENTS.md` (Strict Invariants & Protokol Tektokan)
2. `DESIGN.md` (Spesifikasi visual kartu task, status pill, palet warna SAKODE)
3. `ARCHITECTURE.md` (Modul Task & Assignment, Skema tasks & applications, Transaksi Atomik)
4. `PLANNING.md` (Sprint 2 Deliverables & Kriteria Penerimaan MVP No. 3, 4, 5)

Wajib terapkan panduan dari Local Agent Skills di:
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md` (Transaksi atomik Firestore runTransaction, validasi Zod server-side)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-threat-model\SKILL.md` (Integritas concurrency, penegakan batas 1 active task & 3 pending applications)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\frontend-design\SKILL.md` (Kartu task bernuansa bounty RPG profesional, no AI slop, layout hierarkis)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md` (Aksesibilitas form, countdown waktu nyata, touch target min 44px)

---

#### 1. Tujuan Sprint 2
Membangun mesin utama Task & Solo Assignment:
1. Admin dapat membuat, menyusun draf, dan menerbitkan task (Solo/Team, Instant Take/Application, Fixed/Duration deadline, reward Integer IDR, snapshot Terms).
2. Member yang disetujui (APPROVED) dapat menjelajahi task yang tersedia (Available Tasks).
3. Penegakan transaksi atomik **Instant Take** (aturan mutlak: 1 Member hanya boleh memiliki maksimal 1 Active Task).
4. Penegakan sistem **Application** (maksimal 3 pending application per member, pembatalan tanpa penalti, dan auto-withdraw aplikasi lain ketika 1 aplikasi terpilih).
5. Validasi batas waktu di server (**Zero-Cron Invariant** berbasis Server Timestamp).
6. Tampilan Hero **Active Task** pada Dashboard Member dengan countdown waktu nyata.

---

#### 2. Spesifikasi Teknis & Berkas yang Dibuat

1. **Skema Validasi Input Zod (`src/lib/validations/task.ts`)**:
   - `createTaskSchema`:
     - `title`: string (min 5, max 120).
     - `description`: string (min 20).
     - `scope`: string (lingkup pekerjaan).
     - `deliverableGuidelines`: string (panduan hasil yang diharapkan).
     - `acceptanceCriteria`: array of string (minimal 1 kriteria).
     - `mode`: `'SOLO' | 'TEAM'`.
     - `assignmentType`: `'INSTANT_TAKE' | 'APPLICATION'`.
     - `requiredSkills`: array of string.
     - `totalReward`: number integer Rupiah positif (min Rp 10.000, kelipatan 1.000).
     - `deadlineType`: `'FIXED' | 'DURATION'`.
     - `fixedDeadline`: tanggal/jam ISO string (jika deadlineType === FIXED).
     - `durationMinutes`: number integer menit (jika deadlineType === DURATION).
     - `termsContent`: string (isi Terms & Conditions yang akan di-snapshot).
     - `status`: `'DRAFT' | 'OPEN'`.
   - `applyTaskSchema`:
     - `taskId`: string.
     - `message`: string (catatan kesiapan / perkenalan, min 10 karakter).
     - `portfolioLinks`: array of URL string (opsional).

2. **Backend Services & Firestore Transactions**:
   - **`src/server/services/task.service.ts`**:
     - `createTask(adminUid, input)`: Menyimpan task baru dengan snapshot terms `{ version: 1, content, capturedAt }`. Mencatat event `TASK_CREATED` di `auditEvents`.
     - `publishTask(adminUid, taskId)`: Mengubah status dari `DRAFT` menjadi `OPEN`.
     - `getAvailableTasks(userProfile)`: Mengambil task berstatus `OPEN` (difilter berdasarkan kualifikasi).
     - `getTaskDetail(taskId)`: Mengambil rincian task lengkap beserta snapshot terms.
     - `getActiveTaskForUser(userId)`: Mengambil task aktif yang sedang dipegang pengguna (jika ada).
     - `checkAndEnforceDeadline(task)`: Fungsi utilitas server untuk mengecek apakah `now > task.deadlineAt`.
   - **`src/server/services/assignment.service.ts`**:
     - `instantTakeTask(userId, taskId, agreedTermsVersion)`:
       - **WAJIB** menggunakan `firestore.runTransaction()`.
       - Memeriksa user `approvalStatus === 'APPROVED'`.
       - Memeriksa user `activeTaskId === null` (Jika sudah ada, lempar error: "Member sedang memiliki task aktif yang belum selesai").
       - Memeriksa task `status === 'OPEN'` dan `assignmentType === 'INSTANT_TAKE'`.
       - Menghitung `deadlineAt` (jika duration: `now + durationMinutes`, jika fixed: `task.fixedDeadlineAt`).
       - Memperbarui task (`status = 'ACTIVE'`, `assignedUserId = userId`, `deadlineAt`).
       - Memperbarui user (`activeTaskId = taskId`).
       - Mencatat event `TASK_TAKEN_INSTANT` di `auditEvents`.
     - `submitApplication(userId, input)`:
       - Memeriksa user `pendingApplicationCount < 3`.
       - Membuat dokumen di koleksi `applications` dengan status `PENDING`.
       - Menambah `user.pendingApplicationCount` secara atomik.
     - `withdrawApplication(userId, applicationId)`:
       - Memeriksa kepemilikan aplikasi dan status masih `PENDING`.
       - Mengubah status aplikasi menjadi `WITHDRAWN`.
       - Mengurangi `user.pendingApplicationCount`.
     - `selectApplicant(adminUid, taskId, applicationId)`:
       - **WAJIB** menggunakan `firestore.runTransaction()`.
       - Memverifikasi hak admin.
       - Mengambil data applicant. Verifikasi applicant belum memiliki `activeTaskId`.
       - Menetapkan task ke applicant (`status = 'ACTIVE'`, `assignedUserId = applicantUid`).
       - Mengubah status aplikasi terpilih menjadi `ACCEPTED`.
       - **Auto-withdraw**: Menarik seluruh aplikasi pending lain milik member tersebut (`status = 'WITHDRAWN'`), dan me-reset `pendingApplicationCount` = 0.
       - Mengubah aplikasi pendaftar lain pada task ini menjadi `REJECTED`.
       - Memperbarui user applicant (`activeTaskId = taskId`).
       - Mencatat event `TASK_APPLICANT_SELECTED` di `auditEvents`.

3. **Server Actions (`src/server/actions/task.actions.ts` & `src/server/actions/assignment.actions.ts`)**:
   - Server Actions Next.js App Router yang aman untuk Client Components.

4. **Halaman & Antarmuka UI (App Router)**:
   - **Admin Task Management (`src/app/(dashboard)/admin/tasks/page.tsx` & `/create/page.tsx`)**:
     - Form wizard pembuatan task lengkap dengan preview bounty card waktu nyata.
     - Pemilihan mode (Solo/Team), tipe assignment, setting deadline, dan input kriteria bertahap.
     - Daftar manajemen task admin (Draf, Open, Active, dsb.).
     - Panel Review Applicant: Antrean pendaftar pada task bertipe Application dengan tombol **"Pilih Applicant"**.
   - **Eksplorasi Task Member (`src/app/(dashboard)/member/tasks/page.tsx` & `/tasks/[id]/page.tsx`)**:
     - Daftar kartu task (*Bounty Cards*) berstatus `OPEN` dengan filter (Solo/Team, Instant Take/Application).
     - Halaman detail task: Rincian scope, deliverable, kriteria penerimaan, nominal bounty, dan kotak persetujuan Terms & Conditions.
     - Tombol aksi kontekstual:
       - Jika Instant Take: Tombol **"Ambil Task Sekarang"** (dengan konfirmasi modal persetujuan Terms).
       - Jika Application: Tombol **"Kirim Application"** (membuka modal input pesan motivasi & link portofolio).
       - Jika member sudah memegang 1 Active Task: Tombol di-disable dengan tooltip informatif "Anda sedang memegang 1 Active Task".
       - Jika pendaftar sudah memiliki 3 aplikasi pending: Form aplikasi di-disable dengan pesan batas kuota.
   - **Dashboard Member (`src/app/(dashboard)/member/page.tsx`)**:
     - Jika member memiliki `activeTaskId`: Tampilkan **Hero Active Task Card** yang dominan di bagian atas dashboard dengan countdown timer waktu nyata (berkedip/oranye jika sisa waktu < 24 jam), rincian kriteria, dan tombol "Kirim Hasil".
     - Tab Aplikasi Saya: Menampilkan daftar kartu aplikasi yang sedang diajukan (Pending) beserta tombol "Batalkan Aplikasi".

---

#### 3. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Admin dapat membuat task baru (Solo/Team, Instant Take/Application, Fixed/Duration deadline) dan menyimpannya sebagai Draf atau langsung Diterbitkan (Open).
- [ ] Member yang disetujui (APPROVED) dapat melihat daftar task yang tersedia di halaman eksplorasi.
- [ ] Sistem menegakkan aturan batas: Member dengan 1 Active Task tidak dapat mengambil task lain.
- [ ] Transaksi Firestore Instant Take mencegah perebutan slot oleh dua member secara bersamaan (*concurrency safe*).
- [ ] Sistem membatasi maksimal 3 Pending Application per member, dan member dapat membatalkan aplikasi pending tanpa penalti.
- [ ] Saat Admin memilih 1 applicant, aplikasi lain milik member tersebut otomatis ditarik (auto-withdrawn) tanpa penalti, dan task menjadi Active miliknya.
- [ ] Countdown batas waktu deadline ditampilkan akurat di antarmuka member dan divalidasi di server.
- [ ] `npm run build` dan `npm run lint` lolos 100% tanpa error TypeScript maupun ESLint.

---

#### 4. Format Laporan Penyerahan Tugas
Kirimkan ringkasan hasil kerja sesuai format standar di `AGENTS.md`.
```
