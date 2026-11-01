'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  ShieldAlert,
  ArrowLeft,
  Home,
  LogIn,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';

export default function ForbiddenPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-slate-50/70 dark:bg-[#070A10]">
      {/* Ambient Radial Color Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-amber-500/15 via-rose-500/15 to-purple-500/10 dark:from-amber-500/20 dark:via-rose-500/15 dark:to-slate-900 rounded-full blur-3xl z-0 opacity-80"
      />

      {/* Watermark Monogram */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5 dark:opacity-10 z-0 select-none overflow-hidden"
      >
        <span className="text-[220px] sm:text-[320px] font-mono font-black tracking-tighter text-slate-900 dark:text-amber-400">
          403
        </span>
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto text-center space-y-6 animate-pop-in">
        {/* Shield Alert Icon */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 border border-amber-300 dark:border-amber-400/40">
            <ShieldAlert className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Headings */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Error 403 • Akses Terbatas (Forbidden)</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Izin Akses Halaman Dibatasi
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Akun Anda tidak memiliki kredensial atau peran yang sesuai untuk membuka area ini. Halaman ini memerlukan hak akses khusus administrator atau kualifikasi member tertentu.
          </p>
        </div>

        {/* User Account Info Card */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-2.5 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Akun Masuk Saat Ini:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              {user?.email || 'Belum terautentikasi'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Peran Akun:</span>
            <span className="font-black px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 uppercase text-[10px]">
              {user?.role || 'MEMBER'}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">Status Akun:</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">
              {user?.approvalStatus || 'APPROVED'}
            </span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => router.back()}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Kembali
          </Button>

          <Button
            variant="primary"
            size="default"
            onClick={() => router.push(user?.role === 'ADMIN' ? '/admin' : '/member')}
            leftIcon={<Home className="h-4 w-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Ke Dashboard Utama
          </Button>

          <Button
            variant="secondary"
            size="default"
            onClick={async () => {
              await logout();
              router.push('/login');
            }}
            leftIcon={<LogIn className="h-4 w-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Ganti Akun
          </Button>
        </div>
      </div>
    </div>
  );
}
