# PROMPT EKSEKUSI TAHAP 9: SPRINT 8 - REALTIME NOTIFICATION CENTER, FCM & EMAIL ADAPTER

> **Instruksi untuk User**: Salin seluruh teks prompt di bawah ini dan berikan langsung kepada Agent Programmer (Coder Agent) Anda.

---

```markdown
### TUGAS EKSEKUSI: SPRINT 8 - REALTIME IN-APP NOTIFICATION, FCM & EMAIL ADAPTER

Halo Coder Agent! Hasil Sprint 7 telah diverifikasi dan dinyatakan **APPROVED** oleh Orchestrator / QA.
Sekarang saatnya mengeksekusi **Sprint 8: Realtime In-App Notification Center, FCM & Email Adapter** pada repositori `sakode-task-reward`.

Sebelum menulis kode, Anda **DIHARUSKAN** membaca dan mematuhi:
1. `AGENTS.md` (Strict Invariants: Non-blocking Notifications, Error Handling Indonesia)
2. `DESIGN.md` (Spesifikasi visual lonceng notifikasi, badge belum dibaca, card notifikasi)
3. `ARCHITECTURE.md` (Koleksi `notifications`, Arsitektur Non-blocking FCM & Email Adapter)
4. `PLANNING.md` (Sprint 8 Deliverables & Kriteria Penerimaan MVP No. 12)

Wajib terapkan panduan dari Local Agent Skills di:
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md` (Sanitasi link notifikasi, isolasi kegagalan pihak ketiga, non-blocking promise)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\frontend-design\SKILL.md` (Dropdown / drawer notifikasi elegan, indikator unread, layout template email HTML SAKODE)
- `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md` (Aksesibilitas menu popover/drawer, state baca/belum baca WCAG, touch target min 44px)

---

#### 1. Tujuan Sprint 8
Membangun pusat notifikasi waktu nyata (real-time), integrasi Web Push FCM, dan adapter email transaksional yang terisolasi dari database utama:
1. **Pusat Notifikasi In-App Realtime (Firestore)**:
   - Disimpan di koleksi `notifications` Firestore (`userId`, `title`, `message`, `category`, `link`, `isRead`, `createdAt`).
   - 10 Kategori Notifikasi Resmi SAKODE (Halaman 12-13 Spesifikasi):
     1. `ACCOUNT`: Akun disetujui atau ditolak
     2. `APPLICATION`: Permohonan task diterima atau ditolak
     3. `TEAM`: Undangan tim atau status keanggotaan diperbarui
     4. `SUBMISSION`: Deliverable diterima untuk ditinjau
     5. `REVISION`: Revisi diminta oleh Admin
     6. `APPEAL`: Sanggahan atau banding diputuskan
     7. `REWARD`: Reward baru tersedia untuk diklaim
     8. `CLAIM`: Pencairan klaim diproses atau dibayar
     9. `CONSENSUS`: Proposal pembagian honor tim memerlukan persetujuan voting
     10. `REPORT`: Laporan sengketa mendapat tanggapan atau keputusan
   - Realtime Listener (`onSnapshot`) di frontend: pembaruan instan tanpa perlu refresh halaman.
   - Popover / Drawer notifikasi di Navbar dengan counter badge merah/oranye dan tombol **"Tandai Semua Dibaca (Mark All as Read)"**.
   - Halaman notifikasi lengkap: `/member/notifications` dan `/admin/notifications`.
2. **Web Push Notification Adapter (Firebase Cloud Messaging - FCM)**:
   - Service worker `public/firebase-messaging-sw.js` untuk menerima push notification di latar belakang browser.
   - Layanan pendaftaran token perangkat FCM ke dokumen `users/{uid}.fcmTokens`.
   - **STRICT INVARIANT: Non-Blocking Architecture**: Kegagalan push FCM (token kedaluwarsa / izin ditolak) **MUTLAK TIDAK BOLEH** membatalkan mutasi transaksi atau aksi utama.
3. **Decoupled Transactional Email Adapter**:
   - Adapter pattern independen di `src/server/services/email/`:
     - Driver pengiriman via **Resend** (menggunakan `RESEND_API_KEY` dan `EMAIL_FROM_ADDRESS` dari `.env.local`).
     - Fallback aman: jika API key kosong atau pengiriman gagal, cetak log peringatan tanpa membuat server crash.
     - Template email HTML bermerek resmi SAKODE (Font Nunito, Cyan `#71CFFE`, Teks `#172033`):
       - Template 1: Akun Disetujui (Welcome to SAKODE)
       - Template 2: Revisi Diminta pada Task
       - Template 3: Pencairan Honor Telah Ditransfer
       - Template 4: Musyawarah Pembagian Tim Memerlukan Suara
   - **STRICT INVARIANT: Non-Blocking Architecture**: Kegagalan pengiriman email **MUTLAK TIDAK BOLEH** me-rollback task, review, atau pembayaran database.
4. **Integrasi Dispatcher Notifikasi**:
   - Helper server `dispatchNotification(recipientUid, payload)` yang otomatis mengirimkan ke:
     - Firestore `notifications` (In-App)
     - FCM Web Push (jika token aktif ada)
     - Email Transaksional (jika peristiwa bernilai penting)
   - Tautkan helper ini pada aksi-aksi kritis di service sebelumnya (`user.service`, `assignment.service`, `submission.service`, `appeal.service`, `claim.service`, `report.service`).

---

#### 2. Spesifikasi Teknis & Berkas yang Dibuat

1. **Skema Validasi Input Zod (`src/lib/validations/notification.ts`)**:
   - `markNotificationReadSchema`: `notificationId: string`.
   - `registerFCMTokenSchema`: `token: string`.

2. **Backend Services & Notifications Layer**:
   - **`src/server/services/notification.service.ts`**:
     - `createNotification(recipientUid, payload)`: Menulis dokumen ke `notifications`.
     - `getUserNotifications(userId, limit)`: Mengambil riwayat notifikasi pengguna.
     - `markAsRead(userId, notificationId)`: Mengubah `isRead = true`.
     - `markAllAsRead(userId)`: Mengubah seluruh notifikasi pengguna menjadi `isRead = true` via batched write.
     - `registerDeviceToken(userId, fcmToken)`: Menyimpan token FCM ke `users/{uid}`.
     - `dispatchNotification(recipientUid, options)`: Fungsi terpadu non-blocking yang mengeksekusi in-app + push + email secara paralel dan aman.
   - **`src/server/services/email/email.adapter.ts`**:
     - Interface `EmailAdapter` dan implementasi `ResendEmailAdapter`.
     - Fungsi `sendEmailSafe(to, subject, html, text)`: Dibungkus `try/catch` tanpa melempar unhandled error.
   - **`src/server/services/email/templates/`**:
     - `accountApprovedEmail.ts`
     - `revisionRequestedEmail.ts`
     - `claimPaidEmail.ts`
     - `teamConsensusEmail.ts`
   - **`src/server/services/fcm.service.ts`**:
     - Helper pengiriman FCM multicast ke token pengguna via `firebase-admin/messaging` (aman try/catch).

3. **Server Actions (`src/server/actions/notification.actions.ts`)**:
   - Server Actions App Router untuk penandaan baca, token register, dan pengambilan notifikasi.

4. **Service Worker & Client Push Helper**:
   - `public/firebase-messaging-sw.js`: Service worker penanganan push background.
   - `src/lib/firebase/messaging.ts`: Helper client untuk request permission & token.

5. **Halaman & Antarmuka UI (App Router)**:
   - **Komponen Lonceng Notifikasi (`src/components/notification/NotificationBell.tsx`)**:
     - Lonceng interaktif di `Navbar` desktop dan `MobileNav` mobile.
     - Badge hitungan belum dibaca (*Unread count*).
     - Dropdown popover menampilkan 5 notifikasi terbaru, waktu relatif, dan tombol "Tandai Semua Dibaca" serta tautan "Lihat Semua Notifikasi".
     - Realtime listener Firestore (`onSnapshot`) yang responsif.
   - **Halaman Pusat Notifikasi Lengkap (`src/app/(dashboard)/member/notifications/page.tsx` & `/admin/notifications/page.tsx`)**:
     - Daftar notifikasi lengkap dengan filter kategori (Akun, Task, Tim, Review, Keuangan, Laporan) dan filter Belum Dibaca.
     - Kartu notifikasi yang dapat diklik langsung mengarahkan ke link terkait.
   - **Banner Izin Push Notification (`src/components/notification/PushPermissionBanner.tsx`)**:
     - Banner halus yang menanyakan apakah pengguna ingin mengaktifkan notifikasi push browser.

---

#### 3. Kriteria Keberhasilan (Acceptance Criteria)
- [ ] In-app notification center realtime berfungsi di Firestore dan memperbarui unread badge secara live tanpa reload.
- [ ] Pengguna dapat menandai notifikasi sebagai sudah dibaca satuan maupun sekaligus (Mark All as Read).
- [ ] Service worker FCM dan adapter email transaksional Resend terintegrasi dengan template HTML SAKODE.
- [ ] STRICT INVARIANT TERPENUHI: Kegagalan FCM atau email (misal API key dummy / koneksi putus) TIDAK PERNAH membatalkan aksi transaksi database utama.
- [ ] Event langsung (akun disetujui, revisi diminta, reward cair, voting tim) otomatis mengirimkan notifikasi.
- [ ] `npm run build` dan `npm run lint` lolos 100% tanpa error TypeScript maupun ESLint.

---

#### 4. Format Laporan Penyerahan Tugas
Kirimkan ringkasan hasil kerja sesuai format standar di `AGENTS.md`.
```
