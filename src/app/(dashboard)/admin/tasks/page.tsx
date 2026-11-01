'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatCurrencyIDR, formatDateWIB, toDateSafe } from '@/lib/utils';
import { TASK_STATUS, TASK_MODES, TASK_ASSIGNMENT_TYPES } from '@/lib/constants';
import { getAllTasksForAdminAction, publishTaskAction } from '@/server/actions/task.actions';
import { getApplicationsForTaskAction, selectApplicantAction } from '@/server/actions/assignment.actions';
import {
  getTeamDetailAction,
  getTeamMembersAction,
  adminOverrideTeamRosterAction,
} from '@/server/actions/team.actions';
import type { TaskDocument, ApplicationDocument, TeamDocument, TeamMembershipDocument } from '@/types/database';
import {
  Compass,
  Plus,
  Search,
  Users,
  User,
  Zap,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Clock,
  X,
  UserCheck,
  Phone,
  Mail,
  Loader2,
  Shield,
  Crown,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Copy,
  Check,
  RotateCcw,
  Tag,
} from 'lucide-react';
import { ViewModeToggle, type ViewMode } from '@/components/ui/ViewModeToggle';

type SortOption = 'NEWEST' | 'OLDEST' | 'REWARD_HIGH' | 'REWARD_LOW' | 'DEADLINE';
type ModeFilterOption = 'ALL' | 'SOLO' | 'TEAM';
type AssignmentFilterOption = 'ALL' | 'INSTANT_TAKE' | 'APPLICATION';

export default function AdminTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // View Mode: 'list' | 'grid' | 'table'
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sakode_admin_tasks_view_mode') as ViewMode | null;
      if (saved && (saved === 'grid' || saved === 'list' || saved === 'table')) {
        setViewMode(saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  // Filter & Search State
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [modeFilter, setModeFilter] = useState<ModeFilterOption>('ALL');
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilterOption>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Copy feedback state
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);

  // Applicant Drawer State
  const [selectedTaskForApplicants, setSelectedTaskForApplicants] = useState<TaskDocument | null>(null);
  const [applicants, setApplicants] = useState<ApplicationDocument[]>([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Team Roster Drawer State
  const [selectedTaskForTeam, setSelectedTaskForTeam] = useState<TaskDocument | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<TeamDocument | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMembershipDocument[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [overrideAction, setOverrideAction] = useState<'ADD' | 'REMOVE'>('ADD');
  const [overrideTargetUserId, setOverrideTargetUserId] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isOverriding, setIsOverriding] = useState(false);

  // Load all tasks for admin (memuat semua sekali agar filtering dan counter real-time instan)
  const loadTasks = useCallback(async () => {
    if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAllTasksForAdminAction(user.id, undefined);
      if (res.success && res.tasks) {
        setTasks(res.tasks);
      } else {
        setErrorMsg(res.error || 'Gagal memuat daftar task.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  // Handle Publish Draft Task
  const handlePublishTask = async (taskId: string) => {
    if (!user) return;
    setActionInProgress(taskId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await publishTaskAction(user.id, taskId);
      if (res.success) {
        setSuccessMsg('Task berhasil diterbitkan dan sekarang berstatus OPEN.');
        loadTasks();
      } else {
        setErrorMsg(res.error || 'Gagal mempublikasikan task.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal mempublikasikan task.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Copy Task URL
  const handleCopyLink = (taskId: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const url = `${origin}/member/tasks/${taskId}`;
    navigator.clipboard.writeText(url);
    setCopiedTaskId(taskId);
    setTimeout(() => {
      setCopiedTaskId(null);
    }, 2000);
  };

  // Open Applicant Drawer
  const handleOpenApplicants = async (task: TaskDocument) => {
    setSelectedTaskForApplicants(task);
    setLoadingApplicants(true);
    setApplicants([]);
    try {
      const res = await getApplicationsForTaskAction(task.id);
      if (res.success && res.applications) {
        setApplicants(res.applications);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingApplicants(false);
    }
  };

  // Select Applicant (Atomic Selection)
  const handleSelectApplicant = async (applicationId: string) => {
    if (!user || !selectedTaskForApplicants) return;
    const confirmChoice = window.confirm(
      'Apakah Anda yakin memilih applicant ini? Aplikasi pending lain milik member ini akan otomatis ditarik (auto-withdraw) tanpa penalti, dan task akan langsung berstatus ACTIVE.'
    );
    if (!confirmChoice) return;

    setActionInProgress(applicationId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await selectApplicantAction(user.id, selectedTaskForApplicants.id, applicationId);
      if (res.success) {
        setSuccessMsg('Applicant berhasil dipilih! Task kini berstatus ACTIVE.');
        setSelectedTaskForApplicants(null);
        loadTasks();
      } else {
        setErrorMsg(res.error || 'Gagal memilih applicant.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memproses seleksi applicant.');
    } finally {
      setActionInProgress(null);
    }
  };

  // Open Team Roster Drawer
  const handleOpenTeamRoster = async (task: TaskDocument) => {
    if (!task.assignedTeamId) return;
    setSelectedTaskForTeam(task);
    setLoadingTeam(true);
    setTeamMembers([]);
    setSelectedTeam(null);
    try {
      const resTeam = await getTeamDetailAction(task.assignedTeamId);
      if (resTeam.success && resTeam.team) {
        setSelectedTeam(resTeam.team);
      }
      const resMembers = await getTeamMembersAction(task.assignedTeamId);
      if (resMembers.success && resMembers.members) {
        setTeamMembers(resMembers.members);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingTeam(false);
    }
  };

  // Execute Admin Override
  const handleExecuteOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTeam) return;
    if (overrideReason.trim().length < 10) {
      setErrorMsg('Alasan override wajib diisi minimal 10 karakter untuk audit trail.');
      return;
    }

    setIsOverriding(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await adminOverrideTeamRosterAction(user.id, {
        teamId: selectedTeam.id,
        action: overrideAction,
        targetUserId: overrideTargetUserId.trim(),
        reason: overrideReason.trim(),
      });

      if (res.success) {
        setSuccessMsg(`Admin override roster (${overrideAction}) berhasil dieksekusi.`);
        setOverrideTargetUserId('');
        setOverrideReason('');
        const resMembers = await getTeamMembersAction(selectedTeam.id);
        if (resMembers.success && resMembers.members) {
          setTeamMembers(resMembers.members);
        }
        loadTasks();
      } else {
        setErrorMsg(res.error || 'Gagal mengeksekusi override.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal mengeksekusi override roster.');
    } finally {
      setIsOverriding(false);
    }
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setStatusFilter('ALL');
    setModeFilter('ALL');
    setAssignmentFilter('ALL');
    setSortBy('NEWEST');
    setSearchQuery('');
    setShowFilterPanel(false);
  };

  const isAdvancedFilterActive = modeFilter !== 'ALL' || assignmentFilter !== 'ALL';

  const isFilterActive =
    statusFilter !== 'ALL' ||
    isAdvancedFilterActive ||
    sortBy !== 'NEWEST' ||
    searchQuery.trim().length > 0;

  // Real-time Global Counts (dihitung dari seluruh tasks di memori)
  const counts = useMemo(() => {
    return {
      all: tasks.length,
      open: tasks.filter((t) => t.status === TASK_STATUS.OPEN).length,
      active: tasks.filter((t) => t.status === TASK_STATUS.ACTIVE).length,
      review: tasks.filter((t) => t.status === TASK_STATUS.IN_REVIEW || t.status === TASK_STATUS.SUBMITTED).length,
      completed: tasks.filter((t) => t.status === TASK_STATUS.APPROVED || t.status === TASK_STATUS.PARTIAL).length,
      draft: tasks.filter((t) => t.status === TASK_STATUS.DRAFT).length,
    };
  }, [tasks]);

  // Client-Side Multi-Filter & Search
  const filteredAndSortedTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        // Status filter
        if (statusFilter !== 'ALL') {
          if (statusFilter === 'REVIEW') {
            if (t.status !== TASK_STATUS.IN_REVIEW && t.status !== TASK_STATUS.SUBMITTED) return false;
          } else if (statusFilter === 'COMPLETED') {
            if (t.status !== TASK_STATUS.APPROVED && t.status !== TASK_STATUS.PARTIAL) return false;
          } else if (t.status !== statusFilter) {
            return false;
          }
        }

        // Mode filter
        if (modeFilter !== 'ALL' && t.mode !== modeFilter) {
          return false;
        }

        // Assignment filter
        if (assignmentFilter !== 'ALL' && t.assignmentType !== assignmentFilter) {
          return false;
        }

        // Search query (judul, skills, deskripsi, id, assigned user)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchTitle = t.title.toLowerCase().includes(query);
          const matchDesc = t.description?.toLowerCase().includes(query);
          const matchSkills = t.requiredSkills?.some((s) => s.toLowerCase().includes(query));
          const matchId = t.id.toLowerCase().includes(query);
          const matchAssignee = t.assignedUserId?.toLowerCase().includes(query);
          if (!matchTitle && !matchDesc && !matchSkills && !matchId && !matchAssignee) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'NEWEST') {
          const dateA = toDateSafe(a.createdAt)?.getTime() || 0;
          const dateB = toDateSafe(b.createdAt)?.getTime() || 0;
          return dateB - dateA;
        }
        if (sortBy === 'OLDEST') {
          const dateA = toDateSafe(a.createdAt)?.getTime() || 0;
          const dateB = toDateSafe(b.createdAt)?.getTime() || 0;
          return dateA - dateB;
        }
        if (sortBy === 'REWARD_HIGH') {
          return b.totalReward - a.totalReward;
        }
        if (sortBy === 'REWARD_LOW') {
          return a.totalReward - b.totalReward;
        }
        if (sortBy === 'DEADLINE') {
          const deadA = toDateSafe(a.deadlineAt || a.fixedDeadlineAt)?.getTime() || Number.MAX_SAFE_INTEGER;
          const deadB = toDateSafe(b.deadlineAt || b.fixedDeadlineAt)?.getTime() || Number.MAX_SAFE_INTEGER;
          return deadA - deadB;
        }
        return 0;
      });
  }, [tasks, statusFilter, modeFilter, assignmentFilter, searchQuery, sortBy]);

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
                  Katalog Utama
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {tasks.length} Total Task
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
                Katalog &amp; Pelamar Task
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Cari, filter, dan kelola alur penugasan bounty, seleksi pelamar, hingga manajemen tim secara terpusat.
              </p>
            </div>

            <Link href="/admin/tasks/create">
              <Button
                variant="primary"
                className="font-bold gap-2 h-10 px-4 sm:px-5 shadow-sm bg-gradient-to-r from-sky-500 to-[#076991] hover:from-sky-600 hover:to-[#055374] dark:from-sakode-cyan dark:to-sky-400 dark:text-slate-950 shadow-sky-500/20"
              >
                <Plus className="h-4 w-4 stroke-[2.5]" />
                <span>Terbitkan Task Baru</span>
              </Button>
            </Link>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              <button
                onClick={() => setErrorMsg(null)}
                className="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMsg}</span>
              </div>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Minimalist Single-Row Toolbar */}
          <div className="space-y-2">
            <div className="bg-white dark:bg-slate-900/80 p-2 sm:px-3 sm:py-2 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
                {/* Segmented Filter Pills (Status Utama) */}
                <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 lg:pb-0">
                  {[
                    { label: 'Semua', count: counts.all, filter: 'ALL' },
                    { label: 'Buka', count: counts.open, filter: TASK_STATUS.OPEN },
                    { label: 'Aktif', count: counts.active, filter: TASK_STATUS.ACTIVE },
                    { label: 'Review', count: counts.review, filter: 'REVIEW' },
                    { label: 'Selesai', count: counts.completed, filter: 'COMPLETED' },
                    { label: 'Draf', count: counts.draft, filter: TASK_STATUS.DRAFT },
                  ].map((stat) => {
                    const isActive = statusFilter === stat.filter;
                    return (
                      <button
                        key={stat.label}
                        type="button"
                        onClick={() => setStatusFilter(stat.filter)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{stat.label}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                            isActive
                              ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {stat.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Side: Search + Sort Dropdown + Filter Toggle */}
                <div className="flex items-center gap-2 shrink-0 w-full lg:w-auto">
                  {/* Search Input */}
                  <div className="relative flex-1 lg:w-60">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari task atau skill..."
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
                    title="Filter lanjutan berdasarkan mode & metode"
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
                    storageKey="sakode_admin_tasks_view_mode"
                  />
                </div>
              </div>

              {/* Collapsible Sub-Panel: Mode & Metode (Hanya saat dibutuhkan) */}
              {showFilterPanel && (
                <div className="pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 animate-in fade-in duration-150">
                  <div className="flex flex-wrap items-center gap-3">
                    {/* Mode */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Mode:</span>
                      <select
                        value={modeFilter}
                        onChange={(e) => setModeFilter(e.target.value as ModeFilterOption)}
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
                        value={assignmentFilter}
                        onChange={(e) => setAssignmentFilter(e.target.value as AssignmentFilterOption)}
                        className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium cursor-pointer"
                      >
                        <option value="ALL">Semua Metode</option>
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
                <strong className="text-slate-800 dark:text-slate-200">{tasks.length}</strong> task
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

          {/* Task List */}
          {isLoading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5 font-medium">Memuat katalog task...</p>
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <Card className="py-16 text-center border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 rounded-3xl">
              <CardContent className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Compass className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Tidak ada task yang cocok</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {isFilterActive
                    ? 'Tidak ada task yang memenuhi kombinasi kriteria pencarian dan filter saat ini.'
                    : 'Belum ada task pada katalog. Mulai dengan menerbitkan task baru untuk komunitas.'}
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  {isFilterActive && (
                    <Button variant="outline" size="sm" onClick={handleResetFilters} className="font-bold text-xs gap-1.5">
                      <Filter className="h-3.5 w-3.5" />
                      <span>Bersihkan Filter</span>
                    </Button>
                  )}
                  <Link href="/admin/tasks/create">
                    <Button variant="primary" size="sm" className="font-bold gap-1.5 text-xs">
                      <Plus className="h-3.5 w-3.5" />
                      <span>Terbitkan Task Baru</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            /* =============================================================== */
            /* VIEW MODE A: CARD BESAR (GRID 2 KOLOM)                          */
            /* =============================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAndSortedTasks.map((task) => {
                const isSolo = task.mode === TASK_MODES.SOLO;
                const isInstant = task.assignmentType === TASK_ASSIGNMENT_TYPES.INSTANT_TAKE;
                const isDraft = task.status === TASK_STATUS.DRAFT;
                const isApplication = !isInstant;
                const isCopied = copiedTaskId === task.id;

                let deadlineBadgeText: string | null = null;
                if (task.durationMinutes) {
                  const hours = Math.round(task.durationMinutes / 60);
                  deadlineBadgeText = hours >= 24 ? `${Math.round(hours / 24)} Hari` : `${hours} Jam`;
                } else if (task.fixedDeadlineAt) {
                  deadlineBadgeText = formatDateWIB(task.fixedDeadlineAt);
                } else if (task.deadlineAt) {
                  deadlineBadgeText = formatDateWIB(task.deadlineAt);
                }

                return (
                  <div
                    key={task.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 hover:border-sky-500/40 dark:hover:border-sky-500/40 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 justify-between">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              isSolo
                                ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60'
                                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                            }`}
                          >
                            {isSolo ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                            <span>{isSolo ? 'Solo' : 'Tim'}</span>
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                              isInstant
                                ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
                            }`}
                          >
                            {isInstant ? <Zap className="h-3 w-3 text-amber-500" /> : <Send className="h-3 w-3 text-indigo-500" />}
                            <span>{isInstant ? 'Instant Take' : 'Seleksi Pelamar'}</span>
                          </span>

                          <StatusPill status={task.status} size="sm" />
                        </div>

                        {deadlineBadgeText && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{deadlineBadgeText}</span>
                          </span>
                        )}
                      </div>

                      {/* Judul Task */}
                      <Link href={`/member/tasks/${task.id}`} className="block group">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                          {task.title}
                        </h2>
                      </Link>

                      {/* Ringkasan Deskripsi */}
                      {task.description && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Skills Tags */}
                      {task.requiredSkills && task.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1">
                          {task.requiredSkills.slice(0, 4).map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => setSearchQuery(skill)}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-950/60 text-slate-600 hover:text-sky-700 dark:text-slate-300 dark:hover:text-sky-300 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
                            >
                              {skill}
                            </button>
                          ))}
                          {task.requiredSkills.length > 4 && (
                            <span className="text-[10px] font-bold text-slate-400">
                              +{task.requiredSkills.length - 4}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom: Bounty & Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block leading-tight">
                          Total Bounty
                        </span>
                        <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                          {formatCurrencyIDR(task.totalReward)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {isDraft && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionInProgress === task.id}
                            onClick={() => handlePublishTask(task.id)}
                            className="font-bold text-xs gap-1 h-8 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Terbitkan</span>
                          </Button>
                        )}

                        {isApplication && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenApplicants(task)}
                            className="font-bold text-xs gap-1 h-8 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                          >
                            <Users className="h-3 w-3 text-purple-500" />
                            <span>Pelamar</span>
                          </Button>
                        )}

                        {task.mode === TASK_MODES.TEAM && task.assignedTeamId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenTeamRoster(task)}
                            className="font-bold text-xs gap-1 h-8 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 cursor-pointer"
                          >
                            <Users className="h-3 w-3" />
                            <span>Roster</span>
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleCopyLink(task.id)}
                          className="text-xs h-8 px-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          title="Salin tautan task"
                        >
                          {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>

                        <Link href={`/member/tasks/${task.id}`} target="_blank">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 px-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            title="Buka pratinjau"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'list' ? (
            /* =============================================================== */
            /* VIEW MODE B: MEMANJANG (HORIZONTAL LIST)                        */
            /* =============================================================== */
            <div className="space-y-3">
              {filteredAndSortedTasks.map((task) => {
                const isSolo = task.mode === TASK_MODES.SOLO;
                const isInstant = task.assignmentType === TASK_ASSIGNMENT_TYPES.INSTANT_TAKE;
                const isDraft = task.status === TASK_STATUS.DRAFT;
                const isApplication = !isInstant;
                const isCopied = copiedTaskId === task.id;

                let deadlineBadgeText: string | null = null;
                if (task.durationMinutes) {
                  const hours = Math.round(task.durationMinutes / 60);
                  deadlineBadgeText = hours >= 24 ? `${Math.round(hours / 24)} Hari` : `${hours} Jam`;
                } else if (task.fixedDeadlineAt) {
                  deadlineBadgeText = formatDateWIB(task.fixedDeadlineAt);
                } else if (task.deadlineAt) {
                  deadlineBadgeText = formatDateWIB(task.deadlineAt);
                }

                return (
                  <div
                    key={task.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 hover:border-sky-500/40 dark:hover:border-sky-500/40 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-2.5 flex-1 min-w-0">
                      {/* Badges Bar */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isSolo
                              ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60'
                              : 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/60'
                          }`}
                        >
                          {isSolo ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                          <span>{isSolo ? 'Solo' : 'Tim'}</span>
                        </span>

                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isInstant
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                              : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60'
                          }`}
                        >
                          {isInstant ? <Zap className="h-3 w-3 text-amber-500" /> : <Send className="h-3 w-3 text-indigo-500" />}
                          <span>{isInstant ? 'Instant Take' : 'Seleksi Pelamar'}</span>
                        </span>

                        <StatusPill status={task.status} size="sm" />

                        {deadlineBadgeText && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/70 dark:border-slate-700/70">
                            <Clock className="h-3 w-3 text-slate-400" />
                            <span>{deadlineBadgeText}</span>
                          </span>
                        )}
                      </div>

                      {/* Judul Task */}
                      <Link href={`/member/tasks/${task.id}`} className="block group">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-1">
                          {task.title}
                        </h2>
                      </Link>

                      {/* Ringkasan Deskripsi */}
                      {task.description && (
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                      )}

                      {/* Meta Information: Waktu & Penerima */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Dibuat: {formatDateWIB(task.createdAt)}</span>
                        </div>
                        {task.assignedUserId && (
                          <div className="flex items-center gap-1 text-sky-700 dark:text-sky-300 font-semibold">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Penerima: {task.assignedUserId.slice(0, 8)}...</span>
                          </div>
                        )}
                        {task.assignedTeamId && (
                          <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300 font-semibold">
                            <Users className="h-3.5 w-3.5" />
                            <span>Tim ID: {task.assignedTeamId.slice(0, 8)}...</span>
                          </div>
                        )}
                      </div>

                      {/* Skills Tags */}
                      {task.requiredSkills && task.requiredSkills.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1 pt-0.5">
                          <Tag className="h-3 w-3 text-slate-400 shrink-0" />
                          {task.requiredSkills.map((skill) => (
                            <button
                              key={skill}
                              type="button"
                              onClick={() => setSearchQuery(skill)}
                              title={`Klik untuk filter task dengan skill: ${skill}`}
                              className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 hover:bg-sky-50 dark:bg-slate-800 dark:hover:bg-sky-950/60 text-slate-600 hover:text-sky-700 dark:text-slate-300 dark:hover:text-sky-300 border border-slate-200/60 dark:border-slate-700/60 hover:border-sky-300 dark:hover:border-sky-700 transition-colors cursor-pointer"
                            >
                              {skill}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Sisi Kanan: Bounty Reward & Action Buttons */}
                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/80 shrink-0">
                      {/* Nominal Reward */}
                      <div className="text-left md:text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block leading-tight">
                          Total Bounty
                        </span>
                        <span className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                          {formatCurrencyIDR(task.totalReward)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isDraft && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={actionInProgress === task.id}
                            onClick={() => handlePublishTask(task.id)}
                            className="font-bold text-xs gap-1.5 h-8.5 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                          >
                            {actionInProgress === task.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            )}
                            <span>Terbitkan</span>
                          </Button>
                        )}

                        {isApplication && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenApplicants(task)}
                            className="font-bold text-xs gap-1.5 h-8.5 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                          >
                            <Users className="h-3.5 w-3.5 text-purple-500" />
                            <span>Review Pelamar</span>
                          </Button>
                        )}

                        {task.mode === TASK_MODES.TEAM && task.assignedTeamId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenTeamRoster(task)}
                            className="font-bold text-xs gap-1.5 h-8.5 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 cursor-pointer"
                          >
                            <Users className="h-3.5 w-3.5" />
                            <span>Roster Tim</span>
                          </Button>
                        )}

                        {/* Copy Link Button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          type="button"
                          onClick={() => handleCopyLink(task.id)}
                          className="text-xs font-semibold gap-1 h-8.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                          title="Salin tautan task publik"
                        >
                          {isCopied ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-500" />
                              <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Salin</span>
                            </>
                          )}
                        </Button>

                        {/* Preview Public Page */}
                        <Link href={`/member/tasks/${task.id}`} target="_blank">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs font-semibold gap-1 h-8.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                            title="Buka pratinjau halaman publik"
                          >
                            <span>Pratinjau</span>
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* =============================================================== */
            /* VIEW MODE C: FORMAT TABEL DATA PADAT (TABLE)                    */
            /* =============================================================== */
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5 pl-4">Task &amp; ID</th>
                      <th className="p-3.5">Mode &amp; Metode</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Bounty (IDR)</th>
                      <th className="p-3.5">Batas Waktu</th>
                      <th className="p-3.5">Skill Utama</th>
                      <th className="p-3.5 pr-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredAndSortedTasks.map((task) => {
                      const isSolo = task.mode === TASK_MODES.SOLO;
                      const isInstant = task.assignmentType === TASK_ASSIGNMENT_TYPES.INSTANT_TAKE;
                      const isDraft = task.status === TASK_STATUS.DRAFT;
                      const isApplication = !isInstant;
                      const isCopied = copiedTaskId === task.id;

                      let deadlineBadgeText: string | null = null;
                      if (task.durationMinutes) {
                        const hours = Math.round(task.durationMinutes / 60);
                        deadlineBadgeText = hours >= 24 ? `${Math.round(hours / 24)} Hari` : `${hours} Jam`;
                      } else if (task.fixedDeadlineAt) {
                        deadlineBadgeText = formatDateWIB(task.fixedDeadlineAt);
                      } else if (task.deadlineAt) {
                        deadlineBadgeText = formatDateWIB(task.deadlineAt);
                      }

                      return (
                        <tr key={task.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 pl-4 max-w-xs">
                            <Link
                              href={`/member/tasks/${task.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-cyan-400 line-clamp-1 block"
                            >
                              {task.title}
                            </Link>
                            <span className="text-[10px] font-mono text-slate-400 block truncate">
                              #{task.id}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {isSolo ? 'Solo' : 'Tim'}
                              </span>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {isInstant ? 'Instant' : 'Kurasi'}
                              </span>
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <StatusPill status={task.status} size="sm" />
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                            {formatCurrencyIDR(task.totalReward)}
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400">
                            {deadlineBadgeText || '-'}
                          </td>
                          <td className="p-3.5 max-w-[160px]">
                            {task.requiredSkills && task.requiredSkills.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {task.requiredSkills.slice(0, 2).map((s) => (
                                  <Badge key={s} variant="outline" className="text-[9px] py-0 px-1">
                                    {s}
                                  </Badge>
                                ))}
                                {task.requiredSkills.length > 2 && (
                                  <span className="text-[10px] text-slate-400">
                                    +{task.requiredSkills.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">-</span>
                            )}
                          </td>
                          <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1">
                              {isDraft && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={actionInProgress === task.id}
                                  onClick={() => handlePublishTask(task.id)}
                                  className="font-bold text-[11px] h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                                >
                                  Terbitkan
                                </Button>
                              )}
                              {isApplication && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenApplicants(task)}
                                  className="font-bold text-[11px] h-7 px-2 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 cursor-pointer"
                                >
                                  Pelamar
                                </Button>
                              )}
                              {task.mode === TASK_MODES.TEAM && task.assignedTeamId && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenTeamRoster(task)}
                                  className="font-bold text-[11px] h-7 px-2 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 cursor-pointer"
                                >
                                  Roster
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyLink(task.id)}
                                className="h-7 px-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                title="Salin tautan"
                              >
                                {isCopied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                              </Button>
                              <Link href={`/member/tasks/${task.id}`} target="_blank">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                                  title="Pratinjau"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </Button>
                              </Link>
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

        {/* Modal / Drawer: Review Applicants */}
        {selectedTaskForApplicants && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50 dark:bg-slate-900/90">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="purple" leftIcon={<Users className="h-3 w-3" />}>
                      Antrean Applicant
                    </Badge>
                    <StatusPill status={selectedTaskForApplicants.status} size="sm" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {selectedTaskForApplicants.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bounty: <strong className="text-slate-900 dark:text-white">{formatCurrencyIDR(selectedTaskForApplicants.totalReward)}</strong> • Pilih satu pelamar terbaik untuk langsung mengaktifkan task.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTaskForApplicants(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {loadingApplicants ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-7 w-7 animate-spin mx-auto text-sky-500" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Memuat pelamar...</p>
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">Belum ada pelamar</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                      Task ini belum memiliki pendaftar. Pelamar akan muncul otomatis saat diajukan oleh member.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {applicants.map((app) => {
                      const isPending = app.status === 'PENDING';
                      const isAccepted = app.status === 'ACCEPTED';
                      const isTaskOpen = selectedTaskForApplicants.status === TASK_STATUS.OPEN;

                      return (
                        <div
                          key={app.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isAccepted
                              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-white">
                                  {app.applicantDisplayName || app.applicantEmail || 'Member SAKODE'}
                                </span>
                                <StatusPill status={app.status} size="sm" />
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                {app.applicantEmail && (
                                  <span className="flex items-center gap-1">
                                    <Mail className="h-3 w-3 text-slate-400" />
                                    <span>{app.applicantEmail}</span>
                                  </span>
                                )}
                                {app.applicantContactNumber && (
                                  <span className="flex items-center gap-1">
                                    <Phone className="h-3 w-3 text-slate-400" />
                                    <span>{app.applicantContactNumber}</span>
                                  </span>
                                )}
                                <span>Diajukan: {formatDateWIB(app.createdAt)}</span>
                              </div>

                              {/* Skills */}
                              {app.applicantSkills && app.applicantSkills.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {app.applicantSkills.map((s) => (
                                    <span
                                      key={s}
                                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Motivation Message */}
                              <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300">
                                <div className="font-semibold text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                                  Pesan Motivasi:
                                </div>
                                <p className="whitespace-pre-line leading-relaxed">{app.message}</p>
                              </div>

                              {/* Portfolio Links */}
                              {app.portfolioLinks && app.portfolioLinks.length > 0 && (
                                <div className="pt-1 flex flex-wrap gap-2 text-xs">
                                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Portofolio:</span>
                                  {app.portfolioLinks.map((link, idx) => (
                                    <a
                                      key={idx}
                                      href={link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5 font-medium"
                                    >
                                      <span>Tautan {idx + 1}</span>
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Action to Select */}
                            <div className="sm:self-center shrink-0">
                              {isPending && isTaskOpen && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={actionInProgress === app.id}
                                  onClick={() => handleSelectApplicant(app.id)}
                                  className="font-bold text-xs gap-1.5 h-9"
                                >
                                  {actionInProgress === app.id ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                  )}
                                  <span>Pilih Applicant</span>
                                </Button>
                              )}

                              {isAccepted && (
                                <div className="px-3 py-1 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>Terpilih (Active)</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <span>Total Pelamar: {applicants.length}</span>
                <Button variant="outline" size="sm" onClick={() => setSelectedTaskForApplicants(null)} className="text-xs">
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal / Drawer: Team Roster & Emergency Override */}
        {selectedTaskForTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-purple-50/50 dark:bg-purple-950/20">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Badge variant="purple" leftIcon={<Users className="h-3 w-3" />}>
                      Roster Tim
                    </Badge>
                    {selectedTeam && (
                      <>
                        <StatusPill status={selectedTeam.status} size="sm" />
                        {selectedTeam.rosterLocked ? (
                          <Badge variant="orange" leftIcon={<Lock className="h-3 w-3" />}>
                            Roster Terkunci
                          </Badge>
                        ) : (
                          <Badge variant="cyan" leftIcon={<Unlock className="h-3 w-3" />}>
                            Recruiting
                          </Badge>
                        )}
                      </>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {selectedTaskForTeam.title}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bounty: <strong className="text-slate-900 dark:text-white">{formatCurrencyIDR(selectedTaskForTeam.totalReward)}</strong>
                    {selectedTeam && (
                      <span> • Kode Undangan: <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{selectedTeam.inviteCode}</span></span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTaskForTeam(null);
                    setSelectedTeam(null);
                    setTeamMembers([]);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1">
                {loadingTeam ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-7 w-7 animate-spin mx-auto text-purple-500" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Memuat data tim dan roster...</p>
                  </div>
                ) : !selectedTeam ? (
                  <div className="py-12 text-center">
                    <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-2">Data Tim Belum Tersedia</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                      Task tim ini belum diinisialisasi atau data tim tidak ditemukan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Team Metrics Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Anggota</div>
                        <div className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                          {selectedTeam.memberCount} / {selectedTeam.maxMembers}
                        </div>
                        <div className="text-[10px] text-slate-400">Min: {selectedTeam.minMembers} orang</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Prinsip Split</div>
                        <div className="text-sm font-black text-purple-600 dark:text-purple-400 mt-0.5">
                          {selectedTeam.initialSplitPrinciple || 'EQUAL'}
                        </div>
                        <div className="text-[10px] text-slate-400">Konsensus Tim</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Status Roster</div>
                        <div className="text-sm font-black text-slate-700 dark:text-slate-300 mt-0.5">
                          {selectedTeam.rosterLocked ? 'Terkunci' : 'Terbuka'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {selectedTeam.rosterLocked ? 'Locked permanently' : 'Menerima anggota'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">Dibuat</div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                          {formatDateWIB(selectedTeam.createdAt)}
                        </div>
                        <div className="text-[10px] text-slate-400">Waktu WIB</div>
                      </div>
                    </div>

                    {/* Member List */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-purple-500" />
                          <span>Daftar Anggota Tim ({teamMembers.length})</span>
                        </h3>
                      </div>

                      {teamMembers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          Belum ada anggota terdaftar.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {teamMembers.map((member) => {
                            const isLead = member.roleInTeam === 'LEAD';
                            return (
                              <div
                                key={member.id}
                                className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                                  isLead
                                    ? 'border-purple-200 dark:border-purple-800 bg-purple-50/40 dark:bg-purple-950/20'
                                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    {isLead ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                        <Crown className="h-3 w-3" />
                                        <span>Team Lead</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                        <User className="h-3 w-3" />
                                        <span>Member</span>
                                      </span>
                                    )}
                                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                                      {member.userDisplayName || member.userEmail || member.userId}
                                    </span>
                                    <StatusPill status={member.status} size="sm" />
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-slate-500 dark:text-slate-400">
                                    {member.userEmail && <span>{member.userEmail}</span>}
                                    <span className="font-mono text-[11px] text-slate-400">UID: {member.userId}</span>
                                    {member.agreedTermsAt && (
                                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">✓ Setuju Syarat &amp; Pembagian</span>
                                    )}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 sm:self-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    type="button"
                                    onClick={() => {
                                      setOverrideAction('REMOVE');
                                      setOverrideTargetUserId(member.userId);
                                    }}
                                    className="text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 h-8 px-2.5"
                                  >
                                    Pilih untuk Hapus
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Admin Emergency Override Section */}
                    <div className="p-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/20 space-y-4">
                      <div className="flex items-start gap-2.5">
                        <Shield className="h-5 w-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-300">
                            Emergency Override Roster (Hak Khusus Admin)
                          </h4>
                          <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed mt-0.5">
                            Gunakan hanya untuk kondisi darurat (misal: anggota tidak aktif atau keadaan force majeure).
                            Penambahan atau penghapusan anggota saat status tim ACTIVE akan memodifikasi kepemilikan task aktif dan seluruh mutasi tercatat permanen di <code className="bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded text-[11px] font-mono">auditEvents</code>.
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleExecuteOverride} className="space-y-3 pt-2 border-t border-amber-200 dark:border-amber-800/60">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Action toggle */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Tindakan Override
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setOverrideAction('ADD')}
                                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                                  overrideAction === 'ADD'
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                                }`}
                              >
                                + Tambah Anggota
                              </button>
                              <button
                                type="button"
                                onClick={() => setOverrideAction('REMOVE')}
                                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                                  overrideAction === 'REMOVE'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                                }`}
                              >
                                - Hapus Anggota
                              </button>
                            </div>
                          </div>

                          {/* Target User ID */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                              Target User UID (Firestore)
                            </label>
                            <input
                              type="text"
                              required
                              value={overrideTargetUserId}
                              onChange={(e) => setOverrideTargetUserId(e.target.value)}
                              placeholder="Masukkan Firestore UID member..."
                              className="w-full text-xs font-mono p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        {/* Reason Textarea */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Alasan Override (Audit Trail - Wajib Minimal 10 Karakter)
                          </label>
                          <textarea
                            required
                            rows={2}
                            minLength={10}
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Contoh: Mengganti anggota yang tidak responsif selama 48 jam sesuai kesepakatan tim..."
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>

                        {/* Submit Button */}
                        <div className="flex justify-end">
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isOverriding || overrideReason.trim().length < 10 || !overrideTargetUserId.trim()}
                            className="gap-1.5 font-bold text-xs bg-amber-600 hover:bg-amber-700 border-amber-600 text-white shadow-xs"
                          >
                            {isOverriding ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Shield className="h-3.5 w-3.5" />
                            )}
                            <span>Eksekusi Admin Override</span>
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
                <span>Roster Locking Invariant SAKODE</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedTaskForTeam(null);
                    setSelectedTeam(null);
                    setTeamMembers([]);
                  }}
                  className="text-xs"
                >
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
