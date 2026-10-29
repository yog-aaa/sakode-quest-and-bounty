# SAKODE Work — Spesifikasi Sistem Lencana & Jenjang Level Kontributor

Dokumen ini adalah cetak biru arsitektur gamifikasi, reputasi talenta, dan perolehan lencana (*achievements*) untuk platform **SAKODE Task & Reward Platform** (`sakode-task-reward`).

---

## 1. Filosofi Gamifikasi Berbasis Kontribusi Nyata

Gamifikasi pada SAKODE Work tidak menggunakan metrik semu (*vanity metrics*) seperti rentetan login harian tanpa aksi. Setiap tingkat level dan lencana merepresentasikan:
1. **Deliverable Nyata**: Hasil karya yang telah diverifikasi dan disetujui oleh tim Reviewer & QA SAKODE Academy.
2. **Kepatuhan Invariant**: Penegakan standar mutu kode, etika kolaborasi tim (konsensus 100%), dan disiplin tenggat waktu berbasis WIB.
3. **Pembuka Hak Istimewa (Perk Unlocks)**: Kenaikan level membuka akses ke tugas yang lebih kompleks dengan reward yang lebih besar, hak memimpin tim (*Party Leader*), hingga hak diundang sebagai *Co-Reviewer QA*.

---

## 2. Jenjang Level Kontributor (Contributor Progression Path)

| Tingkat | Gelar / Level | Syarat Kualifikasi | Hak Istimewa (*Unlocked Perks*) |
|---|---|---|---|
| **LVL 1** | **Onboarded Contributor** (*Entry*) | Akun disetujui admin, verifikasi identitas & profil lengkap. | Akses task kategori *Beginner* (Reward hingga Rp 750.000). |
| **LVL 2** | **Active Contributor** (*Intermediate*) | Menyelesaikan minimal **3 task** mandiri dengan nilai mutu A. | Membuka task *Intermediate* (Reward s.d. Rp 2.000.000) & hak bergabung dalam Team Party. |
| **LVL 3** | **Senior Specialist** (*Advanced*) | Menyelesaikan minimal **8 task** dengan riwayat *zero-critical defect*. | Akses task *Advanced* (Reward s.d. Rp 5.000.000), prioritas antrean review QA, & slot aplikasi prioritas. |
| **LVL 4** | **Lead Fellow** (*Fellow*) | Menyelesaikan minimal **15 task** & memimpin minimal **2 Team Projects**. | Berhak menjadi *Party Leader* tim multi-disiplin & hak diundang sebagai *Co-Reviewer QA*. |
| **LVL 5** | **Grandmaster Fellow** (*Apex Legend*) | Menyelesaikan minimal **30 task**, rasio revisi < 5%, & kontribusi lintas pilar. | Hak veto arsitektur teknis, lencana profil berlapis emas, & nominasi instruktur utama akademi. |

---

## 3. Matriks Katalog 24 Lencana SAKODE Work (Badge Matrix)

Lencana diklasifikasikan ke dalam 4 pilar utama dan 4 tingkat kelangkaan (*Tiers*):
- 🟢 **Common**: Pencapaian tahap awal / orientasi.
- 🔵 **Rare**: Bukti penguasaan teknis dan konsistensi operasional.
- 🟣 **Epic**: Kemampuan tingkat tinggi dan kepemimpinan inisiatif.
- 🟡 **Legendary**: Prestasi langka dengan standar mutu tanpa cela.

### A. Pilar 1: Teknologi & IT (Tech & Software Engineering)
1. **First Commit** (Common • 🟢): Menyelesaikan task pertama di bidang pemrograman, database, atau integrasi API.
2. **Bug Hunter** (Rare • 🔵): Menemukan dan memperbaiki celah keamanan kritis atau regresi performa sebelum rilis.
3. **DevOps Runner** (Rare • 🔵): Mengonfigurasi pipeline CI/CD GitHub Actions atau otomasi deployment cloud tanpa insiden.
4. **Sistem Integrator** (Epic • 🟣): Membangun sinkronisasi background worker, Cloud Functions, dan arsitektur Firestore multi-koleksi.
5. **Arsitek Solusi** (Epic • 🟣): Menyelesaikan 3 task arsitektur kode berskala besar dengan zero defect dan strict TypeScript safety. *(Tampil di Landing Page)*
6. **Titan of Code** (Legendary • 🟡): Membangun subsystem inti dari awal hingga rilis produksi dengan pengujian beban dan keamanan 100% lulus.

### B. Pilar 2: Modul & Edukasi (Curriculum & Knowledge)
1. **Penulis Catatan** (Common • 🟢): Memperbarui dokumentasi teknis, cheatsheet Git, atau panduan instalasi praktikum.
2. **Penyusun Kurikulum** (Rare • 🔵): Menulis silabus bootcamp lengkap atau 5 modul lab praktikum mahasiswa yang disetujui kurator.
3. **Pembuat Kuis** (Rare • 🔵): Menyusun 50+ bank soal pilihan ganda dan studi kasus analitis lengkap dengan tes kasus kode otomatis.
4. **Mentor Teladan** (Epic • 🟣): Membimbing kelompok talent mahasiswa atau peserta akademi hingga berhasil menyelesaikan proyek akhir. *(Tampil di Landing Page)*
5. **Master Kurator** (Epic • 🟣): Mengkurasi dan menyelaraskan 100+ modul pembelajaran dengan kebutuhan standar industri masa kini.
6. **Begawan Edukasi** (Legendary • 🟡): Merumuskan blueprint kurikulum multi-semester yang diadopsi sebagai kurikulum standar SAKODE Academy.

### C. Pilar 3: Marketing & Komunitas (Growth & Community Catalyst)
1. **Penyebar Kabar** (Common • 🟢): Memproduksi publikasi informasi beasiswa, promosi batch kelas, atau dokumentasi meetup.
2. **Storyteller Kreatif** (Rare • 🔵): Menerbitkan 5 set carousel infografis edukatif atau visual micro-learning dengan engagement tinggi.
3. **Event Coordinator** (Rare • 🔵): Mengelola operasional webinar teknis daring dengan 250+ partisipan terdaftar.
4. **Katalis Komunitas** (Epic • 🟣): Memimpin tech talk nasional atau workshop hybrid dengan 500+ peserta dan kepuasan > 95%. *(Tampil di Landing Page)*
5. **Grand Evangelist** (Epic • 🟣): Menginisiasi kemitraan komunitas teknologi kampus dan merekrut 100+ kontributor aktif baru.
6. **Duta Kehormatan** (Legendary • 🟡): Konsistensi 1 tahun dalam membangun reputasi brand SAKODE Academy di kancah nasional.

### D. Pilar 4: Milestone Platform & Invariant Kehormatan (Platform Prestige)
1. **Misi Pertama** (Common • 🟢): Diberikan saat tugas pertama apapun dinyatakan lulus review oleh administrator.
2. **Pilar Konsensus** (Rare • 🔵): Berhasil menuntaskan task tim dengan kesepakatan pembagian honor 100% konsensus tanpa sengketa.
3. **Pengawal Deadline** (Rare • 🔵): Menyelesaikan 5 task berturut-turut minimal 12 jam sebelum batas akhir waktu server WIB.
4. **Pengiriman Kilat** (Legendary • 🟡): Menyelesaikan deliverable utuh berstandar produksi dalam waktu kurang dari 24 jam.
5. **Presisi Tanpa Revisi (Golden Ledger)** (Legendary • 🟡): Rekor penyelesaian 5 task berurutan dengan kelulusan langsung (*Direct Approved*) tanpa catatan revisi. *(Tampil di Landing Page)*
6. **Pelindung Ekosistem** (Legendary • 🟡): Menjaga audit trail append-only dan zero security bypass sepanjang keterlibatan di platform.

---

## 4. Tata Kelola Penayangan: Landing Page vs Dashboard Member

### A. Landing Page (`src/app/page.tsx`)
- **Prinsip**: *Showcase of Excellence* (Hanya menayangkan Lencana Tertinggi).
- **Komponen**: **Hall of Fame: 4 Lencana Kehormatan Tertinggi**:
  1. `Presisi Tanpa Revisi` (Legendary • 🟡) — Milestone SAKODE
  2. `Arsitek Solusi` (Epic • 🟣) — Teknologi & IT
  3. `Mentor Teladan` (Epic • 🟣) — Modul & Edukasi
  4. `Katalis Komunitas` (Epic • 🟣) — Marketing & Komunitas
- **Aksi Pengguna**: Mengklik lencana membuka modal kriteria kelayakan. Banner di bawahnya mengarahkan pengguna: *"Ingin melihat 20+ lencana lengkap? Buka Dashboard Member"*.

### B. Dashboard Member (`/member/achievements`)
- **Prinsip**: *Comprehensive Tracker & Reward Redemption*.
- **Fitur Halaman**:
  1. **Status Level & Progress Bar XP**: Menampilkan persentase menuju level berikutnya berdasarkan jumlah task selesai dan rasio rating.
  2. **Filter Tab 4 Pilar**: Teknologi, Edukasi, Komunitas, Milestone.
  3. **Status Kartu Lencana**:
     - *Unlocked*: Lencana berwarna penuh, tanggal perolehan, nomor sertifikat digital.
     - *Locked*: Lencana bertopeng abu-abu (*greyscale*), progress bar penyelesaian (misal: `3/5 task selesai`), dan tombol panduan.
  4. **Sertifikat Digital & Showcase Profil**: Kemampuan membagikan lencana ke LinkedIn atau portofolio publik.
