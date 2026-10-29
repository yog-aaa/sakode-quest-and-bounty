'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatCurrencyIDR, formatDateWIB } from '@/lib/utils';
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
  Layers,
  ChevronRight,
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
} from 'lucide-react';

export default function AdminTasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Load tasks callback
  const loadTasks = useCallback(async () => {
    if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAllTasksForAdminAction(user.id, statusFilter === 'ALL' ? undefined : statusFilter);
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
  }, [user, statusFilter]);

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

  // Filtered by Search Query
  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchTitle = t.title.toLowerCase().includes(query);
    const matchSkills = t.requiredSkills.some((s) => s.toLowerCase().includes(query));
    return matchTitle || matchSkills;
  });

  // Calculate Metric Counts
  const counts = {
    all: tasks.length,
    draft: tasks.filter((t) => t.status === TASK_STATUS.DRAFT).length,
    open: tasks.filter((t) => t.status === TASK_STATUS.OPEN).length,
    active: tasks.filter((t) => t.status === TASK_STATUS.ACTIVE).length,
    review: tasks.filter((t) => t.status === TASK_STATUS.IN_REVIEW || t.status === TASK_STATUS.SUBMITTED).length,
    completed: tasks.filter((t) => t.status === TASK_STATUS.APPROVED).length,
  };

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-100 dark:bg-cyan-950/80 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/80">
                  <Compass className="h-3 w-3" />
                  <span>Katalog Bounty & Penugasan</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Siklus Hidup Terpadu
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Manajemen Task & Bounty SAKODE
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Kelola siklus hidup bounty, publikasi task, dan seleksi pelamar secara transparan, adil, dan atomik.
              </p>
            </div>

            <Link href="/admin/tasks/create">
              <Button variant="primary" className="font-bold gap-2 h-11 px-5 shadow-sm">
                <Plus className="h-4 w-4" />
                <span>Buat Task Baru</span>
              </Button>
            </Link>
          </div>

          {/* Alert Messages */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-600 dark:text-rose-400 hover:text-rose-900 dark:hover:text-rose-200 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 cursor-pointer">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Metric Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
            {[
              { label: 'Semua Task', count: counts.all, filter: 'ALL' },
              { label: 'Draf', count: counts.draft, filter: TASK_STATUS.DRAFT },
              { label: 'Buka (Open)', count: counts.open, filter: TASK_STATUS.OPEN },
              { label: 'Sedang Aktif', count: counts.active, filter: TASK_STATUS.ACTIVE },
              { label: 'Dalam Review', count: counts.review, filter: TASK_STATUS.IN_REVIEW },
              { label: 'Selesai', count: counts.completed, filter: TASK_STATUS.APPROVED },
            ].map((stat) => (
              <button
                key={stat.label}
                onClick={() => setStatusFilter(stat.filter)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  statusFilter === stat.filter
                    ? 'border-sakode-cyan bg-white shadow-xs ring-2 ring-sakode-cyan/30'
                    : 'border-sakode-border bg-white hover:border-slate-300'
                }`}
              >
                <div className="text-[11px] font-semibold text-sakode-text-muted uppercase tracking-wider">
                  {stat.label}
                </div>
                <div className="text-lg sm:text-xl font-black text-sakode-text mt-0.5">{stat.count}</div>
              </button>
            ))}
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-lg border border-sakode-border">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari task berdasarkan judul atau skill..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-sakode-border focus:outline-none focus:ring-1 focus:ring-sakode-cyan"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-sakode-text-muted font-medium">Status Aktif:</span>
              <span className="text-xs font-bold text-sakode-text px-2 py-1 rounded bg-sakode-bg border border-sakode-border">
                {statusFilter === 'ALL' ? 'Semua Status' : statusFilter}
              </span>
            </div>
          </div>

          {/* Task List */}
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-cyan" />
              <p className="text-xs text-sakode-text-muted mt-2 font-medium">Memuat data task...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card className="py-12 text-center border-dashed">
              <CardContent className="space-y-3">
                <Compass className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-sakode-text">Belum ada task ditemukan</h3>
                <p className="text-xs text-sakode-text-muted max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ada task yang cocok dengan pencarian "${searchQuery}".`
                    : 'Belum ada task pada kategori status ini. Mulai dengan membuat task baru.'}
                </p>
                <Link href="/admin/tasks/create">
                  <Button variant="primary" size="sm" className="font-bold gap-1.5 mt-2">
                    <Plus className="h-3.5 w-3.5" />
                    <span>Buat Task Pertama</span>
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredTasks.map((task) => {
                const isSolo = task.mode === TASK_MODES.SOLO;
                const isInstant = task.assignmentType === TASK_ASSIGNMENT_TYPES.INSTANT_TAKE;
                const isDraft = task.status === TASK_STATUS.DRAFT;
                const isApplication = !isInstant;

                return (
                  <Card key={task.id} hoverable className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
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
                        <span className="text-[11px] text-sakode-text-muted font-medium ml-1">
                          ID: <span className="font-mono">{task.id.slice(0, 8)}...</span>
                        </span>
                      </div>

                      {/* Title */}
                      <Link href={`/member/tasks/${task.id}`} className="block group">
                        <h2 className="text-base sm:text-lg font-bold text-sakode-text group-hover:text-sky-600 transition-colors">
                          {task.title}
                        </h2>
                      </Link>

                      {/* Meta information */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sakode-text-muted">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Reward:</span>
                          <span className="font-extrabold text-sakode-text text-sm">
                            {formatCurrencyIDR(task.totalReward)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Dibuat: {formatDateWIB(task.createdAt)}</span>
                        </div>
                        {task.assignedUserId && (
                          <div className="flex items-center gap-1 text-sky-700 font-semibold">
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Penerima: {task.assignedUserId.slice(0, 8)}</span>
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {task.requiredSkills.map((skill) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions on right */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-sakode-border">
                      {isDraft && (
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={actionInProgress === task.id}
                          onClick={() => handlePublishTask(task.id)}
                          className="font-bold text-xs gap-1.5 h-9"
                        >
                          {actionInProgress === task.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          )}
                          <span>Terbitkan Task</span>
                        </Button>
                      )}

                      {isApplication && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenApplicants(task)}
                          className="font-bold text-xs gap-1.5 h-9 text-slate-700 border-slate-300"
                        >
                          <Users className="h-3.5 w-3.5 text-sakode-purple" />
                          <span>Review Pelamar</span>
                        </Button>
                      )}

                      {task.mode === TASK_MODES.TEAM && task.assignedTeamId && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenTeamRoster(task)}
                          className="font-bold text-xs gap-1.5 h-9 text-purple-800 border-purple-200 hover:bg-purple-50"
                        >
                          <Users className="h-3.5 w-3.5 text-sakode-purple" />
                          <span>Roster Tim</span>
                        </Button>
                      )}

                      <Link href={`/member/tasks/${task.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs gap-1 h-8 text-sakode-text-muted">
                          <span>Pratinjau</span>
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal / Drawer: Review Applicants */}
        {selectedTaskForApplicants && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-sakode-border flex items-start justify-between bg-sakode-bg">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="purple" leftIcon={<Users className="h-3 w-3" />}>
                      Antrean Applicant
                    </Badge>
                    <StatusPill status={selectedTaskForApplicants.status} size="sm" />
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-sakode-text leading-snug">
                    {selectedTaskForApplicants.title}
                  </h2>
                  <p className="text-xs text-sakode-text-muted mt-0.5">
                    Bounty: <strong className="text-sakode-text">{formatCurrencyIDR(selectedTaskForApplicants.totalReward)}</strong> • Pilih satu pelamar terbaik untuk langsung mengaktifkan task.
                  </p>
                </div>
                <button
                  onClick={() => setSelectedTaskForApplicants(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                {loadingApplicants ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-7 w-7 animate-spin mx-auto text-sakode-cyan" />
                    <p className="text-xs text-sakode-text-muted mt-2">Memuat pelamar...</p>
                  </div>
                ) : applicants.length === 0 ? (
                  <div className="py-12 text-center">
                    <Users className="h-10 w-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-sakode-text mt-2">Belum ada pelamar</h4>
                    <p className="text-xs text-sakode-text-muted max-w-xs mx-auto mt-1">
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
                          className={`p-4 rounded-lg border transition-all ${
                            isAccepted
                              ? 'border-emerald-300 bg-emerald-50/50'
                              : 'border-sakode-border bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-sakode-text">
                                  {app.applicantDisplayName || app.applicantEmail || 'Member SAKODE'}
                                </span>
                                <StatusPill status={app.status} size="sm" />
                              </div>

                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sakode-text-muted">
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
                                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-sakode-bg text-sakode-text-muted border border-sakode-border"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}

                              {/* Motivation Message */}
                              <div className="mt-2 p-2.5 rounded bg-slate-50 border border-slate-200/80 text-xs text-slate-700">
                                <div className="font-semibold text-[11px] text-slate-500 uppercase tracking-wider mb-0.5">
                                  Pesan Motivasi:
                                </div>
                                <p className="whitespace-pre-line leading-relaxed">{app.message}</p>
                              </div>

                              {/* Portfolio Links */}
                              {app.portfolioLinks && app.portfolioLinks.length > 0 && (
                                <div className="pt-1 flex flex-wrap gap-2 text-xs">
                                  <span className="text-[11px] font-semibold text-slate-500">Portofolio:</span>
                                  {app.portfolioLinks.map((link, idx) => (
                                    <a
                                      key={idx}
                                      href={link}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sky-600 hover:underline flex items-center gap-0.5 font-medium"
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
                                <div className="px-3 py-1 rounded bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
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
              <div className="p-3 sm:p-4 border-t border-sakode-border bg-sakode-bg flex justify-between items-center text-xs text-sakode-text-muted">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-sakode-border flex items-start justify-between bg-purple-50/50">
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
                  <h2 className="text-base sm:text-lg font-black text-sakode-text leading-snug">
                    {selectedTaskForTeam.title}
                  </h2>
                  <p className="text-xs text-sakode-text-muted mt-0.5">
                    Bounty: <strong className="text-sakode-text">{formatCurrencyIDR(selectedTaskForTeam.totalReward)}</strong>
                    {selectedTeam && (
                      <span> • Kode Undangan: <span className="font-mono font-bold text-sakode-purple">{selectedTeam.inviteCode}</span></span>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTaskForTeam(null);
                    setSelectedTeam(null);
                    setTeamMembers([]);
                  }}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-6 flex-1">
                {loadingTeam ? (
                  <div className="py-12 text-center">
                    <Loader2 className="h-7 w-7 animate-spin mx-auto text-sakode-purple" />
                    <p className="text-xs text-sakode-text-muted mt-2">Memuat data tim dan roster...</p>
                  </div>
                ) : !selectedTeam ? (
                  <div className="py-12 text-center">
                    <AlertTriangle className="h-10 w-10 text-amber-400 mx-auto" />
                    <h4 className="text-sm font-bold text-sakode-text mt-2">Data Tim Belum Tersedia</h4>
                    <p className="text-xs text-sakode-text-muted max-w-xs mx-auto mt-1">
                      Task tim ini belum diinisialisasi atau data tim tidak ditemukan.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Team Metrics Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Anggota</div>
                        <div className="text-sm font-black text-sakode-text mt-0.5">
                          {selectedTeam.memberCount} / {selectedTeam.maxMembers}
                        </div>
                        <div className="text-[10px] text-slate-400">Min: {selectedTeam.minMembers} orang</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Prinsip Split</div>
                        <div className="text-sm font-black text-sakode-purple mt-0.5">
                          {selectedTeam.initialSplitPrinciple || 'EQUAL'}
                        </div>
                        <div className="text-[10px] text-slate-400">Konsensus Tim</div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Status Roster</div>
                        <div className="text-sm font-black text-slate-700 mt-0.5">
                          {selectedTeam.rosterLocked ? 'Terkunci' : 'Terbuka'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {selectedTeam.rosterLocked ? 'Locked permanently' : 'Menerima anggota'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-slate-500">Dibuat</div>
                        <div className="text-xs font-semibold text-slate-700 mt-0.5">
                          {formatDateWIB(selectedTeam.createdAt)}
                        </div>
                        <div className="text-[10px] text-slate-400">Waktu WIB</div>
                      </div>
                    </div>

                    {/* Member List */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-sakode-text-muted flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-sakode-purple" />
                          <span>Daftar Anggota Tim ({teamMembers.length})</span>
                        </h3>
                      </div>

                      {teamMembers.length === 0 ? (
                        <div className="p-4 text-center text-xs text-sakode-text-muted border border-dashed rounded-lg">
                          Belum ada anggota terdaftar.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {teamMembers.map((member) => {
                            const isLead = member.roleInTeam === 'LEAD';
                            return (
                              <div
                                key={member.id}
                                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors ${
                                  isLead ? 'border-purple-200 bg-purple-50/40' : 'border-sakode-border bg-white'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    {isLead ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-sakode-purple border border-purple-200">
                                        <Crown className="h-3 w-3" />
                                        <span>Team Lead</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700">
                                        <User className="h-3 w-3" />
                                        <span>Member</span>
                                      </span>
                                    )}
                                    <span className="font-bold text-sm text-sakode-text">
                                      {member.userDisplayName || member.userEmail || member.userId}
                                    </span>
                                    <StatusPill status={member.status} size="sm" />
                                  </div>

                                  <div className="flex flex-wrap items-center gap-x-3 text-xs text-sakode-text-muted">
                                    {member.userEmail && <span>{member.userEmail}</span>}
                                    <span className="font-mono text-[11px] text-slate-400">UID: {member.userId}</span>
                                    {member.agreedTermsAt && (
                                      <span className="text-emerald-600 font-medium">✓ Setuju Syarat & Pembagian</span>
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
                                    className="text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 h-8 px-2.5"
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
                    <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/50 space-y-4">
                      <div className="flex items-start gap-2.5">
                        <Shield className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                            Emergency Override Roster (Hak Khusus Admin)
                          </h4>
                          <p className="text-xs text-amber-800 leading-relaxed mt-0.5">
                            Gunakan hanya untuk kondisi darurat (misal: anggota tidak aktif atau keadaan force majeure).
                            Penambahan atau penghapusan anggota saat status tim ACTIVE akan memodifikasi kepemilikan task aktif dan seluruh mutasi tercatat permanen di <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px] font-mono">auditEvents</code>.
                          </p>
                        </div>
                      </div>

                      <form onSubmit={handleExecuteOverride} className="space-y-3 pt-2 border-t border-amber-200">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Action toggle */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Tindakan Override
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setOverrideAction('ADD')}
                                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                                  overrideAction === 'ADD'
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                + Tambah Anggota
                              </button>
                              <button
                                type="button"
                                onClick={() => setOverrideAction('REMOVE')}
                                className={`py-2 px-3 text-xs font-bold rounded-lg border text-center transition-all ${
                                  overrideAction === 'REMOVE'
                                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                }`}
                              >
                                - Hapus Anggota
                              </button>
                            </div>
                          </div>

                          {/* Target User ID */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                              Target User UID (Firestore)
                            </label>
                            <input
                              type="text"
                              required
                              value={overrideTargetUserId}
                              onChange={(e) => setOverrideTargetUserId(e.target.value)}
                              placeholder="Masukkan Firestore UID member..."
                              className="w-full text-xs font-mono p-2 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                            />
                          </div>
                        </div>

                        {/* Reason Textarea */}
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Alasan Override (Audit Trail - Wajib Minimal 10 Karakter)
                          </label>
                          <textarea
                            required
                            rows={2}
                            minLength={10}
                            value={overrideReason}
                            onChange={(e) => setOverrideReason(e.target.value)}
                            placeholder="Contoh: Mengganti anggota yang tidak responsif selama 48 jam sesuai kesepakatan tim..."
                            className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
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
              <div className="p-3 sm:p-4 border-t border-sakode-border bg-sakode-bg flex justify-between items-center text-xs text-sakode-text-muted">
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
