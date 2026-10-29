---
trigger: model_decision
description: Aturan integer Rupiah, zero-decimal, masking nomor rekening, enkripsi data pembayaran, dan snapshot klaim reward SAKODE.
---

# Aturan Keuangan & Data Rekening SAKODE

1. **Integer Rupiah (Zero-Float)**:
   - Seluruh nominal reward, saldo, dan transaksi keuangan disimpan dan diproses dalam **Integer IDR** murni (contoh: `Rp 250.000` = `250000`).
   - Dilarang keras menggunakan tipe data `float`, `double`, atau pembagian desimal di database.

2. **Enkripsi Sebelum Persistence**:
   - Nomor rekening bank dan e-wallet wajib dienkripsi di level aplikasi (`src/lib/crypto.ts`) sebelum disimpan ke Firestore.

3. **Masking di Tampilan Pengguna**:
   - Tampilan nomor rekening pada UI publik dan member wajib menggunakan format bertopeng (*masked*), misalnya: `BCA ****1234` atau `GoPay ****8899`.
   - Data lengkap hanya didekripsi pada sesi admin berwenang yang sedang memproses pencairan.

4. **Snapshot Rekening Saat Klaim**:
   - Saat klaim reward diajukan, data rekening penerima disalin sebagai snapshot permanen di dokumen klaim untuk membekukan rekening tujuan pembayaran.
