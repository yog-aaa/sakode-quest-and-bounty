import { renderEmailLayout } from './emailLayout';

export function accountApprovedEmail(displayName: string, loginUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Selamat! Akun SAKODE Anda Telah Disetujui';
  const title = 'Selamat Datang di SAKODE Platform!';

  const contentHtml = `
    <p>Halo <strong>${displayName}</strong>,</p>
    <p>Kabar gembira! Pendaftaran akun Anda telah ditinjau dan <strong>resmi disetujui</strong> oleh tim Administrator SAKODE Academy.</p>
    
    <div style="background-color: #F0FDF4; border-left: 4px solid #22C55E; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #166534; font-weight: 600;">
        Status Akun: AKTIF &bull; Siap Mengambil Task
      </p>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #15803D;">
        Sekarang Anda memiliki akses penuh untuk menjelajahi katalog tugas (Quest), mengajukan permohonan task solo, membentuk tim kolaborasi, serta mengumpulkan bounty reward.
      </p>
    </div>

    <p>Silakan masuk ke platform untuk melengkapi preferensi profil dan mulai memilih tugas perdana Anda.</p>
  `;

  const html = renderEmailLayout({
    title,
    previewText: 'Akun SAKODE Anda telah disetujui oleh Administrator.',
    contentHtml,
    ctaText: 'Masuk ke Platform SAKODE',
    ctaUrl: loginUrl,
  });

  const text = `Halo ${displayName},

Kabar gembira! Pendaftaran akun Anda di SAKODE Task & Reward Platform telah resmi disetujui oleh Administrator.
Status Akun Anda kini AKTIF.

Silakan login ke platform di tautan berikut:
${loginUrl}

Selamat bergabung dan berkontribusi bersama komunitas SAKODE!

Salam hangat,
Tim SAKODE Academy`;

  return { subject, html, text };
}
