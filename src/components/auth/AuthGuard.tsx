'use client';

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

  // 1. Jika belum login sama sekali (Stopper Screen dengan Ornamen SAKODE Work)
  if (!user) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-slate-50/50 dark:bg-[#070C14]">
        {/* Subtle Ambient Radial Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-sky-400/15 via-sakode-purple/10 to-amber-400/10 dark:from-sakode-cyan/10 dark:via-sakode-purple/10 dark:to-amber-400/5 rounded-full blur-3xl -z-10"
        />

        {/* Ambient Giant Brandmark Watermark behind Card */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-[0.05] -z-10 select-none overflow-hidden"
        >
          <span className="text-[260px] font-mono font-black tracking-tighter">
            &#123;k&#125;
          </span>
        </div>

        {/* Stopper Container with Surrounding Floating Navbar Icons */}
        <div className="relative max-w-lg w-full">
          {/* ================================================================= */}
          {/* FLOATING SAKODE NAVBAR ORNAMENTS (Eksplor, Pilar, Reward, QA, FAQ) */}
          {/* ================================================================= */}

          {/* 1. Top-Left: Eksplor Task (Compass) */}
          <div
            aria-hidden="true"
            className="hidden sm:flex absolute -top-8 -left-8 lg:-left-12 z-20 items-center gap-2 px-3 py-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-sky-300 dark:border-sky-500/40 shadow-lg shadow-sky-500/10 backdrop-blur-md animate-float-slow select-none"
          >
            <div className="p-1 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sakode-cyan">
              <Compass className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200">
              Eksplor Task
            </span>
          </div>

          {/* 2. Top-Right: Lencana & Level Medallion (Award / Golden Ledger) */}
          <div
            aria-hidden="true"
            className="hidden sm:flex absolute -top-10 -right-8 lg:-right-12 z-20 items-center gap-2 p-2 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-amber-300 dark:border-amber-500/40 shadow-lg shadow-amber-500/10 backdrop-blur-md animate-float-reverse select-none"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/badges/badge-golden-ledger.svg"
              alt="Lencana"
              className="h-8 w-8 object-contain drop-shadow-xs"
            />
            <div className="text-left pr-1">
              <div className="text-[10px] font-black text-amber-600 dark:text-amber-400">
                Hall of Fame
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500">
                24 Lencana
              </div>
            </div>
          </div>

          {/* 3. Middle-Left: 3 Pilar Kontribusi (Layers) */}
          <div
            aria-hidden="true"
            className="hidden md:flex absolute top-1/2 -left-12 lg:-left-16 -translate-y-1/2 z-20 items-center gap-2 px-2.5 py-2 rounded-2xl bg-white/85 dark:bg-slate-900/85 border border-purple-300 dark:border-purple-500/30 shadow-md backdrop-blur-md animate-drift-lateral select-none"
          >
            <div className="p-1 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-sakode-purple">
              <Layers className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
              3 Pilar
            </span>
          </div>

          {/* 4. Middle-Right: Klaim Reward (Wallet & Coins) */}
          <div
            aria-hidden="true"
            className="hidden md:flex absolute top-1/2 -right-12 lg:-right-16 -translate-y-1/2 z-20 items-center gap-2 px-2.5 py-2 rounded-2xl bg-white/85 dark:bg-slate-900/85 border border-emerald-300 dark:border-emerald-500/30 shadow-md backdrop-blur-md animate-float-slow select-none"
          >
            <div className="p-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <Coins className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
              Integer IDR
            </span>
          </div>

          {/* 5. Bottom-Left: Alur Kerja & QA (Target) */}
          <div
            aria-hidden="true"
            className="hidden sm:flex absolute -bottom-6 -left-6 lg:-left-10 z-20 items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md animate-float-reverse select-none"
          >
            <Target className="h-3.5 w-3.5 text-sky-500" />
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              Alur Review QA
            </span>
          </div>

          {/* 6. Bottom-Right: Bantuan & FAQ (HelpCircle) */}
          <div
            aria-hidden="true"
            className="hidden sm:flex absolute -bottom-6 -right-6 lg:-right-10 z-20 items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-md animate-float-slow select-none"
          >
            <HelpCircle className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">
              Bantuan SAKODE
            </span>
          </div>

          {/* ================================================================= */}
          {/* MAIN GLASSMORPHIC STOPPER CARD */}
          {/* ================================================================= */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-xl shadow-slate-900/5 dark:shadow-sky-500/5 space-y-6 text-center transition-all relative z-10">
            {/* SAKODE Medallion Header with Sparkle Star */}
            <div className="relative mx-auto w-16 h-16 sm:w-18 sm:h-18 rounded-2xl bg-gradient-to-br from-sky-100 via-sky-50 to-white dark:from-sky-950/80 dark:via-slate-900 dark:to-slate-900 border-2 border-sky-300 dark:border-sakode-cyan/50 flex items-center justify-center shadow-md shadow-sky-500/15">
              <Lock className="h-8 w-8 text-sky-600 dark:text-sakode-cyan" />
              <div className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-amber-400 text-slate-950 shadow-xs">
                <Sparkles className="h-3 w-3" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-950/90 text-[#076991] dark:text-sakode-cyan border border-sky-200 dark:border-sky-800">
                <ShieldAlert className="h-3 w-3" />
                <span>Autentikasi Diperlukan</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Akses Eksklusif Kontributor SAKODE
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                Halaman ini memuat akses task bounty berbayar, antrean klaim honor, dan pencatatan reputasi. Masuk dengan akun terverifikasi SAKODE Academy untuk melanjutkan.
              </p>
            </div>

            {/* SAKODE Badge Preview Showcase Stack */}
            <div className="flex items-center justify-center gap-2.5 py-1 px-3 rounded-xl bg-slate-50/80 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 w-fit mx-auto">
              <div className="flex items-center -space-x-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/badges/badge-level-1.svg"
                  alt="Level 1"
                  className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-contain shadow-xs"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/badges/badge-code-artisan.svg"
                  alt="Code Artisan"
                  className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-contain shadow-xs"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/badges/badge-knowledge-mentor.svg"
                  alt="Mentor"
                  className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-contain shadow-xs"
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/badges/badge-level-5.svg"
                  alt="Grandmaster"
                  className="h-7 w-7 rounded-full ring-2 ring-white dark:ring-slate-900 object-contain shadow-xs"
                />
              </div>
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                Buka 24 Lencana &amp; 5 Jenjang Level
              </span>
            </div>

            {/* Value Preview Mini Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-left">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Coins className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>Bounty IDR</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Pencairan honor tunai langsung tanpa potongan.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Zap className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <span>Solo &amp; Team</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Proyek nyata dengan proteksi konsensus 100%.
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-2.5 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Award className="h-3.5 w-3.5 text-purple-500 shrink-0" />
                  <span>24 Lencana</span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  Reputasi keahlian diakui SAKODE Academy.
                </p>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="space-y-2.5 pt-2">
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
                  Belum Punya Akun? Daftar Sebagai Kontributor
                </Button>
              </Link>
            </div>

            <div className="pt-2 flex flex-col items-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Kembali ke Beranda Utama</span>
              </Link>

              {/* Security Trust Footnote */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 w-full flex items-center justify-center gap-3 text-[10px] text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Firebase Auth Terenkripsi
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5 text-sky-500" />
                  SAKODE Single Sign-On
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
        <Card className="max-w-md w-full text-center border-sakode-purple/40 bg-gradient-to-b from-white to-purple-50/20">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-sakode-purple/15 text-sakode-purple">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">403 - Akses Khusus Super Admin</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Halaman ini dibatasi secara ketat dan hanya dapat diakses oleh Super Administrator resmi SAKODE Academy. Akun Anda saat ini memiliki peran <strong className="font-bold text-sakode-text">{user.role}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin" className="inline-block w-full">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Dashboard Admin
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Proteksi Rute Admin (RBAC: Hanya ADMIN & SUPER_ADMIN)
  if (requireAdmin && !user.isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-sakode-orange/40 bg-gradient-to-b from-white to-orange-50/20">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-sakode-orange/15 text-sakode-orange">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">403 - Akses Ditolak</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Halaman ini dibatasi secara ketat dan hanya dapat diakses oleh Administrator resmi SAKODE Academy. Akun Anda saat ini memiliki peran <strong className="font-bold text-sakode-text">{user.role}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/" className="inline-block w-full">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Halaman Utama
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Proteksi Member Belum Disetujui (PENDING)
  if (requireApproved && user.approvalStatus === USER_APPROVAL_STATUS.PENDING) {
    // Jika belum mengisi data rekening sama sekali
    if (!user.paymentAccountEncrypted) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sakode-cyan/20 text-[#09668d]">
                <Clock className="h-6 w-6" />
              </div>
              <CardTitle>Lengkapi Profil Anda</CardTitle>
              <CardDescription>
                Anda belum melengkapi nomor kontak dan data rekening tujuan reward.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/onboarding" className="inline-block w-full">
                <Button variant="primary" className="w-full">
                  Lengkapi Profil Sekarang
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Clock className="h-6 w-6" />
            </div>
            <CardTitle>Pendaftaran Sedang Ditinjau</CardTitle>
            <CardDescription>
              Akun Anda sedang dalam antrean verifikasi Admin SAKODE. Fitur pengerjaan task akan aktif setelah disetujui.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/pending-approval" className="inline-block w-full">
              <Button variant="outline" className="w-full">
                Lihat Detail Status Peninjauan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. Proteksi Member Ditolak (REJECTED)
  if (requireApproved && user.approvalStatus === USER_APPROVAL_STATUS.REJECTED) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-sakode-orange/50">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle>Pendaftaran Perlu Perbaikan</CardTitle>
            <CardDescription>
              Admin telah meninjau pendaftaran Anda dan meminta perbaikan data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/rejected" className="inline-block w-full">
              <Button variant="danger" className="w-full">
                Periksa Catatan & Perbaiki Data
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
