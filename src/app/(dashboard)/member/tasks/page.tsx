'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { BountyCard } from '@/components/task/BountyCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { StatusPill } from '@/components/ui/StatusPill';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { ViewModeToggle, type ViewMode } from '@/components/ui/ViewModeToggle';
import { getAvailableTasksAction } from '@/server/actions/task.actions';
import { instantTakeTaskAction, submitApplicationAction } from '@/server/actions/assignment.actions';
import { formatCurrencyIDR, formatDateWIB, toDateSafe } from '@/lib/utils';
import { TASK_MODES, TASK_ASSIGNMENT_TYPES, TASK_STATUS } from '@/lib/constants';
import type { TaskDocument } from '@/types/database';
import {
  Compass,
  Search,
  Users,
  User,
  Zap,
  Send,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Loader2,
  FileText,
  Filter,
  RotateCcw,
  Clock,
  ArrowUpDown,
} from 'lucide-react';

type SortOption = 'NEWEST' | 'OLDEST' | 'REWARD_HIGH' | 'REWARD_LOW' | 'DEADLINE';

export default function MemberTasksExplorePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'SOLO' | 'TEAM'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INSTANT_TAKE' | 'APPLICATION'>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // View Mode: Grid, List, Table
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sakode_member_tasks_view_mode') as ViewMode;
      if (saved === 'grid' || saved === 'list' || saved === 'table') return saved;
    }
    return 'grid';
  });

  // Modal States
  const [instantTakeTask, setInstantTakeTask] = useState<TaskDocument | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isTakingTask, setIsTakingTask] = useState(false);

  const [applyTask, setApplyTask] = useState<TaskDocument | null>(null);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [portfolioInput, setPortfolioInput] = useState('');
  const [agreedCommitment, setAgreedCommitment] = useState(false);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // Notification States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load available tasks
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAvailableTasksAction({
        mode: modeFilter === 'ALL' ? undefined : modeFilter,
        assignmentType: typeFilter === 'ALL' ? undefined : typeFilter,
      });
      if (res.success && res.tasks) {
        setTasks(res.tasks);
      } else {
        setErrorMsg(res.error || 'Gagal memuat task.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  }, [modeFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  // Handle Instant Take Confirmation
  const handleConfirmInstantTake = async () => {
    if (!user || !instantTakeTask) return;
    if (!agreedTerms) {
      setErrorMsg('Anda wajib menyetujui syarat & ketentuan sebelum mengambil task.');
      return;
    }

    setIsTakingTask(true);
    setErrorMsg(null);
    try {
      const res = await instantTakeTaskAction(user.id, {
        taskId: instantTakeTask.id,
        agreedTermsVersion: instantTakeTask.termsSnapshot.version,
      });

      if (res.success) {
        setInstantTakeTask(null);
        router.push('/member');
      } else {
        setErrorMsg(res.error || 'Gagal mengambil task.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memproses instant take.');
    } finally {
      setIsTakingTask(false);
    }
  };

  // Handle Application Submission
  const handleConfirmApply = async () => {
    if (!user || !applyTask) return;
    if (motivationMessage.trim().length < 10) {
      setErrorMsg('Pesan motivasi minimal 10 karakter.');
      return;
    }
    if (!agreedCommitment) {
      setErrorMsg('Anda wajib menyetujui komitmen kriteria penerimaan.');
      return;
    }

    setIsSubmittingApp(true);
    setErrorMsg(null);
    try {
      const portfolioLinks = portfolioInput
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await submitApplicationAction(user.id, {
        taskId: applyTask.id,
        message: motivationMessage,
        portfolioLinks,
      });

      if (res.success) {
        setApplyTask(null);
        setMotivationMessage('');
        setPortfolioInput('');
        setAgreedCommitment(false);
        setSuccessMsg('Aplikasi Anda berhasil dikirim! Pantau statusnya di Dashboard Member.');
        loadTasks();
      } else {
        setErrorMsg(res.error || 'Gagal mengajukan aplikasi.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal mengirim aplikasi.');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setModeFilter('ALL');
    setTypeFilter('ALL');
    setSortBy('NEWEST');
  };

  // Filter and Sort
  const filteredAndSortedTasks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const result = tasks.filter((t) => {
      if (!query) return true;
      const matchTitle = t.title.toLowerCase().includes(query);
      const matchDesc = t.description?.toLowerCase().includes(query) || false;
      const matchSkills = t.requiredSkills.some((s) => s.toLowerCase().includes(query));
      return matchTitle || matchDesc || matchSkills;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case 'REWARD_HIGH':
          return (b.totalReward || 0) - (a.totalReward || 0);
        case 'REWARD_LOW':
          return (a.totalReward || 0) - (b.totalReward || 0);
        case 'DEADLINE': {
          const tA = toDateSafe(a.deadlineAt || a.fixedDeadlineAt)?.getTime() || Number.MAX_SAFE_INTEGER;
          const tB = toDateSafe(b.deadlineAt || b.fixedDeadlineAt)?.getTime() || Number.MAX_SAFE_INTEGER;
          return tA - tB;
        }
        case 'OLDEST': {
          const dateA = toDateSafe(a.createdAt)?.getTime() || 0;
          const dateB = toDateSafe(b.createdAt)?.getTime() || 0;
          return dateA - dateB;
        }
        case 'NEWEST':
        default: {
          const dateA = toDateSafe(a.createdAt)?.getTime() || 0;
          const dateB = toDateSafe(b.createdAt)?.getTime() || 0;
          return dateB - dateA;
        }
      }
    });

    return result;
  }, [tasks, searchQuery, sortBy]);

  const hasActiveTask = Boolean(user?.activeTaskId);
  const maxApplicationsReached = (user?.pendingApplicationCount || 0) >= 3;
  const isFilterActive = searchQuery !== '' || modeFilter !== 'ALL' || typeFilter !== 'ALL' || sortBy !== 'NEWEST';
  const isAdvancedFilterActive = modeFilter !== 'ALL' || typeFilter !== 'ALL';

  return (
    <AuthGuard requireApproved>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors">
        <div className="max-w-7xl mx-auto space-y-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/90 dark:border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="cyan" leftIcon={<Compass className="h-3 w-3" />}>
                  Eksplorasi Quest & Bounty
                </Badge>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">SAKODE Academy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Papan Bounty & Task Tersedia
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Ambil task secara instan atau ajukan aplikasi untuk tugas bernilai tinggi. Selesaikan tepat waktu untuk klaim bounty.
              </p>
            </div>

            <Link href="/member">
              <Button variant="outline" className="font-bold gap-2 text-xs h-9 cursor-pointer">
                <Users className="h-3.5 w-3.5" />
                <span>Dashboard Saya</span>
              </Button>
            </Link>
          </div>

          {/* User Quota & Active Task Status Banners */}
          {hasActiveTask && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">
                    Anda sedang memegang 1 Active Task
                  </h4>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                    Sesuai invariant sistem SAKODE, Anda tidak dapat mengambil atau mendaftar task lain sampai task aktif Anda selesai dan disetujui.
                  </p>
                </div>
              </div>
              <Link href="/member">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold text-xs bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-slate-800 whitespace-nowrap shadow-2xs cursor-pointer"
                >
                  <span>Lihat Task Aktif</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          {maxApplicationsReached && !hasActiveTask && (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 text-sky-900 dark:text-sky-200 flex items-center gap-3 shadow-2xs">
              <AlertCircle className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold">Batas kuota aplikasi tercapai (3/3):</span> Anda memiliki 3 aplikasi berstatus pending. Anda dapat membatalkan aplikasi yang belum ditinjau di tab dashboard Anda jika ingin mendaftar ke task lain.
              </div>
            </div>
          )}

          {/* Feedback Messages */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-600 dark:text-rose-400 hover:text-rose-800 p-1 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 p-1 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Minimalist Single-Row Toolbar (Emil Kowalski Pattern) */}
          <div className="space-y-2">
            <div className="bg-white dark:bg-slate-900/80 p-2 sm:px-3 sm:py-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari task, skill, teknologi (React, Node, UI/UX)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8.5 pr-7 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer p-0.5 rounded"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* Right Controls: Sort, Filter, ViewModeToggle */}
                <div className="flex items-center gap-2 shrink-0">
                  {/* Sort Dropdown */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    aria-label="Urutkan daftar task"
                    className="bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shrink-0"
                  >
                    <option value="NEWEST">Terbaru</option>
                    <option value="OLDEST">Terlama</option>
                    <option value="REWARD_HIGH">Bounty Tertinggi</option>
                    <option value="REWARD_LOW">Bounty Terendah</option>
                    <option value="DEADLINE">Tenggat Terdekat</option>
                  </select>

                  {/* Filter Toggle Button */}
                  <button
                    type="button"
                    onClick={() => setShowFilterPanel(!showFilterPanel)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                      isAdvancedFilterActive || showFilterPanel
                        ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300'
                        : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title="Filter berdasarkan mode dan tipe penugasan"
                  >
                    <Filter className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Filter</span>
                    {isAdvancedFilterActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                    )}
                  </button>

                  {/* View Mode Switcher */}
                  <ViewModeToggle
                    value={viewMode}
                    onChange={setViewMode}
                    storageKey="sakode_member_tasks_view_mode"
                  />
                </div>
              </div>

              {/* Collapsible Sub-Panel: Mode & Metode Penugasan */}
              {showFilterPanel && (
                <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Mode */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Mode:</span>
                      <select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value as 'ALL' | 'SOLO' | 'TEAM')}
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer"
                      >
                        <option value="ALL">Semua Mode</option>
                        <option value={TASK_MODES.SOLO}>Solo Task</option>
                        <option value={TASK_MODES.TEAM}>Team Task</option>
                      </select>
                    </div>

                    {/* Metode Penugasan */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Metode:</span>
                      <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value as 'ALL' | 'INSTANT_TAKE' | 'APPLICATION')}
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer"
                      >
                        <option value="ALL">Semua Tipe</option>
                        <option value={TASK_ASSIGNMENT_TYPES.INSTANT_TAKE}>Instant Take</option>
                        <option value={TASK_ASSIGNMENT_TYPES.APPLICATION}>Seleksi Pelamar</option>
                      </select>
                    </div>
                  </div>

                  {isFilterActive && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                    >
                      <RotateCcw className="h-3 w-3" />
                      <span>Reset Semua Filter</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Subtle Counter Bar */}
            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 dark:text-slate-400">
              <span>
                Menampilkan <strong className="text-slate-800 dark:text-slate-200">{filteredAndSortedTasks.length}</strong> dari{' '}
                <strong className="text-slate-800 dark:text-slate-200">{tasks.length}</strong> task tersedia
              </span>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <RotateCcw className="h-2.5 w-2.5" />
                  <span>Reset Filter</span>
                </button>
              )}
            </div>
          </div>

          {/* Task Content List (Grid, List, Table) */}
          {isLoading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 font-medium">Mencari task tersedia...</p>
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <Card className="py-16 text-center border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 rounded-3xl">
              <CardContent className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Tidak ada task yang cocok</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery || isAdvancedFilterActive
                    ? 'Tidak ada task yang cocok dengan kriteria pencarian atau filter yang dipilih.'
                    : 'Semua task telah diambil atau sedang dikerjakan. Silakan periksa kembali nanti.'}
                </p>
                {isFilterActive && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters} className="text-xs font-bold gap-1 mt-2 cursor-pointer">
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset Filter</span>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            /* VIEW 1: GRID MODE */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAndSortedTasks.map((task) => (
                <BountyCard
                  key={task.id}
                  task={task}
                  userActiveTaskId={user?.activeTaskId}
                  userPendingAppCount={user?.pendingApplicationCount || 0}
                  userIsApproved={user?.approvalStatus === 'APPROVED'}
                  onInstantTake={(t) => {
                    setInstantTakeTask(t);
                    setAgreedTerms(false);
                    setErrorMsg(null);
                  }}
                  onApply={(t) => {
                    setApplyTask(t);
                    setMotivationMessage('');
                    setPortfolioInput('');
                    setAgreedCommitment(false);
                    setErrorMsg(null);
                  }}
                />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            /* VIEW 2: LIST MODE (Horizontal Card) */
            <div className="space-y-3">
              {filteredAndSortedTasks.map((task) => {
                const isSolo = task.mode === TASK_MODES.SOLO;
                const isInstant = task.assignmentType === TASK_ASSIGNMENT_TYPES.INSTANT_TAKE;
                const isHasActiveTask = !!user?.activeTaskId;
                const isMaxApp = (user?.pendingApplicationCount || 0) >= 3;
                const isActionDisabled = user?.approvalStatus !== 'APPROVED' || isHasActiveTask || (!isInstant && isMaxApp);

                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant={isSolo ? 'cyan' : 'purple'}
                          leftIcon={isSolo ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                        >
                          {isSolo ? 'Solo' : 'Team'}
                        </Badge>
                        <Badge
                          variant="outline"
                          leftIcon={isInstant ? <Zap className="h-3 w-3 text-amber-500" /> : <Send className="h-3 w-3 text-sky-500" />}
                        >
                          {isInstant ? 'Instant Take' : 'Application'}
                        </Badge>
                        <StatusPill status={task.status} size="sm" />
                      </div>

                      <div>
                        <Link href={`/member/tasks/${task.id}`}>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors line-clamp-1">
                            {task.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {task.description}
                        </p>
                      </div>

                      {/* Required skills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {task.requiredSkills.slice(0, 4).map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
                          >
                            {skill}
                          </span>
                        ))}
                        {task.requiredSkills.length > 4 && (
                          <span className="text-[10px] text-slate-400 font-semibold">
                            +{task.requiredSkills.length - 4} skill
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right side: Bounty + Action */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Bounty</span>
                        <div className="text-lg font-black text-slate-900 dark:text-white font-mono">
                          {formatCurrencyIDR(task.totalReward)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/member/tasks/${task.id}`}>
                          <Button variant="outline" size="sm" className="text-xs font-semibold h-8 cursor-pointer">
                            Detail
                          </Button>
                        </Link>

                        {isInstant ? (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isActionDisabled}
                            onClick={() => {
                              setInstantTakeTask(task);
                              setAgreedTerms(false);
                              setErrorMsg(null);
                            }}
                            className="text-xs font-bold gap-1 h-8 cursor-pointer"
                          >
                            <span>Ambil</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="team"
                            size="sm"
                            disabled={isActionDisabled}
                            onClick={() => {
                              setApplyTask(task);
                              setMotivationMessage('');
                              setPortfolioInput('');
                              setAgreedCommitment(false);
                              setErrorMsg(null);
                            }}
                            className="text-xs font-bold gap-1 h-8 cursor-pointer"
                          >
                            <span>Ajukan</span>
                            <Send className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW 3: TABLE MODE (Data Dense) */
            <div className="bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200/90 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Judul Task & Deskripsi</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4">Bounty Reward</th>
                      <th className="py-3 px-4">Batas Waktu</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredAndSortedTasks.map((task) => {
                      const isSolo = task.mode === TASK_MODES.SOLO;
                      const isInstant = task.assignmentType === TASK_ASSIGNMENT_TYPES.INSTANT_TAKE;
                      const isHasActiveTask = !!user?.activeTaskId;
                      const isMaxApp = (user?.pendingApplicationCount || 0) >= 3;
                      const isActionDisabled = user?.approvalStatus !== 'APPROVED' || isHasActiveTask || (!isInstant && isMaxApp);

                      return (
                        <tr key={task.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 max-w-sm">
                            <Link href={`/member/tasks/${task.id}`}>
                              <span className="font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-400 transition-colors line-clamp-1">
                                {task.title}
                              </span>
                            </Link>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                              {task.description}
                            </span>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge
                              variant={isSolo ? 'cyan' : 'purple'}
                              leftIcon={isSolo ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                            >
                              {isSolo ? 'Solo' : 'Team'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <Badge
                              variant="outline"
                              leftIcon={isInstant ? <Zap className="h-3 w-3 text-amber-500" /> : <Send className="h-3 w-3 text-sky-500" />}
                            >
                              {isInstant ? 'Instant Take' : 'Application'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrencyIDR(task.totalReward)}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                            {task.deadlineAt ? (
                              <CountdownTimer deadline={task.deadlineAt} />
                            ) : task.durationMinutes ? (
                              <span>{Math.round(task.durationMinutes / 60)} Jam</span>
                            ) : (
                              <span>Fleksibel</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5">
                              <Link href={`/member/tasks/${task.id}`}>
                                <Button variant="outline" size="sm" className="text-xs h-7 px-2.5 cursor-pointer">
                                  Detail
                                </Button>
                              </Link>
                              {isInstant ? (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={isActionDisabled}
                                  onClick={() => {
                                    setInstantTakeTask(task);
                                    setAgreedTerms(false);
                                    setErrorMsg(null);
                                  }}
                                  className="text-xs font-bold gap-1 h-7 px-2.5 cursor-pointer"
                                >
                                  <span>Ambil</span>
                                </Button>
                              ) : (
                                <Button
                                  variant="team"
                                  size="sm"
                                  disabled={isActionDisabled}
                                  onClick={() => {
                                    setApplyTask(task);
                                    setMotivationMessage('');
                                    setPortfolioInput('');
                                    setAgreedCommitment(false);
                                    setErrorMsg(null);
                                  }}
                                  className="text-xs font-bold gap-1 h-7 px-2.5 cursor-pointer"
                                >
                                  <span>Ajukan</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Instant Take Terms Confirmation */}
        {instantTakeTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant="cyan" leftIcon={<Zap className="h-3 w-3 text-amber-500" />}>
                      Instant Take Confirmation
                    </Badge>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Terms Snapshot v{instantTakeTask.termsSnapshot.version}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {instantTakeTask.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Reward: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrencyIDR(instantTakeTask.totalReward)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setInstantTakeTask(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Terms Content Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Perhatian Invariant:</span> Dengan mengambil task ini, task akan langsung berstatus <strong>ACTIVE</strong> atas nama Anda, batas waktu (countdown) akan langsung berjalan, dan Anda tidak dapat mengambil task lain sampai task ini selesai.
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-sky-500" />
                    <span>Syarat & Ketentuan Pengerjaan:</span>
                  </h4>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                    {instantTakeTask.termsSnapshot.content}
                  </div>
                </div>

                {/* Acceptance Checkbox */}
                <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                    Saya telah membaca, memahami, dan menyetujui seluruh ketentuan dan deliverable di atas. Saya bersedia menyelesaikan task ini secara profesional.
                  </span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setInstantTakeTask(null)}
                  disabled={isTakingTask}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!agreedTerms || isTakingTask}
                  onClick={handleConfirmInstantTake}
                  className="text-xs font-bold gap-1 cursor-pointer"
                >
                  {isTakingTask ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Mengunci Task...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      <span>Konfirmasi & Ambil Sekarang</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Application Submission */}
        {applyTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant="purple" leftIcon={<Send className="h-3 w-3" />}>
                      Formulir Aplikasi Pelamar
                    </Badge>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {applyTask.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bounty: <strong className="text-slate-900 dark:text-white font-mono">{formatCurrencyIDR(applyTask.totalReward)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setApplyTask(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Content Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Pesan Motivasi & Pengalaman Relevan: <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={motivationMessage}
                    onChange={(e) => setMotivationMessage(e.target.value)}
                    placeholder="Jelaskan mengapa Anda atau tim Anda kandidat yang tepat untuk task ini..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                  <span className="text-[11px] text-slate-400">Minimal 10 karakter.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Tautan Portofolio / Contoh Pekerjaan Sebelumnya (Opsional):
                  </label>
                  <textarea
                    rows={2}
                    value={portfolioInput}
                    onChange={(e) => setPortfolioInput(e.target.value)}
                    placeholder="Masukkan URL portofolio atau GitHub repo (satu link per baris)..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-mono"
                  />
                </div>

                {/* Commitment Checkbox */}
                <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedCommitment}
                    onChange={(e) => setAgreedCommitment(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 cursor-pointer"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 leading-snug">
                    Saya berkomitmen untuk menyelesaikan seluruh deliverable sesuai acceptance criteria jika aplikasi saya disetujui.
                  </span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="p-4 border-t border-slate-200/90 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setApplyTask(null)}
                  disabled={isSubmittingApp}
                  className="text-xs font-semibold cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  variant="team"
                  size="sm"
                  disabled={!agreedCommitment || motivationMessage.trim().length < 10 || isSubmittingApp}
                  onClick={handleConfirmApply}
                  className="text-xs font-bold gap-1 cursor-pointer"
                >
                  {isSubmittingApp ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span>Kirim Aplikasi Sekarang</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
