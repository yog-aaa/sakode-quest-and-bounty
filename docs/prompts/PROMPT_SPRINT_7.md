# PROMPT EKSEKUSI TAHAP 8: SPRINT 7 - CONFLICT-OF-INTEREST REPORTS, PROGRESSIVE PENALTIES & AUDIT TRAIL

> **Instruksi untuk User**: Salin seluruh teks prompt di bawah ini dan berikan langsung kepada Agent Programmer (Coder Agent) Anda.

---

```markdown
### TUGAS EKSEKUSI: SPRINT 7 - CONFLICT-OF-INTEREST REPORTS, PROGRESSIVE PENALTIES & AUDIT TRAIL

Halo Coder Agent! Hasil Sprint 6 telah diverifikasi dan dinyatakan **APPROVED** oleh Orchestrator / QA.
Sekarang saatnya mengeksekusi **Sprint 7: Conflict-of-Interest Reports, Progressive Penalties & Append-Only Audit Trail** pada repositori `sakode-task-reward`.

Sebelum menulis kode, Anda **DIHARUSKAN** membaca dan mematuhi:
1. `AGENTS.md` (Strict Invariants: Append-Only Audit Trail, Anti-Konflik Kepentingan, Super Admin Authority)
2. `DESIGN.md` (Spesifikasi visual status report, badge penalti, tabel audit log)
3. `ARCHITECTURE.md` (Koleksi `reports`, `penalties`, `auditEvents`, `systemConfig`, Super Admin Permissions)
4. `PLANNING.md` (Sprint 7 Deliverables & Kriteria Penerimaan MVP No. 10 & 11)

Wajib terapkan panduan dari Local Agent Skills di:
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-threat-model\SKILL.md` (Aturan anti-konflik kepentingan: Admin terlibat dilarang menangani laporan, eskalasi ke Super Admin, imutabilitas audit log)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md` (Pencegahan privilege escalation, validasi Zod ketat, otorisasi RBAC Super Admin)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\frontend-design\SKILL.md` (Tabel audit log profesional, form pelaporan berbukti, kartu riwayat penalti)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md` (Modal konfirmasi penalti, diff view before/after audit, touch target min 44px)

---

#### 1. Tujuan Sprint 7
Membangun sistem pelaporan sengketa berbukti, penegakan anti-konflik kepentingan, mesin penalti progresif, hak wewenang Super Admin, dan penampil audit trail:
1. **Sistem Pelaporan Terhubung (Reports)**:
   - Pelaporan dapat dibuat dari 4 entitas: `TASK`, `SUBMISSION`, `CLAIM`, atau `TEAM_DISTRIBUTION`.
   - 6 Kategori resmi SAKODE:
     1. Hasil atau scope tidak sesuai.
     2. Pembayaran Admin belum diterima.
     3. Team Lead tidak membagikan reward sesuai kesepakatan.
     4. Bukti pembayaran tidak valid.
     5. Anggota team tidak menjalankan tanggung jawab.
     6. Perilaku atau keputusan melanggar Terms.
   - Wajib menyertakan kronologi (min 25 karakter) dan berkas bukti (JPG/PNG/WebP/PDF max 10MB via Cloudinary).
   - Status siklus: `SUBMITTED` -> `UNDER_REVIEW` -> `NEED_MORE_EVIDENCE` -> `RESOLVED` / `REJECTED`.
2. **STRICT INVARIANT: Aturan Anti-Konflik Kepentingan (Conflict-of-Interest Rule)**:
   - Admin yang terlibat langsung dalam task/submission/claim yang dilaporkan **DILARANG** menjadi penyelesai akhir laporan.
   - Seluruh laporan yang mencatut Admin secara otomatis **DIALIHKAN KE SUPER ADMIN**.
3. **Mesin Penalti Progresif (Progressive Penalties)**:
   - Tingkatan penalti:
     - `WARNING` (Peringatan tertulis)
     - `COOLDOWN` (Jeda waktu tidak boleh mengambil task baru selama X hari)
     - `TEAM_ONLY` (Hanya boleh bergabung ke Team Task)
     - `NO_LEAD` (Dilarang menjadi Team Lead)
     - `TEMPORARY_SUSPEND` (Suspend akun sementara selama X hari)
     - `ACCOUNT_SUSPEND` (Suspend akun permanen untuk pelanggaran berat)
   - Rekomendasi otomatis dibuat oleh sistem saat laporan diproses (tanpa cron).
   - Admin/Super Admin dapat mengonfirmasi rekomendasi atau melakukan **Override**.
   - **STRICT INVARIANT: Alasan Wajib Override**: Setiap override penalti oleh Admin/Super Admin **WAJIB** mencantumkan alasan tertulis (min 15 karakter).
4. **Wewenang Khusus Super Admin (Halaman 5 Spesifikasi)**:
   - 1 Akun Super Admin.
   - Mengangkat atau mencabut role Admin (`promoteToAdmin`, `demoteToMember`).
   - Mengatur konfigurasi operasional dan aturan penalti di `systemConfig`.
   - Menangani laporan yang melibatkan Admin.
   - Melihat seluruh audit trail historis.
   - **STRICT INVARIANT: Audit Immutability**: Super Admin sekalipun **DILARANG** mengubah (`update`) atau menghapus (`delete`) data audit historis pada `auditEvents`.
5. **Dashboard Audit Trail (`/admin/audit`)**:
   - Penampil riwayat audit lengkap untuk Admin & Super Admin.
   - Filter aktor, tipe aksi, entitas, dan rentang waktu.
   - Menampilkan diff before/after snapshot dan catatan alasan.

---

#### 2. Spesifikasi Teknis & Berkas yang Dibuat

1. **Skema Validasi Input Zod (`src/lib/validations/report.ts`)**:
   - `createReportSchema`:
     - `targetType`: `'TASK' | 'SUBMISSION' | 'CLAIM' | 'TEAM_DISTRIBUTION'`.
     - `targetId`: string.
     - `category`: string (dari 6 kategori resmi).
     - `chronology`: string (min 25 karakter).
     - `evidenceFiles`: array of evidence file objects (max 5 berkas, max 10MB, no video).
   - `resolveReportSchema`:
     - `reportId`: string.
     - `action`: `'RESOLVE' | 'REJECT' | 'REQUEST_EVIDENCE'`.
     - `resolutionNotes`: string (min 15 karakter).
     - `applyPenalty`: boolean.
     - `penaltyType`: `'WARNING' | 'COOLDOWN' | 'TEAM_ONLY' | 'NO_LEAD' | 'TEMPORARY_SUSPEND' | 'ACCOUNT_SUSPEND'` (opsional).
     - `penaltyDurationDays`: number (opsional).
     - `penaltyTargetUserId`: string (opsional).
     - `isOverride`: boolean.
     - `overrideReason`: string (wajib jika isOverride === true, min 15 karakter).
   - `adminRoleManagementSchema`:
     - `targetUserId`: string.
     - `action`: `'PROMOTE' | 'DEMOTE'`.
     - `reason`: string (min 15 karakter).

2. **Backend Services & Firestore Transactions**:
   - **`src/server/services/report.service.ts`**:
     - `createReport(reporterUid, input)`:
       - Memeriksa eksistensi entitas target.
       - Cek apakah entitas target melibatkan Admin (misal: claim yang diproses oleh Admin X, submission yang direview oleh Admin Y). Jika ya, tandai `involvesAdmin = true` dan `escalatedToSuperAdmin = true`.
       - Buat dokumen di `reports` (status = `SUBMITTED`).
       - Catat event `REPORT_SUBMITTED` di `auditEvents`.
     - `getReportsQueue(adminUid)`:
       - Mengambil daftar laporan.
       - Jika pemanggil adalah Super Admin: tampilkan seluruh laporan (termasuk yang dieskalasi).
       - Jika pemanggil adalah Admin biasa: sembunyikan laporan yang melibatkan dirinya sendiri (Anti-Conflict of Interest) dan laporan yang dieskalasi khusus Super Admin.
     - `resolveReport(adminUid, input)`:
       - **WAJIB** `firestore.runTransaction()`.
       - Ambil dokumen report dan target terkait.
       - **ANTI-CONFLICT CHECK**: Periksa apakah `adminUid` adalah pihak terlapor / admin pemutus yang terlibat. Jika ya, tolak: "Anda tidak dapat menyelesaikan laporan yang melibatkan diri Anda sendiri."
       - Jika laporan bertanda `involvesAdmin === true`, verifikasi pemanggil adalah `SUPER_ADMIN`.
       - Update report status (`RESOLVED`, `REJECTED`, atau `NEED_MORE_EVIDENCE`).
       - Jika `applyPenalty === true`:
         - Buat dokumen di koleksi `penalties`.
         - Update profil `users` terlapor (misal: `cooldownUntil`, `isSuspended = true`, dsb).
         - Jika `isOverride === true`, pastikan `overrideReason` tersimpan.
       - Catat event `REPORT_RESOLVED` & `PENALTY_ISSUED` di `auditEvents`.
   - **`src/server/services/admin-manage.service.ts`**:
     - `manageAdminRole(superAdminUid, input)`:
       - Verifikasi pemanggil adalah `SUPER_ADMIN`.
       - Ubah role target user di Firestore & Firebase Auth Custom Claims (`ADMIN` atau `MEMBER`).
       - Catat event `ADMIN_ROLE_UPDATED` di `auditEvents`.
   - **`src/server/services/audit.service.ts`**:
     - `getAuditEvents(adminUid, filters)`:
       - Mengambil data audit log dari `auditEvents` (diurutkan descending by timestamp).
       - STRICT INVARIANT: Tidak menyediakan fungsi update atau delete pada service audit (murni append-only).

3. **Server Actions (`src/server/actions/report.actions.ts` & `src/server/actions/admin-manage.actions.ts`)**:
   - Server Actions App Router untuk eksekusi pelaporan, resolusi, manajemen role admin, dan pengambilan log audit.

4. **Halaman & Antarmuka UI (App Router)**:
   - **Modal Buat Laporan Pengguna (`src/components/report/CreateReportModal.tsx`)**:
     - Tombol "Laporkan Masalah" pada halaman Task, Deliverable, Klaim Reward, dan Tim.
     - Pilihan 6 kategori resmi, textarea kronologi, dan dropzone berkas bukti Cloudinary.
   - **Halaman Manajemen Laporan Admin (`src/app/(dashboard)/admin/reports/page.tsx` & `[id]/page.tsx`)**:
     - Antrean laporan sengketa dengan badge kategori, status, dan label "Eskalasi Super Admin" jika melibatkan Admin.
     - Halaman detail: kronologi, viewer berkas bukti, dan panel resolusi.
     - Form penjatuhan penalti dengan rekomendasi sistem dan opsi override (input alasan wajib).
   - **Halaman Manajemen Admin Super Admin (`src/app/(dashboard)/admin/roles/page.tsx`)**:
     - Hanya dapat diakses oleh Super Admin.
     - Daftar administrator SAKODE dengan tombol "Angkat Jadi Admin" atau "Cabut Akses Admin" (modal input alasan).
   - **Halaman Audit Trail Permanen (`src/app/(dashboard)/admin/audit/page.tsx`)**:
     - Tabel log audit: Waktu (WIB), Aktor, Aksi, Entitas, Snapshot Before/After, dan Catatan Alasan.
     - Filter pencarian instan berdasarkan aksi atau aktor.
   - **Navigasi Navbar**:
     - Tambahkan tautan "Laporan Masalah" dan "Audit Trail" pada menu admin.

---

#### 3. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Pengguna dapat membuat laporan sengketa dari task, submission, claim, atau tim dengan melampirkan berkas bukti.
- [ ] Aturan Anti-Konflik Kepentingan ditegakkan: Admin terlibat dilarang memproses laporannya; laporan terkait admin otomatis dialihkan ke Super Admin.
- [ ] Rekomendasi penalti dapat dikonfirmasi atau di-override dengan kewajiban mencantumkan alasan tertulis.
- [ ] Super Admin dapat mengangkat/mencabut role Admin dengan alasan audit wajib.
- [ ] Seluruh mutasi sensitif tercatat secara append-only di `auditEvents` dan dapat dipantau di halaman `/admin/audit`.
- [ ] `npm run build` dan `npm run lint` lolos 100% tanpa error TypeScript maupun ESLint.

---

#### 4. Format Laporan Penyerahan Tugas
Kirimkan ringkasan hasil kerja sesuai format standar di `AGENTS.md`.
```
