# SKILLS_GUIDE.md — Panduan Pemanfaatan Skills Antigravity SAKODE

Dokumen ini memandu implementer dan orkestrator dalam memanfaatkan sistem skill Antigravity untuk repositori **SAKODE Task & Reward Platform** (`sakode-task-reward`).

---

## 1. Lokasi & Penyimpanan Skills

1. **Koleksi Sumber Custom Skills (Root Hub)**:
   `C:\Users\yogaa\Document Local\AGENT-SKILLS\`
   - Berisi 35 custom skills di `skills/<nama-skill>/SKILL.md`.
   - Terhubung secara resmi ke Antigravity via plugin junction di `~/.gemini/config/plugins/agent-skills`.
   - *(Repositori sumber ini bersifat read-only bagi task project. Dilarang mengubah file sumber langsung dari repo project).*

2. **Project-Local Skills SAKODE**:
   `.agents/skills/<nama-skill>/SKILL.md`
   - Salinan terpilih skill yang relevan langsung untuk SAKODE (`frontend-design`, `tailwind-design-system`, `web-design-guidelines`, `animate`, `security-best-practices`, `security-threat-model`, `shadcn`).
   - Dapat diakses langsung oleh subagent di dalam lingkungan workspace.

---

## 2. Prinsip Progressive Disclosure

Dalam memanfaatkan skill, agen wajib menerapkan prinsip keterbukaan bertahap (*progressive disclosure*):

1. **Jangan Memuat Seluruh Skill**: Jangan pernah memuat atau membaca seluruh isi direktori skill ke dalam konteks sekaligus.
2. **Cek Deskripsi & Kebutuhan Terlebih Dahulu**: Identifikasi skill yang benar-benar dibutuhkan oleh task aktif.
3. **Baca `SKILL.md` yang Dipilih**: Baca berkas `SKILL.md` lokal secara lengkap dan terarah saat eksekusi dimulai.
4. **Skills Tidak Memperluas Otorisasi**: Skill menyediakan panduan desain dan arsitektur, bukan memperluas akses mutasi atau izin eksternal.

---

## 3. Matriks Routing Skill Berdasarkan Tugas

| Domain Tugas | Agen Terkait | Skill Rujukan Lokal (`.agents/skills/...`) | Fokus Panduan |
|---|---|---|---|
| **Antarmuka & Estetika Visual** | `frontend-engineer` | `frontend-design` | Hindari "AI slop" generik; estetika SAKODE (SIMADEP x RPG quest board halus); kontras dan ruang tajam. |
| **Design System & Tokens** | `frontend-engineer` | `tailwind-design-system` | Semantic color tokens, konsistensi Tailwind CSS 4, skalabilitas komponen UI. |
| **Aksesibilitas & Standar Web** | `frontend-engineer`<br/>`qa-reviewer` | `web-design-guidelines` | Target sentuh mobile >= 44px, status multi-indikator (ikon + teks), keyboard focus-visible, WCAG AA. |
| **Komponen UI Primitif** | `frontend-engineer` | `shadcn` | Pola komponen dialog, popover, dropdown, dan form accessibility yang solid. |
| **Animasi & Mikro-interaksi** | `frontend-engineer` | `animate` | Transisi status halus, feedback pemuatan, kurva easing natural, dukungan *reduced motion*. |
| **Keamanan & Validasi Server** | `backend-engineer`<br/>`firestore-engineer` | `security-best-practices` | Validasi Zod ketat di server, proteksi IDOR, masking rekening, pencegahan privilege escalation. |
| **Model Ancaman Keamanan** | `backend-engineer`<br/>`qa-reviewer` | `security-threat-model` | Evaluasi potensi eksploitasi, race condition finansial, kebocoran secret, dan boundary server/client. |

---

## 4. Cara Agen Mengakses File Skill

Agen dapat membaca dokumen panduan skill menggunakan tool pembacaan berkas pada path lokal:

```powershell
# Contoh membaca panduan frontend-design lokal
Get-Content ".agents/skills/frontend-design/SKILL.md"

# Atau membaca panduan keamanan lokal
Get-Content ".agents/skills/security-best-practices/SKILL.md"
```

Jika memerlukan skill baru dari sumber eksternal `AGENT-SKILLS`:
1. Verifikasi kebutuhan dan reusabilitasnya untuk SAKODE.
2. Salin folder skill ke `.agents/skills/<nama-skill>/SKILL.md`.
3. Dilarang menyalin seluruh direktori eksternal secara membabi buta.
