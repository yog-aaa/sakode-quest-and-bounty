# PROMPT EKSEKUSI TAHAP 1: SPRINT 0 - FONDASI PROYEK & DESIGN SYSTEM SAKODE

> **Instruksi untuk User**: Salin seluruh teks prompt di bawah ini dan berikan langsung kepada Agent Programmer (Coder Agent) Anda.

---

```markdown
### TUGAS EKSEKUSI: SPRINT 0 - FONDASI PROYEK & DESIGN SYSTEM SAKODE

Halo Coder Agent! Anda ditugaskan untuk menginisialisasi fondasi proyek **SAKODE Task & Reward Platform** sesuai dengan spesifikasi resmi SAKODE Academy.

Sebelum menulis kode, Anda **DIHARUSKAN** membaca dan mematuhi dokumen berikut yang ada di repositori:
1. `AGENTS.md` (Pedoman kolaborasi dan strict invariants)
2. `DESIGN.md` (Spesifikasi visual dan token desain resmi SAKODE)
3. `ARCHITECTURE.md` (Arsitektur modul dan skema database)
4. `PLANNING.md` (Roadmap dan 15 Kriteria Penerimaan MVP)

Selain itu, baca panduan skill lokal yang relevan di:
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\frontend-design\SKILL.md` (Desain antarmuka berkualitas tinggi, anti-AI slop, sentuhan estetika SAKODE)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\tailwind-design-system\SKILL.md` (Konfigurasi Tailwind CSS dan token semantik)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md` (Aksesibilitas dan responsivitas mobile-first)

---

#### 1. Tujuan Sprint 0
Membangun fondasi aplikasi Next.js (App Router) + TypeScript + Tailwind CSS yang bersih, terstruktur modular, serta mengonfigurasi Design System & Tokens resmi SAKODE, type definitions Firestore, helper utilitas, dan stub konfigurasi Firebase.

---

#### 2. Spesifikasi Teknis & Berkas yang Dibuat

1. **Inisialisasi Project**:
   - Gunakan **Next.js 14+ / 15** dengan **App Router**, **TypeScript**, dan **Tailwind CSS**.
   - Pasang icon library **lucide-react** dan class merger utility **clsx** + **tailwind-merge**.
   - Konfigurasi Font Google: **Nunito** sebagai font default aplikasi di `src/app/layout.tsx`.

2. **Konfigurasi Design Tokens SAKODE di `tailwind.config.ts` (atau `@theme` CSS jika Tailwind v4)**:
   - Warna resmi:
     - `sakode-text`: `#172033` (Teks utama)
     - `sakode-text-muted`: `#64748B` (Teks sekunder)
     - `sakode-cyan`: `#71CFFE` (Warna primer SAKODE)
     - `sakode-purple`: `#BC71FE` (Aksen tim / kolaborasi)
     - `sakode-orange`: `#F9723B` (Deadline, peringatan, aksi kritis)
     - `sakode-border`: `#DBE8F0` (Border tipis)
     - `sakode-bg`: `#F7FBFE` (Background default kanvas)
     - `sakode-card`: `#FFFFFF` (Background card / panel)
   - Border radius default: `8px` (`0.5rem`)
   - Spacing: Mendukung skala 4, 8, 12, 16, 20, 24, 32, 40, 56, 64px.

3. **Struktur Direktori Proyek**:
   Susun direktori modular di bawah `src/`:
   ```
   src/
   ├── app/
   │   ├── (auth)/
   │   ├── (dashboard)/
   │   │   ├── admin/
   │   │   └── member/
   │   ├── layout.tsx
   │   ├── page.tsx
   │   └── globals.css
   ├── components/
   │   ├── layout/
   │   │   ├── Navbar.tsx
   │   │   └── MobileNav.tsx
   │   └── ui/
   │       ├── Button.tsx
   │       ├── Card.tsx
   │       ├── Badge.tsx
   │       └── StatusPill.tsx
   ├── lib/
   │   ├── firebase/
   │   │   ├── client.ts        // Inisialisasi Firebase Client SDK
   │   │   └── admin.ts         // Inisialisasi Firebase Admin SDK (lazy / safe)
   │   ├── utils.ts             // Helper (formatCurrencyIDR, formatDateWIB, cn)
   │   └── constants.ts         // Roles, TaskStatus, ClaimStatus, dll
   ├── types/
   │   ├── database.ts          // TypeScript interfaces untuk seluruh koleksi Firestore
   │   └── auth.ts
   └── server/                  // Server Actions & Services
   ```

4. **Konfigurasi Lingkungan (`.env.example`)**:
   Sediakan file `.env.example` dengan variabel Firebase, Cloudinary, dan URL aplikasi.

5. **Type Definitions Awal (`src/types/database.ts`)**:
   Definisikan interface TypeScript yang ketat untuk seluruh entitas Firestore yang ada di `ARCHITECTURE.md`:
   - `UserDocument`, `TaskDocument`, `ApplicationDocument`, `TeamDocument`, `TeamMembershipDocument`, `SubmissionDocument`, `RewardLedgerDocument`, `ClaimDocument`, `TeamDistributionDocument`, `ReportDocument`, `PenaltyDocument`, `NotificationDocument`, `AuditEventDocument`.
   - Invariant: Seluruh nominal uang adalah `number` (integer Rupiah).

6. **Helper Utilitas (`src/lib/utils.ts`)**:
   - `formatCurrencyIDR(amount: number): string` -> format Rp xxx.xxx (tanpa desimal).
   - `formatDateWIB(date: Date | string | number): string` -> format tanggal & jam dalam zona waktu `Asia/Jakarta`.
   - `cn(...inputs: ClassValue[])` -> utility penggabung class Tailwind.

7. **Komponen UI Primitif SAKODE (`src/components/ui/`)**:
   - `Button`: Mendukung variant primer (`sakode-cyan`), tim (`sakode-purple`), bahaya/deadline (`sakode-orange`), outline dengan border `#DBE8F0`, dan secondary.
   - `Card`: Menggunakan background `#FFFFFF`, border `#DBE8F0`, shadow ringan, dan border-radius `8px`.
   - `StatusPill`: Menampilkan status task/reward dengan indikator warna + teks Bahasa Indonesia yang eksplisit + ikon Lucide yang sesuai (lihat tabel di `DESIGN.md`).
   - Halaman `src/app/page.tsx`: Halaman selamat datang yang menampilkan demo visual token SAKODE (warna, tombol, badge status, card, dan layout responsif).

---

#### 3. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Proyek Next.js + TypeScript + Tailwind berhasil diinisialisasi dan dapat dijalankan tanpa crash.
- [ ] Palet warna resmi SAKODE, font Nunito, dan radius 8px terkonfigurasi dengan benar.
- [ ] `src/lib/utils.ts` memiliki helper format mata uang IDR integer dan format tanggal WIB.
- [ ] `src/types/database.ts` memuat interface komprehensif seluruh koleksi Firestore sesuai `ARCHITECTURE.md`.
- [ ] Komponen UI primitif (`Button`, `Card`, `StatusPill`) terimplementasi rapi dan responsif mobile-first.
- [ ] `npm run build` dan `npm run lint` berjalan sukses tanpa error TypeScript maupun ESLint.

---

#### 4. Format Laporan Penyerahan Tugas (Wajib Mengikuti Format Ini)
Setelah selesai mengeksekusi, kirimkan ringkasan hasil kerja Anda dengan format:

```markdown
### [RINGKASAN PEKERJAAN: SPRINT-0]

#### 1. Implementasi yang Dilakukan
- <Penjelasan implementasi>

#### 2. Skill AGENT-SKILLS yang Digunakan
- `<nama-skill>`: <Bagaimana panduan diterapkan pada kode>

#### 3. Berkas yang Dibuat / Dimodifikasi
- [path/to/file.ts](file:///...) - <Keterangan berkas>

#### 4. Hasil Verifikasi Mandiri (Self-Check)
- `npm run build`: [Lolos / Gagal]
- `npm run lint` / Typecheck: [Lolos / Gagal]
- Tampilan Responsif (Mobile & Desktop): [Lolos]

#### 5. Checklist Acceptance Criteria
- [x] Kriteria 1
- [x] Kriteria 2
- [x] Kriteria 3

#### 6. Catatan Teknis untuk QA
- <Catatan teknis>
```
```
