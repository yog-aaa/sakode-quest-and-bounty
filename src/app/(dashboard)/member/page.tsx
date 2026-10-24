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
} from 'lucide-react';

export default function MemberDashboardPage() {
  const { user } = useAuth();

  const [activeTask, setActiveTask] = useState<TaskDocument | null>(null);
  const [loadingActiveTask, setLoadingActiveTask] = useState(false);

  const [applications, setApplications] = useState<ApplicationDocument[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'applications'>('overview');
  const [showSubmissionNotice, setShowSubmissionNotice] = useState(false);
  const [withdrawingAppId, setWithdrawingAppId] = useState<string | null>(null);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Load Active Task
  const loadActiveTask = useCallback(async () => {
    if (!user) return;
    setLoadingActiveTask(true);
    try {
      const res = await getActiveTaskForUserAction(user.id);
      if (res.success && res.task) {
        setActiveTask(res.task);
      } else {
        setActiveTask(null);
      }
    } catch (err: unknown) {
      console.error(err);
    } finally {
      setLoadingActiveTask(false);
    }
  }, [user]);

  // Load User Applications
  const loadApplications = useCallback(async () => {
    if (!user) return;
    setLoadingApplications(true);
    try {
      const res = await getUserApplicationsAction(user.id);
      if (res.success && res.applications) {
        setApplications(res.applications);
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
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sakode-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="success" leftIcon={<ShieldCheck className="h-3 w-3" />}>
                  Member Terverifikasi
                </Badge>
                <span className="text-xs text-sakode-text-muted">SAKODE Academy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-sakode-text tracking-tight">
                Halo, {user?.displayName || 'Member SAKODE'}!
              </h1>
              <p className="text-xs sm:text-sm text-sakode-text-muted">
                Status akun Anda: <strong className="text-emerald-700">APPROVED</strong>. Anda memiliki akses penuh untuk mengambil task dan berkolaborasi dalam tim.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/member/tasks">
                <Button variant="primary" className="font-bold gap-2 h-11 px-5 shadow-sm">
                  <Compass className="h-4 w-4" />
                  <span>Jelajahi Task Tersedia</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Action Notifications */}
          {actionSuccessMsg && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{actionSuccessMsg}</span>
              </div>
              <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {actionErrorMsg && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{actionErrorMsg}</span>
              </div>
              <button onClick={() => setActionErrorMsg(null)} className="text-rose-600 hover:text-rose-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-xs font-semibold text-sakode-text-muted uppercase">
                Task Aktif Saat Ini
              </div>
              <div className="text-xl sm:text-2xl font-black text-sakode-text mt-1">
                {activeTask ? '1 Task (Sedang Dikerjakan)' : 'Belum Ada Task Aktif'}
              </div>
              <span className="text-[11px] text-sakode-text-muted mt-1 block">
                Batas Invariant: Maksimal 1 Active Task
              </span>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold text-sakode-text-muted uppercase">
                Aplikasi Pending
              </div>
              <div className="text-xl sm:text-2xl font-black text-sakode-text mt-1">
                {pendingAppsCount} / 3 Kuota
              </div>
              <span className="text-[11px] text-sakode-text-muted mt-1 block">
                Batas Invariant: Maksimal 3 pending application
              </span>
            </Card>

            <Card className="p-4">
              <div className="text-xs font-semibold text-sakode-text-muted uppercase">
                Rekening Pencairan
              </div>
              <div className="text-sm font-mono font-bold text-sakode-text mt-1 truncate">
                {user?.paymentAccountMasked || 'Belum terdaftar'}
              </div>
              <span className="text-[11px] text-emerald-700 font-semibold mt-1 block">
                Terenkripsi AES-256
              </span>
            </Card>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-sakode-border pb-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'border-sakode-cyan text-sakode-text'
                  : 'border-transparent text-sakode-text-muted hover:text-sakode-text'
              }`}
            >
              <Zap className="h-4 w-4 text-sakode-cyan" />
              <span>Task Aktif & Profil</span>
            </button>

            <button
              onClick={() => setActiveTab('applications')}
              className={`px-4 py-2 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'applications'
                  ? 'border-sakode-purple text-sakode-text'
                  : 'border-transparent text-sakode-text-muted hover:text-sakode-text'
              }`}
            >
              <Send className="h-4 w-4 text-sakode-purple" />
              <span>Aplikasi Saya ({applications.length})</span>
            </button>
          </div>

          {/* TAB 1: OVERVIEW & ACTIVE TASK HERO */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* DOMINANT HERO ACTIVE TASK CARD */}
              {loadingActiveTask ? (
                <div className="py-12 text-center bg-white rounded-xl border border-sakode-border">
                  <Loader2 className="h-7 w-7 animate-spin mx-auto text-sakode-cyan" />
                  <p className="text-xs text-sakode-text-muted mt-2">Memeriksa status task aktif...</p>
                </div>
              ) : activeTask ? (
                <Card className="border-2 border-sakode-cyan shadow-lg bg-gradient-to-br from-white via-white to-sky-50/30 overflow-hidden">
                  <div className="bg-sakode-cyan/15 px-6 py-3 border-b border-sakode-cyan/30 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-black uppercase tracking-wider text-sakode-text">
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

                  <CardContent className="p-6 space-y-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <h2 className="text-xl sm:text-2xl font-black text-sakode-text leading-tight">
                          {activeTask.title}
                        </h2>
                        <p className="text-xs sm:text-sm text-sakode-text-muted leading-relaxed">
                          {activeTask.description}
                        </p>
                      </div>

                      {/* Bounty & Deadline Highlight Box */}
                      <div className="p-4 rounded-xl bg-white border border-sakode-border shadow-xs space-y-2 shrink-0 md:w-72">
                        <div>
                          <span className="text-[10px] font-bold text-sakode-text-muted uppercase tracking-wider">
                            Bounty Reward:
                          </span>
                          <div className="text-2xl font-black text-sakode-text">
                            {formatCurrencyIDR(activeTask.totalReward)}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-sakode-border/60">
                          <span className="text-[10px] font-bold text-sakode-text-muted uppercase tracking-wider block mb-1">
                            Sisa Waktu Pengerjaan:
                          </span>
                          <CountdownTimer deadline={activeTask.deadlineAt} />
                        </div>
                      </div>
                    </div>

                    {/* Acceptance Criteria Checklist */}
                    <div className="pt-2 border-t border-sakode-border/60">
                      <h4 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                        <span>Kriteria Penerimaan (Acceptance Criteria):</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {activeTask.acceptanceCriteria.map((criterion, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-slate-800"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                            <span>{criterion}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Deliverable Hint & Action Buttons */}
                    <div className="pt-3 border-t border-sakode-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-sakode-text-muted">
                        Panduan Deliverable: <strong className="text-sakode-text">{activeTask.deliverableGuidelines}</strong>
                      </div>

                      <div className="flex items-center gap-2">
                        {activeTask.assignedTeamId && (
                          <Link href={`/member/teams/${activeTask.assignedTeamId}`}>
                            <Button variant="team" size="sm" className="text-xs font-bold h-10 gap-1.5">
                              <Users className="h-4 w-4" />
                              <span>Ruang Tim</span>
                            </Button>
                          </Link>
                        )}

                        <Link href={`/member/tasks/${activeTask.id}`}>
                          <Button variant="outline" size="sm" className="text-xs font-bold h-10">
                            Lihat Rincian Lengkap
                          </Button>
                        </Link>

                        <Link href={`/member/tasks/${activeTask.id}/submit`}>
                          <Button
                            variant="primary"
                            size="sm"
                            className="font-bold text-xs h-10 gap-1.5 px-4 shadow-sm bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white"
                          >
                            <FileCheck2 className="h-4 w-4" />
                            <span>Kirim Hasil Pekerjaan</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                /* No Active Task Hero Promo */
                <Card className="p-8 text-center border-dashed bg-white">
                  <div className="max-w-md mx-auto space-y-3">
                    <Compass className="h-10 w-10 text-sakode-cyan mx-auto" />
                    <h3 className="text-base font-bold text-sakode-text">Anda Belum Memiliki Task Aktif</h3>
                    <p className="text-xs text-sakode-text-muted">
                      Jelajahi quest yang tersedia, ambil tugas solo secara langsung dengan Instant Take, atau daftar ke task kolaborasi tim untuk memperoleh bounty reward.
                    </p>
                    <Link href="/member/tasks">
                      <Button variant="primary" size="sm" className="font-bold gap-2 mt-2">
                        <span>Buka Papan Bounty</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}

              {/* Profile & Skill Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4 text-sakode-purple" />
                      <span>Keahlian & Tag Skill Anda</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Digunakan untuk merekomendasikan task yang relevan dengan spesialisasi Anda:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {user?.skills && user.skills.length > 0 ? (
                        user.skills.map((skill) => (
                          <Badge key={skill} variant="purple" className="text-xs">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-sakode-text-muted">Belum ada skill yang dipilih</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      <span>Informasi Akun & Kontak</span>
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Data identitas dan rekening pencairan yang diverifikasi admin:
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0 text-xs">
                    <div>Email: <strong className="text-sakode-text">{user?.email}</strong></div>
                    <div>WhatsApp/Telegram: <strong className="text-sakode-text">{user?.contactNumber || '-'}</strong></div>
                    <div>Rekening: <strong className="font-mono text-sakode-text">{user?.paymentAccountMasked || '-'}</strong></div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* TAB 2: APPLICATIONS LIST */}
          {activeTab === 'applications' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-sakode-border">
                <div>
                  <h3 className="text-sm font-bold text-sakode-text">Daftar Permohonan Task (Applications)</h3>
                  <p className="text-xs text-sakode-text-muted">
                    Kuota pending: <strong>{pendingAppsCount} / 3</strong> • Pembatalan permohonan pending tidak dikenakan penalti.
                  </p>
                </div>

                <Link href="/member/tasks">
                  <Button variant="outline" size="sm" className="text-xs font-bold gap-1">
                    <Compass className="h-3.5 w-3.5" />
                    <span>Cari Task Lain</span>
                  </Button>
                </Link>
              </div>

              {loadingApplications ? (
                <div className="py-16 text-center">
                  <Loader2 className="h-7 w-7 animate-spin mx-auto text-sakode-cyan" />
                  <p className="text-xs text-sakode-text-muted mt-2">Memuat daftar aplikasi Anda...</p>
                </div>
              ) : applications.length === 0 ? (
                <Card className="py-16 text-center border-dashed">
                  <CardContent className="space-y-3">
                    <Send className="h-10 w-10 text-slate-300 mx-auto" />
                    <h4 className="text-sm font-bold text-sakode-text">Belum ada permohonan task</h4>
                    <p className="text-xs text-sakode-text-muted max-w-sm mx-auto">
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
                      <Card key={app.id} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2">
                            <StatusPill status={app.status} size="sm" />
                            <span className="text-xs text-sakode-text-muted font-medium">
                              Diajukan pada: {formatDateWIB(app.createdAt)}
                            </span>
                          </div>

                          <h3 className="text-base font-bold text-sakode-text">
                            {app.taskTitle || `Task ID: ${app.taskId.slice(0, 10)}...`}
                          </h3>

                          {app.taskReward && (
                            <div className="text-xs text-sakode-text-muted">
                              Potensi Bounty: <strong className="text-sakode-text">{formatCurrencyIDR(app.taskReward)}</strong>
                            </div>
                          )}

                          {/* Message snippet */}
                          <div className="p-2.5 rounded bg-slate-50 border border-slate-200 text-xs text-slate-700">
                            <span className="font-semibold text-slate-500 uppercase text-[10px] block mb-0.5">
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
                              className="font-bold text-xs gap-1.5 h-9 text-rose-700 border-rose-200 hover:bg-rose-50"
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
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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

        {/* Modal: Submission Notice (Sprint 4 Preview) */}
        {showSubmissionNotice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="p-5 border-b border-sakode-border bg-sakode-bg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCheck2 className="h-5 w-5 text-sakode-cyan" />
                  <h3 className="text-base font-bold text-sakode-text">Pengiriman Hasil Pekerjaan</h3>
                </div>
                <button onClick={() => setShowSubmissionNotice(false)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-5 space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                <p>
                  Modul pengiriman hasil pekerjaan (Submission Form, Git Repository URL, Preview Link, dan Review Lock System) akan diaktifkan secara menyeluruh pada <strong>Sprint 4: Submission & Review Core</strong>.
                </p>
                <p>
                  Untuk saat ini, silakan selesaikan seluruh kriteria penerimaan yang ditentukan pada branch repositori Anda sebelum batas waktu berakhir.
                </p>
              </div>

              <div className="p-4 border-t border-sakode-border bg-sakode-bg flex justify-end">
                <Button variant="primary" size="sm" onClick={() => setShowSubmissionNotice(false)} className="font-bold text-xs">
                  Mengerti
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
