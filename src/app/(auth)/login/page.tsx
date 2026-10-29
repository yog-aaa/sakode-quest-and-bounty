'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SakodeAmbientOrnaments, SakodeSmileArc } from '@/components/brand/SakodeAmbientOrnaments';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { USER_APPROVAL_STATUS } from '@/lib/constants';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Terminal,
  BookOpen,
  Megaphone,
  Wallet,
  ShieldCheck,
  Check,
} from 'lucide-react';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTab = searchParams.get('tab');

  const {
    user,
    isLoading,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    error: authError,
    emailVerificationSent,
  } = useAuth();

  // Auto-redirect jika pengguna sudah memiliki sesi aktif
  useEffect(() => {
    if (!isLoading && user) {
      if (user.isAdmin || user.isSuperAdmin) {
        router.replace('/admin');
      } else if (user.isApprovedMember) {
        router.replace('/member');
      } else if (user.approvalStatus === USER_APPROVAL_STATUS.PENDING) {
        // Invariant UX: Jika data rekening belum dilengkapi, wajib ke tahap 2 onboarding
        if (!user.paymentAccountEncrypted) {
          router.replace('/onboarding');
        } else {
          router.replace('/pending-approval');
        }
      } else if (user.approvalStatus === USER_APPROVAL_STATUS.REJECTED) {
        router.replace('/rejected');
      } else {
        router.replace('/');
      }
    }
  }, [user, isLoading, router]);

  // Tab State: Sinkronisasi query param URL & aksi pengguna tanpa cascading effect (React 19 / ESLint compliant)
  const [tabOverride, setTabOverride] = useState<'login' | 'register' | null>(null);
  const [prevQueryTab, setPrevQueryTab] = useState(queryTab);

  if (queryTab !== prevQueryTab) {
    setPrevQueryTab(queryTab);
    setTabOverride(null);
  }

  const activeTab = tabOverride ?? (queryTab === 'register' ? 'register' : 'login');
  const setActiveTab = (newTab: 'login' | 'register') => {
    setTabOverride(newTab);
  };

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [unregisteredNotice, setUnregisteredNotice] = useState<{
    email: string;
    displayName?: string;
  } | null>(null);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    if (activeTab === 'login') {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setValidationErrors(errors);
        return;
      }

      setFormSubmitting(true);
      const ok = await signInWithEmail(email, password);
      setFormSubmitting(false);

      if (ok) {
        router.push('/');
      }
    } else {
      const result = registerSchema.safeParse({ email, password, confirmPassword });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setValidationErrors(errors);
        return;
      }

      setFormSubmitting(true);
      const ok = await signUpWithEmail(email, password);
      setFormSubmitting(false);

      if (ok) {
        router.push('/onboarding');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setUnregisteredNotice(null);
    try {
      const res = await signInWithGoogle(activeTab);
      if (res.notRegistered) {
        // Mode login tapi akun Google belum terdaftar di SAKODE
        if (res.email) {
          setEmail(res.email);
        }
        setUnregisteredNotice({
          email: res.email || 'Akun Google Anda',
          displayName: res.displayName || undefined,
        });
        setActiveTab('register');
        return;
      }

      if (res.success && activeTab === 'register') {
        router.push('/onboarding');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  if (user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex flex-col items-center justify-center p-6 space-y-3 transition-colors">
        <Loader2 className="h-8 w-8 animate-spin text-sakode-cyan" />
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          Mengarahkan ke dashboard...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070C14] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-sakode-cyan/30 transition-colors relative overflow-hidden">
      {/* Rich SAKODE Ambient Ornaments (Watermarks, Scattered Letters & Floating Badges) */}
      <SakodeAmbientOrnaments showForegroundBadges={true} />

      {/* Top Simple Header */}
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
              Bagian dari ekosistem resmi SAKODE Academy
            </span>
            <ThemeToggle />
            <Link
              href="/"
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-10 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-stretch">
          {/* Left Column: Contributor Ecosystem Value Panel */}
          <div className="lg:col-span-5 flex flex-col justify-between rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-sm">
            <div className="space-y-6">
              {/* Brand Lockup */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                    Internal Ekosistem SAKODE
                  </span>
                  <SakodeSmileArc className="w-7 h-2 text-amber-500/80" />
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sakode-work-logo.svg"
                  alt="SAKODE Work"
                  className="h-8 w-auto object-contain pt-1"
                />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                  Platform Kolaborasi &amp; Task Kontributor
                </h2>
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ruang kerja terstruktur bagi talenta dan kontributor SAKODE Academy untuk menggarap proyek teknologi, modul edukasi, dan inisiatif komunitas dengan transparansi penuh.
                </p>
              </div>

              {/* 3 Pillars List */}
              <div className="space-y-3 pt-1">
                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 hover:border-sky-300 dark:hover:border-sky-500/30 transition-colors">
                  <div className="rounded-xl bg-sky-50 dark:bg-sky-500/10 p-2 text-sky-600 dark:text-sakode-cyan border border-sky-200 dark:border-sky-500/20 shrink-0">
                    <Terminal className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Teknologi &amp; IT</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Frontend, backend, mobile app, DevOps, hingga security audit berstandar industri.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 hover:border-purple-300 dark:hover:border-purple-500/30 transition-colors">
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-500/10 p-2 text-purple-600 dark:text-sakode-purple border border-purple-200 dark:border-purple-500/20 shrink-0">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Modul &amp; Edukasi</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Penyusunan silabus kurikulum, penulisan modul lab praktikum, dan bank soal bootcamp.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-3.5 hover:border-amber-300 dark:hover:border-amber-500/30 transition-colors">
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shrink-0">
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">Marketing &amp; Komunitas</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                      Desain konten sosial, copywriting edukatif, dan penyelenggaraan event teknologi.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Proof Metric */}
            <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-slate-600 dark:text-slate-300 font-semibold">Reward Integer Transparan</span>
              </div>
              <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">100% Bersih (IDR)</span>
            </div>
          </div>

          {/* Right Column: Auth Card */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm dark:shadow-2xl p-6 sm:p-8">
              {/* Tab Selector */}
              <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setValidationErrors({});
                    setUnregisteredNotice(null);
                  }}
                  className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'login'
                      ? 'bg-sakode-cyan text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  <span>Masuk Akun</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setValidationErrors({});
                    setUnregisteredNotice(null);
                  }}
                  className={`py-2.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'register'
                      ? 'bg-sakode-cyan text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Daftar Kontributor</span>
                </button>
              </div>

              {/* Headline & Registration Stepper Visualizer */}
              <div className="mb-6 space-y-3">
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {activeTab === 'login' ? 'Masuk ke SAKODE Work' : 'Daftar Sebagai Kontributor'}
                  </h1>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {activeTab === 'login'
                      ? 'Akses dashboard pengerjaan task, pantau status review, dan kelola pencairan reward Anda.'
                      : 'Mulai perjalanan kontribusi proyek nyata dan klaim reward bounty langsung ke rekening Anda.'}
                  </p>
                </div>

                {/* Step-by-Step Register Visualizer (Hanya Tampil di Tab Register) */}
                {activeTab === 'register' && (
                  <div className="p-3 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/60 space-y-2 animate-fade-in-up">
                    <div className="flex items-center justify-between text-[11px] font-bold text-sky-900 dark:text-sakode-cyan">
                      <span className="flex items-center gap-1.5">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-500 text-slate-950 text-[10px] font-black">
                          1
                        </span>
                        <span>Tahap 1 dari 3: Akun Kontributor</span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                        Berikutnya: Profil &amp; Rekening
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5 text-[10px]">
                      <div className="flex items-center gap-1.5 font-bold text-sky-700 dark:text-sakode-cyan bg-white dark:bg-slate-900/80 px-2 py-1 rounded-lg border border-sky-200 dark:border-sky-800">
                        <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
                        <span>1. Buat Akun</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium bg-white/60 dark:bg-slate-900/40 px-2 py-1 rounded-lg border border-transparent">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <span>2. Rekening</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium bg-white/60 dark:bg-slate-900/40 px-2 py-1 rounded-lg border border-transparent">
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700"></span>
                        <span>3. Kurasi</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Banners: Google Belum Terdaftar */}
              {unregisteredNotice && (
                <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/50 text-xs text-amber-900 dark:text-amber-200 space-y-1.5 animate-fade-in-up shadow-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300">
                      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>Akun Google Belum Terdaftar</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUnregisteredNotice(null)}
                      className="text-amber-700 hover:text-amber-950 dark:text-amber-400 dark:hover:text-white text-xs font-bold px-1"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-[11px] text-amber-800/95 dark:text-amber-300/90 leading-relaxed pl-6">
                    Alamat email Google <strong className="font-bold underline">{unregisteredNotice.email}</strong> belum terdaftar sebagai kontributor SAKODE Work. Kami telah mengarahkan Anda ke formulir pendaftaran. Silakan klik tombol <strong>Daftar Cepat dengan Akun Google</strong> atau lengkapi password di bawah.
                  </p>
                </div>
              )}

              {/* Status Banners: Email Verifikasi */}
              {emailVerificationSent && (
                <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/40 text-xs text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center gap-2 font-bold">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Email Verifikasi Telah Dikirim</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400/90 pl-6">
                    Periksa kotak masuk email Anda dan klik tautan verifikasi sebelum mengklaim task.
                  </p>
                </div>
              )}

              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/40 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Google 1-Click Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white gap-3 font-bold text-xs cursor-pointer rounded-lg shadow-xs"
                onClick={handleGoogleSignIn}
                disabled={formSubmitting || isGoogleLoading}
                isLoading={isGoogleLoading}
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {activeTab === 'login'
                    ? 'Masuk dengan Akun Google'
                    : 'Daftar Cepat dengan Akun Google'}
                </span>
              </Button>

              {/* Divider */}
              <div className="relative flex items-center justify-center my-5">
                <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
                <span className="bg-white dark:bg-slate-900 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  {activeTab === 'login' ? 'atau masuk dengan email' : 'atau daftar dengan email baru'}
                </span>
                <div className="border-t border-slate-200 dark:border-slate-800 w-full"></div>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    label="Alamat Email"
                    type="email"
                    placeholder="nama@sakode.com atau email aktif"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    error={validationErrors.email}
                    leftIcon={<Mail className="h-4 w-4 text-slate-400" />}
                    autoComplete="email"
                    required
                    className="bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sakode-cyan focus:ring-sakode-cyan/20"
                  />
                </div>

                <div>
                  <Input
                    label="Kata Sandi"
                    type="password"
                    placeholder="Minimal 8 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    error={validationErrors.password}
                    leftIcon={<Lock className="h-4 w-4 text-slate-400" />}
                    autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
                    required
                    className="bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sakode-cyan focus:ring-sakode-cyan/20"
                  />
                </div>

                {activeTab === 'register' && (
                  <div className="space-y-3">
                    <Input
                      label="Konfirmasi Kata Sandi"
                      type="password"
                      placeholder="Ulangi kata sandi"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={validationErrors.confirmPassword}
                      leftIcon={<Lock className="h-4 w-4 text-slate-400" />}
                      autoComplete="new-password"
                      required
                      className="bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sakode-cyan focus:ring-sakode-cyan/20"
                    />

                    {/* Live Password Requirement Helper */}
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-[11px] space-y-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300 block">
                        Standar Keamanan Akun:
                      </span>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span
                          className={`flex items-center gap-1 ${
                            password.length >= 8
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <Check
                            className={`h-3 w-3 ${
                              password.length >= 8 ? 'opacity-100' : 'opacity-30'
                            }`}
                          />
                          Minimal 8 karakter
                        </span>
                        <span
                          className={`flex items-center gap-1 ${
                            /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
                              ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          <Check
                            className={`h-3 w-3 ${
                              /[a-zA-Z]/.test(password) && /[0-9]/.test(password)
                                ? 'opacity-100'
                                : 'opacity-30'
                            }`}
                          />
                          Huruf &amp; angka
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full font-black mt-2 h-11 cursor-pointer bg-sakode-cyan text-slate-950 hover:bg-[#5dbfe9] rounded-lg transition-colors shadow-xs"
                  isLoading={formSubmitting}
                >
                  {activeTab === 'login'
                    ? 'Masuk ke Platform'
                    : 'Lanjut ke Tahap 2: Profil & Rekening'}
                  <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>

                {activeTab === 'register' && (
                  <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 text-center">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Rekening dienkripsi AES-256 • Tanpa potongan • Honor 100% IDR</span>
                  </div>
                )}
              </form>

              {/* Bottom Switcher */}
              <div className="text-center pt-5 border-t border-slate-100 dark:border-slate-800/80 mt-5">
                {activeTab === 'login' ? (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Belum terdaftar sebagai kontributor?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('register');
                        setValidationErrors({});
                        setUnregisteredNotice(null);
                      }}
                      className="font-bold text-[#076991] dark:text-sakode-cyan hover:underline cursor-pointer"
                    >
                      Daftar Akun Baru
                    </button>
                  </p>
                ) : (
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Sudah memiliki akun terverifikasi?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('login');
                        setValidationErrors({});
                        setUnregisteredNotice(null);
                      }}
                      className="font-bold text-[#076991] dark:text-sakode-cyan hover:underline cursor-pointer"
                    >
                      Masuk ke Akun
                    </button>
                  </p>
                )}
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

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sakode-cyan" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
