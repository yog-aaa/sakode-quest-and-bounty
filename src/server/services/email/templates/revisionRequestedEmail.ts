import { renderEmailLayout } from './emailLayout';

export function revisionRequestedEmail(
  displayName: string,
  taskTitle: string,
  revisionNotes: string,
  deadlineFormatted: string,
  taskUrl: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `Revisi Diminta: ${taskTitle}`;
  const title = 'Permintaan Revisi Hasil Deliverable';

  const contentHtml = `
    <p>Halo <strong>${displayName}</strong>,</p>
    <p>Hasil pengerjaan tugas yang Anda kirimkan untuk tugas <strong>"${taskTitle}"</strong> telah ditinjau oleh Administrator, dan terdapat beberapa hal yang perlu disempurnakan.</p>
    
    <div style="background-color: #FFF7ED; border-left: 4px solid #F9723B; padding: 16px 20px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #9A3412; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
        Catatan Revisi dari Admin:
      </p>
      <p style="margin: 8px 0 0 0; color: #172033; font-style: italic; white-space: pre-line;">
        "${revisionNotes}"
      </p>
    </div>

    <table role="presentation" width="100%" style="background-color: #F8FAFC; border: 1px solid #DBE8F0; border-radius: 8px; margin: 16px 0;" cellpadding="12">
      <tr>
        <td style="font-size: 14px; color: #64748B;">Batas Waktu Pengiriman Revisi:</td>
        <td align="right" style="font-size: 14px; font-weight: 700; color: #DC2626;">${deadlineFormatted}</td>
      </tr>
    </table>

    <p>Harap perbaiki deliverable sesuai instruksi di atas dan kirimkan kembali sebelum batas waktu berakhir untuk menghindari penalti keterlambatan.</p>
  `;

  const html = renderEmailLayout({
    title,
    previewText: `Revisi diminta untuk tugas "${taskTitle}". Batas waktu: ${deadlineFormatted}`,
    contentHtml,
    ctaText: 'Lihat Detail & Kirim Revisi',
    ctaUrl: taskUrl,
  });

  const text = `Halo ${displayName},

Hasil pengerjaan deliverable untuk tugas "${taskTitle}" memerlukan perbaikan dari Administrator.

Catatan Revisi Admin:
"${revisionNotes}"

Batas Waktu Revisi:
${deadlineFormatted}

Silakan buka tautan berikut untuk melihat rincian dan mengirimkan perbaikan:
${taskUrl}

Salam,
Tim Administrator SAKODE`;

  return { subject, html, text };
}
