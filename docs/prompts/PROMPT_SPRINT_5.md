# PROMPT EKSEKUSI TAHAP 6: SPRINT 5 - PARTIAL COMPLETION, LINKED CONTINUATION TASK & ONE-TIME APPEAL

> **Instruksi untuk User**: Salin seluruh teks prompt di bawah ini dan berikan langsung kepada Agent Programmer (Coder Agent) Anda.

---

```markdown
### TUGAS EKSEKUSI: SPRINT 5 - PARTIAL COMPLETION, LINKED CONTINUATION TASK & ONE-TIME APPEAL

Halo Coder Agent! Hasil Sprint 4 telah diverifikasi dan dinyatakan **APPROVED** oleh Orchestrator / QA.
Sekarang saatnya mengeksekusi **Sprint 5: Partial Completion, Linked Continuation Task & One-Time Appeal** pada repositori `sakode-task-reward`.

Sebelum menulis kode, Anda **DIHARUSKAN** membaca dan mematuhi:
1. `AGENTS.md` (Strict Invariants & Protokol Tektokan)
2. `DESIGN.md` (Spesifikasi visual status `Partial` #3B82F6 & `Appealed` #8B5CF6)
3. `ARCHITECTURE.md` (Modul Partial & Appeal, Skema tasks & submissions, Independent Admin Review)
4. `PLANNING.md` (Sprint 5 Deliverables & Kriteria Penerimaan MVP No. 7)

Wajib terapkan panduan dari Local Agent Skills di:
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-threat-model\SKILL.md` (Aturan anti-konflik kepentingan: Admin pemutus awal dilarang meninjau permohonan appeal yang sama)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md` (Firestore runTransaction untuk kalkulasi batas bounty dan pembentukan continuation task terhubung)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\frontend-design\SKILL.md` (Form evaluasi partial completion, perbandingan visual hasil diterima vs tersisa, kartu sanggahan appeal)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md` (Komponen modal sanggahan, input berkas bukti banding, touch target min 44px)

---

#### 1. Tujuan Sprint 5
Membangun siklus penanganan deliverable yang selesai sebagian dan mekanisme perlindungan hak member melalui sanggahan:
1. **Fitur Partial Completion (Admin)**:
   - Jika hasil pengerjaan memiliki nilai operasional sebagian, Admin dapat menetapkan Partial Completion.
   - Menentukan:
     - Bagian pekerjaan yang diterima (*accepted deliverable*).
     - Bagian pekerjaan yang masih tersisa (*remaining scope*).
     - Nominal reward parsial (Integer Rupiah).
     - Alasan evaluasi objektif.
   - **STRICT INVARIANT: Batas Bounty Awal**: Total reward parsial + reward continuation task **MUTLAK TIDAK BOLEH** melebihi bounty awal task (`partialReward + continuationBounty <= initialBounty`).
   - **Auto-Generation Continuation Task**: Sistem secara otomatis melahirkan **Continuation Task** baru yang tertaut (`parentTaskId = originalTaskId`), dengan sisa scope dan sisa reward.
   - Status task asal berubah menjadi `PARTIAL`.
2. **One-Time Appeal Engine (Hak Sanggahan 1 Kali)**:
   - Member (Solo) atau Team Lead (Team) berhak mengajukan **1 KALI KESEMPATAN APPEAL** atas keputusan `FAILED` (penolakan) atau `PARTIAL`.
   - Wajib menyertakan alasan sanggahan/kronologi (min 20 karakter) dan berkas bukti baru (*evidence files* via Cloudinary).
   - Status task beralih menjadi `APPEALED`, dan reward terkait ditahan selama masa appeal.
3. **Aturan Anti-Konflik Kepentingan Review Appeal**:
   - Appeal **WAJIB** ditinjau dan diputuskan oleh **ADMIN LAIN** (`reviewAdminId !== firstReviewerAdminId`). Admin yang memberikan keputusan pertama dilarang memutuskan appeal tersebut.
   - Keputusan kedua bersifat **FINAL**:
     - Jika banding diterima (`APPROVED`): status submission dan task dipulihkan menjadi `APPROVED`.
     - Jika banding ditolak (`REJECTED`): status task tetap `FAILED` / `PARTIAL` dan hak appeal ditutup permanen.
4. Seluruh keputusan dicatat ke koleksi `auditEvents` (append-only).

---

#### 2. Spesifikasi Teknis & Berkas yang Dibuat

1. **Skema Validasi Input Zod (`src/lib/validations/appeal.ts`)**:
   - `partialCompletionSchema`:
     - `submissionId`: string.
     - `acceptedNotes`: string (min 15 karakter).
     - `remainingScope`: string (min 15 karakter).
     - `partialRewardAmount`: number integer Rupiah positif.
     - `reason`: string (min 10 karakter).
     - `publishContinuationNow`: boolean.
   - `submitAppealSchema`:
     - `submissionId`: string.
     - `appealReason`: string (min 20 karakter).
     - `evidenceFiles`: array of object evidence (JPG/PNG/WebP/PDF max 10MB, no video).
   - `decideAppealSchema`:
     - `submissionId`: string.
     - `decision`: `'APPROVE' | 'REJECT'`.
     - `resolutionNotes`: string (min 15 karakter).

2. **Backend Services & Firestore Transactions (`src/server/services/appeal.service.ts`)**:
   - `setPartialCompletion(adminUid, input)`:
     - **WAJIB** menggunakan `firestore.runTransaction()`.
     - Memeriksa hak admin dan lock review.
     - Memeriksa `input.partialRewardAmount < task.totalReward`.
     - Sisa bounty = `task.totalReward - input.partialRewardAmount`.
     - Memperbarui submission: `status = 'PARTIAL_APPROVED'`.
     - Memperbarui task asal: `status = 'PARTIAL'`, `continuationTaskId = newTaskId`.
     - Membuat dokumen task baru di `tasks` (Continuation Task):
       - `title = `[Lanjutan] ${task.title}`
       - `scope = input.remainingScope`
       - `totalReward = sisaBounty`
       - `parentTaskId = task.id`
       - `status = input.publishContinuationNow ? 'OPEN' : 'DRAFT'`
     - Catat event `TASK_PARTIAL_COMPLETED` & `CONTINUATION_TASK_CREATED` di `auditEvents`.
   - `fileSubmissionAppeal(userId, input)`:
     - Memeriksa pemanggil adalah pemilik task / Team Lead.
     - Memeriksa apakah submission pernah diajukan appeal sebelumnya (`submission.appealed === true`). Jika sudah, tolak (hanya 1x kesempatan).
     - Memeriksa status task saat ini adalah `FAILED` atau `PARTIAL`.
     - Simpan data appeal ke `submission.appeal` (`appealedByUserId`, `reason`, `evidenceFiles`, `filedAt`).
     - Set `submission.appealed = true`.
     - Update task status: `status = 'APPEALED'`.
     - Catat event `SUBMISSION_APPEAL_FILED` di `auditEvents`.
   - `decideAppeal(adminUid, input)`:
     - **WAJIB** menggunakan `firestore.runTransaction()`.
     - **STRICT INVARIANT (Conflict of Interest)**: Periksa `adminUid !== submission.reviewedByAdminId`. Jika sama, lempar error: "Admin yang memberikan keputusan awal dilarang meninjau sanggahan ini. Review harus dilakukan oleh Admin lain."
     - Jika `decision === 'APPROVE'`:
       - `submission.status = 'APPROVED'`
       - `task.status = 'APPROVED'`
     - Jika `decision === 'REJECT'`:
       - Task tetap pada status sebelumnya (`FAILED` atau `PARTIAL`).
     - Simpan `reviewedByAdminId = adminUid`, `reviewedAt`, `resolutionStatus`, `resolutionNotes`.
     - Catat event `APPEAL_DECIDED` di `auditEvents`.

3. **Server Actions (`src/server/actions/appeal.actions.ts`)**:
   - Actions Next.js App Router untuk eksekusi partial completion, pengajuan appeal, dan keputusan appeal independen.

4. **Halaman & Antarmuka UI (App Router)**:
   - **Modal & Form Partial Completion pada Halaman Review Admin (`src/app/(dashboard)/admin/submissions/[id]/page.tsx`)**:
     - Tambahkan tombol **"Selesai Sebagian (Partial Completion)"** (#3B82F6).
     - Modal interaktif dengan kalkulasi otomatis: Input nilai reward parsial -> live display sisa reward untuk continuation task. Validasi agar tidak melebihi bounty awal.
     - Pilihan checkbox: "Langsung terbitkan Continuation Task ke status OPEN".
   - **Form Pengajuan Appeal Member (`src/app/(dashboard)/member/tasks/[id]/page.tsx`)**:
     - Jika task berstatus `FAILED` atau `PARTIAL` dan belum pernah mengajukan appeal: Munculkan banner/tombol **"Ajukan Sanggahan (Appeal)"** (#8B5CF6).
     - Modal form sanggahan: Input alasan kronologi dan dropzone upload bukti tambahan via Cloudinary.
     - Tampilan badge informatif: "1 Kesempatan Sanggahan Tersisa" / "Sanggahan Sedang Ditinjau Admin Lain".
   - **Antrean & Halaman Keputusan Appeal Admin (`src/app/(dashboard)/admin/submissions/page.tsx` & detail)**:
     - Tab filter khusus: **"Sanggahan / Appeals"**.
     - Di halaman detail submission: Tampilkan riwayat keputusan awal (Admin pertama, tanggal, catatan penolakan) dan berkas sanggahan member.
     - Proteksi UI: Jika Admin yang sedang login adalah Admin pemutus awal, tombol keputusan di-disable dengan peringatan: *"Aturan Anti-Konflik Kepentingan: Anda tidak dapat meninjau sanggahan atas keputusan Anda sendiri."*
     - Tombol Aksi: **"Terima Sanggahan (Approve)"** & **"Tolak Sanggahan (Final Reject)"**.

---

#### 3. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Admin dapat menetapkan Partial Completion dengan porsi diterima, porsi tersisa, dan nominal parsial.
- [ ] Sistem otomatis melahirkan Continuation Task tertaut dengan sisa bounty, dan total reward tidak melebihi bounty awal.
- [ ] Member / Team Lead dapat mengajukan 1 kali appeal disertai alasan dan berkas bukti baru saat task ditolak atau disetujui sebagian.
- [ ] Sistem menolak pengajuan appeal kedua (hanya 1 kesempatan per submission).
- [ ] Admin pemutus awal diblokir dari mengevaluasi appeal yang bersangkutan (aturan anti-konflik kepentingan ditegakkan).
- [ ] Admin kedua dapat menyetujui atau menolak appeal secara final, dan seluruh keputusan diaudit di `auditEvents`.
- [ ] `npm run build` dan `npm run lint` lolos 100% tanpa error TypeScript maupun ESLint.

---

#### 4. Format Laporan Penyerahan Tugas
Kirimkan ringkasan hasil kerja sesuai format standar di `AGENTS.md`.
```
