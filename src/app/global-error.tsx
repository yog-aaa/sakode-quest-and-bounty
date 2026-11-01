'use client';

import React from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-950 text-white font-sans flex items-center justify-center p-6 antialiased">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xl border border-rose-500/30">
            !
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-black text-white">
              Sistem SAKODE Mengalami Gangguan Fatal
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              Terjadi kesalahan kritis pada level root layout platform. Silakan muat ulang atau coba beberapa saat lagi.
            </p>
          </div>

          {error.digest && (
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-400">
              Digest: {error.digest}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => reset()}
              className="w-full h-11 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
            >
              Muat Ulang Komponen
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="w-full h-11 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
            >
              Kembali ke Halaman Awal
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
