import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility penggabung class Tailwind CSS yang aman dari konflik.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Mengonversi berbagai format tanggal (Date, ISO string, epoch number, Firestore Timestamp)
 * menjadi objek JavaScript Date.
 */
export function toDateSafe(
  date:
    | Date
    | string
    | number
    | { seconds: number; nanoseconds?: number; toDate?: () => Date }
    | null
    | undefined
): Date | null {
  if (!date) return null;

  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }

  // Handle Firestore Timestamp object yang memiliki toDate()
  if (typeof date === 'object' && typeof (date as { toDate?: () => Date }).toDate === 'function') {
    return (date as { toDate: () => Date }).toDate();
  }

  // Handle serialized Firestore Timestamp { seconds: number }
  if (typeof date === 'object' && 'seconds' in date && typeof date.seconds === 'number') {
    return new Date(date.seconds * 1000);
  }

  const parsed = new Date(date as string | number);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Format mata uang integer Rupiah (Strict Invariant: Integer Rupiah, tanpa desimal).
 * Contoh: 250000 -> "Rp 250.000"
 */
export function formatCurrencyIDR(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Rp 0';
  }

  const rounded = Math.round(amount);
  const isNegative = rounded < 0;
  const absFormatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.abs(rounded));

  return isNegative ? `-Rp ${absFormatted}` : `Rp ${absFormatted}`;
}

/**
 * Format tanggal dan waktu dalam zona waktu resmi WIB (Asia/Jakarta).
 * Contoh: "22 Okt 2026, 22.30 WIB"
 */
export function formatDateWIB(
  date:
    | Date
    | string
    | number
    | { seconds: number; nanoseconds?: number; toDate?: () => Date }
    | null
    | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = toDateSafe(date);
  if (!d) return '-';

  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options,
  };

  const formatted = new Intl.DateTimeFormat('id-ID', defaultOptions).format(d);
  // Tambahkan sufiks WIB jika menampilkan jam dan belum ada
  return formatted.includes(':') && !formatted.includes('WIB')
    ? `${formatted} WIB`
    : formatted;
}

/**
 * Format tanggal ringkas (hanya hari & bulan) untuk timeline / list.
 * Contoh: "22 Okt 2026"
 */
export function formatDateOnlyWIB(
  date:
    | Date
    | string
    | number
    | { seconds: number; nanoseconds?: number; toDate?: () => Date }
    | null
    | undefined
): string {
  return formatDateWIB(date, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: undefined,
    minute: undefined,
  });
}

/**
 * Helper masking nama pemegang rekening.
 * Contoh: "John Doe" -> "J*** D**"
 */
export function maskName(name: string): string {
  if (!name) return '***';
  return name
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (word.length <= 1) return word;
      return word[0] + '*'.repeat(Math.max(2, word.length - 1));
    })
    .join(' ');
}

/**
 * Helper masking nomor rekening perbankan / e-wallet.
 * Contoh: "1234567890" -> "•••• 7890"
 */
export function maskAccountNumber(accNumber: string): string {
  if (!accNumber) return '••••';
  const clean = accNumber.trim();
  if (clean.length <= 4) return clean;
  const lastFour = clean.slice(-4);
  return `•••• ${lastFour}`;
}

/**
 * Format resmi masked payment account SAKODE (DESIGN.md / ARCHITECTURE.md)
 * Contoh: "BCA •••• 5678 a.n J*** D**"
 */
export function formatMaskedPaymentAccount(
  bankName: string,
  accountNumber: string,
  accountHolderName: string
): string {
  const cleanBank = (bankName || 'BANK').trim();
  const cleanNumber = accountNumber ? accountNumber.trim() : '';
  const lastFour = cleanNumber.length >= 4 ? cleanNumber.slice(-4) : cleanNumber;
  const maskedHolder = maskName(accountHolderName);

  return `${cleanBank} •••• ${lastFour} a.n ${maskedHolder}`;
}
