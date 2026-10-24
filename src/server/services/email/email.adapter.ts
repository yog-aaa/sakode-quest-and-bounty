/**
 * SAKODE Task & Reward Platform - Decoupled Transactional Email Adapter
 * Mengimplementasikan Adapter Pattern untuk pengiriman email transaksional via Resend.
 * 
 * STRICT INVARIANT: Non-Blocking Architecture
 * Kegagalan pengiriman email (koneksi putus, API key kosong/invalid, rate limit)
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
  private fromAddress: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    this.fromAddress =
      process.env.EMAIL_FROM_ADDRESS || 'SAKODE Academy <notifications@sakode.id>';

    if (apiKey && apiKey.trim() !== '') {
      try {
        this.resend = new Resend(apiKey);
      } catch (err) {
        console.warn('[ResendEmailAdapter] Gagal menginisialisasi client Resend:', err);
      }
    } else {
      console.info(
        '[ResendEmailAdapter] RESEND_API_KEY tidak terkonfigurasi. Email adapter aktif dalam mode dummy/fallback logging.'
      );
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
    const { to, subject, html, text, replyTo } = options;

    // Jika API Key tidak ada, simulasikan pengiriman sukses (fallback non-blocking untuk dev & testing)
    if (!this.resend) {
      console.info(`[ResendEmailAdapter Dummy] Simulasi pengiriman email ke: ${Array.isArray(to) ? to.join(', ') : to} | Subjek: "${subject}"`);
      return {
        success: true,
        messageId: `dummy-${Date.now()}`,
      };
    }

    try {
      const response = await this.resend.emails.send({
        from: this.fromAddress,
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
