'use client';

import { useState, useCallback } from 'react';
import { useToast } from '@/context/ToastContext';

interface CopyOptions {
  successMessage?: string;
  successTitle?: string;
  timeoutMs?: number;
}

export function useCopyToClipboard(options?: CopyOptions) {
  const [isCopied, setIsCopied] = useState(false);
  const { success, error } = useToast();

  const copy = useCallback(
    async (text: string, customMessage?: string) => {
      if (!text) return false;

      try {
        await navigator.clipboard.writeText(text);
        setIsCopied(true);

        const msg = customMessage || options?.successMessage || 'Tersalin ke papan klip!';
        success(msg, options?.successTitle || 'Berhasil');

        setTimeout(() => {
          setIsCopied(false);
        }, options?.timeoutMs || 2000);

        return true;
      } catch (err: unknown) {
        console.error('Failed to copy to clipboard:', err);
        error('Gagal menyalin teks ke clipboard. Izin browser mungkin dibatasi.', {
          title: 'Gagal Menyalin',
        });
        return false;
      }
    },
    [options, success, error]
  );

  return { isCopied, copy };
}
