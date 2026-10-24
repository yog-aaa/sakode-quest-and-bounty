import { renderEmailLayout } from './emailLayout';

export function teamConsensusEmail(
  displayName: string,
  teamName: string,
  taskTitle: string,
  proposedAmountFormatted: string,
  voteUrl: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Musyawarah Pembagian Honor: ${teamName}`;
  const title = 'Persetujuan Pembagian Reward Tim Diperlukan';

  const contentHtml = `
    <p>Halo <strong>${displayName}</strong>,</p>
    <p>Team Lead dari tim <strong>"${teamName}"</strong> telah mengajukan draf pembagian alokasi honor untuk pengerjaan tugas <strong>"${taskTitle}"</strong>.</p>
    
    <div style="background-color: #FAF5FF; border: 1px solid #E9D5FF; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
      <div style="font-size: 13px; font-weight: 600; color: #7E22CE; text-transform: uppercase; letter-spacing: 0.5px;">
        Porsi Alokasi Diajukan untuk Anda
      </div>
      <div style="font-size: 26px; font-weight: 800; color: #6B21A8; margin-top: 4px;">
        ${proposedAmountFormatted}
      </div>
      <div style="font-size: 12px; color: #64748B; margin-top: 8px;">
        Sesuai aturan SAKODE, pencairan dana hanya dapat diproses setelah <strong>100% konsensus</strong> dicapai oleh seluruh anggota tim.
      </div>
    </div>

    <p>Silakan tinjau rincian pembagian ini. Anda dapat memberikan suara <strong>Setuju</strong> untuk meloloskan konsensus, atau <strong>Tolak</strong> jika membutuhkan musyawarah ulang bersama Team Lead.</p>
  `;

  const html = renderEmailLayout({
    title,
    previewText: `Persetujuan pembagian honor diajukan untuk tim "${teamName}". Alokasi Anda: ${proposedAmountFormatted}`,
    contentHtml,
    ctaText: 'Buka Ruang Musyawarah Tim',
    ctaUrl: voteUrl,
  });

  const text = `Halo ${displayName},

Team Lead tim "${teamName}" telah mengajukan proposal pembagian reward untuk tugas "${taskTitle}".
Alokasi yang diajukan untuk Anda adalah: ${proposedAmountFormatted}.

Sesuai aturan integritas SAKODE, seluruh anggota tim wajib memberikan persetujuan (100% konsensus) agar dana dapat dicairkan oleh Admin.

Silakan berikan persetujuan atau diskusikan ulang melalui tautan berikut:
${voteUrl}

Salam kolaborasi,
Platform SAKODE Academy`;

  return { subject, html, text };
}
