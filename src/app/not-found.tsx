'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import {
  Compass,
  ArrowLeft,
  Home,
  Briefcase,
  Gift,
  HelpCircle,
  Search,
} from 'lucide-react';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-slate-50/70 dark:bg-[#070A10]">
      {/* Ambient Radial Color Glows */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-sky-400/20 via-purple-500/15 to-amber-400/15 dark:from-sky-500/15 dark:via-purple-500/10 dark:to-cyan-500/10 rounded-full blur-3xl z-0 opacity-80"
      />

      {/* Ambient Center Watermark Monogram {404} */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-5 dark:opacity-10 z-0 select-none overflow-hidden"
      >
        <span className="text-[220px] sm:text-[320px] font-mono font-black tracking-tighter text-slate-900 dark:text-sky-400">
          404
        </span>
      </div>

      <div className="relative z-10 w-full max-w-lg mx-auto text-center space-y-6 animate-pop-in">
        {/* Pulsing Radar Icon Wrapper */}
        <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-sky-400/20 dark:bg-sky-500/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-sky-500/20 border border-sky-300 dark:border-sky-400/40">
            <Compass className="h-8 w-8 animate-spin text-white" style={{ animationDuration: '18s' }} />
          </div>
        </div>

        {/* Status Pill & Headings */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>Error 404 • Halaman Tidak Ditemukan</span>
          </span>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Sepertinya Anda Keluar dari Jalur Quest
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            Halaman atau tautan yang Anda tuju tidak ditemukan, telah dipindahkan, atau task telah diarsipkan dari sistem SAKODE Work.
          </p>
        </div>

        {/* Quick Route Cards */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/90 dark:border-slate-800 shadow-sm space-y-3">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-left">
            Rekomendasi Navigasi Cepat:
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-left">
            <Link
              href="/member"
              className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-sky-400 dark:hover:border-sky-500/50 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-sky-50/50 dark:hover:bg-sky-950/30 transition-all flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950/70 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Home className="h-4 w-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-sky-600 dark:group-hover:text-sky-400">
                  Dashboard Saya
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  Ringkasan & Task Aktif
                </span>
              </div>
            </Link>

            <Link
              href="/member/tasks"
              className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-500/50 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-purple-50/50 dark:hover:bg-purple-950/30 transition-all flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Briefcase className="h-4 w-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  Eksplor Task
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  Daftar Quest & Bounty
                </span>
              </div>
            </Link>

            <Link
              href="/member/rewards"
              className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition-all flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Gift className="h-4 w-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  Klaim Reward
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  Pencairan Saldo & Rekening
                </span>
              </div>
            </Link>

            <Link
              href="/"
              className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 bg-slate-50/50 dark:bg-slate-950/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition-all flex items-center gap-2.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Search className="h-4 w-4" />
              </div>
              <div className="truncate">
                <span className="text-xs font-bold text-slate-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  Halaman Utama
                </span>
                <span className="text-[10px] text-slate-500 block truncate">
                  Landing SAKODE Work
                </span>
              </div>
            </Link>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="outline"
            size="default"
            onClick={() => router.back()}
            leftIcon={<ArrowLeft className="h-4 w-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Kembali ke Halaman Sebelumnya
          </Button>

          <Button
            variant="primary"
            size="default"
            onClick={() => router.push('/member')}
            leftIcon={<Home className="h-4 w-4" />}
            className="w-full sm:w-auto text-xs"
          >
            Buka Dashboard SAKODE
          </Button>
        </div>
      </div>
    </div>
  );
}
