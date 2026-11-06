import { renderEmailLayout } from './emailLayout';

export function accountRegisteredEmail(displayName: string, dashboardUrl: string): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Konfirmasi Pendaftaran Akun SAKODE Academy';
  const title = 'Pendaftaran Anda Sedang Ditinjau';

  const contentHtml = `
    <p>Halo <strong>${displayName}</strong>,</p>
    <p>Terima kasih telah mendaftar di <strong>SAKODE Task & Reward Platform</strong>. Formulir biodata, keahlian teknis, dan informasi rekening Anda telah berhasil kami terima.</p>
    
    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #92400E; font-weight: 600;">
        Status Pendaftaran: DALAM ANTRIAN KURASI
      </p>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #B45309;">
        Tim Administrator SAKODE sedang meninjau kesesuaian data Anda. Proses verifikasi biasanya memakan waktu maksimal 1x24 jam pada hari kerja.
      </p>
    </div>

    <p>Anda akan menerima notifikasi email otomatis segera setelah akun Anda diverifikasi dan disetujui untuk mulai mengambil task berbayar.</p>
  `;

  const html = renderEmailLayout({
    title,
    previewText: 'Pendaftaran akun SAKODE Anda telah diterima dan sedang dalam antrean kurasi.',
    contentHtml,
    ctaText: 'Cek Status Pendaftaran',
    ctaUrl: dashboardUrl,
  });

  const text = `Halo ${displayName},

Terima kasih telah mendaftar di SAKODE Task & Reward Platform.
Formulir dan data pendaftaran Anda telah berhasil kami terima dan saat ini sedang dalam antrean kurasi tim Administrator.

Anda akan menerima pemberitahuan lebih lanjut saat akun Anda disetujui.

Salam hangat,
Tim SAKODE Academy`;

  return { subject, html, text };
}
