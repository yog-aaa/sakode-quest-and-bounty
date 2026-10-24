/**
 * SAKODE Task & Reward Platform - Branded HTML Email Template Base Layout
 * Menggunakan palet token resmi SAKODE (Cyan #71CFFE, Dark Text #172033, Border #DBE8F0, Bg #F7FBFE)
 * Dirancang dengan HTML tables inline-styled agar kompatibel dengan seluruh email client.
 */

export interface EmailLayoutOptions {
  title: string;
  previewText?: string;
  contentHtml: string;
  ctaText?: string;
  ctaUrl?: string;
}

export function renderEmailLayout({
  title,
  previewText,
  contentHtml,
  ctaText,
  ctaUrl,
}: EmailLayoutOptions): string {
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #F7FBFE; font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #172033; }
    table { border-collapse: collapse; }
    a { color: #0284c7; text-decoration: none; }
  </style>
</head>
<body style="margin: 0; padding: 24px 12px; background-color: #F7FBFE; font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  ${previewText ? `<div style="display: none; max-height: 0px; overflow: hidden;">${previewText}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>` : ''}
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #DBE8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(23, 32, 51, 0.05);" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 24px 32px; background-color: #172033; border-bottom: 3px solid #71CFFE;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">
                      SAKODE <span style="color: #71CFFE;">ACADEMY</span>
                    </div>
                    <div style="font-size: 12px; color: #94A3B8; font-weight: 500; margin-top: 2px;">
                      Task & Reward Platform
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: rgba(113, 207, 254, 0.15); border: 1px solid rgba(113, 207, 254, 0.3); color: #71CFFE; font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 6px;">
                      NOTIFIKASI RESMI
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px; font-size: 15px; line-height: 1.6; color: #172033;">
              <h1 style="font-size: 20px; font-weight: 700; color: #172033; margin-top: 0; margin-bottom: 16px;">
                ${title}
              </h1>
              
              ${contentHtml}

              <!-- CTA Button -->
              ${
                ctaText && ctaUrl
                  ? `
              <div style="margin-top: 32px; margin-bottom: 16px; text-align: center;">
                <a href="${ctaUrl}" style="display: inline-block; background-color: #71CFFE; color: #172033; font-weight: 700; font-size: 15px; padding: 14px 28px; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(113, 207, 254, 0.4); text-align: center;">
                  ${ctaText} &rarr;
                </a>
              </div>
              <p style="font-size: 12px; color: #64748B; text-align: center; margin-top: 8px;">
                Atau salin tautan berikut ke browser Anda:<br>
                <a href="${ctaUrl}" style="color: #0284c7; word-break: break-all;">${ctaUrl}</a>
              </p>
              `
                  : ''
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #F8FAFC; border-top: 1px solid #DBE8F0; font-size: 12px; color: #64748B; text-align: center; line-height: 1.5;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #475569;">
                SAKODE Task & Reward Platform &bull; Papua, Indonesia
              </p>
              <p style="margin: 0; color: #94A3B8;">
                Email ini dikirim otomatis oleh sistem. Harap tidak membalas email ini secara langsung.<br>
                &copy; ${currentYear} SAKODE Academy. Hak Cipta Dilindungi.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
