'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  Lock,
  LogIn,
  UserPlus,
  Home,
  Shield,
  KeyRound,
} from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-slate-50/70 dark:bg-[#070A10]">
      {/* Ambient Radial Color Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-sky-500/15 via-indigo-500/15 to-purple-500/10 dark:from-sky-500/20 dark:via-indigo-500/15 dark:to-slate-900 rounded-full blur-3xl z-0 opacity-80"
      />

      {/* Watermark Monogram */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5 dark:opacity-10 z-0 select-none overflow-hidden"
      >
        <span className="text-[220px] sm:text-[320px] font-mono font-black tracking-tighter text-slate-900 dark:text-sky-400">
          401
        </span>
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto text-center space-y-6 animate-pop-in">
        {/* Lock Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-sky-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-300 dark:border-sky-400/40">
            <KeyRound className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>Error 401 • Autentikasi Diperlukan (Unauthorized)</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Sesi Akun Anda Diperlukan
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Untuk mengakses halaman quest, bounty, atau dashboard kerja, Anda harus masuk ke akun SAKODE yang terdaftar dan terverifikasi.
          </p>
        </div>

        {/* Security Feature Highlights */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2.5 text-left text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Shield className="h-4 w-4 text-sky-500 shrink-0" />
            <span>Sistem dilindungi dengan autentikasi berbasis sesi terenkripsi Firebase Auth.</span>
          </div>
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
            <Lock className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>Pemberian hak akses task dan saldo honor memerlukan verifikasi akun aktif.</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="default"
            onClick={() => router.push('/login')}
            leftIcon={<LogIn className="h-4 w-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Masuk ke Akun SAKODE
          </Button>

          <Button
            variant="outline"
            size="default"
            onClick={() => router.push('/register')}
            leftIcon={<UserPlus className="h-4 w-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Daftar Akun Baru
          </Button>

          <Button
            variant="ghost"
            size="default"
            onClick={() => router.push('/')}
            leftIcon={<Home className="h-4 w-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Beranda
          </Button>
        </div>
      </div>
    </div>
  );
}
