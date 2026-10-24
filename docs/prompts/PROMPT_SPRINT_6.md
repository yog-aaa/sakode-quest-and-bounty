# PROMPT EKSEKUSI TAHAP 7: SPRINT 6 - FINANCIAL LEDGER, SOLO CLAIM & TEAM 100% CONSENSUS DISTRIBUTION

> **Instruksi untuk User**: Salin seluruh teks prompt di bawah ini dan berikan langsung kepada Agent Programmer (Coder Agent) Anda.

---

```markdown
### TUGAS EKSEKUSI: SPRINT 6 - FINANCIAL LEDGER, SOLO CLAIM & TEAM 100% CONSENSUS DISTRIBUTION

Halo Coder Agent! Hasil Sprint 5 telah diverifikasi dan dinyatakan **APPROVED** oleh Orchestrator / QA.
Sekarang saatnya mengeksekusi **Sprint 6: Financial Ledger, Solo Claim & Team 100% Consensus Distribution** pada repositori `sakode-task-reward`.

Sebelum menulis kode, Anda **DIHARUSKAN** membaca dan mematuhi:
1. `AGENTS.md` (Strict Invariants: Integer Rupiah, Snapshot Rekening, Idempotency, 100% Konsensus)
2. `DESIGN.md` (Spesifikasi visual status klaim: Available -> Claimed -> Processing -> Paid -> Confirmed)
3. `ARCHITECTURE.md` (Modul Reward & Claim Ledger, Koleksi `rewardLedgers`, `claims`, `teamDistributions`)
4. `PLANNING.md` (Sprint 6 Deliverables & Kriteria Penerimaan MVP No. 8 & 9)

Wajib terapkan panduan dari Local Agent Skills di:
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md` (Firestore runTransaction untuk pencairan dana, idempotency keys, snapshot rekening permanen)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-threat-model\SKILL.md` (Pencegahan double-claim, verifikasi kepemilikan rekening terenkripsi, proteksi pembagian tim)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\frontend-design\SKILL.md` (Widget pencairan batch "Cairkan Semua", kartu distribusi tim, status tracker pembayaran)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md` (Dialog konfirmasi transfer manual admin, modal upload bukti transfer, touch target min 44px)

---

#### 1. Tujuan Sprint 6
Membangun siklus keuangan, pencairan honor solo secara batch, dan pembagian reward tim berbasis konsensus 100%:
1. **Reward Ledger Generator**:
   - Saat Solo Task disetujui (`status === 'APPROVED'`), sistem membuat 1 dokumen di `rewardLedgers` (status: `AVAILABLE`, Integer Rupiah).
   - Saat Partial Completion ditetapkan, sistem membuat reward item parsial.
2. **Solo Task Batch Claim Engine**:
   - Member dapat melihat reward tersedia, memilih multi-item reward atau menggunakan tombol cepat **"Cairkan Semua (Claim All)"**.
   - **STRICT INVARIANT: Satu Reward Item Tidak Dapat Dicairkan Sebagian**: Item dicairkan utuh.
   - **Snapshot Data Rekening**: Saat claim diajukan, sistem menyimpan snapshot data rekening `{ bankName, accountNumber, accountHolderName }` pada dokumen `claims` agar perubahan profil masa depan tidak merusak riwayat transaksi.
   - **Idempotency Key**: String unik per permohonan claim untuk mencegah duplikasi catatan pencairan.
   - Siklus status: `AVAILABLE` -> `CLAIMED` -> `PROCESSING` -> `PAID` -> `CONFIRMED`.
3. **Pembayaran & Verifikasi Admin**:
   - Admin mentransfer manual dan mengunggah berkas bukti transfer (via Cloudinary signed upload).
   - Member mengonfirmasi penerimaan dana ("Konfirmasi Penerimaan").
4. **Mekanisme Reward & Pembayaran Team Task**:
   - **Proposal Konsensus Team Lead**: Team Lead mengajukan nominal final per anggota (`sum(allocations) === totalReward`).
   - **Aturan Konsensus 100%**:
     - Seluruh anggota tim WAJIB menyetujui nominal akhir.
     - 1 penolakan mengembalikan proposal ke tahap musyawarah dengan catatan evaluasi.
     - Riwayat proposal dan persetujuan tidak dapat dihapus.
   - **Pencairan Tim**:
     - Setelah konsensus 100% tercapai, total reward menjadi 1 reward item yang diclaim oleh **Team Lead**.
     - Admin hanya melakukan **SATU transfer penuh** kepada Team Lead.
   - **Alur Distribusi Tim**:
     1. Team Lead menerima dana dari Admin.
     2. Team Lead mentransfer ke masing-masing anggota sesuai nominal kesepakatan.
     3. Team Lead mengunggah bukti transfer per anggota ke sistem.
     4. Seluruh anggota mengonfirmasi penerimaan dana masing-masing.
     5. Team Task beralih menjadi status `CLOSED` setelah seluruh distribusi dikonfirmasi.

---

#### 2. Spesifikasi Teknis & Berkas yang Dibuat

1. **Skema Validasi Input Zod (`src/lib/validations/claim.ts`)**:
   - `createClaimSchema`:
     - `rewardLedgerIds`: array of string (minimal 1 ID).
     - `idempotencyKey`: string.
   - `processClaimSchema`:
     - `claimId`: string.
     - `action`: `'PROCESS' | 'PAY'`.
     - `transferProofUrl`: string (wajib jika action === PAY).
     - `transferProofPublicId`: string (opsional).
     - `adminNotes`: string (opsional).
   - `proposeTeamSplitSchema`:
     - `teamId`: string.
     - `taskId`: string.
     - `allocations`: array of `{ userId: string, amount: number }` (jumlah total harus cocok dengan totalReward task).
   - `voteTeamSplitSchema`:
     - `teamId`: string.
     - `agreed`: boolean.
     - `rejectionReason`: string (opsional, min 10 karakter jika agreed === false).
   - `uploadLeadTransferProofSchema`:
     - `teamId`: string.
     - `memberUserId`: string.
     - `transferProofUrl`: string.
   - `confirmMemberReceiptSchema`:
     - `claimId`: string (untuk solo) atau `teamDistributionId` (untuk anggota tim).

2. **Backend Services & Firestore Transactions (`src/server/services/claim.service.ts`)**:
   - `createRewardLedgerForTask(taskId, recipientUserId, amount, teamId)`:
     - Membuat dokumen di `rewardLedgers` dengan status `AVAILABLE`.
   - `submitBatchClaim(userId, input)`:
     - **WAJIB** `firestore.runTransaction()`.
     - Mengambil data profil user & dekripsi data rekening bank.
     - Mengambil seluruh `rewardLedgers` yang dipilih.
     - Verifikasi: Seluruh ledger dimiliki oleh `userId` dan berstatus `AVAILABLE`.
     - Hitung total amount (Integer Rupiah).
     - Buat dokumen di `claims` (snapshot rekening, idempotency key, status `CLAIMED`).
     - Perbarui status seluruh ledger terpilih menjadi `CLAIMED` dan tautkan `claimId`.
     - Catat event `CLAIM_CREATED` di `auditEvents`.
   - `adminProcessClaim(adminUid, input)`:
     - **WAJIB** `firestore.runTransaction()`.
     - Verifikasi hak admin.
     - Jika action === 'PAY': simpan `transferProofUrl`, set status `PAID`, catat `processedByAdminId = adminUid`, `processedAt = now`.
     - Perbarui seluruh ledger terkait menjadi `PAID`.
     - Catat event `CLAIM_PAID` di `auditEvents`.
   - `confirmClaimReceipt(userId, claimId)`:
     - Verifikasi pemanggil adalah pemilik claim.
     - Set status claim `CONFIRMED`, `confirmedAt = now`.
     - Catat event `CLAIM_CONFIRMED` di `auditEvents`.
   - `proposeTeamSplitDistribution(teamLeadUid, input)`:
     - Verifikasi caller adalah Team Lead.
     - Verifikasi `sum(allocations) === task.totalReward`.
     - Buat dokumen di `teamDistributions` (`consensusReached = false`).
     - Catat event `TEAM_SPLIT_PROPOSED` di `auditEvents`.
   - `voteTeamSplitDistribution(userId, input)`:
     - **WAJIB** `firestore.runTransaction()`.
     - Anggota menyetujui atau menolak proposal pembagian reward.
     - Jika ada 1 penolakan: set `status = 'DELIBERATION_REJECTED'`, simpan alasan penolakan.
     - Jika seluruh anggota menyetujui (100% konsensus): set `consensusReached = true`, buat 1 reward item di `rewardLedgers` milik Team Lead sebesar total bounty task.
     - Catat event `TEAM_SPLIT_VOTED` di `auditEvents`.
   - `uploadTeamLeadMemberProof(teamLeadUid, input)`:
     - Team Lead mengunggah bukti transfer per anggota.
   - `confirmTeamMemberDistribution(userId, teamDistributionId)`:
     - Anggota tim mengonfirmasi telah menerima transfer dari Team Lead.
     - Jika SELURUH anggota tim telah mengonfirmasi: ubah status task dan tim menjadi `CLOSED`.

3. **Server Actions (`src/server/actions/claim.actions.ts`)**:
   - Actions Next.js App Router untuk seluruh interaksi finansial.

4. **Halaman & Antarmuka UI (App Router)**:
   - **Halaman Manajemen Reward & Klaim Member (`src/app/(dashboard)/member/rewards/page.tsx`)**:
     - Ringkasan Saldo: Total Siap Klaim (Rp xxx.xxx), Sedang Diproses (Rp xxx.xxx), Total Telah Dicairkan.
     - Daftar Item Reward Tersedia dengan checkbox pilihan dan tombol besar **"Cairkan Semua (Claim All)"**.
     - Modal Konfirmasi Klaim: Menampilkan rincian daftar task, total pencairan integer IDR, dan verifikasi nomor rekening tujuan yang ter-mask.
     - Tab Riwayat Pencairan: Status berjenjang (Claimed -> Processing -> Paid -> Confirmed) dengan tombol "Lihat Bukti Transfer Admin" dan tombol **"Konfirmasi Penerimaan Dana"**.
   - **Halaman Manajemen Pencairan Admin (`src/app/(dashboard)/admin/claims/page.tsx`)**:
     - Antrean klaim menunggu transfer dengan snapshot rekening tujuan dan tombol unmask aman.
     - Modal "Kirim Pembayaran": Upload berkas bukti transfer via Cloudinary dan tombol konfirmasi transfer selesai.
   - **Komponen & Panel Konsensus Pembagian Tim (`src/components/team/TeamDistributionModal.tsx`)**:
     - Bagi Team Lead: Form alokasi nominal per anggota tim dengan indikator validasi real-time `Sisa Alokasi: Rp 0` (harus 100% pas).
     - Bagi Anggota Tim: Banner voting proposal nominal pembagian reward dengan tombol "Setuju" atau "Tolak" (input alasan musyawarah).
     - Panel Pasca Pembayaran: Team Lead mengunggah bukti per anggota, dan masing-masing anggota memiliki tombol "Konfirmasi Penerimaan Honor".

---

#### 3. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Task yang disetujui menghasilkan reward item integer Rupiah di rewardLedgers.
- [ ] Member dapat mencairkan beberapa reward sekaligus dalam batch (Claim All).
- [ ] Snapshot data rekening tersimpan permanen pada dokumen claim dan dilindungi idempotency key.
- [ ] Admin dapat memproses klaim, mengunggah bukti transfer, dan member dapat mengonfirmasi penerimaan.
- [ ] Team Lead dapat mengajukan proposal pembagian reward dan wajib disetujui 100% oleh seluruh anggota tim.
- [ ] 1 penolakan mengembalikan proposal tim ke musyawarah; konsensus 100% membuka klaim untuk Team Lead.
- [ ] Team Lead mengunggah bukti transfer per anggota, seluruh anggota mengonfirmasi, dan task tim berubah menjadi CLOSED.
- [ ] `npm run build` dan `npm run lint` lolos 100% tanpa error TypeScript maupun ESLint.

---

#### 4. Format Laporan Penyerahan Tugas
Kirimkan ringkasan hasil kerja sesuai format standar di AGENTS.md.
```
