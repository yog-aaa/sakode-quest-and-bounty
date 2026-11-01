'use client';

// SAKODE Work - Reusable Access & Authentication Gate Guard
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  ShieldAlert,
  ArrowLeft,
  ArrowRight,
  LogIn,
  Clock,
  AlertCircle,
  Loader2,
  RotateCw,
  Lock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Coins,
  Zap,
  Award,
  Compass,
  Layers,
  Target,
  Wallet,
  HelpCircle,
} from 'lucide-react';
import { USER_APPROVAL_STATUS } from '@/lib/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireSuperAdmin?: boolean;
  requireApproved?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAdmin = false,
  requireSuperAdmin = false,
  requireApproved = false,
}) => {
  const { user, isLoading, logout } = useAuth();
  const [isTimedOut, setIsTimedOut] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout | undefined;
    if (isLoading) {
      timer = setTimeout(() => {
        setIsTimedOut(true);
      }, 2500);
    } else {
      setIsTimedOut(false);
    }

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [isLoading]);

  if (isLoading) {
    if (isTimedOut) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center border-amber-200 bg-amber-50/40">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                <Clock className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg">Proses Verifikasi Sesi Terkendala</CardTitle>
              <CardDescription className="text-xs leading-relaxed">
                Verifikasi status akses akun SAKODE Anda membutuhkan waktu lebih lama dari biasanya. Hal ini dapat disebabkan oleh koneksi jaringan yang lambat atau sinkronisasi sesi yang tertunda.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="primary"
                className="w-full gap-2 cursor-pointer"
                onClick={() => window.location.reload()}
              >
                <RotateCw className="h-4 w-4" />
                Muat Ulang Halaman
              </Button>
              <Button
                variant="outline"
                className="w-full gap-2 cursor-pointer"
                onClick={async () => {
                  await logout();
                  window.location.href = '/login';
                }}
              >
                <LogIn className="h-4 w-4" />
                Masuk Ulang ke Akun
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-sakode-cyan" />
        <span className="text-xs font-semibold text-sakode-text-muted">
          Memverifikasi status akses akun SAKODE...
        </span>
      </div>
    );
  }

  // 1. Jika belum login sama sekali (Stopper Screen dengan Background Ornamen SAKODE Work)
  if (!user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-slate-50/70 dark:bg-[#070C14]">
        {/* =================================================================== */}
        {/* BACKGROUND AMBIENT LAYER (ORNAMEN SAKODE WORK DI LATAR BELAKANG) */}
        {/* =================================================================== */}

        {/* Ambient Radial Color Glows */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-sky-400/20 via-sakode-purple/15 to-amber-400/15 dark:from-sakode-cyan/25 dark:via-sakode-purple/20 dark:to-amber-400/15 rounded-full blur-3xl z-0 opacity-80"
        />

        {/* Ambient Center Watermark Monogram {k} */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-10 dark:opacity-20 z-0 select-none overflow-hidden"
        >
          <span className="text-[260px] sm:text-[340px] font-mono font-black tracking-tighter text-slate-800 dark:text-sky-400 drop-shadow-sm">
            &#123;k&#125;
          </span>
        </div>

        {/* Background Ambient Brand Glyphs & Micro Elements */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 select-none overflow-hidden"
        >
          {/* Top-Left: Compass & Code Tag */}
          <div className="absolute top-10 left-8 md:left-20 flex items-center gap-2 opacity-50 dark:opacity-75 -rotate-6">
            <div className="p-1.5 rounded-lg bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sakode-cyan border border-sky-300 dark:border-sky-700">
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200">
              sa&#123;kode&#125; workspace
            </span>
          </div>

          {/* Top-Right: Golden Ledger Badge */}
          <div className="absolute top-8 right-8 md:right-20 flex items-center gap-2.5 opacity-60 dark:opacity-80 rotate-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/badges/badge-golden-ledger.svg"
              alt=""
              className="h-10 w-10 object-contain drop-shadow"
            />
            <span className="text-xs font-mono font-bold tracking-wider text-amber-700 dark:text-amber-300 hidden sm:inline">
              reputation: 24_badges
            </span>
          </div>

          {/* Bottom-Left: Currency / Integer IDR Tag */}
          <div className="absolute bottom-10 left-8 md:left-24 flex items-center gap-2 opacity-50 dark:opacity-75 rotate-3">
            <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700">
              <Coins className="h-4 w-4" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
              [INTEGER_IDR]
            </span>
          </div>

          {/* Bottom-Right: QA Protocol Tag */}
          <div className="absolute bottom-10 right-8 md:right-24 flex items-center gap-2 opacity-50 dark:opacity-75 -rotate-3">
            <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-sakode-purple border border-purple-300 dark:border-purple-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
              verified_pipeline
            </span>
          </div>

          {/* Mid-Canvas Faint Float Glyphs */}
          <span className="hidden lg:block absolute left-[12%] top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-sky-600/40 dark:text-sakode-cyan/50 select-none">
            &lt;sakode_work /&gt;
          </span>
          <span className="hidden lg:block absolute right-[12%] top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-amber-600/40 dark:text-amber-400/50 select-none">
            &#123;status: auth_required&#125;
          </span>
        </div>

        {/* =================================================================== */}
        {/* MAIN CLEAN STOPPER CARD (FOKUS, ELEGAN, DAN TIDAK RAMAI) */}
        {/* =================================================================== */}
        <div className="relative max-w-md w-full z-10">
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 dark:shadow-sky-500/5 space-y-6 text-center transition-all">
            {/* Header: SAKODE Work Logo & Minimalist Squircle Lock Icon */}
            <div className="flex flex-col items-center justify-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sakode-work-logo.svg"
                alt="SAKODE Work"
                className="h-8 sm:h-9 w-auto object-contain"
              />
              <div className="relative w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950/70 border border-sky-200 dark:border-sky-800 flex items-center justify-center shadow-xs">
                <Lock className="h-6 w-6 text-sky-600 dark:text-sakode-cyan" />
                <div className="absolute -top-1 -right-1 p-0.5 rounded-full bg-amber-400 text-slate-950">
                  <Sparkles className="h-2.5 w-2.5" />
                </div>
              </div>
            </div>

            {/* Typography Section */}
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950/80 text-[#076991] dark:text-sakode-cyan border border-sky-200/80 dark:border-sky-800/80">
                <ShieldAlert className="h-3 w-3" />
                <span>Autentikasi Diperlukan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Akses Kontributor SAKODE
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
                Silakan masuk dengan akun SAKODE Academy Anda untuk mengeksplorasi task, mengajukan deliverable, dan memantau reward kontribusi.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2.5 pt-1">
              <Link href="/login" className="block w-full">
                <Button
                  variant="primary"
                  className="w-full h-11 text-xs sm:text-sm font-black bg-gradient-to-r from-sky-500 to-[#076991] hover:from-sky-600 hover:to-[#055374] dark:from-sakode-cyan dark:to-sky-400 dark:text-slate-950 dark:hover:from-sky-300 dark:hover:to-cyan-300 shadow-md shadow-sky-500/20 transition-all active:scale-[0.99] cursor-pointer"
                  rightIcon={<ArrowRight className="h-4 w-4 stroke-[2.5]" />}
                >
                  Masuk ke Akun SAKODE
                </Button>
              </Link>
              <Link href="/register" className="block w-full">
                <Button
                  variant="outline"
                  className="w-full h-10 text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Belum Punya Akun? Daftar
                </Button>
              </Link>
            </div>

            {/* Clean Back Link & Single-Line Security Note */}
            <div className="pt-1 flex flex-col items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Beranda Utama</span>
              </Link>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-center gap-2 text-[10px] text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-500" />
                  Firebase Auth
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-sky-500" />
                  Single Sign-On
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Proteksi Rute Super Admin (Hanya SUPER_ADMIN)
  if (requireSuperAdmin && !user.isSuperAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center rounded-3xl border border-purple-200 dark:border-purple-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl shadow-purple-500/5 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-sakode-purple border border-purple-200 dark:border-purple-800">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">403 - Akses Khusus Super Admin</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Halaman ini dibatasi secara ketat dan hanya dapat diakses oleh Super Administrator resmi SAKODE Academy. Akun Anda saat ini memiliki peran <strong className="font-bold text-slate-900 dark:text-white">{user.role}</strong>.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/admin" className="inline-block w-full">
              <Button variant="outline" className="w-full gap-2 text-xs font-bold border-slate-200 dark:border-slate-800">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Proteksi Rute Admin (RBAC: Hanya ADMIN & SUPER_ADMIN)
  if (requireAdmin && !user.isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center rounded-3xl border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl shadow-amber-500/5 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">403 - Akses Ditolak</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Halaman ini dibatasi secara ketat dan hanya dapat diakses oleh Administrator resmi SAKODE Academy. Akun Anda saat ini memiliki peran <strong className="font-bold text-slate-900 dark:text-white">{user.role}</strong>.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/" className="inline-block w-full">
              <Button variant="outline" className="w-full gap-2 text-xs font-bold border-slate-200 dark:border-slate-800">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Halaman Utama
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Proteksi Member Belum Disetujui (PENDING)
  if (requireApproved && user.approvalStatus === USER_APPROVAL_STATUS.PENDING) {
    // Jika belum mengisi data rekening sama sekali
    if (!user.paymentAccountEncrypted) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center rounded-3xl border border-sky-200 dark:border-sky-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl shadow-sky-500/5 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sakode-cyan border border-sky-200 dark:border-sky-800">
              <Clock className="h-7 w-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">Lengkapi Profil Member Anda</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Anda belum melengkapi nomor kontak WhatsApp dan data rekening tujuan transfer reward honor task.
              </p>
            </div>
            <div className="pt-2">
              <Link href="/onboarding" className="inline-block w-full">
                <Button variant="primary" className="w-full text-xs font-black bg-sakode-cyan text-slate-950 hover:bg-[#5dbfe9]">
                  Lengkapi Profil Sekarang
                </Button>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center rounded-3xl border border-amber-200 dark:border-amber-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl shadow-amber-500/5 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Pendaftaran Sedang Ditinjau</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Akun Anda sedang dalam antrean verifikasi Admin SAKODE Academy. Fitur pengerjaan task akan aktif setelah akun disetujui.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/pending-approval" className="inline-block w-full">
              <Button variant="outline" className="w-full text-xs font-bold border-slate-200 dark:border-slate-800">
                Lihat Detail Status Peninjauan
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 4. Proteksi Member Ditolak (REJECTED)
  if (requireApproved && user.approvalStatus === USER_APPROVAL_STATUS.REJECTED) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center rounded-3xl border border-rose-200 dark:border-rose-800/80 bg-white dark:bg-slate-900/90 p-6 sm:p-8 shadow-xl shadow-rose-500/5 space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <AlertCircle className="h-7 w-7" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Pendaftaran Perlu Perbaikan</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Admin SAKODE telah meninjau pendaftaran Anda dan meminta perbaikan data rekening atau nomor kontak.
            </p>
          </div>
          <div className="pt-2">
            <Link href="/rejected" className="inline-block w-full">
              <Button variant="danger" className="w-full text-xs font-black">
                Periksa Catatan &amp; Perbaiki Data
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
