'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SakodeAmbientOrnaments, SakodeSmileArc } from '@/components/brand/SakodeAmbientOrnaments';
import {
  AlertCircle,
  Edit3,
  Home,
  MessageCircle,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function RejectedPage() {
  const { user } = useAuth();

  const rejectionNotes =
    user?.rejectionReason ||
    user?.revisionNotes ||
    'Informasi data rekening atau nama pemilik belum memenuhi ketentuan verifikasi SAKODE. Silakan periksa kembali nama pemilik rekening agar sesuai dengan data identitas Anda.';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070C14] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-sakode-cyan/30 transition-colors relative overflow-hidden">
      {/* SAKODE Scattered Ornaments & Ambient Lights */}
      <SakodeAmbientOrnaments showForegroundBadges={true} />

      {/* Header */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#070C14]/90 backdrop-blur-md relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sakode-work-logo.svg"
              alt="SAKODE Work"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 font-medium">
              Evaluasi Verifikasi Profil
            </span>
            <ThemeToggle />
            <Link
              href="/"
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              ← Beranda
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center justify-center">
        <div className="max-w-xl w-full space-y-6">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Status Evaluasi Akun
              </span>
              <SakodeSmileArc className="w-7 h-2 text-rose-500/80" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Pendaftaran Memerlukan Penyesuaian
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Admin SAKODE telah meninjau pengajuan profil Anda. Anda hanya perlu menyesuaikan beberapa data tanpa harus membuat akun baru.
            </p>
          </div>

          {/* Status Glassmorphic Card */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 dark:shadow-rose-500/5 overflow-hidden">
            {/* Top Accent Strip */}
            <div className="h-2 w-full bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500"></div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Status Header */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800/80 flex items-center justify-center text-rose-600 dark:text-rose-400 shadow-md shadow-rose-500/10">
                  <AlertCircle className="h-8 w-8 stroke-[2.2]" />
                  <div className="absolute -top-1 -right-1 p-1 rounded-full bg-rose-500 text-white">
                    <ShieldAlert className="h-3 w-3" />
                  </div>
                </div>

                <div className="flex justify-center">
                  <StatusPill status="REJECTED" size="lg" />
                </div>
              </div>

              {/* Official Review Notes from Admin */}
              <div className="rounded-2xl border border-rose-200 dark:border-rose-800/80 bg-rose-50/70 dark:bg-rose-950/40 p-5 space-y-2.5">
                <div className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>Catatan Hasil Evaluasi Tim Admin SAKODE:</span>
                </div>
                <div className="bg-white/90 dark:bg-slate-900/90 p-4 rounded-xl border border-rose-200/80 dark:border-rose-800/60 shadow-xs">
                  <p className="text-xs text-rose-950 dark:text-rose-200 leading-relaxed font-semibold">
                    &ldquo;{rejectionNotes}&rdquo;
                  </p>
                </div>
              </div>

              {/* Quick Checklist Info */}
              <div className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 space-y-2 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 block">
                  Petunjuk Perbaikan Data:
                </span>
                <div className="space-y-1.5 text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Pastikan nama pemilik rekening sama persis dengan nama lengkap Anda.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Nomor rekening harus berupa digit angka tanpa tanda hubung (-) atau spasi.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Pengajuan revisi akan langsung masuk ke antrean prioritas peninjauan ulang.</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <Link href="/onboarding" className="block w-full">
                  <Button
                    variant="primary"
                    className="w-full h-11 text-xs sm:text-sm font-black bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white shadow-md shadow-rose-500/20 cursor-pointer"
                    rightIcon={<ArrowRight className="h-4 w-4 stroke-[2.5]" />}
                  >
                    Perbaiki Data Profil Sekarang
                  </Button>
                </Link>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    className="w-full h-10 text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 cursor-pointer gap-2 transition-all shadow-2xs"
                    onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Tanya Admin SAKODE</span>
                  </Button>

                  <Link href="/" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full h-10 text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 cursor-pointer gap-2 transition-all shadow-2xs"
                    >
                      <Home className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
                      <span>Kembali ke Beranda</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 py-5 text-center text-xs text-slate-500">
        <p>&copy; 2026 SAKODE Academy. Seluruh Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
