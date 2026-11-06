import { renderEmailLayout } from './emailLayout';

export function accountRejectedEmail(
  displayName: string,
  reason: string,
  supportUrl: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Pemberitahuan Status Pendaftaran Akun SAKODE';
  const title = 'Status Pendaftaran Akun SAKODE';

  const contentHtml = `
    <p>Halo <strong>${displayName}</strong>,</p>
    <p>Terima kasih atas ketertarikan Anda untuk bergabung dan berkontribusi di ekosistem SAKODE Academy.</p>
    
    <p>Setelah dilakukan peninjauan administratif oleh tim kurator, kami memberitahukan bahwa pendaftaran akun Anda saat ini <strong>belum dapat disetujui</strong>.</p>

    <div style="background-color: #FFF1F2; border-left: 4px solid #F43F5E; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #9F1239; font-weight: 700; font-size: 14px;">
        Alasan dari Administrator:
      </p>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #BE123C; line-height: 1.5;">
        &ldquo;${reason}&rdquo;
      </p>
    </div>

    <p>Jika Anda merasa terdapat kekeliruan atau ingin meminta klarifikasi lebih lanjut, silakan hubungi tim dukungan SAKODE melalui tautan di bawah ini.</p>
  `;

  const html = renderEmailLayout({
    title,
    previewText: 'Pemberitahuan terkait peninjauan pendaftaran akun SAKODE Anda.',
    contentHtml,
    ctaText: 'Hubungi Tim Dukungan SAKODE',
    ctaUrl: supportUrl,
  });

  const text = `Halo ${displayName},

Terima kasih atas ketertarikan Anda untuk bergabung di SAKODE Academy.
Setelah dilakukan peninjauan, pendaftaran akun Anda saat ini belum dapat disetujui dengan alasan:

"${reason}"

Jika ada pertanyaan, silakan hubungi tim dukungan kami di:
${supportUrl}

Salam hormat,
Tim Administrator SAKODE`;

  return { subject, html, text };
}
