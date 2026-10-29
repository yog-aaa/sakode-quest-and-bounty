'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SakodeAmbientOrnaments, SakodeSmileArc } from '@/components/brand/SakodeAmbientOrnaments';
import { USER_APPROVAL_STATUS } from '@/lib/constants';
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  Home,
  MessageCircle,
  ShieldCheck,
  Edit3,
  Lock,
  Sparkles,
  ArrowRight,
  User,
  Phone,
  CreditCard,
} from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, refreshProfile, isLoading } = useAuth();
  const [checking, setChecking] = useState(false);

  // Auto-redirect jika pengguna sudah disetujui atau merupakan Admin/Super Admin
  useEffect(() => {
    if (!isLoading && user) {
      const isApproved =
        user.approvalStatus === USER_APPROVAL_STATUS.APPROVED ||
        String(user.approvalStatus).toUpperCase() === USER_APPROVAL_STATUS.APPROVED;

      if (user.isAdmin || user.isSuperAdmin) {
        router.replace('/admin');
      } else if (isApproved) {
        router.replace('/member');
      }
    }
  }, [user, isLoading, router]);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

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
              Tahap 3 dari 3: Verifikasi Admin
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
          {/* Brand & Status Notice */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                Status Pengajuan Akun
              </span>
              <SakodeSmileArc className="w-7 h-2 text-amber-500/80" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Pendaftaran Sedang Ditinjau Admin
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
              Profil dan data nomor rekening Anda telah tersimpan. Tim Admin SAKODE Academy sedang memvalidasi data untuk aktivasi akses task.
            </p>
          </div>

          {/* Main Status Glassmorphic Card */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 dark:shadow-sky-500/5 overflow-hidden">
            {/* Top Glowing Status Bar */}
            <div className="h-2 w-full bg-gradient-to-r from-amber-400 via-amber-500 to-sky-400 animate-pulse"></div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header Icon & Status Pill */}
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/70 border border-amber-200 dark:border-amber-800/80 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-md shadow-amber-500/10">
                  <Clock className="h-8 w-8 stroke-[2.2]" />
                  <div className="absolute -top-1 -right-1 p-1 rounded-full bg-amber-400 text-slate-950">
                    <Sparkles className="h-3 w-3" />
                  </div>
                </div>

                <div className="flex justify-center">
                  <StatusPill status="PENDING" size="lg" />
                </div>
              </div>

              {/* 4-Step Verification Timeline */}
              <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/40 p-4 sm:p-5 space-y-3.5">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>Tahapan Aktivasi Akun:</span>
                  <span className="font-mono text-[10px] text-amber-600 dark:text-amber-400">Step 3 of 4</span>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Step 1: Registrasi */}
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">1. Registrasi Akun SAKODE</div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Email dan kredensial akses berhasil didaftarkan.</p>
                    </div>
                  </div>

                  {/* Step 2: Profil & Rekening */}
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">2. Kelengkapan Profil &amp; Rekening Terenkripsi</div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Nomor rekening dienkripsi dengan standar AES-256.</p>
                    </div>
                  </div>

                  {/* Step 3: Verifikasi Admin (Active) */}
                  <div className="flex items-start gap-3 p-3 rounded-xl border border-amber-300 dark:border-amber-500/40 bg-amber-50/80 dark:bg-amber-950/40">
                    <div className="p-1 rounded-full bg-amber-200 dark:bg-amber-900/80 text-amber-700 dark:text-amber-300 shrink-0 mt-0.5">
                      <Clock className="h-4 w-4 animate-spin" style={{ animationDuration: '4s' }} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="font-black text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <span>3. Evaluasi Mutu oleh Tim Admin</span>
                        <span className="text-[9px] uppercase px-1.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900 text-amber-800 dark:text-amber-300 font-extrabold">
                          Estimasi 1x24 Jam
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-tight">
                        Admin memastikan data identitas valid untuk kelayakan penerimaan tugas proyek nyata.
                      </p>
                    </div>
                  </div>

                  {/* Step 4: Akses Penuh */}
                  <div className="flex items-start gap-3 opacity-50">
                    <div className="h-6 w-6 rounded-full border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                      4
                    </div>
                    <div>
                      <div className="font-bold text-slate-700 dark:text-slate-300">4. Akses Penuh ke Katalog Task &amp; Klaim Reward</div>
                      <p className="text-[11px] text-slate-500">Katalog task solo &amp; team akan otomatis terbuka setelah disetujui.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Snapshot Card */}
              {user && (
                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 p-4 space-y-3 text-xs">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-sky-500" />
                      <span>Ringkasan Pengajuan Profil:</span>
                    </span>
                    <Link
                      href="/onboarding"
                      className="text-sky-600 dark:text-sakode-cyan hover:underline flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Edit3 className="h-3 w-3" />
                      <span>Ubah Data</span>
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-500 dark:text-slate-400">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider block">Nama Lengkap</span>
                      <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                        {user.displayName || '-'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider block">Kontak WhatsApp</span>
                      <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                        {user.contactNumber || '-'}
                      </span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] uppercase font-mono tracking-wider block">Rekening Reward (Masked)</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <CreditCard className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {user.paymentAccountMasked || 'Belum diisi'}
                        </span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold">
                          Terenkripsi
                        </span>
                      </div>
                    </div>
                  </div>

                  {user.skills && user.skills.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400 block mb-1.5">
                        Skill yang Diajukan ({user.skills.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {user.skills.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <Button
                  variant="primary"
                  className="w-full h-11 text-xs sm:text-sm font-black bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 shadow-md shadow-amber-500/20 cursor-pointer transition-all"
                  onClick={handleRefresh}
                  disabled={checking}
                  isLoading={checking}
                  rightIcon={<RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />}
                >
                  <span>{checking ? 'Memverifikasi...' : 'Periksa Status Persetujuan'}</span>
                </Button>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    className="w-full h-10 text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-slate-100 cursor-pointer gap-2 transition-all shadow-2xs"
                    onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Hubungi Admin SAKODE</span>
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
