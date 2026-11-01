'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  AlertTriangle,
  RotateCw,
  Home,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Terminal,
  LifeBuoy,
} from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  const [copied, setCopied] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  useEffect(() => {
    // Log error to console for debugging
    console.error('Unhandled Application Exception caught by ErrorBoundary:', error);
  }, [error]);

  const handleCopyErrorReport = () => {
    const report = [
      `SAKODE Work Error Report`,
      `Timestamp: ${new Date().toISOString()}`,
      `Error Message: ${error.message || 'Unknown Exception'}`,
      `Digest: ${error.digest || 'N/A'}`,
      `Stack Trace:`,
      error.stack || 'No stack trace available',
    ].join('\n');

    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-slate-50/70 dark:bg-[#070A10]">
      {/* Ambient Radial Color Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-rose-500/15 via-orange-500/10 to-amber-500/10 dark:from-rose-500/20 dark:via-orange-500/15 dark:to-slate-900 rounded-full blur-3xl z-0 opacity-80"
      />

      <div className="relative z-10 w-full max-w-lg mx-auto text-center space-y-6 animate-pop-in">
        {/* Pulsing Alert Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-rose-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20 border border-rose-300 dark:border-rose-400/40">
            <AlertTriangle className="h-8 w-8 text-white animate-bounce" style={{ animationDuration: '2s' }} />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Terjadi Kendala Teknis Sementara</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Aplikasi Mengalami Gangguan
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Terjadi kesalahan tak terduga saat memproses permintaan Anda. Sistem telah mengisolasi error ini untuk mencegah gangguan data.
          </p>
        </div>

        {/* Error Info Card & Actions */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-rose-500" />
              <span>Kode Trace / Digest:</span>
            </span>
            <code className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              {error.digest ? error.digest.slice(0, 16) : 'CRASH_RUNTIME'}
            </code>
          </div>

          <p className="text-xs text-rose-800 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200/80 dark:border-rose-900/40 font-mono truncate">
            {error.message || 'An unexpected runtime error occurred.'}
          </p>

          {/* Toggle Details */}
          <div>
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>{showTechnicalDetails ? 'Sembunyikan detail teknis' : 'Lihat detail teknis'}</span>
              {showTechnicalDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showTechnicalDetails && (
              <pre className="mt-2 p-3 rounded-xl bg-slate-950 text-slate-200 text-[10px] font-mono overflow-x-auto max-h-40 leading-relaxed border border-slate-800">
                {error.stack || error.message}
              </pre>
            )}
          </div>

          {/* Copy Report Button */}
          <div className="pt-1 flex items-center justify-between">
            <span className="text-[10px] text-slate-400">
              Laporkan trace ini ke tim pengembang SAKODE jika berulang.
            </span>
            <button
              onClick={handleCopyErrorReport}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-all cursor-pointer active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold">Laporan Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Salin Trace Error</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => (window.location.href = '/member')}
            leftIcon={<Home className="h-4 w-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Kembali ke Beranda
          </Button>

          <Button
            variant="primary"
            size="default"
            onClick={() => reset()}
            leftIcon={<RotateCw className="h-4 w-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Coba Lagi Sekarang
          </Button>
        </div>
      </div>
    </div>
  );
}
