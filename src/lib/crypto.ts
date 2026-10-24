/**
 * SAKODE Task & Reward Platform - Kriptografi & Keamanan Data Sensitif
 * Mengimplementasikan enkripsi AES-256-GCM terotentikasi untuk data perbankan & rekening.
 * Sesuai panduan di AGENTS.md, ARCHITECTURE.md, dan skill security-best-practices.
 */

import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV standar yang optimal untuk AES-GCM
const DEFAULT_DEV_KEY = 'sakode_default_secure_dev_key_2026_32bytes!!';

/**
 * Mendapatkan kunci enkripsi 32-byte (256-bit) yang konsisten.
 * Menggunakan hash SHA-256 untuk menjamin kunci selalu berukuran tepat 32 byte.
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET_KEY || DEFAULT_DEV_KEY;
  return crypto.createHash('sha256').update(secret).digest();
}

export interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

/**
 * Mengenkripsi plaintext menggunakan AES-256-GCM.
 * Output format: `<iv_hex>:<authTag_hex>:<ciphertext_hex>`
 */
export function encryptData(plaintext: string): string {
  if (!plaintext) {
    throw new Error('Data yang akan dienkripsi tidak boleh kosong.');
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Mendekripsi string ciphertext terenkripsi format `<iv_hex>:<authTag_hex>:<ciphertext_hex>`.
 * Memvalidasi keaslian data via GCM authentication tag untuk mencegah manipulasi.
 */
export function decryptData(encryptedPayload: string): string {
  if (!encryptedPayload) {
    throw new Error('Payload terenkripsi tidak boleh kosong.');
  }

  const parts = encryptedPayload.split(':');
  if (parts.length !== 3) {
    throw new Error('Format ciphertext tidak valid. Harus iv:authTag:ciphertext.');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  if (!ivHex || !authTagHex || !ciphertextHex) {
    throw new Error('Komponen enkripsi (IV / Tag / Ciphertext) tidak lengkap.');
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const ciphertext = Buffer.from(ciphertextHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Tipe payload detail perbankan/e-wallet member
 */
export interface BankAccountDetails {
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
}

/**
 * Mengenkripsi objek rekening bank menjadi string aman
 */
export function encryptBankAccount(details: BankAccountDetails): string {
  return encryptData(JSON.stringify(details));
}

/**
 * Mendekripsi string terenkripsi menjadi objek rekening bank
 */
export function decryptBankAccount(encryptedString: string): BankAccountDetails {
  const json = decryptData(encryptedString);
  return JSON.parse(json) as BankAccountDetails;
}
