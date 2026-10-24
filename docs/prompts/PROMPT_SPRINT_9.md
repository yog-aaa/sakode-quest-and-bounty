# PROMPT EKSEKUSI TAHAP 10: SPRINT 9 - QUALITY GATE, CONCURRENCY TESTS & FINAL MVP SIGN-OFF

> **Instruksi untuk User**: Salin seluruh teks prompt di bawah ini dan berikan langsung kepada Agent Programmer (Coder Agent) Anda.

---

```markdown
### TUGAS EKSEKUSI: SPRINT 9 - QUALITY GATE, CONCURRENCY TESTS & FINAL MVP SIGN-OFF

Halo Coder Agent! Hasil Sprint 8 telah diverifikasi dan dinyatakan **APPROVED** oleh Orchestrator / QA.
Sekarang saatnya mengeksekusi **Sprint 9: Quality Gate, Concurrency Tests & Final MVP Sign-Off** sebagai tahap final penutup MVP pada repositori `sakode-task-reward`.

Sebelum menulis kode, Anda **DIHARUSKAN** membaca dan mematuhi:
1. `AGENTS.md` (Strict Invariants & Rubrik QA)
2. `DESIGN.md` (Standar Aksesibilitas WCAG AA & Responsivitas Mobile-First)
3. `ARCHITECTURE.md` (Mekanisme Proteksi Konkurensi & Security Rules)
4. `PLANNING.md` (15 Acceptance Criteria MVP Halaman 16 Spesifikasi)

Wajib terapkan panduan dari Local Agent Skills di:
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md` (Firestore Security Rules production-grade, sanitasi transaksi)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-threat-model\SKILL.md` (Pengujian batas ekstrem race condition, pencegahan privilege escalation)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md` (Audit aksesibilitas form, focus states, kontras warna, touch target min 44px)

---

#### 1. Tujuan Sprint 9
Membangun rangkaian uji konkurensi otomatis, memublikasikan aturan keamanan Firestore (`firestore.rules`), melakukan audit aksesibilitas, serta memverifikasi pemenuhan 100% dari 15 Kriteria Penerimaan MVP resmi SAKODE Academy:
1. **Automated Concurrency Test Suite (`scripts/test-concurrency.ts`)**:
   - Skrip pengujian otomatis mandiri yang menguji 4 skenario balapan data (*race conditions*) ekstrem:
     1. **Dua Member Mengambil Slot Terakhir (Instant Take Race)**: 2 member terpisah secara serentak mengklik Instant Take pada 1 task yang sama di milidetik yang sama. Hasil: Tepat 1 member berhasil (`ACTIVE`), 1 member gagal dengan pesan ramah.
     2. **Dua Admin Menyelesaikan Review yang Sama**: 2 admin secara bersamaan mencoba mengevaluasi submission yang sama. Hasil: Hanya admin pemegang review lock sah yang berhasil; admin lain diblokir.
     3. **Dua Permintaan Claim untuk Reward Item yang Sama (Double Claim)**: Pengujian idempotency key dan status check. Hasil: Tidak ada pencatatan pembayaran ganda atau saldo ganda.
     4. **Perubahan Roster Saat Tim Mulai Aktif**: Upaya memutasi anggota tim saat `startTeamTask` dieksekusi. Hasil: Roster locking mencegah mutasi tidak sah dan seluruh anggota tim terikat 1 Active Task.
2. **Hardened Production Firestore Security Rules (`firestore.rules`)**:
   - Berkas aturan keamanan Firestore production-grade di root repositori:
     - Aturan akses koleksi `users`, `tasks`, `applications`, `teams`, `teamMemberships`, `submissions`, `rewardLedgers`, `claims`, `teamDistributions`, `reports`, `penalties`, `notifications`, dan `auditEvents`.
     - **STRICT INVARIANT: Audit Immutability**: `allow update, delete: if false;` pada koleksi `auditEvents`.
     - Data rekening `paymentAccountEncrypted` hanya dapat dibaca oleh pemilik akun dan Admin.
3. **Audit Kualitas Aksesibilitas (WCAG AA) & Mobile-First**:
   - Memastikan navigasi keyboard (Tab / Shift+Tab / Enter / Escape pada modal).
   - Memastikan touch target minimal 44x44px (`h-11`) pada seluruh tombol & input.
   - Memastikan rasio kontras warna memadai pada tema terang default.
   - Memastikan tata letak bebas overflow horizontal pada ponsel (375px), tablet (768px), dan desktop (1280px).
4. **Matriks Verifikasi 15 Acceptance Criteria MVP (Halaman 16 Spesifikasi)**:
   - Buat laporan komprehensif `docs/UAT_ACCEPTANCE_MATRIX.md` yang memetakan status pemenuhan ke-15 kriteria penerimaan MVP resmi SAKODE.

---

#### 2. Spesifikasi Teknis & Berkas yang Dibuat

1. **Automated Concurrency Test Script (`scripts/test-concurrency.ts`)**:
   - Skrip TypeScript executable via `npm run test:concurrency` (tambahkan script ini di `package.json` menggunakan `tsx` atau `node --loader ts-node/esm` atau script mandiri).
   - Mensimulasikan `Promise.all()` concurrent calls ke service `assignment.service`, `submission.service`, dan `claim.service`.
   - Mengeluarkan output laporan terminal terformat rapi dengan status PASSED/FAILED untuk tiap skenario balapan data.

2. **Production Firestore Security Rules (`firestore.rules`)**:
   - Diletakkan di root project `sakode-task-reward/firestore.rules`.
   - Aturan autentikasi ketat, role-based checks, dan pencegahan modifikasi audit log.

3. **Dokumentasi Matriks Penerimaan UAT (`docs/UAT_ACCEPTANCE_MATRIX.md`)**:
   - Memuat status pengujian 15 Kriteria Penerimaan MVP sesuai Halaman 16 dokumen spesifikasi.

4. **Package Scripts Update (`package.json`)**:
   - Tambahkan skrip: `"test:concurrency": "node scripts/run-concurrency-test.mjs"` (atau sejenisnya yang bebas dependensi eksternal).

---

#### 3. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] Skrip uji konkurensi berhasil mengeksekusi 4 skenario balapan data dan membuktikan ketahanan transaksi Firestore terhadap double assignment, double review, dan double claim.
- [ ] Berkas `firestore.rules` siap produksi tersedia di root proyek dengan penegakan immutability audit log (`allow update, delete: if false`).
- [ ] Seluruh tombol dan form memenuhi standar touch target minimal 44px dan navigasi keyboard ramah pengguna.
- [ ] Berkas `docs/UAT_ACCEPTANCE_MATRIX.md` mendokumentasikan pemenuhan 15 kriteria penerimaan MVP resmi dengan status 100% TERPENUHI.
- [ ] `npm run build` dan `npm run lint` lolos 100% tanpa error TypeScript maupun ESLint.

---

#### 4. Format Laporan Penyerahan Tugas
Kirimkan ringkasan hasil kerja sesuai format standar di `AGENTS.md`.
```
