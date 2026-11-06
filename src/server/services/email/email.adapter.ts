/**
 * SAKODE Task & Reward Platform - Decoupled Transactional Email Adapter
 * Mengimplementasikan Adapter Pattern untuk pengiriman email transaksional via Resend.
 * 
 * STRICT INVARIANT: Non-Blocking Architecture
 * Kegagalan pengiriman email (koneksi putus, API key kosong/invalid, rate limit, domain unverified)
 * MUTLAK TIDAK BOLEH membuat crash server atau me-rollback transaksi database.
 */

import { Resend } from 'resend';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface EmailAdapter {
  sendEmail(options: SendEmailOptions): Promise<SendEmailResult>;
}

/**
 * Implementasi Resend Email Adapter
 */
export class ResendEmailAdapter implements EmailAdapter {
  private resend: Resend | null = null;
  private cachedApiKey: string | null = null;

  private getResendClient(): Resend | null {
    const apiKey = (process.env.RESEND_API_KEY || '').trim();
    if (!apiKey) {
      return null;
    }

    if (this.resend && this.cachedApiKey === apiKey) {
      return this.resend;
    }

    try {
      this.resend = new Resend(apiKey);
      this.cachedApiKey = apiKey;
      return this.resend;
    } catch (err) {
      console.warn('[ResendEmailAdapter] Gagal menginisialisasi client Resend:', err);
      return null;
    }
  }

  private resolveFromAddress(): string {
    const configuredFrom = (process.env.EMAIL_FROM_ADDRESS || '').trim().replace(/^"|"$/g, '');

    // Resend menolak pengiriman dari domain webmail publik (@gmail.com, @yahoo, dll)
    // Jika belum diset atau salah konfigurasi ke gmail, gunakan fallback resmi testing Resend
    if (!configuredFrom) {
      return 'SAKODE Academy <onboarding@resend.dev>';
    }

    if (/@(gmail|yahoo|hotmail|outlook)\.com/i.test(configuredFrom)) {
      console.warn(
        `[ResendEmailAdapter] Alamat pengirim "${configuredFrom}" tidak didukung oleh Resend API (tidak boleh menggunakan @gmail.com dsb). Mengalihkan otomatis ke "SAKODE Academy <onboarding@resend.dev>". Harap verifikasi domain khusus di resend.com/domains.`
      );
      return 'SAKODE Academy <onboarding@resend.dev>';
    }

    return configuredFrom;
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const { to, subject, html, text, replyTo } = options;
    const client = this.getResendClient();

    // Jika API Key tidak ada, simulasikan pengiriman sukses (fallback dummy untuk dev/testing lokal)
    if (!client) {
      console.info(
        `[ResendEmailAdapter Dummy] Simulasi pengiriman email ke: ${
          Array.isArray(to) ? to.join(', ') : to
        } | Subjek: "${subject}"`
      );
      return {
        success: true,
        messageId: `dummy-${Date.now()}`,
      };
    }

    const fromAddress = this.resolveFromAddress();

    try {
      const response = await client.emails.send({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
        text,
        replyTo: replyTo,
      });

      if (response.error) {
        console.warn('[ResendEmailAdapter] Resend API Error:', response.error);
        return {
          success: false,
          error: response.error.message,
        };
      }

      console.info(
        `[ResendEmailAdapter] Email berhasil dikirim via Resend ke ${
          Array.isArray(to) ? to.join(', ') : to
        } | MsgID: ${response.data?.id}`
      );

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      console.warn('[ResendEmailAdapter] Exception saat mengirim email:', errMsg);
      return {
        success: false,
        error: errMsg,
      };
    }
  }
}

// Singleton Default Instance
const defaultEmailAdapter = new ResendEmailAdapter();

/**
 * Helper Fungsi Pengiriman Email yang 100% Aman dari Throwing Exception
 */
export async function sendEmailSafe(
  to: string | string[],
  subject: string,
  html: string,
  text?: string
): Promise<SendEmailResult> {
  try {
    return await defaultEmailAdapter.sendEmail({ to, subject, html, text });
  } catch (error) {
    console.warn('[sendEmailSafe] Catch terluar tertangkap:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email sending error',
    };
  }
}
