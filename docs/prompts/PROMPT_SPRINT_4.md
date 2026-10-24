# PROMPT EKSEKUSI TAHAP 5: SPRINT 4 - SUBMISSION, CLOUDINARY UPLOAD & SHARED REVIEW QUEUE

> **Instruksi untuk User**: Salin seluruh teks prompt di bawah ini dan berikan langsung kepada Agent Programmer (Coder Agent) Anda.

---

```markdown
### TUGAS EKSEKUSI: SPRINT 4 - SUBMISSION, CLOUDINARY UPLOAD & SHARED REVIEW QUEUE

Halo Coder Agent! Hasil Sprint 3 telah diverifikasi dan dinyatakan **APPROVED** oleh Orchestrator / QA.
Sekarang saatnya mengeksekusi **Sprint 4: Submission, Evidence Upload & Shared Review Queue** pada repositori `sakode-task-reward`.

Sebelum menulis kode, Anda **DIHARUSKAN** membaca dan mematuhi:
1. `AGENTS.md` (Strict Invariants & Protokol Tektokan)
2. `DESIGN.md` (Spesifikasi visual status In Review, Revision, Approved, Failed)
3. `ARCHITECTURE.md` (Modul Submission & Review, Koleksi submissions, Shared Review Lock)
4. `PLANNING.md` (Sprint 4 Deliverables & Kriteria Penerimaan MVP No. 5 & 13)

Wajib terapkan panduan dari Local Agent Skills di:
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md` (Cloudinary Signed Upload, authenticated private delivery, sanitasi link)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-threat-model\SKILL.md` (Atomic Review Locking untuk mencegah tabrakan review antar 4 admin)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\frontend-design\SKILL.md` (Review layout antarmuka admin, status tracker visual pengerjaan)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md` (Drag & drop file upload, form draft retention saat upload gagal, touch target min 44px)

---

#### 1. Tujuan Sprint 4
Membangun siklus lengkap penyerahan hasil pekerjaan dan antrean evaluasi Admin:
1. Member (Solo) atau Team Lead (Team) dapat mengirimkan hasil pekerjaan (*submission*) berupa catatan, link deliverable, dan file bukti kerja (*evidence files*).
2. **Format Berkas Bukti**: Dibatasi ketat pada **JPG, PNG, WebP, dan PDF** dengan ukuran maksimal **10 MB per file**. (Strict Invariant: Video DITOLAK pada MVP).
3. **Penyimpanan Cloudinary**: Menggunakan *Signed Upload* dan URL privat/terotentikasi. Firestore hanya menyimpan metadata (`url`, `publicId`, `fileName`, `fileType`, `fileSize`).
4. **Draft Retention & Atomicity**: Jika upload gagal, metadata Firestore tidak ditulis dan isian form tetap tersimpan agar pengguna tidak kehilangan ketikan.
5. **Single Active Submission & Versioning**: Setiap task hanya memiliki 1 submission aktif per iterasi (versi 1, versi 2 saat revisi).
6. **Shared Review Queue with Atomic Lock**:
   - Sekitar 4 Admin berbagi antrean review yang sama.
   - Saat Admin A membuka suatu submission untuk dinilai, kunci sementara ditempatkan (`reviewLockedByAdminId = adminA`, `reviewLockedUntil = now + 15 menit`).
   - Admin B yang membuka submission yang sama dicegah mengambil keputusan dengan pesan: *"Sedang diperiksa oleh Admin [Nama]"*.
   - Kunci kedaluwarsa otomatis jika melewati 15 menit tanpa aksi.
7. **Pilihan Keputusan Admin**:
   - **Setujui (Approve)**: Status task & submission menjadi `APPROVED`.
   - **Minta Revisi (Request Revision)**: Hanya dapat dilakukan jika deadline masih berlaku atau dengan menetapkan batas waktu revisi baru. Status menjadi `REVISION`.
   - **Perpanjang Waktu Manual (Extend Deadline)**: Admin memberikan waktu tambahan disertai alasan wajib yang dicatat di `auditEvents`.
   - **Tolak (Reject)**: Status task menjadi `FAILED` (membuka hak sanggah/appeal di Sprint 5).

---

#### 2. Spesifikasi Teknis & Berkas yang Dibuat

1. **Skema Validasi Input Zod (`src/lib/validations/submission.ts`)**:
   - `createSubmissionSchema`:
     - `taskId`: string.
     - `notes`: string (min 15 karakter).
     - `deliverableLinks`: array of URL string (minimal 1 link: GitHub, deployment, dsb).
     - `evidenceFiles`: array of object `{ url: string, publicId: string, fileName: string, fileType: string, fileSize: number }` (maksimal 5 file, tipe file hanya JPG/PNG/WebP/PDF, max 10MB per file).
   - `reviewSubmissionSchema`:
     - `submissionId`: string.
     - `action`: `'APPROVE' | 'REQUEST_REVISION' | 'EXTEND_DEADLINE' | 'REJECT'`.
     - `revisionNotes`: string (wajib jika REQUEST_REVISION).
     - `revisionDeadline`: string ISO date (opsional / jika ada perpanjangan).
     - `extensionDays`: number (wajib jika EXTEND_DEADLINE).
     - `reason`: string (wajib jika REJECT atau EXTEND_DEADLINE, min 10 karakter).
   - `acquireReviewLockSchema`: `submissionId: string`.

2. **Integrasi Cloudinary & Signed Upload (`src/lib/cloudinary.ts` & Route Handler `/api/upload/sign`)**:
   - Helper untuk menghasilkan parameter tanda tangan (*signed upload signature*) dengan API Secret Cloudinary.
   - Validasi whitelist MIME type (`image/jpeg`, `image/png`, `image/webp`, `application/pdf`) dan ukuran <= 10MB.
   - Sediakan fallback mock upload untuk mode evaluasi lokal tanpa API key Cloudinary aktif.

3. **Backend Services & Firestore Transactions**:
   - **`src/server/services/submission.service.ts`**:
     - `submitTaskWork(userId, input)`:
       - Validasi: Jika Solo Task, caller harus `assignedUserId`. Jika Team Task, caller harus **Team Lead** (`teamLeadUserId`).
       - Zero-Cron Check: Periksa apakah `now > task.deadlineAt`. Jika terlewat, tolak submission.
       - Buat dokumen baru di `submissions` (version = iterasi ke-n, status = `SUBMITTED`).
       - Perbarui task: `status = 'SUBMITTED'`.
       - Catat event `SUBMISSION_CREATED` di `auditEvents`.
     - `acquireReviewLock(adminUid, submissionId)`:
       - Mengunci submission via transaksi: Jika `reviewLockedByAdminId` aktif dan `reviewLockedUntil > now` oleh admin lain, tolak dengan info admin pengunci.
       - Jika kosong atau kedaluwarsa, set `reviewLockedByAdminId = adminUid` dan `reviewLockedUntil = now + 15 menit`.
     - `releaseReviewLock(adminUid, submissionId)`:
       - Melepaskan kunci jika admin menutup halaman review.
     - `reviewSubmission(adminUid, input)`:
       - **WAJIB** menggunakan `firestore.runTransaction()`.
       - Verifikasi hak admin dan kepemilikan review lock.
       - Eksekusi aksi:
         - Jika `APPROVE`: `submission.status = 'APPROVED'`, `task.status = 'APPROVED'`.
         - Jika `REQUEST_REVISION`: `submission.status = 'REVISION_REQUESTED'`, `task.status = 'REVISION'`, perbarui `task.deadlineAt` jika ada batas revisi baru.
         - Jika `EXTEND_DEADLINE`: perbarui `task.deadlineAt = now + extensionDays`, catat perpanjangan manual.
         - Jika `REJECT`: `submission.status = 'REJECTED'`, `task.status = 'FAILED'`.
       - Lepaskan review lock (`reviewLockedByAdminId = null`).
       - Catat event `SUBMISSION_REVIEWED` di `auditEvents`.
     - `getSubmissionsForTask(taskId)`: Mengambil seluruh riwayat versi submission dari suatu task.
     - `getPendingSubmissionsQueue(adminUid)`: Mengambil daftar submission yang menunggu antrean review admin.

4. **Server Actions (`src/server/actions/submission.actions.ts`)**:
   - Actions Next.js App Router untuk submit deliverable, ambil/lepas lock, dan evaluasi review.

5. **Halaman & Antarmuka UI (App Router)**:
   - **Komponen Upload Berkas (`src/components/submission/FileUploadDropzone.tsx`)**:
     - Drag & drop file area dengan indikator kemajuan (progress bar).
     - Validasi ukuran (max 10MB) dan tipe berkas (JPG, PNG, WebP, PDF) langsung di sisi browser sebelum upload.
     - Tombol hapus berkas terunggah dan preview thumbnail.
   - **Form Pengiriman Hasil (`src/app/(dashboard)/member/tasks/[id]/submit/page.tsx`)**:
     - Hanya dapat diakses oleh pemegang task (Solo member atau Team Lead).
     - Input catatan deliverable, multi-input link (GitHub, URL web), dan dropzone berkas bukti.
     - State form disimpan di localStorage / memori sementara agar tidak hilang jika terjadi gangguan koneksi.
   - **Antrean Review Admin (`src/app/(dashboard)/admin/submissions/page.tsx` atau tab antrean di `/admin`)**:
     - Daftar pengiriman menunggu evaluasi diurutkan berdasarkan waktu kirim / urgensi.
     - Indikator visual kunci: badge "Sedang Ditinjau oleh Admin [Nama]" dengan timer mundur sisa durasi kunci.
   - **Halaman Penilaian Submission (`src/app/(dashboard)/admin/submissions/[id]/page.tsx`)**:
     - Menampilkan catatan pengerjaan, daftar link yang dapat diklik langsung, dan viewer file bukti (preview PDF & gambar).
     - Banner status review lock aktif.
     - Panel Aksi Admin:
       - Tombol Hijau: **"Setujui Hasil Pekerjaan"**
       - Tombol Oranye: **"Minta Revisi Hasil"** (membuka modal input catatan revisi)
       - Tombol Biru: **"Beri Perpanjangan Waktu"** (input hari & alasan)
       - Tombol Merah: **"Tolak Hasil"** (input alasan)

---

#### 3. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Member (Solo) atau Team Lead (Team) dapat mengirimkan hasil pekerjaan beserta file bukti valid (JPG/PNG/WebP/PDF <= 10MB).
- [ ] Berkas video DITOLAK baik di sisi UI maupun validasi server.
- [ ] Pengecekan Zero-Cron menolak pengiriman baru jika batas waktu deadline task telah terlampaui.
- [ ] Shared Review Queue mencegah tabrakan keputusan 2 admin melalui mekanisme Atomic Review Locking 15 menit.
- [ ] Admin dapat menyetujui, meminta revisi, memberikan perpanjangan manual berdasar alasan, atau menolak submission.
- [ ] Seluruh keputusan review, perubahan batas waktu, dan pembukaan berkas tercatat permanen di `auditEvents`.
- [ ] `npm run build` dan `npm run lint` lolos 100% tanpa error TypeScript maupun ESLint.

---

#### 4. Format Laporan Penyerahan Tugas
Kirimkan ringkasan hasil kerja sesuai format standar di `AGENTS.md`.
```
