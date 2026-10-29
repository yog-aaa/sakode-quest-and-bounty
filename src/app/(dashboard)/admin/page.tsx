'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  getAdminDashboardOverviewAction,
} from '@/server/actions/admin-manage.actions';
import type { AdminDashboardOverviewData } from '@/server/services/admin-manage.service';
import { formatCurrencyIDR, formatDateWIB } from '@/lib/utils';
import {
  Users,
  CreditCard,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Plus,
  Coins,
  CheckCircle2,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

// Format deskripsi ramah manusia untuk audit event
function formatAuditEventDescription(action: string, entityType: string, entityId: string): string {
  const act = action.toUpperCase();
  if (act.includes('APPROVE_MEMBER') || act.includes('MEMBER_APPROVED') || act.includes('APPROVE_USER')) {
    return 'Pendaftaran member disetujui';
  }
  if (act.includes('REJECT_MEMBER') || act.includes('MEMBER_REJECTED')) {
    return 'Pendaftaran member ditolak';
  }
  if (act.includes('CLAIM_PAY') || act.includes('CLAIM_PAID')) {
    return 'Pencairan reward berhasil ditransfer';
  }
  if (act.includes('SUBMISSION_APPROVED') || act.includes('ACCEPT_SUBMISSION')) {
    return 'Deliverable tugas disetujui';
  }
  if (act.includes('SUBMISSION_REVISION')) {
    return 'Permintaan revisi tugas diajukan';
  }
  if (act.includes('TASK_CREATED') || act.includes('CREATE_TASK')) {
    return 'Task proyek baru diterbitkan';
  }
  if (act.includes('USER_PROFILE_UPDATED')) {
    return 'Pembaruan data profil staf';
  }
  return `${action.replace(/_/g, ' ').toLowerCase()} (${entityType} #${entityId.slice(0, 6)}...)`;
}

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

  // Hitung total item yang membutuhkan perhatian mendesak dari admin
  const totalUrgentCount =
    (overview?.pendingMembersCount || 0) +
    (overview?.pendingSubmissionsCount || 0) +
    (overview?.pendingClaimsCount || 0) +
    (overview?.activeReportsCount || 0);

  const adminName = user?.displayName || user?.email?.split('@')[0] || 'Administrator';

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-6xl mx-auto space-y-7">
          {/* =============================================================== */}
          {/* 1. HERO GREETING: PERSONAL, HUMAN, CLEAR */}
          {/* =============================================================== */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Halo, {adminName}</span>
                <span className="text-xl sm:text-2xl animate-wave">👋</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {isLoading ? (
                  <span className="animate-pulse">Menghubungkan ke pusat metrik operasional...</span>
                ) : totalUrgentCount > 0 ? (
                  <span>
                    Ada <strong className="text-amber-600 dark:text-amber-400 font-bold">{totalUrgentCount} antrean</strong> yang memerlukan tinjauan Anda hari ini.
                  </span>
                ) : (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 inline" />
                    <span>Semua antrean bersih! Tidak ada tugas operasional tertunda.</span>
                  </span>
                )}
              </p>
            </div>

            {/* Quick Primary Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
                className="h-10 text-xs font-semibold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs cursor-pointer"
                title="Segarkan Data Real-Time"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Segarkan</span>
              </Button>

              <Link href="/admin/tasks/create">
                <Button
                  variant="primary"
                  size="sm"
                  className="h-10 text-xs font-bold gap-2 bg-gradient-to-r from-sky-500 to-[#076991] hover:from-sky-600 hover:to-[#055374] dark:from-sakode-cyan dark:to-sky-400 dark:text-slate-950 dark:hover:from-sky-300 dark:hover:to-cyan-300 shadow-sm shadow-sky-500/20"
                >
                  <Plus className="h-4 w-4 stroke-[2.5]" />
                  <span>Terbitkan Task</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Feedback Alert jika ada error */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-3 shadow-2xs">
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
          {/* 2. 4 KEY PERFORMANCE METRICS: CALM, BIG NUMBERS, LOW CLUTTER */}
          {/* =============================================================== */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            {/* Card 1: Verifikasi Member */}
            <Link
              href="/admin/members"
              className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 hover:border-sky-400 dark:hover:border-cyan-500/50 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Verifikasi Member
                </span>
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-[#076991] dark:text-sakode-cyan border border-sky-200/60 dark:border-sky-800/60">
                  <Users className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isLoading ? '--' : overview?.pendingMembersCount || 0}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Menunggu Kurasi</span>
                  <ArrowRight className="h-3 w-3 text-sky-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Card 2: Review Submission */}
            <Link
              href="/admin/submissions"
              className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500/50 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Review Submission
                </span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <FileCheck2 className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isLoading ? '--' : overview?.pendingSubmissionsCount || 0}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Deliverable Masuk</span>
                  <ArrowRight className="h-3 w-3 text-emerald-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Card 3: Klaim Hadiah */}
            <Link
              href="/admin/claims"
              className="group p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500/50 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Klaim Dana Menunggu
                </span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                  <CreditCard className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isLoading ? '--' : overview?.pendingClaimsCount || 0}
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">Siap Ditransfer</span>
                  <ArrowRight className="h-3 w-3 text-amber-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            </Link>

            {/* Card 4: Total Bounty Disbursed */}
            <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between pb-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Total Disbursed
                </span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60">
                  <Coins className="h-4 w-4" />
                </div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
                  {isLoading ? '--' : formatCurrencyIDR(overview?.totalDisbursedBounty || 0)}
                </div>
                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                  Bounty Bersih IDR
                </div>
              </div>
            </div>
          </div>

          {/* =============================================================== */}
          {/* 3. TWO-COLUMN LAYOUT: ACTION CENTER + RECENT TIMELINE */}
          {/* =============================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* KOLOM KIRI (2/3): PUSAT TINDAKAN OPERASIONAL & FEED AKTIVITAS */}
            <div className="lg:col-span-2 space-y-6">
              {/* Card A: Antrean Perlu Tindakan Hari Ini */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        Antrean Perlu Tindakan Segera
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Fokus pada subsistem yang sedang membutuhkan keputusan staf
                      </p>
                    </div>
                  </div>

                  {totalUrgentCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      {totalUrgentCount} Menunggu
                    </span>
                  )}
                </div>

                {isLoading ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    Memeriksa antrean operasional...
                  </div>
                ) : totalUrgentCount === 0 ? (
                  // Delightful Zero State (Emil Kowalski style: calm, reassuring)
                  <div className="py-8 px-4 text-center space-y-2">
                    <div className="inline-flex p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Ekosistem Terkendali Penuh
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Semua pendaftaran member, deliverable tugas, dan pengajuan klaim hadiah telah selesai diproses.
                    </p>
                  </div>
                ) : (
                  // Action Items List (Hanya muncul jika ada antrean > 0)
                  <div className="space-y-2.5">
                    {/* Item 1: Member Menunggu Kurasi */}
                    {overview && overview.pendingMembersCount > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-[#076991] dark:text-sakode-cyan shrink-0">
                            <Users className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {overview.pendingMembersCount} Pendaftar Baru Menunggu Verifikasi
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Validasi nomor kontak WhatsApp &amp; data rekening AES-256
                            </p>
                          </div>
                        </div>

                        <Link href="/admin/members">
                          <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1 shrink-0">
                            <span>Tinjau</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Item 2: Submission Siap Dinilai */}
                    {overview && overview.pendingSubmissionsCount > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shrink-0">
                            <FileCheck2 className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {overview.pendingSubmissionsCount} Deliverable Tugas Masuk
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Review kode &amp; tentukan status approval atau revisi
                            </p>
                          </div>
                        </div>

                        <Link href="/admin/submissions">
                          <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1 shrink-0 text-emerald-700 dark:text-emerald-300">
                            <span>Review</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Item 3: Klaim Hadiah Menunggu Transfer */}
                    {overview && overview.pendingClaimsCount > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 shrink-0">
                            <CreditCard className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {overview.pendingClaimsCount} Permohonan Pencairan Dana
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Klaim bounty kontributor siap dieksekusi transfer bank
                            </p>
                          </div>
                        </div>

                        <Link href="/admin/claims">
                          <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1 shrink-0 text-amber-700 dark:text-amber-300">
                            <span>Proses</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    )}

                    {/* Item 4: Laporan Sengketa Aktif */}
                    {overview && overview.activeReportsCount > 0 && (
                      <div className="p-3.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 shrink-0">
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                              {overview.activeReportsCount} Sengketa Membutuhkan Investigasi
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              Laporan kecurangan atau banding hasil evaluasi
                            </p>
                          </div>
                        </div>

                        <Link href="/admin/reports">
                          <Button size="sm" variant="outline" className="h-8 text-xs font-bold gap-1 shrink-0 text-rose-700 dark:text-rose-300">
                            <span>Investigasi</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card B: Aktivitas Operasional Terkini (Clean Human-Readable Feed) */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                        Aktivitas Terkini Platform
                      </h2>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Rekaman kronologis mutasi data yang terdaftar di sistem
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/admin/audit"
                    className="text-xs font-semibold text-[#076991] dark:text-sakode-cyan hover:underline flex items-center gap-1"
                  >
                    <span>Audit Lengkap</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>

                {isLoading ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Memuat log aktivitas...
                  </div>
                ) : overview?.recentAuditEvents && overview.recentAuditEvents.length > 0 ? (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {overview.recentAuditEvents.slice(0, 5).map((evt) => (
                      <div key={evt.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                              {formatAuditEventDescription(evt.action, evt.entityType, evt.entityId)}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono truncate">
                              ID: {evt.entityId}
                            </p>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-400 shrink-0 font-medium">
                          {formatDateWIB(evt.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400">
                    Belum ada rekaman aktivitas baru.
                  </div>
                )}
              </div>
            </div>

            {/* KOLOM KANAN (1/3): STATUS EKOSISTEM BOUNTY & SHORTCUTS */}
            <div className="space-y-6">
              {/* Card C: Ringkasan Ekosistem Task */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Status Ekosistem Task
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-xs text-slate-600 dark:text-slate-300">Task Buka (Open)</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                      {overview?.openTasksCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-xs text-slate-600 dark:text-slate-300">Task Perlu Seleksi</span>
                    <span className="text-sm font-bold text-purple-600 dark:text-purple-400 font-mono">
                      {overview?.tasksNeedingActionCount || 0}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-xs text-slate-600 dark:text-slate-300">Sanggahan / Sengketa</span>
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400 font-mono">
                      {overview?.activeReportsCount || 0}
                    </span>
                  </div>
                </div>

                <Link href="/admin/tasks" className="block pt-1">
                  <Button variant="outline" className="w-full h-9 text-xs font-bold gap-1.5 justify-center">
                    <span>Buka Katalog Task</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>

              {/* Card D: Pintasan Cepat Operasional */}
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 shadow-xs space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Aksi Cepat
                </h3>

                <div className="space-y-1.5">
                  <Link
                    href="/admin/tasks/create"
                    className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                      <span>Terbitkan Task Proyek Baru</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/admin/members"
                    className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                      <span>Kelola Antrean Member</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/admin/audit"
                    className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                      <span>Jejak Audit Forensik</span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                  </Link>

                  <Link
                    href="/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors group"
                  >
                    <span className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-sky-500 group-hover:scale-110 transition-transform" />
                      <span>Pratinjau Portal Publik</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Tab Baru ↗</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
