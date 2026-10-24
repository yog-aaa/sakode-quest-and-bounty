# PROMPT EKSEKUSI TAHAP 4: SPRINT 3 - TEAM TASK LIFECYCLE, RECRUITMENT & ROSTER LOCKING

> **Instruksi untuk User**: Salin seluruh teks prompt di bawah ini dan berikan langsung kepada Agent Programmer (Coder Agent) Anda.

---

```markdown
### TUGAS EKSEKUSI: SPRINT 3 - TEAM TASK LIFECYCLE, RECRUITMENT & ROSTER LOCKING

Halo Coder Agent! Hasil Sprint 2 telah diverifikasi dan dinyatakan **APPROVED** oleh Orchestrator / QA.
Sekarang saatnya mengeksekusi **Sprint 3: Team Task Lifecycle, Recruitment & Roster Locking** pada repositori `sakode-task-reward`.

Sebelum menulis kode, Anda **DIHARUSKAN** membaca dan mematuhi:
1. `AGENTS.md` (Strict Invariants & Protokol Tektokan)
2. `DESIGN.md` (Spesifikasi visual mode tim, token `sakode-purple`, avatar roster)
3. `ARCHITECTURE.md` (Modul Team Management, Koleksi teams & teamMemberships, Transaksi Atomik)
4. `PLANNING.md` (Sprint 3 Deliverables & Kriteria Penerimaan MVP No. 5 & 6)

Wajib terapkan panduan dari Local Agent Skills di:
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md` (Firestore runTransaction untuk konsensus & penguncian roster)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-threat-model\SKILL.md` (Penegakan activeTaskId pada seluruh anggota tim, proteksi hak akses Team Lead)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\frontend-design\SKILL.md` (Aksen kolaborasi sakode-purple, tampilan party/roster tim RPG yang elegan)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md` (Dialog konfirmasi syarat & ketentuan, touch target min 44px)

---

#### 1. Tujuan Sprint 3
Membangun siklus lengkap manajemen pekerjaan tim (**Team Task**):
1. Orang pertama yang mengambil task (Instant Take) atau applicant yang dipilih Admin otomatis menjadi **Team Lead**.
2. Team Lead dapat membuka recruitment, membagikan link/kode undangan, serta menyetujui calon anggota tim.
3. Penegakan 4 syarat sebelum task tim dapat dimulai (`ACTIVE`):
   - Jumlah minimum anggota tim terpenuhi (`memberCount >= minMembers`).
   - Setiap anggota memenuhi kelayakan (akun `APPROVED` dan tidak sedang memiliki Active Task).
   - Setiap anggota menyetujui *Terms & Conditions*.
   - Seluruh anggota tim menyetujui prinsip pembagian reward awal (`EQUAL` atau `CONTRIBUTION_BASED`).
4. **Strict Invariant**: Saat tim berubah menjadi `ACTIVE`, **seluruh anggota tim dihitung memegang 1 Active Task** (`user.activeTaskId = taskId`).
5. **Roster Locking**: Roster anggota dikunci secara permanen saat `ACTIVE` (hanya Admin yang dapat override jika terjadi keadaan darurat, dicatat di `auditEvents`).
6. **Perhitungan Deadline**: Untuk *Duration-based Deadline*, timer durasi baru mulai dihitung saat status tim berganti menjadi `ACTIVE`.

---

#### 2. Spesifikasi Teknis & Berkas yang Dibuat

1. **Skema Validasi Input Zod (`src/lib/validations/team.ts`)**:
   - `joinTeamSchema`: `teamId`, `inviteCode`, `message` (opsional).
   - `approveMemberSchema`: `teamId`, `memberUserId`.
   - `teamConsentSchema`: `teamId`, `agreedTermsVersion`, `agreedSplitPrinciple: 'EQUAL' | 'CONTRIBUTION_BASED'`.
   - `adminOverrideRosterSchema`: `teamId`, `action: 'ADD' | 'REMOVE'`, `targetUserId`, `reason: string` (min 10 karakter).

2. **Backend Services & Firestore Transactions (`src/server/services/team.service.ts`)**:
   - `initializeTeam(taskId, teamLeadUserId, initialSplitPrinciple)`:
     - Dijalankan otomatis saat Team Task diambil (Instant Take) atau applicant dipilih.
     - Membuat dokumen di `teams` (`status = 'RECRUITING'`, `teamLeadUserId`, `minMembers`, `maxMembers`, `inviteCode` unik 6 karakter, `rosterLocked = false`).
     - Membuat dokumen `teamMemberships` untuk Team Lead (`roleInTeam = 'LEAD'`, `status = 'TERMS_ACCEPTED'`).
   - `requestJoinTeam(userId, inviteCode)`:
     - Memeriksa user `approvalStatus === 'APPROVED'` dan `activeTaskId === null`.
     - Memeriksa tim masih dalam status `RECRUITING` dan belum melebihi `maxMembers`.
     - Membuat dokumen `teamMemberships` (`status = 'APPLIED'`).
   - `approveJoinRequest(teamLeadUid, teamId, targetUserId)`:
     - Verifikasi caller adalah Team Lead dari tim tersebut.
     - Mengubah status `teamMemberships` target menjadi `APPROVED`.
     - Menambah `memberCount` pada dokumen `teams`.
   - `submitMemberConsent(userId, teamId, agreedTermsVersion, agreedSplit)`:
     - Member menyetujui Terms dan prinsip pembagian awal.
     - Mengubah status `teamMemberships` menjadi `TERMS_ACCEPTED`.
   - `startTeamTask(teamLeadUid, teamId)`:
     - **WAJIB** menggunakan `firestore.runTransaction()`.
     - Verifikasi caller adalah Team Lead.
     - Cek: `memberCount >= minMembers`.
     - Cek: Seluruh anggota tim di `teamMemberships` telah berstatus `TERMS_ACCEPTED`.
     - Cek: Tidak ada anggota tim yang tiba-tiba mengambil active task lain di tengah jalan.
     - Hitung `deadlineAt`: Jika duration-based, hitung `now + durationMinutes`.
     - Perbarui status tim: `status = 'ACTIVE'`, `rosterLocked = true`.
     - Perbarui status task: `status = 'ACTIVE'`, `assignedTeamId = teamId`, `deadlineAt`.
     - **STRICT INVARIANT**: Perbarui dokumen seluruh anggota tim di koleksi `users` (`activeTaskId = taskId`).
     - Catat audit event `TEAM_TASK_STARTED` di `auditEvents`.
   - `adminOverrideTeamRoster(adminUid, input)`:
     - Pengecualian darurat hanya oleh Admin dengan alasan wajib, dicatat di `auditEvents`.

3. **Server Actions (`src/server/actions/team.actions.ts`)**:
   - Server Actions App Router untuk integrasi komponen interaktif UI.

4. **Halaman & Antarmuka UI (App Router)**:
   - **Komponen Roster Tim (`src/components/team/TeamRosterCard.tsx`)**:
     - Visualisasi party kolaborasi bernuansa aksen SAKODE Purple (`#BC71FE`).
     - Daftar slot anggota: Avatar, nama, role (Team Lead badge emas/purple, Member), status checklist (Terms Disetujui, Prinsip Pembagian Disetujui).
     - Link / tombol salin kode undangan tim (*Copy Invite Code*).
   - **Halaman Ruang Kolaborasi Tim (`src/app/(dashboard)/member/teams/[id]/page.tsx` atau tab di `/member/tasks/[id]`)**:
     - Status fase tim: `RECRUITING` (menunggu kuota & persetujuan), `READY` (semua setuju, siap dimulai), atau `ACTIVE` (sedang berjalan, roster terkunci).
     - Bagi Calon Anggota: Tombol "Gabung Tim" dengan input kode undangan.
     - Bagi Anggota Tim: Modal konfirmasi persetujuan Terms dan pemilihan voting prinsip pembagian reward (Rata vs Kontribusi).
     - Bagi Team Lead: Panel kelola permintaan bergabung (tombol Terima / Tolak) dan tombol besar **"Mulai Kerjakan Task Bersama Tim"** (hanya aktif jika syarat 100% terpenuhi).
   - **Dashboard Admin Tim (`src/app/(dashboard)/admin/tasks/page.tsx`)**:
     - Tab status Tim: Menampilkan kuota terisi (misal: 3/5 Anggota), status konsensus awal, dan tombol darurat "Kelola Roster Tim" (Admin Override).

---

#### 3. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Orang pertama / applicant terpilih pada Team Task otomatis menjadi Team Lead dan dokumen tim terbuat.
- [ ] Calon anggota dapat meminta bergabung via kode undangan dan disetujui oleh Team Lead.
- [ ] Task tim tidak dapat dimulai jika kuota minimum anggota belum terpenuhi atau ada anggota yang belum menyetujui Terms & prinsip pembagian.
- [ ] Transaksi atomik mengunci roster tim menjadi ACTIVE dan menandai `activeTaskId` pada SELURUH anggota tim secara bersamaan.
- [ ] Timer durasi pengerjaan tim baru dimulai tepat saat task berubah status menjadi ACTIVE.
- [ ] Anggota tim yang aktif dicegah mengambil task lain di seluruh platform (aturan 1 Active Task).
- [ ] `npm run build` dan `npm run lint` lolos 100% tanpa error TypeScript maupun ESLint.

---

#### 4. Format Laporan Penyerahan Tugas
Kirimkan ringkasan hasil kerja sesuai format standar di `AGENTS.md`.
```
