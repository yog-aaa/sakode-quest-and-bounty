'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { formatCurrencyIDR, formatDateWIB } from '@/lib/utils';
import { getActiveTaskForUserAction } from '@/server/actions/task.actions';
import { getUserApplicationsAction, withdrawApplicationAction } from '@/server/actions/assignment.actions';
import { getClientFirestore } from '@/lib/firebase/client';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { TaskDocument, ApplicationDocument } from '@/types/database';
import {
  Compass,
  ShieldCheck,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Send,
  FileCheck2,
  Trash2,
  ArrowRight,
  Loader2,
  X,
  Wallet,
  Clock,
  Sparkles,
  ChevronRight,
  Lock,
} from 'lucide-react';

export default function MemberDashboardPage() {
  const { user } = useAuth();

  const [activeTask, setActiveTask] = useState<TaskDocument | null>(null);
  const [loadingActiveTask, setLoadingActiveTask] = useState(false);

  const [applications, setApplications] = useState<ApplicationDocument[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'applications'>('overview');
  const [withdrawingAppId, setWithdrawingAppId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Load Active Task (Prioritaskan Client SDK untuk menghindari Server Action 500)
  const loadActiveTask = useCallback(async () => {
    if (!user) return;
    setLoadingActiveTask(true);
    try {
      // Jika member tidak sedang memegang activeTaskId, langsung set null tanpa network roundtrip
      if (!user.activeTaskId) {
        setActiveTask(null);
        setLoadingActiveTask(false);
        return;
      }

      // 1. Coba lewat Client SDK langsung jika user punya activeTaskId
      try {
        const db = getClientFirestore();
        const snap = await getDoc(doc(db, 'tasks', user.activeTaskId));
        if (snap.exists()) {
          setActiveTask({ ...(snap.data() as TaskDocument), id: snap.id });
        } else {
          setActiveTask(null);
        }
        setLoadingActiveTask(false);
        return;
      } catch (clientErr) {
        console.warn('Client load active task fallback:', clientErr);
      }

      // 2. Fallback Server Action hanya jika Client SDK mengalami exception jaringan
      try {
        const res = await getActiveTaskForUserAction(user.id);
        if (res.success && res.task) {
          setActiveTask(res.task);
        } else {
          setActiveTask(null);
        }
      } catch (actErr) {
        console.warn('Server action fallback error for active task:', actErr);
        setActiveTask(null);
      }
    } catch (err: unknown) {
      console.error(err);
      setActiveTask(null);
    } finally {
      setLoadingActiveTask(false);
    }
  }, [user]);

  // Load User Applications (Prioritaskan Client SDK untuk menghindari Server Action 500)
  const loadApplications = useCallback(async () => {
    if (!user) return;
    setLoadingApplications(true);
    try {
      // 1. Coba lewat Client SDK langsung (sesuai schema firestore.rules: userId)
      try {
        const db = getClientFirestore();
        const q = query(collection(db, 'applications'), where('userId', '==', user.id));
        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({ ...(d.data() as ApplicationDocument), id: d.id }));
        setApplications(docs);
        setLoadingApplications(false);
        return;
      } catch (clientErr) {
        console.warn('Client load applications fallback:', clientErr);
      }

      // 2. Fallback Server Action hanya jika Client SDK terkendala
      try {
        const res = await getUserApplicationsAction(user.id);
        if (res.success && res.applications) {
          setApplications(res.applications);
        }
      } catch (actErr) {
        console.warn('Server action fallback error for applications:', actErr);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingApplications(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadActiveTask();
      loadApplications();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadActiveTask, loadApplications]);

  // Withdraw Application
  const handleWithdrawApplication = async (applicationId: string) => {
    if (!user) return;
    const confirmWithdraw = window.confirm(
      'Apakah Anda yakin ingin membatalkan permohonan ini? Pembatalan ini bebas penalti dan akan mengembalikan 1 slot kuota aplikasi Anda.'
    );
    if (!confirmWithdraw) return;

    setWithdrawingAppId(applicationId);
    setActionErrorMsg(null);
    setActionSuccessMsg(null);
    try {
      const res = await withdrawApplicationAction(user.id, applicationId);
      if (res.success) {
        setActionSuccessMsg('Permohonan berhasil dibatalkan tanpa penalti.');
        loadApplications();
      } else {
        setActionErrorMsg(res.error || 'Gagal membatalkan permohonan.');
      }
    } catch (err: unknown) {
      console.error(err);
      setActionErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setWithdrawingAppId(null);
    }
  };

  const pendingAppsCount = applications.filter((a) => a.status === 'PENDING').length;

  return (
    <AuthGuard requireApproved>
      <div className="relative min-h-screen bg-slate-50 dark:bg-[#070A10] py-8 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors overflow-hidden">
        {/* Subtle Ambient Radial Mesh Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-sky-500/[0.07] via-indigo-500/[0.03] to-transparent pointer-events-none blur-3xl -z-10" />

        <div className="max-w-6xl mx-auto space-y-7">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Member Terverifikasi</span>
                </span>
                <span className="text-xs text-slate-400 font-medium">SAKODE Academy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                Halo, {user?.displayName || 'Member SAKODE'}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl leading-relaxed">
                Akun Anda berstatus <strong className="text-emerald-600 dark:text-emerald-400 font-bold">APPROVED</strong>. Anda memiliki akses penuh untuk mengeksekusi task solo instan atau bergabung dalam squad proyek tim.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/member/tasks">
                <button className="group flex items-center gap-2.5 pl-4 pr-2 py-2 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 text-xs font-bold shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer">
                  <span>Jelajahi Task Tersedia</span>
                  <div className="w-6 h-6 rounded-full bg-white/15 dark:bg-slate-900/15 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </button>
              </Link>
            </div>
          </div>

          {/* Action Notifications */}
          {actionSuccessMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 p-1 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {actionErrorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-2xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{actionErrorMsg}</span>
              </div>
              <button onClick={() => setActionErrorMsg(null)} className="text-rose-600 dark:text-rose-400 hover:text-rose-800 p-1 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Quick Stats Grid: Hardware Doppelrand Bento Architecture */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Task Aktif */}
            <div className="p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs">
              <div className="p-4 rounded-[calc(1rem-0.125rem)] bg-white dark:bg-slate-900/90 h-full flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Task Aktif Saat Ini
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/60 dark:border-amber-800/60">
                    <Zap className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-950 dark:text-white font-mono">
                    {activeTask ? '1 Task' : '0 Task'}
                  </div>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mt-0.5">
                    {activeTask ? 'Sedang Anda Kerjakan' : 'Slot Pengerjaan Kosong'}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Limit Invariant:</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">Maks. 1 Task</span>
                </div>
              </div>
            </div>

            {/* Card 2: Aplikasi Pending */}
            <div className="p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs">
              <div className="p-4 rounded-[calc(1rem-0.125rem)] bg-white dark:bg-slate-900/90 h-full flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Aplikasi Pending
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200/60 dark:border-purple-800/60">
                    <Send className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <div className="text-2xl font-black text-slate-950 dark:text-white font-mono">
                    {pendingAppsCount} <span className="text-base text-slate-400 font-normal">/ 3</span>
                  </div>
                  {/* Slot progress dots */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    {[0, 1, 2].map((idx) => (
                      <div
                        key={idx}
                        className={`h-1.5 flex-1 rounded-full transition-colors ${
                          idx < pendingAppsCount
                            ? 'bg-purple-500'
                            : 'bg-slate-100 dark:bg-slate-800'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Status Kuota:</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {3 - pendingAppsCount} Slot Tersisa
                  </span>
                </div>
              </div>
            </div>

            {/* Card 3: Rekening & Dompet */}
            <div className="p-1 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 transition-all hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs">
              <div className="p-4 rounded-[calc(1rem-0.125rem)] bg-white dark:bg-slate-900/90 h-full flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Rekening & Klaim
                  </span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/60">
                    <Wallet className="h-4 w-4" />
                  </div>
                </div>

                <div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-white truncate">
                    {user?.paymentAccountMasked || 'Belum diatur'}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                    <Lock className="h-3 w-3" />
                    <span>Terenkripsi AES-256</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Pencairan Dana:</span>
                  <Link href="/member/rewards" className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5">
                    <span>Buka Dompet</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation: Floating Segmented Island */}
          <div className="flex items-center justify-between pt-2">
            <div className="inline-flex p-1 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 gap-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span>Task Aktif & Profil</span>
              </button>

              <button
                onClick={() => setActiveTab('applications')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'applications'
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Send className="h-3.5 w-3.5 text-purple-500" />
                <span>Aplikasi Saya ({applications.length})</span>
              </button>
            </div>
          </div>

          {/* TAB 1: OVERVIEW & ACTIVE TASK HERO */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* DOMINANT HERO ACTIVE TASK CARD */}
              {loadingActiveTask ? (
                <div className="py-16 text-center bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/90 dark:border-slate-800">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
                  <p className="text-xs text-slate-400 mt-2">Memeriksa status task aktif...</p>
                </div>
              ) : activeTask ? (
                <div className="p-1 rounded-3xl bg-gradient-to-b from-sky-400/30 to-slate-200/40 dark:from-sky-500/20 dark:to-slate-800/40 border border-sky-400/40 dark:border-sky-500/30 shadow-md">
                  <div className="rounded-[calc(1.5rem-0.125rem)] bg-white dark:bg-slate-900 overflow-hidden">
                    {/* Header bar */}
                    <div className="bg-sky-50/70 dark:bg-sky-950/40 px-6 py-3.5 border-b border-sky-100 dark:border-sky-900/40 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                          Hero Active Task • Sedang Anda Kerjakan
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="cyan" leftIcon={<Zap className="h-3 w-3" />}>
                          {activeTask.assignmentType === 'INSTANT_TAKE' ? 'Instant Take' : 'Application'}
                        </Badge>
                        <StatusPill status={activeTask.status} size="sm" />
                      </div>
                    </div>

                    <div className="p-6 sm:p-7 space-y-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="space-y-2 flex-1">
                          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">
                            {activeTask.title}
                          </h2>
                          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            {activeTask.description}
                          </p>
                        </div>

                        {/* Bounty & Deadline Highlight Box */}
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-2.5 shrink-0 md:w-72">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                              Bounty Reward:
                            </span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                              {formatCurrencyIDR(activeTask.totalReward)}
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Sisa Waktu Pengerjaan:
                            </span>
                            <CountdownTimer deadline={activeTask.deadlineAt} />
                          </div>
                        </div>
                      </div>

                      {/* Acceptance Criteria Checklist */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Kriteria Penerimaan (Acceptance Criteria):</span>
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeTask.acceptanceCriteria.map((criterion, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-xs text-slate-800 dark:text-slate-200"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                              <span>{criterion}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Deliverable Hint & Action Buttons */}
                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Panduan Deliverable: <strong className="text-slate-800 dark:text-slate-200">{activeTask.deliverableGuidelines}</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          {activeTask.assignedTeamId && (
                            <Link href={`/member/teams/${activeTask.assignedTeamId}`}>
                              <Button variant="team" size="sm" className="text-xs font-bold h-9 gap-1.5 cursor-pointer">
                                <Users className="h-4 w-4" />
                                <span>Ruang Tim</span>
                              </Button>
                            </Link>
                          )}

                          <Link href={`/member/tasks/${activeTask.id}`}>
                            <Button variant="outline" size="sm" className="text-xs font-semibold h-9 cursor-pointer">
                              Rincian Task
                            </Button>
                          </Link>

                          <Link href={`/member/tasks/${activeTask.id}/submit`}>
                            <Button
                              variant="primary"
                              size="sm"
                              className="font-bold text-xs h-9 gap-1.5 px-4 shadow-xs bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white cursor-pointer"
                            >
                              <FileCheck2 className="h-4 w-4" />
                              <span>Kirim Hasil Pekerjaan</span>
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* INTERACTIVE QUEST DISCOVERY CARD (Modern High-End Empty State) */
                <div className="p-1 rounded-3xl bg-slate-200/50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
                  <div className="p-8 sm:p-10 rounded-[calc(1.5rem-0.125rem)] bg-white dark:bg-slate-900/90 text-center relative overflow-hidden">
                    {/* Background Ethereal Circle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-sky-500/5 dark:bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="max-w-lg mx-auto space-y-4 relative z-10">
                      {/* Radar Icon Container */}
                      <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-100 dark:border-sky-800/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mx-auto shadow-xs">
                        <Compass className="h-8 w-8 animate-pulse" />
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="text-lg sm:text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
                          Siap Menyelesaikan Quest Pertama Anda?
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                          Papan tugas SAKODE Work memuat puluhan tantangan IT terkurasi. Ambil task solo instan atau bergabung ke squad proyek bereputasi.
                        </p>
                      </div>

                      {/* 3 Value Pillars */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-left">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-xs space-y-1">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5 text-amber-500" />
                            <span>Instant Take</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Langsung kunci task tanpa antrean seleksi.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-xs space-y-1">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-purple-500" />
                            <span>Kolaborasi Tim</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Kerjakan tantangan arsitektur bersama squad.
                          </p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-xs space-y-1">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                            <Wallet className="h-3.5 w-3.5 text-emerald-500" />
                            <span>Bounty Terjamin</span>
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            Pencairan langsung ke rekening terverifikasi.
                          </p>
                        </div>
                      </div>

                      {/* CTA Button */}
                      <div className="pt-2">
                        <Link href="/member/tasks">
                          <button className="group inline-flex items-center gap-2 pl-5 pr-2.5 py-2.5 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-bold text-xs shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer">
                            <span>Buka Papan Bounty & Quest</span>
                            <div className="w-6 h-6 rounded-full bg-white/20 dark:bg-slate-900/15 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                              <ArrowRight className="h-3.5 w-3.5" />
                            </div>
                          </button>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Profile & Skill Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <User className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span>Keahlian & Tag Skill Anda</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Digunakan untuk merekomendasikan task yang relevan dengan spesialisasi Anda:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {user?.skills && user.skills.length > 0 ? (
                        user.skills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Belum ada skill yang dipilih</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 shadow-2xs rounded-2xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-900 dark:text-white">
                      <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Informasi Akun & Kontak</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                      Data identitas dan rekening pencairan yang diverifikasi admin:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-400">Email:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{user?.email}</strong>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-400">Kontak:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{user?.contactNumber || '-'}</strong>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Rekening:</span>
                      <strong className="text-slate-900 dark:text-white font-mono">{user?.paymentAccountMasked || '-'}</strong>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATIONS LIST */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Daftar Permohonan Task (Applications)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Kuota pending: <strong>{pendingAppsCount} / 3</strong> • Pembatalan permohonan pending tidak dikenakan penalti.
                  </p>
                </div>

                <Link href="/member/tasks">
                  <Button variant="outline" size="sm" className="text-xs font-semibold gap-1 h-8 cursor-pointer">
                    <Compass className="h-3.5 w-3.5" />
                    <span>Cari Task Lain</span>
                  </Button>
                </Link>
              </div>

              {loadingApplications ? (
                <div className="py-16 text-center">
                  <Loader2 className="h-7 w-7 animate-spin mx-auto text-sky-500" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Memuat daftar aplikasi Anda...</p>
                </div>
              ) : applications.length === 0 ? (
                <Card className="py-16 text-center border-dashed border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 rounded-2xl">
                  <CardContent className="space-y-3">
                    <Send className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Belum ada permohonan task</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Anda belum pernah mengajukan permohonan pada task bertipe Application.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => {
                    const isPending = app.status === 'PENDING';
                    const isAccepted = app.status === 'ACCEPTED';
                    const isWithdrawn = app.status === 'WITHDRAWN';

                    return (
                      <Card
                        key={app.id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 bg-white dark:bg-slate-900/80 border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xs"
                      >
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusPill status={app.status} size="sm" />
                            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              Diajukan: {formatDateWIB(app.createdAt)}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-slate-900 dark:text-white">
                            {app.taskTitle || `Task ID: ${app.taskId.slice(0, 10)}...`}
                          </h3>

                          {app.taskReward && (
                            <div className="text-xs text-slate-500 dark:text-slate-400">
                              Potensi Bounty: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrencyIDR(app.taskReward)}</strong>
                            </div>
                          )}

                          {/* Message snippet */}
                          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/90 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                            <span className="font-semibold text-slate-400 uppercase text-[10px] block mb-0.5">
                              Pesan Motivasi Anda:
                            </span>
                            <p className="whitespace-pre-line leading-relaxed">{app.message}</p>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="sm:self-center shrink-0">
                          {isPending && (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={withdrawingAppId === app.id}
                              onClick={() => handleWithdrawApplication(app.id)}
                              className="font-bold text-xs gap-1.5 h-8 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                            >
                              {withdrawingAppId === app.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                              <span>Batalkan Permohonan</span>
                            </Button>
                          )}

                          {isAccepted && (
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                              <span>Permohonan Diterima</span>
                            </div>
                          )}

                          {isWithdrawn && (
                            <span className="text-xs text-slate-400 font-medium italic">
                              Telah dibatalkan
                            </span>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
