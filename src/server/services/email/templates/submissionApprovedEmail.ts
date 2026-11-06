import { renderEmailLayout } from './emailLayout';

export function submissionApprovedEmail(
  displayName: string,
  taskTitle: string,
  rewardAmountFormatted: string,
  claimUrl: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Selamat! Hasil Pengerjaan Task "${taskTitle}" Telah Disetujui`;
  const title = 'Deliverable Berhasil Disetujui!';

  const contentHtml = `
    <p>Halo <strong>${displayName}</strong>,</p>
    <p>Selamat! Hasil pengerjaan (deliverable) Anda untuk tugas <strong>&ldquo;${taskTitle}&rdquo;</strong> telah ditinjau dan <strong>resmi disetujui</strong> oleh Administrator SAKODE.</p>

    <div style="background-color: #F0FDF4; border-left: 4px solid #22C55E; padding: 16px 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #166534; font-weight: 700; font-size: 14px;">
        Reward Bounty: ${rewardAmountFormatted}
      </p>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #15803D;">
        Hak reward Anda telah dicatat pada sistem Reward Ledger dan saldo Anda siap untuk diajukan pencairan dananya.
      </p>
    </div>

    <p>Kunjungi menu Klaim Reward untuk mengajukan pencairan dana ke rekening bank atau e-wallet yang telah Anda daftarkan.</p>
  `;

  const html = renderEmailLayout({
    title,
    previewText: `Hasil pekerjaan "${taskTitle}" disetujui! Reward ${rewardAmountFormatted} siap diklaim.`,
    contentHtml,
    ctaText: 'Klaim Saldo Reward Saya',
    ctaUrl: claimUrl,
  });

  const text = `Halo ${displayName},

Selamat! Hasil pengerjaan untuk task "${taskTitle}" telah resmi disetujui oleh Administrator SAKODE.
Reward sebesar ${rewardAmountFormatted} telah siap diklaim di platform.

Silakan ajukan klaim reward Anda di tautan berikut:
${claimUrl}

Terima kasih atas kontribusi terbaik Anda!

Salam hangat,
Tim SAKODE Academy`;

  return { subject, html, text };
}
