import { renderEmailLayout } from './emailLayout';

export function claimPaidEmail(
  displayName: string,
  amountFormatted: string,
  bankInfoMasked: string,
  claimUrl: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Pencairan Reward Berhasil: ${amountFormatted}`;
  const title = 'Reward Anda Telah Ditransfer!';

  const contentHtml = `
    <p>Halo <strong>${displayName}</strong>,</p>
    <p>Permintaan pencairan honor / reward Anda telah selesai diproses dan <strong>berhasil ditransfer</strong> oleh Bendahara / Administrator SAKODE.</p>
    
    <div style="background-color: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
      <div style="font-size: 13px; font-weight: 600; color: #166534; text-transform: uppercase; letter-spacing: 0.5px;">
        Total Nominal Ditransfer
      </div>
      <div style="font-size: 28px; font-weight: 800; color: #15803D; margin-top: 4px; letter-spacing: -0.5px;">
        ${amountFormatted}
      </div>
      <div style="font-size: 13px; color: #64748B; margin-top: 8px;">
        Tujuan Rekening: <strong>${bankInfoMasked}</strong>
      </div>
    </div>

    <p>Mohon periksa mutasi saldo rekening atau e-wallet Anda. Setelah dana masuk, silakan buka platform dan klik tombol <strong>"Konfirmasi Penerimaan"</strong> untuk menyelesaikan siklus klaim.</p>
  `;

  const html = renderEmailLayout({
    title,
    previewText: `Pencairan reward sebesar ${amountFormatted} telah berhasil ditransfer.`,
    contentHtml,
    ctaText: 'Konfirmasi Penerimaan Dana',
    ctaUrl: claimUrl,
  });

  const text = `Halo ${displayName},

Klaim reward Anda sebesar ${amountFormatted} telah berhasil ditransfer oleh Administrator SAKODE ke rekening tujuan:
${bankInfoMasked}

Silakan cek mutasi saldo Anda dan lakukan konfirmasi penerimaan di platform SAKODE melalui tautan:
${claimUrl}

Terima kasih atas dedikasi dan kerja keras Anda!

Salam hormat,
Tim Keuangan SAKODE Platform`;

  return { subject, html, text };
}
