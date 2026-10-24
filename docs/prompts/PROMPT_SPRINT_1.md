# PROMPT EKSEKUSI TAHAP 2: SPRINT 1 - IDENTITY, AUTH & ONBOARDING FLOW

> **Instruksi untuk User**: Salin seluruh teks prompt di bawah ini dan berikan langsung kepada Agent Programmer (Coder Agent) Anda.

---

```markdown
### TUGAS EKSEKUSI: SPRINT 1 - IDENTITY, AUTH & ONBOARDING FLOW

Halo Coder Agent! Hasil Sprint 0 telah diverifikasi dan dinyatakan **APPROVED** oleh Orchestrator / QA.
Sekarang saatnya mengeksekusi **Sprint 1: Identity, Auth & Onboarding Flow** pada repositori `sakode-task-reward`.

Sebelum menulis kode, Anda **DIHARUSKAN** membaca dan mematuhi:
1. `AGENTS.md` (Strict Invariants & Protokol Tektokan)
2. `DESIGN.md` (Komponen UI & Form styling SAKODE)
3. `ARCHITECTURE.md` (Modul Identity & Access, Skema users, Enkripsi Rekening)
4. `PLANNING.md` (Sprint 1 Deliverables & Kriteria Penerimaan MVP No. 1 & 2)

Wajib terapkan panduan dari Local Agent Skills di:
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md` (Enkripsi AES-256-GCM data perbankan, validasi server-side Zod, proteksi RBAC)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-threat-model\SKILL.md` (Pencegahan privilege escalation, auth state consistency)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md` (Aksesibilitas form, auto-complete, touch target, pesan error ramah pengguna)

---

#### 1. Tujuan Sprint 1
Membangun siklus lengkap onboarding akun:
`Daftar / Login -> Verifikasi Identitas (Email/Google) -> Lengkapi Profil (Enkripsi Rekening) -> Status Menunggu Approval -> Persetujuan Admin (Active/Approved)`.

---

#### 2. Spesifikasi Teknis & Berkas yang Dibuat

1. **Utility Kriptografi & Enkripsi Rekening (`src/lib/crypto.ts`)**:
   - Implementasikan fungsi enkripsi & dekripsi menggunakan **AES-256-GCM**:
     - `encryptData(plaintext: string): string`
     - `decryptData(ciphertext: string): string`
     - Gunakan secret key dari `process.env.ENCRYPTION_SECRET_KEY` (dengan fallback 32-byte key aman untuk dev/test).
   - Fungsi pembantu masking data rekening (`maskAccountNumber` di `src/lib/utils.ts`):
     - Format: `Bank BCA •••• 5678 a.n J*** D**`.

2. **Skema Validasi Input Zod (`src/lib/validations/auth.ts`)**:
   - `registerSchema`: Email valid, password minimal 8 karakter (kombinasi huruf & angka).
   - `loginSchema`: Email & password.
   - `profileCompletionSchema`:
     - `displayName`: string (min 3, max 60).
     - `contactNumber`: string nomor WhatsApp/Telegram valid (format Indonesia: 08xxx atau +62xxx).
     - `skills`: array of string (minimal 1 skill tag).
     - `bankName`: pilihan bank/e-wallet (BCA, Mandiri, BNI, BRI, BSI, GoPay, OVO, DANA).
     - `accountNumber`: string angka rekening (min 5, max 25).
     - `accountHolderName`: string nama pemilik sesuai buku tabungan/e-wallet.

3. **Backend Authentication & User Services (`src/server/services/auth.service.ts` & `src/server/services/user.service.ts`)**:
   - Sinkronisasi Firebase Auth UID ke dokumen Firestore `users/{uid}`.
   - Status approval alur akun:
     - Member baru mendaftar: `approvalStatus = 'PENDING'` setelah melengkapi profil.
     - Role default: `'MEMBER'`.
     - Data rekening disimpan dalam bentuk `paymentAccountEncrypted` dan `paymentAccountMasked`.
   - Pencegahan pemisahan histori (Account Linking):
     - Logika penautan akun Google ke email/password dengan autentikasi ulang (re-auth).
     - Satu profil SAKODE memiliki 1 Firebase UID utama.
   - Layanan Admin Approval (`approveUser`, `rejectUser`, `requestProfileRevision`):
     - Hanya dapat dipanggil oleh user ber-role `'ADMIN'` atau `'SUPER_ADMIN'`.
     - Mencatat audit event pada koleksi `auditEvents`.

4. **Halaman & Antarmuka UI (App Router)**:
   - **`/login` & `/register` (`src/app/(auth)/...`)**:
     - Tab beralih antara Masuk dan Daftar.
     - Tombol "Masuk dengan Google" (Google OAuth popup/redirect).
     - Form email/password dengan validasi interaktif dan pesan error dalam Bahasa Indonesia.
     - Banner verifikasi email jika email belum diverifikasi.
   - **`/onboarding` (`src/app/(auth)/onboarding/page.tsx`)**:
     - Form pengisian kelengkapan profil bagi akun yang baru mendaftar.
     - Input data perbankan/e-wallet dengan penjelasan privasi & keamanan.
     - Notifikasi konfirmasi berhasil kirim data: berpindah ke status `PENDING_APPROVAL`.
   - **Status Akun Menunggu / Ditolak**:
     - Halaman status interaktif jika user `PENDING`: "Akun Anda Sedang Ditinjau Admin SAKODE".
     - Halaman status jika user `REJECTED`: Alasan penolakan dan tombol untuk memperbaiki profil.
   - **Admin Approval Queue (`src/app/(dashboard)/admin/members/page.tsx`)**:
     - Antrean daftar member berstatus `PENDING`.
     - Kartu verifikasi member: nama, email, kontak, tag skill, dan rekening yang dapat di-unmask secara aman oleh Admin.
     - Tombol aksi: **"Setujui Member"** (`APPROVED`), **"Minta Perbaikan"**, dan **"Tolak"** (dengan modal input alasan).

5. **Auth Context / Guard (`src/context/AuthContext.tsx` atau Server Auth Middleware)**:
   - Menyediakan state user aktif, profil Firestore, role, dan approval status secara reaktif.
   - Proteksi rute:
     - Member belum `APPROVED` tidak dapat mengakses halaman pengerjaan task.
     - User non-admin tidak dapat mengakses rute `/admin/*` (tampilkan 403 Forbidden SAKODE).

---

#### 3. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Pengguna dapat mendaftar dengan email/password dan melihat instruksi verifikasi email.
- [ ] Pengguna dapat masuk menggunakan Google Login.
- [ ] Tersedia form onboarding profil lengkap (nama, kontak, skill tags, info bank/e-wallet).
- [ ] Data rekening tersimpan terenkripsi (AES-256) di Firestore dan di-mask pada tampilan antarmuka.
- [ ] Admin memiliki panel antrean anggota untuk menyetujui, menolak, atau meminta perbaikan data pendaftar.
- [ ] Member yang disetujui berubah statusnya menjadi `APPROVED` dan mendapatkan akses penuh ke platform.
- [ ] Rute admin terlindungi secara ketat dari akses user biasa.
- [ ] `npm run build` dan `npm run lint` lolos 100% tanpa error TypeScript maupun ESLint.

---

#### 4. Format Laporan Penyerahan Tugas
Kirimkan ringkasan penyelesaian pekerjaan dengan format standar:

```markdown
### [RINGKASAN PEKERJAAN: SPRINT-1]

#### 1. Implementasi yang Dilakukan
- <Penjelasan implementasi fitur auth, enkripsi, dan approval queue>

#### 2. Skill AGENT-SKILLS yang Digunakan
- `<nama-skill>`: <Penerapan panduan pada kode>

#### 3. Berkas yang Dibuat / Dimodifikasi
- [path/to/file.ts](file:///...) - <Keterangan berkas>

#### 4. Hasil Verifikasi Mandiri (Self-Check)
- `npm run build`: [Lolos / Gagal]
- `npm run lint` / Typecheck: [Lolos / Gagal]
- Uji Alur: Register -> Onboarding -> Admin Approval -> Approved: [Lolos]

#### 5. Checklist Acceptance Criteria
- [x] Kriteria 1
- [x] Kriteria 2
...

#### 6. Catatan Teknis untuk QA
- <Catatan teknis env, kunci enkripsi, dsb>
```
```
