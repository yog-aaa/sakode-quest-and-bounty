import { renderEmailLayout } from './emailLayout';

export function profileRevisionRequestedEmail(
  displayName: string,
  revisionNotes: string,
  onboardingUrl: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Permintaan Perbaikan Data Pendaftaran Akun SAKODE';
  const title = 'Perbaikan Data Diperlukan';

  const contentHtml = `
    <p>Halo <strong>${displayName}</strong>,</p>
    <p>Tim Administrator SAKODE telah meninjau permohonan pendaftaran Anda. Terdapat beberapa data yang <strong>perlu dilengkapi atau diperbaiki</strong> sebelum akun Anda dapat diaktifkan.</p>

    <div style="background-color: #EFF6FF; border-left: 4px solid #3B82F6; padding: 14px 18px; border-radius: 6px; margin: 20px 0;">
      <p style="margin: 0; color: #1E40AF; font-weight: 700; font-size: 14px;">
        Catatan Revisi dari Administrator:
      </p>
      <p style="margin: 6px 0 0 0; font-size: 14px; color: #1D4ED8; line-height: 1.5;">
        &ldquo;${revisionNotes}&rdquo;
      </p>
    </div>

    <p>Silakan klik tautan di bawah ini untuk memperbarui formulir profil Anda. Setelah perbaikan disimpan, tim kurasi akan segera memproses ulang akun Anda.</p>
  `;

  const html = renderEmailLayout({
    title,
    previewText: 'Perbaikan data pendaftaran akun SAKODE Anda diperlukan.',
    contentHtml,
    ctaText: 'Perbarui Data Profil Sekarang',
    ctaUrl: onboardingUrl,
  });

  const text = `Halo ${displayName},

Tim Administrator SAKODE meminta perbaikan pada data pendaftaran akun Anda dengan catatan:

"${revisionNotes}"

Silakan perbarui profil Anda melalui tautan berikut:
${onboardingUrl}

Setelah diperbarui, data Anda akan segera kami verifikasi ulang.

Salam hangat,
Tim SAKODE Academy`;

  return { subject, html, text };
}
