# SKILLS_GUIDE.md — Panduan Pemanfaatan Local Agent Skills

Dokumen ini memandu **Coder Agent** untuk mengakses dan memanfaatkan secara maksimal seluruh skill pengembangan web yang telah terpasang di:
📂 `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\`

---

## 1. Daftar Skill & Panduan Pemanfaatan

### 1. `frontend-design`
* **Lokasi**: `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\frontend-design\SKILL.md`
* **Kapan Dibaca**: Setiap kali membuat atau merombak komponen antarmuka, layout dashboard, atau kartu task.
* **Instruksi Kunci**:
  * Hindari desain generik "AI slop" (misal: font Inter/Arial biasa, gradient ungu membosankan di latar putih tanpa konteks).
  * Terapkan arah estetika SAKODE secara konsisten: perpaduan struktur dashboard profesional SIMADEP dengan elemen visual anime/RPG halus (bounty card, quest progress, tiering kesulitan).
  * Perhatikan detail mikro: border tipis `#DBE8F0`, aksen cyan `#71CFFE`, purple `#BC71FE` untuk konteks tim, dan orange `#F9723B` untuk deadline.

### 2. `tailwind-design-system`
* **Lokasi**: `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\tailwind-design-system\SKILL.md`
* **Kapan Dibaca**: Saat mengonfigurasi tema, menyusun variabel CSS, membuat varian komponen, dan merapikan utility classes.
* **Instruksi Kunci**:
  * Gunakan token semantik yang dapat diskalakan.
  * Pastikan komponen UI primitif (`Button`, `Card`, `Badge`, `Modal`) memiliki varian status yang rapi dan konsisten.
  * Jaga agar tidak terjadi duplikasi styling sembarangan.

### 3. `security-best-practices` & `security-threat-model`
* **Lokasi**:
  * `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md`
  * `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-threat-model\SKILL.md`
* **Kapan Dibaca**: Saat membangun Server Actions, Route Handlers, skema validasi Zod, dan transaksi Firestore.
* **Instruksi Kunci**:
  * Seluruh input dari client harus divalidasi ketat di server menggunakan Zod.
  * Hindari mempercayai status atau timestamp dari client browser — selalu gunakan `admin.firestore.FieldValue.serverTimestamp()`.
  * Enkripsi data pembayaran sebelum masuk ke database, tampilkan selalu dalam format *masked*.
  * Terapkan transaksi atomik (`firestore.runTransaction`) untuk mencegah race condition / double spending.

### 4. `web-design-guidelines`
* **Lokasi**: `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\web-design-guidelines\SKILL.md`
* **Kapan Dibaca**: Saat mengecek kepatuhan aksesibilitas, responsivitas layar kecil, dan ergonomi form.
* **Instruksi Kunci**:
  * Pastikan touch target di mobile memiliki tinggi minimal `44px`.
  * Setiap status task harus memiliki teks dan ikon, bukan hanya warna (WCAG AA).
  * Navigasi form dapat diakses dengan keyboard (tab index, focus-visible ring).

### 5. `animate`
* **Lokasi**: `C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\animate\SKILL.md`
* **Kapan Dibaca**: Saat mengimplementasikan animasi transisi status, feedback loading, atau modal dialog.
* **Instruksi Kunci**:
  * Animasi harus bermakna dan tidak mengganggu alur kerja operasional.
  * Gunakan easing yang halus (`cubic-bezier` yang natural) dan durasi ringkas (150ms - 250ms).

---

## 2. Cara Coder Agent Membaca File Skill

Coder Agent dapat membaca langsung file `SKILL.md` pada path absolut lokal:
```powershell
# Contoh membaca panduan frontend-design
Get-Content "C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\frontend-design\SKILL.md"

# Contoh membaca panduan security-best-practices
Get-Content "C:\Users\yogaa\Document Local\AGENT-SKILLS\skills\security-best-practices\SKILL.md"
```
Atau menggunakan tool `read_file` pada path tersebut.
