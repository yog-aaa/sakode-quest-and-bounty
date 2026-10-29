---
trigger: model_decision
description: Aturan mutasi atomik Firestore, pencegahan race conditions, idempotensi, dan append-only audit trail untuk platform SAKODE.
---

# Aturan Mutasi Firestore SAKODE

1. **Transaksi Atomik Wajib**:
   Setiap operasi berikut wajib menggunakan `firestore.runTransaction()`:
   - Pengambilan task instan (*Instant Take*).
   - Pemilihan pelamar task (*Applicant Selection*).
   - Pengajuan dan persetujuan klaim reward (*Reward Claim & Approval*).
   - Penguncian antrean review admin (*Review-lock*).
   - Konsensus tim (100% persetujuan distribusi reward).

2. **Re-read Dalam Transaksi**:
   - Selalu baca ulang dokumen status di dalam blok transaksi sebelum mengevaluasi invariant.
   - Pengecekan sebelum transaksi (*read-before-transaction*) hanya bersifat pre-flight, bukan penjaga kebenaran akhir.

3. **Integritas Audit Trail**:
   - Koleksi `auditEvents` bersifat **Append-Only**.
   - Hanya operasi `create` / `add` yang diperbolehkan.
   - Dilarang keras melakukan operasi `update` atau `delete` pada koleksi audit.

4. **Idempotensi Finansial**:
   - Setiap mutasi finansial harus menyertakan idempotency key atau status guard untuk mencegah eksekusi ganda (*double spending*).
