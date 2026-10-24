# DESIGN.md — Spesifikasi Sistem Desain SAKODE

Dokumen ini mendefinisikan panduan visual, token desain, komponen UI, dan pola interaksi untuk **SAKODE Task & Reward Platform** sesuai dengan dokumen spesifikasi resmi dan standar keunggulan dari skill `frontend-design` dan `tailwind-design-system`.

---

## 1. Identitas & Filosofi Desain

* **Prinsip Utama**: *"Profesional, transparan, dan tetap terasa berbeda."*
* **Referensi Estetika**: Menggabungkan struktur efisien dashboard **SIMADEP** dengan kelincahan pola interaksi **QR Code Generator SAKODE**.
* **Sentuhan Anime & RPG Halus**:
  * Progres tugas terasa seperti petualangan terstruktur (*quest progression*).
  * Kartu task menampilkan *bounty reward*, tingkat kesulitan, dan kualifikasi skill.
  * Fitur tim mengadopsi dinamika *party collaboration* dengan peran Team Lead dan konsensus pembagian honor yang transparan.
  * **Batasan**: Bahasa tetap profesional dunia IT (misal: "Task", "Team", "Reward", "Deadline", "Application", "Team Lead"). Dilarang menggunakan istilah fantasi kekanak-kanakan (tidak ada XP, level game, guild, atau rank sihir).

---

## 2. Design Tokens (Spesifikasi Resmi)

### A. Palet Warna (Color Palette)

| Token Name | Hex Code | Peruntukan Utama |
|---|---|---|
| `sakode-text` | `#172033` | Teks judul, label utama, dan body teks primer (kontras tinggi). |
| `sakode-text-muted` | `#64748B` | Teks sekunder, metadata tanggal, helper text, dan border non-aktif. |
| `sakode-cyan` | `#71CFFE` | **Warna Identitas Primer SAKODE**: CTA utama, status Open, link aktif, progress bar utama. |
| `sakode-purple` | `#BC71FE` | **Aksen Kolaborasi & Tim**: Status Recruiting, badge tim, fitur persetujuan split reward. |
| `sakode-orange` | `#F9723B` | **Aksen Kritis & Waktu**: Status Revision, peringatan deadline, pesan penalti, tombol bahaya. |
| `sakode-border` | `#DBE8F0` | Garis tepi card, pembatas tabel, divider, dan outline button. |
| `sakode-bg` | `#F7FBFE` | Latar belakang default kanvas web (light theme). |
| `sakode-card` | `#FFFFFF` | Latar belakang permukaan card, popover, dialog modal. |

### B. Tipografi (Typography)
* **Font Family**: `Nunito`, sans-serif (Google Fonts).
* **Font Weights**:
  * Regular (`400`): Body text, deskripsi deliverable, catatan review.
  * SemiBold (`600`): Label input, subjudul card, nama member, nilai mata uang.
  * Bold (`700`): Judul halaman, bounty reward, status badge.
  * ExtraBold (`800`): Heading utama hero dan statistik ringkasan.

### C. Spacing Scale & Radius
* **Border Radius**: Default **`8px`** (`rounded-lg` pada Tailwind) untuk seluruh tombol, kartu, input, dan modal.
* **Skala Spacing Standar**: `4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `40px`, `56px`, `64px`.
* **Shadows**: Halus dan natural:
  * Card: `0 1px 3px 0 rgba(23, 32, 51, 0.05), 0 1px 2px -1px rgba(23, 32, 51, 0.05)`
  * Elevasi / Modal: `0 10px 15px -3px rgba(23, 32, 51, 0.08), 0 4px 6px -4px rgba(23, 32, 51, 0.04)`

---

## 3. Sistem Status & Indikator Visual

> [!IMPORTANT]
> **Aturan Aksesibilitas (WCAG AA)**: Status **TIDAK BOLEH** dibedakan hanya berdasarkan warna. Setiap status wajib menyertakan **ikon visual** dan **teks Bahasa Indonesia** yang eksplisit.

| Status Task | Warna Primer | Ikon Representatif | Teks Label Indonesia |
|---|---|---|---|
| `DRAFT` | `#64748B` (Slate) | `FileEdit` | Draf Penyusunan |
| `OPEN` | `#71CFFE` (Cyan) | `Compass` | Terbuka untuk Diambil |
| `RECRUITING` | `#BC71FE` (Purple) | `Users` | Perekrutan Tim |
| `READY` | `#818CF8` (Indigo) | `UserCheck` | Tim Siap Dimulai |
| `ACTIVE` | `#10B981` (Emerald) | `PlayCircle` | Sedang Dikerjakan |
| `SUBMITTED` | `#0284C7` (Sky) | `Send` | Menunggu Antrean Review |
| `IN_REVIEW` | `#71CFFE` (Cyan) | `Search` | Sedang Ditinjau Admin |
| `REVISION` | `#F9723B` (Orange) | `AlertCircle` | Perlu Perbaikan Hasil |
| `APPEALED` | `#8B5CF6` (Violet) | `Scale` | Dalam Proses Sanggahan |
| `APPROVED` | `#059669` (Green) | `CheckCircle2` | Diterima (Reward Siap) |
| `PARTIAL` | `#3B82F6` (Blue) | `PieChart` | Selesai Sebagian |
| `FAILED` | `#E11D48` (Rose) | `XCircle` | Ditolak / Melewati Waktu |
| `CLOSED` | `#475569` (Dark Slate) | `Lock` | Arsip Ditutup Selesai |

---

## 4. Spesifikasi Komponen Inti

### 1. Tombol (Button)
* **Primary**: Background `#71CFFE`, Teks `#172033` (Bold), hover: kontras sedikit lebih pekat, focus ring `#71CFFE`.
* **Team Accent**: Background `#BC71FE`, Teks `#FFFFFF`, hover: shade 10% lebih gelap.
* **Warning / Danger**: Background `#F9723B`, Teks `#FFFFFF`.
* **Secondary / Outline**: Background `#FFFFFF`, Border `#DBE8F0`, Teks `#172033`, hover: background `#F7FBFE`.
* **Touch Target**: Minimal tinggi `44px` di mobile (`h-11 px-4`).

### 2. Kartu Task (Task Card / Bounty Card)
* Header: Badge Tipe (`Solo` / `Team`), Badge Mode (`Instant Take` / `Application`), Nilai Bounty (Rp xxx.xxx dalam teks tebal).
* Body: Judul task yang jelas, deskripsi ringkas 2 baris, deretan skill tags.
* Footer: Countdown deadline (hijau jika aman, oranye jika sisa < 24 jam), kuota tim (jika tim), tombol aksi langsung (*CTA*).

### 3. Modul Klaim Reward (Claim Widget)
* Menampilkan daftar item reward yang berstatus `AVAILABLE`.
* Checkbox untuk memilih multi-reward dengan kalkulasi total instan.
* Tombol CTA cepat: **"Cairkan Semua (Claim All)"**.
* Snapshot informasi rekening tujuan sebelum konfirmasi final.

---

## 5. Rancangan Arsitektur Antarmuka (UX Flow)

### A. Dashboard Member
1. **Keadaan 1: Belum Memiliki Task Aktif**:
   * Menampilkan tab *Available Tasks* (tersaring berdasarkan kualifikasi skill).
   * Menampilkan widget *Aplikasi Saya* (maksimal 3 kartu pending).
2. **Keadaan 2: Sedang Mengerjakan Task (Active Task)**:
   * **Hero Section Dominan**: Kartu Active Task mengambil porsi atas dashboard. Memuat countdown waktu nyata, rincian kriteria penerimaan, link ruang kerja, dan tombol besar **"Kirim Hasil Pekerjaan"**.
   * Jika Team Task: Menampilkan roster anggota dan progress checklist internal.
3. **Keadaan 3: Pasca Pengiriman (In Review / Revision)**:
   * Status tracker horizontal tahapan review.
   * Kotak feedback admin yang menonjol jika status revisi disertai batas waktu perbaikan.
4. **Section Reward**:
   * Total reward siap klaim, riwayat pencairan, dan status transfer admin.

### B. Dashboard Admin (Urgensi Queue)
Layout antrean operasional admin diurutkan berdasarkan skala prioritas:
1. **Registrasi Akun Baru** (memerlukan verifikasi profil & persetujuan).
2. **Seleksi Application** (task bertipe application yang menunggu dipilihkan member).
3. **Submission Masuk** (pekerjaan selesai yang menunggu evaluasi admin).
4. **Task Overdue** (task yang melewati deadline untuk evaluasi pembatalan/perpanjangan).
5. **Permohonan Claim Reward** (antrean transfer manual dan unggah bukti transfer).
6. **Distribusi Tim Tertunda** (memantau apakah Team Lead sudah menyalurkan dana ke anggota).
7. **Laporan & Sanggahan (Reports & Appeals)**.

---

## 6. Responsivitas & Standar Mobile-First
* **Layar Ponsel (< 768px)**: Tampilan murni satu kolom vertikal, navigasi bawah (*bottom bar*) untuk menu utama, tombol aksi sticky di bagian bawah saat membuka detail task.
* **Layar Tablet (768px - 1024px)**: Grid 2 kolom adaptif, sidebar navigasi ringkas (*collapsible*).
* **Layar Desktop (> 1024px)**: Tata letak daftar task di sisi kiri (40%) dengan panel detail interaktif di sisi kanan (60%), atau kanban view untuk admin.
