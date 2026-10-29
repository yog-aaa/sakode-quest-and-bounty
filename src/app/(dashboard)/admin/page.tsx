'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { SakodeSmileArc } from '@/components/brand/SakodeAmbientOrnaments';
import {
  getAdminDashboardOverviewAction,
} from '@/server/actions/admin-manage.actions';
import type { AdminDashboardOverviewData } from '@/server/services/admin-manage.service';
import { formatCurrencyIDR, formatDateWIB } from '@/lib/utils';
import {
  ShieldAlert,
  Users,
  Compass,
  CreditCard,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  Bell,
  RefreshCw,
  Plus,
  Coins,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  Lock,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [overview, setOverview] = useState<AdminDashboardOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let ignore = false;
    if (!user?.id) return;

    async function loadData() {
      try {
        const res = await getAdminDashboardOverviewAction(user!.id);
        if (!ignore) {
          if (res.success && res.data) {
            setOverview(res.data);
            setErrorMsg(null);
          } else {
            setErrorMsg(res.error || 'Gagal menyinkronkan data operasional.');
          }
        }
      } catch (err: unknown) {
        if (!ignore) {
          console.error('Error fetching admin dashboard overview:', err);
          setErrorMsg('Koneksi terputus saat memuat data operasional.');
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [user, refreshKey]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((k) => k + 1);
  };

  // Helper untuk warna aksi audit log
  const getAuditActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('APPROVE') || act.includes('CLAIM_PAY') || act.includes('ACCEPT')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
    if (act.includes('REJECT') || act.includes('PENALTY') || act.includes('DEMOTE')) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    }
    if (act.includes('REVISION') || act.includes('DISPUTE') || act.includes('APPEAL')) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    }
    return 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-800';
  };

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070C14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* =============================================================== */}
          {/* 1. EXECUTIVE COMMAND CENTER HEADER */}
          {/* =============================================================== */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-sakode-purple border border-purple-200 dark:border-purple-800/80">
                  <ShieldAlert className="h-3 w-3" />
                  <span>Admin Command Center</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sistem Operasional Real-Time</span>
                </span>
                <SakodeSmileArc className="w-6 h-2 text-amber-500/80 ml-1" />
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Dashboard Operasional SAKODE Work
              </h1>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
                Pusat kendali verifikasi kontributor, manajemen tugas proyek, peninjauan deliverable hasil kerja, dan pencairan bounty transparan.
              </p>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5 sm:self-end lg:self-center">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="h-10 text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs cursor-pointer"
                title="Perbarui Metrik"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Sinkronkan</span>
              </Button>

              <Link href="/admin/audit">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>Audit Trail</span>
                </Button>
              </Link>

              <Link href="/admin/tasks/create">
                <Button
                  variant="primary"
                  size="sm"
                  className="h-10 text-xs font-black gap-2 bg-gradient-to-r from-sky-500 to-[#076991] hover:from-sky-600 hover:to-[#055374] dark:from-sakode-cyan dark:to-sky-400 dark:text-slate-950 dark:hover:from-sky-300 dark:hover:to-cyan-300 shadow-md shadow-sky-500/20"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Terbitkan Task Baru</span>
                </Button>
              </Link>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 animate-fade-in-up">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
              <Button variant="outline" size="sm" onClick={handleRefresh} className="h-8 text-xs font-bold">
                Coba Lagi
              </Button>
            </div>
          )}

          {/* =============================================================== */}
          {/* 2. REAL-TIME OPERATIONAL METRICS (5 KPI CARDS) */}
          {/* =============================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* KPI 1: Antrean Member Baru */}
            <Link href="/admin/members" className="group block focus:outline-none">
              <div className="h-full p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs hover:shadow-md hover:border-sky-400 dark:hover:border-sakode-cyan/50 transition-all duration-200 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Antrean Member
                  </span>
                  <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#076991] dark:text-sakode-cyan border border-sky-200 dark:border-sky-800">
                    <Users className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isLoading ? (
                      <span className="text-slate-300 dark:text-slate-700 animate-pulse">--</span>
                    ) : (
                      overview?.pendingMembersCount || 0
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    Menunggu verifikasi identitas
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-[#076991] dark:text-sakode-cyan group-hover:translate-x-0.5 transition-transform">
                  <span>Buka Antrean</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            {/* KPI 2: Task Butuh Tindakan */}
            <Link href="/admin/tasks" className="group block focus:outline-none">
              <div className="h-full p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs hover:shadow-md hover:border-purple-400 dark:hover:border-purple-500/50 transition-all duration-200 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Task Perlu Aksi
                  </span>
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <Compass className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isLoading ? (
                      <span className="text-slate-300 dark:text-slate-700 animate-pulse">--</span>
                    ) : (
                      overview?.tasksNeedingActionCount || 0
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    Draf publikasi &amp; seleksi pelamar
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-purple-700 dark:text-purple-300 group-hover:translate-x-0.5 transition-transform">
                  <span>Kelola Task ({overview?.openTasksCount || 0} Open)</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            {/* KPI 3: Submission Butuh Review */}
            <Link href="/admin/submissions" className="group block focus:outline-none">
              <div className="h-full p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs hover:shadow-md hover:border-emerald-400 dark:hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Review Submission
                  </span>
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <FileCheck2 className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isLoading ? (
                      <span className="text-slate-300 dark:text-slate-700 animate-pulse">--</span>
                    ) : (
                      overview?.pendingSubmissionsCount || 0
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    Deliverable masuk siap dinilai
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-emerald-700 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Buka Antrean Review</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            {/* KPI 4: Klaim Pencairan Pending */}
            <Link href="/admin/claims" className="group block focus:outline-none">
              <div className="h-full p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs hover:shadow-md hover:border-amber-400 dark:hover:border-amber-500/50 transition-all duration-200 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Klaim Menunggu
                  </span>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <CreditCard className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {isLoading ? (
                      <span className="text-slate-300 dark:text-slate-700 animate-pulse">--</span>
                    ) : (
                      overview?.pendingClaimsCount || 0
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                    Permohonan siap ditransfer
                  </p>
                </div>

                <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300 group-hover:translate-x-0.5 transition-transform">
                  <span>Proses Transfer</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </Link>

            {/* KPI 5: Total Bounty Tersalurkan */}
            <div className="h-full p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900/90 dark:to-slate-950/90 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Disbursed
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <Coins className="h-4 w-4" />
                </div>
              </div>

              <div>
                <div className="text-lg font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {isLoading ? (
                    <span className="text-slate-300 dark:text-slate-700 animate-pulse">--</span>
                  ) : (
                    formatCurrencyIDR(overview?.totalDisbursedBounty || 0)
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Bounty 100% IDR Bersih
                </p>
              </div>

              <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-500 font-mono">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                <span>Terverifikasi Bank</span>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 3. OPERATIONAL QUEUES HUB (6 MODUL UTAMA DENGAN AKSI JELAS) */}
          {/* =============================================================== */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="h-5 w-5 text-[#076991] dark:text-sakode-cyan" />
                  <span>Modul Antrean Operasional &amp; Tugas Harian</span>
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Akses langsung ke setiap subsistem operasional admin dengan indikator urgensi terpusat.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Queue 1: Verifikasi Member */}
              <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-sky-100/70 dark:bg-sky-950/60 text-[#076991] dark:text-sakode-cyan border border-sky-200 dark:border-sky-800">
                      <Users className="h-5 w-5" />
                    </div>
                    {overview && overview.pendingMembersCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                        {overview.pendingMembersCount} Menunggu Kurasi
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Antrean Bersih
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Kurasi &amp; Verifikasi Member Baru
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Verifikasi nomor WhatsApp, data perbankan terenkripsi AES-256, dan validasi portofolio calon kontributor SAKODE.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <Link href="/admin/members">
                    <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1.5 justify-between">
                      <span>Kelola Antrean Member</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Queue 2: Kelola Task & Bounty */}
              <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-purple-100/70 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      <Compass className="h-5 w-5" />
                    </div>
                    {overview && overview.tasksNeedingActionCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                        {overview.tasksNeedingActionCount} Butuh Tindakan
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Katalog Terbit
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Manajemen Task &amp; Seleksi Pelamar
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Publikasikan draf tugas proyek, seleksi pelamar task mode Application, dan atur alokasi bounty solo maupun tim.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <Link href="/admin/tasks">
                    <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1.5 justify-between">
                      <span>Kelola Katalog &amp; Pelamar</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Queue 3: Review Submissions */}
              <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                    {overview && overview.pendingSubmissionsCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-pulse">
                        {overview.pendingSubmissionsCount} Masuk Siap Review
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Semua Terkaji
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Review Deliverable Hasil Kerja
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Evaluasi kode GitHub, URL pratinjau live, dan tentukan persetujuan reward, permintaan revisi, atau pembagian tim.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <Link href="/admin/submissions">
                    <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1.5 justify-between">
                      <span>Buka Antrean Review</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Queue 4: Klaim Reward & Pencairan */}
              <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-amber-100/70 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    {overview && overview.pendingClaimsCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700 animate-pulse">
                        {overview.pendingClaimsCount} Butuh Transfer
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Pencairan Lancar
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Pencairan Dana Bounty (Disbursement)
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Transfer honor tunai ke rekening bank/e-wallet resmi kontributor dan unggah bukti transfer perbankan sah.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <Link href="/admin/claims">
                    <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1.5 justify-between">
                      <span>Kelola Antrean Klaim</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Queue 5: Laporan Sengketa & Investigasi */}
              <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-rose-100/70 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    {overview && overview.activeReportsCount > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
                        {overview.activeReportsCount} Sengketa Terbuka
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                        Tidak Ada Sengketa
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Investigasi Sengketa &amp; Banding Nilai
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Investigasi laporan kecurangan, perselisihan pembagian tim, sanggahan evaluasi tugas, dan penegakan sanksi penalti.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <Link href="/admin/reports">
                    <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1.5 justify-between">
                      <span>Pusat Investigasi Laporan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Queue 6: Manajemen Staf & Delegasi Role (Khusus Super Admin) / Notifikasi Masuk */}
              <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-xl bg-sky-100/70 dark:bg-sky-950/60 text-[#076991] dark:text-sakode-cyan border border-sky-200 dark:border-sky-800">
                      <Bell className="h-5 w-5" />
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300">
                      Real-time Feed
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      Pusat Notifikasi &amp; Staf Admin
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                      Pantau lonceng pemberitahuan masuk dan {user?.isSuperAdmin ? 'kelola hak akses administrator' : 'pantau pengumuman internal staf'}.
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex gap-2">
                  <Link href="/admin/notifications" className="flex-1">
                    <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1">
                      <Bell className="h-3.5 w-3.5" />
                      <span>Notifikasi</span>
                    </Button>
                  </Link>
                  {user?.isSuperAdmin && (
                    <Link href="/admin/roles" className="flex-1">
                      <Button variant="outline" className="w-full h-10 text-xs font-bold gap-1 text-purple-700 dark:text-purple-300">
                        <Lock className="h-3.5 w-3.5" />
                        <span>Hak Akses</span>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 4. RECENT AUDIT TRAIL FORENSIC FEED (AKTIVITAS OPERASIONAL TERBARU) */}
          {/* =============================================================== */}
          <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    Aktivitas Operasional Terbaru (Audit Trail Forensik)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Koleksi riwayat mutasi data sensitif yang dicatat secara permanen dan immutable.
                  </p>
                </div>
              </div>

              <Link href="/admin/audit" className="text-xs font-bold text-[#076991] dark:text-sakode-cyan hover:underline flex items-center gap-1 self-start sm:self-auto">
                <span>Lihat Seluruh Log ({overview?.recentAuditEvents?.length || 0})</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {isLoading ? (
              <div className="py-8 text-center text-xs text-slate-500">
                Memuat riwayat aktivitas audit...
              </div>
            ) : overview?.recentAuditEvents && overview.recentAuditEvents.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {overview.recentAuditEvents.map((evt) => (
                  <div key={evt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border uppercase shrink-0 ${getAuditActionBadge(evt.action)}`}>
                        {evt.action.replace(/_/g, ' ')}
                      </span>
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {evt.entityType}: <span className="font-mono text-slate-500 dark:text-slate-400">{evt.entityId}</span>
                        </span>
                        {evt.metadata && Object.keys(evt.metadata).length > 0 && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                            {JSON.stringify(evt.metadata).slice(0, 100)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right text-[11px] text-slate-500 dark:text-slate-400 font-mono shrink-0 pl-7 sm:pl-0">
                      {formatDateWIB(evt.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                Belum ada aktivitas mutasi audit baru yang tercatat.
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* 5. STRICT INVARIANT & PLATFORM INTEGRITY POSTURE */}
          {/* =============================================================== */}
          <div className="p-5 rounded-2xl border border-sky-200 dark:border-sky-900/60 bg-gradient-to-r from-sky-50/70 via-white to-purple-50/50 dark:from-sky-950/40 dark:via-slate-900/60 dark:to-purple-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-900/60 text-[#076991] dark:text-sakode-cyan shrink-0 mt-0.5">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>Protokol Integritas &amp; Keamanan SAKODE (AGENTS.md)</span>
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Enkripsi nomor rekening AES-256-GCM aktif • Audit trail append-only permanen • Pemisahan wewenang &amp; anti-konflik kepentingan ditegakkan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <span className="text-[10px] font-mono font-bold px-2 py-1 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                Sistem Aktif 100%
              </span>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
