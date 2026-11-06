import { renderEmailLayout } from './emailLayout';

export function taskAssignedEmail(
  displayName: string,
  taskTitle: string,
  rewardAmountFormatted: string,
  deadlineFormatted: string,
  taskUrl: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Permohonan Diterima: Anda Ditugaskan pada "${taskTitle}"`;
  const title = 'Selamat! Anda Terpilih Mengerjakan Task';

  const contentHtml = `
    <p>Halo <strong>${displayName}</strong>,</p>
    <p>Permohonan Anda untuk mengerjakan tugas <strong>&ldquo;${taskTitle}&rdquo;</strong> telah <strong>disetujui oleh Administrator SAKODE</strong>.</p>

    <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px 20px; border-radius: 8px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; color: #64748B; font-size: 13px; width: 140px;">Judul Task:</td>
          <td style="padding: 6px 0; color: #0F172A; font-weight: 700; font-size: 13px;">${taskTitle}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748B; font-size: 13px;">Alokasi Reward:</td>
          <td style="padding: 6px 0; color: #16A34A; font-weight: 800; font-size: 13px;">${rewardAmountFormatted}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #64748B; font-size: 13px;">Batas Pengerjaan:</td>
          <td style="padding: 6px 0; color: #DC2626; font-weight: 700; font-size: 13px;">${deadlineFormatted}</td>
        </tr>
      </table>
    </div>

    <p>Harap perhatikan seluruh kriteria penerimaan (acceptance criteria) dan panduan deliverable pada lembar instruksi task. Kumpulkan hasil pengerjaan tepat waktu untuk menjaga reputasi dan memperoleh bonus on-time delivery.</p>
  `;

  const html = renderEmailLayout({
    title,
    previewText: `Anda resmi ditugaskan pada task "${taskTitle}". Deadline: ${deadlineFormatted}.`,
    contentHtml,
    ctaText: 'Buka Halaman Pengerjaan Task',
    ctaUrl: taskUrl,
  });

  const text = `Halo ${displayName},

Selamat! Anda resmi ditugaskan untuk mengerjakan:
"${taskTitle}"

- Alokasi Reward: ${rewardAmountFormatted}
- Batas Pengerjaan: ${deadlineFormatted}

Buka instruksi pengerjaan di tautan berikut:
${taskUrl}

Selamat bekerja dan berikan kontribusi terbaik Anda!

Salam hangat,
Tim SAKODE Academy`;

  return { subject, html, text };
}
