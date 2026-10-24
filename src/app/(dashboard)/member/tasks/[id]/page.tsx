'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { formatCurrencyIDR, formatDateWIB } from '@/lib/utils';
import { TASK_STATUS, TASK_MODES, TASK_ASSIGNMENT_TYPES } from '@/lib/constants';
import { getTaskDetailAction } from '@/server/actions/task.actions';
import { instantTakeTaskAction, submitApplicationAction } from '@/server/actions/assignment.actions';
import { getSubmissionsForTaskAction } from '@/server/actions/submission.actions';
import type { TaskDocument, SubmissionDocument } from '@/types/database';
import {
  ArrowLeft,
  Compass,
  Users,
  User,
  Zap,
  Send,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Shield,
  ShieldAlert,
  Loader2,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

function TaskDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const taskId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [task, setTask] = useState<TaskDocument | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modals
  const [showInstantModal, setShowInstantModal] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isTakingTask, setIsTakingTask] = useState(false);

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [portfolioInput, setPortfolioInput] = useState('');
  const [agreedCommitment, setAgreedCommitment] = useState(false);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // Load Task
  const loadTask = useCallback(async () => {
    if (!taskId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getTaskDetailAction(taskId);
      if (res.success && res.task) {
        setTask(res.task);
      } else {
        setErrorMsg(res.error || 'Task tidak ditemukan.');
      }

      const resSubs = await getSubmissionsForTaskAction(taskId);
      if (resSubs.success && resSubs.submissions) {
        setSubmissions(resSubs.submissions);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memuat rincian task.');
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTask();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTask]);

  // Handle Instant Take
  const handleInstantTake = async () => {
    if (!user || !task) return;
    if (!agreedTerms) {
      setErrorMsg('Anda wajib menyetujui syarat & ketentuan.');
      return;
    }

    setIsTakingTask(true);
    setErrorMsg(null);
    try {
      const res = await instantTakeTaskAction(user.id, {
        taskId: task.id,
        agreedTermsVersion: task.termsSnapshot.version,
      });

      if (res.success) {
        setShowInstantModal(false);
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

  // Handle Apply
  const handleApply = async () => {
    if (!user || !task) return;
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
        taskId: task.id,
        message: motivationMessage,
        portfolioLinks,
      });

      if (res.success) {
        setShowApplyModal(false);
        setSuccessMsg('Aplikasi Anda berhasil dikirim! Silakan pantau status seleksi di Dashboard Anda.');
        loadTask();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sakode-bg py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-cyan" />
        <p className="text-xs text-sakode-text-muted mt-2 font-medium">Memuat rincian task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-sakode-bg py-16 px-4">
        <div className="max-w-xl mx-auto text-center space-y-4">
          <Compass className="h-12 w-12 text-slate-300 mx-auto" />
          <h2 className="text-xl font-bold text-sakode-text">Task Tidak Ditemukan</h2>
          <p className="text-xs text-sakode-text-muted">
            {errorMsg || 'Task yang Anda cari mungkin telah dihapus atau tidak tersedia.'}
          </p>
          <Link href="/member/tasks">
            <Button variant="primary" size="sm" className="font-bold">
              Kembali ke Eksplor Task
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isSolo = task.mode === TASK_MODES.SOLO;
  const isInstant = task.assignmentType === TASK_ASSIGNMENT_TYPES.INSTANT_TAKE;
  const isOpen = task.status === TASK_STATUS.OPEN;
  const isAssignedToMe = task.assignedUserId === user?.id;
  const hasActiveTask = Boolean(user?.activeTaskId);
  const maxApplicationsReached = (user?.pendingApplicationCount || 0) >= 3;
  const isActionDisabled = !user?.approvalStatus || user?.approvalStatus !== 'APPROVED' || hasActiveTask || (!isInstant && maxApplicationsReached);

  let disabledReason = '';
  if (user?.approvalStatus !== 'APPROVED') {
    disabledReason = 'Akun Anda belum disetujui oleh admin.';
  } else if (hasActiveTask && !isAssignedToMe) {
    disabledReason = 'Anda sedang memegang 1 Active Task.';
  } else if (!isInstant && maxApplicationsReached) {
    disabledReason = 'Batas kuota 3 aplikasi pending tercapai.';
  }

  return (
    <AuthGuard requireApproved>
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Back Button */}
          <div>
            <Link
              href="/member/tasks"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sakode-text-muted hover:text-sakode-text transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Daftar Task</span>
            </Link>
          </div>

          {/* Alerts */}
          {errorMsg && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Left 2 Cols: Task Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={isSolo ? 'cyan' : 'purple'}
                      leftIcon={isSolo ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                    >
                      {isSolo ? 'Solo Task' : 'Team Task'}
                    </Badge>
                    <Badge
                      variant="outline"
                      leftIcon={isInstant ? <Zap className="h-3 w-3 text-amber-500" /> : <Send className="h-3 w-3 text-sky-500" />}
                    >
                      {isInstant ? 'Instant Take' : 'Application'}
                    </Badge>
                    <StatusPill status={task.status} size="sm" />
                  </div>

                  <CardTitle className="text-xl sm:text-2xl font-black text-sakode-text leading-tight">
                    {task.title}
                  </CardTitle>

                  <CardDescription className="text-xs sm:text-sm leading-relaxed text-sakode-text-muted">
                    {task.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6 pt-2">
                  {/* Scope */}
                  <div>
                    <h3 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-sakode-cyan" />
                      <span>Ruang Lingkup Pekerjaan (Scope)</span>
                    </h3>
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {task.scope}
                    </div>
                  </div>

                  {/* Deliverable Guidelines */}
                  <div>
                    <h3 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ExternalLink className="h-4 w-4 text-sky-600" />
                      <span>Panduan Deliverable</span>
                    </h3>
                    <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {task.deliverableGuidelines}
                    </div>
                  </div>

                  {/* Acceptance Criteria */}
                  <div>
                    <h3 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      <span>Kriteria Penerimaan (Acceptance Criteria)</span>
                    </h3>
                    <div className="space-y-2">
                      {task.acceptanceCriteria.map((criterion, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 p-3 rounded-lg bg-emerald-50/40 border border-emerald-100 text-xs sm:text-sm text-slate-800"
                        >
                          <div className="p-0.5 rounded bg-emerald-600 text-white shrink-0 mt-0.5">
                            <Check className="h-3 w-3" />
                          </div>
                          <span>{criterion}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Required Skills */}
                  <div>
                    <h3 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-2">
                      Skill yang Dibutuhkan
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      {task.requiredSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Terms & Conditions Snapshot */}
                  <div className="pt-2 border-t border-sakode-border">
                    <h3 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-sakode-purple" />
                      <span>Syarat & Ketentuan (Snapshot v{task.termsSnapshot.version})</span>
                    </h3>
                    <div className="p-3 rounded-lg bg-sakode-bg border border-sakode-border text-xs font-mono text-sakode-text-muted whitespace-pre-line leading-relaxed">
                      {task.termsSnapshot.content}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Riwayat Deliverable / Submissions */}
              {submissions.length > 0 && (
                <Card className="p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-sakode-border pb-3">
                    <h3 className="text-sm font-black text-sakode-text flex items-center gap-2">
                      <FileText className="h-4 w-4 text-sakode-cyan" />
                      <span>Riwayat Deliverable Diserahkan ({submissions.length})</span>
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {submissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 rounded-xl border border-sakode-border bg-white space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="cyan">Versi {sub.version}</Badge>
                            <StatusPill status={sub.status} size="sm" />
                          </div>
                          <span className="text-[11px] text-sakode-text-muted">
                            {formatDateWIB(sub.createdAt)}
                          </span>
                        </div>

                        <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200/70">
                          {sub.notes}
                        </p>

                        {sub.deliverableLinks && sub.deliverableLinks.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Tautan:</span>
                            <div className="flex flex-wrap gap-2">
                              {sub.deliverableLinks.map((link, idx) => (
                                <a
                                  key={idx}
                                  href={link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-sky-600 hover:underline flex items-center gap-1 font-semibold"
                                >
                                  <span>Tautan #{idx + 1}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {sub.evidenceFiles && sub.evidenceFiles.length > 0 && (
                          <div className="text-[11px] text-slate-500 font-medium">
                            Lampiran Bukti: {sub.evidenceFiles.length} berkas
                          </div>
                        )}

                        {sub.revisionNotes && (
                          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
                            <span className="font-bold text-[11px] uppercase tracking-wider block">
                              Catatan Revisi dari Admin:
                            </span>
                            <p>{sub.revisionNotes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Right 1 Col: Bounty Reward Card & Actions */}
            <div className="space-y-4 sticky top-20">
              <Card className="border-sakode-cyan/50 shadow-md">
                <CardHeader className="pb-3">
                  <div className="text-[11px] font-bold text-sakode-text-muted uppercase tracking-wider">
                    Total Bounty Reward
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-sakode-text tracking-tight">
                    {formatCurrencyIDR(task.totalReward)}
                  </div>
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    100% Ditransfer ke Rekening Terdaftar
                  </span>
                </CardHeader>

                <CardContent className="space-y-4 pt-0">
                  {/* Deadline Info */}
                  <div className="p-3 rounded-lg bg-sakode-bg border border-sakode-border text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-sakode-text-muted">
                      <span>Batas Waktu:</span>
                      <Clock className="h-3.5 w-3.5 text-sakode-cyan" />
                    </div>
                    {task.deadlineAt ? (
                      <div>
                        <CountdownTimer deadline={task.deadlineAt} />
                        <span className="text-[10px] text-sakode-text-muted block mt-1">
                          Deadline: {formatDateWIB(task.deadlineAt)}
                        </span>
                      </div>
                    ) : task.durationMinutes ? (
                      <div className="font-bold text-sakode-text">
                        {Math.round(task.durationMinutes / 60)} Jam ({task.durationMinutes} Menit)
                        <span className="text-[10px] text-sakode-text-muted block font-normal">
                          Dihitung sejak task berhasil diambil
                        </span>
                      </div>
                    ) : task.fixedDeadlineAt ? (
                      <div className="font-bold text-sakode-text">
                        {formatDateWIB(task.fixedDeadlineAt)}
                      </div>
                    ) : (
                      <div className="text-sakode-text-muted">Fleksibel</div>
                    )}
                  </div>

                  {/* State Handling & Actions */}
                  {task.assignedTeamId && (
                    <div className="p-3 rounded-lg bg-purple-50 border border-purple-200 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900">
                        <Users className="h-4 w-4 text-sakode-purple" />
                        <span>Ruang Tim Tersedia</span>
                      </div>
                      <p className="text-[11px] text-purple-700">
                        Task ini dikerjakan secara berkelompok. Akses ruang kolaborasi untuk melihat roster anggota dan kode undangan.
                      </p>
                      <Link href={`/member/teams/${task.assignedTeamId}`} className="block pt-1">
                        <Button variant="team" size="sm" className="w-full font-bold text-xs h-9 gap-1.5">
                          <Users className="h-3.5 w-3.5" />
                          <span>Masuk ke Ruang Tim</span>
                        </Button>
                      </Link>
                    </div>
                  )}

                  {isAssignedToMe ? (
                    <div className="space-y-2">
                      <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                        <span>Anda terdaftar pada task ini!</span>
                      </div>

                      {(task.status === TASK_STATUS.ACTIVE || task.status === TASK_STATUS.REVISION) && (
                        <Link href={`/member/tasks/${task.id}/submit`} className="block">
                          <Button
                            variant="primary"
                            className="w-full font-bold text-xs h-11 gap-1.5 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-sm"
                          >
                            <Send className="h-4 w-4" />
                            <span>Kirim Deliverable (Hasil)</span>
                          </Button>
                        </Link>
                      )}

                      <Link href="/member" className="block">
                        <Button variant="outline" className="w-full font-bold text-xs h-10">
                          Buka Dashboard Pengerjaan
                        </Button>
                      </Link>
                    </div>
                  ) : isOpen ? (
                    <div className="space-y-2">
                      {isActionDisabled && (
                        <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[11px] text-amber-900 font-bold flex items-center gap-1.5">
                          <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0" />
                          <span>{disabledReason}</span>
                        </div>
                      )}

                      {isInstant ? (
                        <Button
                          variant="primary"
                          disabled={isActionDisabled}
                          onClick={() => {
                            setShowInstantModal(true);
                            setAgreedTerms(false);
                          }}
                          className="w-full font-bold text-xs h-11 gap-1.5 shadow-sm"
                        >
                          <Zap className="h-4 w-4" />
                          <span>Ambil Task Sekarang (Instant)</span>
                        </Button>
                      ) : (
                        <Button
                          variant="team"
                          disabled={isActionDisabled}
                          onClick={() => {
                            setShowApplyModal(true);
                            setMotivationMessage('');
                            setPortfolioInput('');
                            setAgreedCommitment(false);
                          }}
                          className="w-full font-bold text-xs h-11 gap-1.5 shadow-sm"
                        >
                          <Send className="h-4 w-4" />
                          <span>Ajukan Permohonan (Apply)</span>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 text-center font-semibold">
                      Task ini berstatus <strong className="text-slate-800">{task.status}</strong> dan tidak lagi menerima pendaftaran baru.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Modal: Instant Take Terms Confirmation */}
        {showInstantModal && task && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              <div className="p-4 sm:p-5 border-b border-sakode-border bg-sakode-bg flex items-start justify-between">
                <div>
                  <Badge variant="cyan" leftIcon={<Zap className="h-3 w-3 text-amber-500" />}>
                    Instant Take Confirmation
                  </Badge>
                  <h2 className="text-base sm:text-lg font-black text-sakode-text mt-1">{task.title}</h2>
                </div>
                <button onClick={() => setShowInstantModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    {isSolo ? (
                      <span>
                        <strong className="font-bold">Konfirmasi Invariant:</strong> Task akan langsung menjadi Active Task Anda, batas waktu pengerjaan akan dimulai, dan slot langsung dikunci di Firestore.
                      </span>
                    ) : (
                      <span>
                        <strong className="font-bold">Konfirmasi Mode Tim:</strong> Anda akan menjadi <strong>Team Lead</strong>, ruang tim akan dibuat dalam fase perekrutan (RECRUITING), dan timer durasi baru akan dimulai setelah seluruh anggota siap.
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                    Syarat & Ketentuan:
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                    {task.termsSnapshot.content}
                  </div>
                </div>

                <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-sakode-border text-sakode-cyan focus:ring-sakode-cyan"
                  />
                  <span className="text-xs text-sakode-text leading-snug">
                    Saya telah membaca, memahami, dan menyetujui seluruh syarat & ketentuan pengerjaan task ini.
                  </span>
                </label>
              </div>

              <div className="p-4 border-t border-sakode-border bg-sakode-bg flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setShowInstantModal(false)} className="text-xs">
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!agreedTerms || isTakingTask}
                  onClick={handleInstantTake}
                  className="font-bold text-xs gap-1.5 h-10 px-4"
                >
                  {isTakingTask ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Konfirmasi & Mulai Bekerja</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Application Submission */}
        {showApplyModal && task && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              <div className="p-4 sm:p-5 border-b border-sakode-border bg-sakode-bg flex items-start justify-between">
                <div>
                  <Badge variant="purple" leftIcon={<Send className="h-3 w-3" />}>
                    Pengajuan Aplikasi
                  </Badge>
                  <h2 className="text-base sm:text-lg font-black text-sakode-text mt-1">{task.title}</h2>
                </div>
                <button onClick={() => setShowApplyModal(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                    Pesan Motivasi & Pengalaman Relevan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Tuliskan pengalaman atau portofolio Anda yang relevan dengan kebutuhan task ini..."
                    value={motivationMessage}
                    onChange={(e) => setMotivationMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-cyan leading-relaxed"
                  />
                  <p className="text-[10px] text-sakode-text-muted mt-1">Minimal 10 karakter.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                    Tautan Portofolio / GitHub
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Satu tautan per baris..."
                    value={portfolioInput}
                    onChange={(e) => setPortfolioInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-cyan font-mono"
                  />
                </div>

                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedCommitment}
                    onChange={(e) => setAgreedCommitment(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-sakode-border text-sakode-cyan focus:ring-sakode-cyan"
                  />
                  <span className="text-xs text-sakode-text leading-snug">
                    Saya berkomitmen menyelesaikan seluruh kriteria penerimaan tepat waktu jika terpilih.
                  </span>
                </label>
              </div>

              <div className="p-4 border-t border-sakode-border bg-sakode-bg flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setShowApplyModal(false)} className="text-xs">
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!agreedCommitment || motivationMessage.trim().length < 10 || isSubmittingApp}
                  onClick={handleApply}
                  className="font-bold text-xs gap-1.5 h-10 px-4"
                >
                  {isSubmittingApp ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span>Kirim Permohonan</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

export default function TaskDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-sakode-bg py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-cyan" />
          <p className="text-xs text-sakode-text-muted mt-2 font-medium">Memuat rincian task...</p>
        </div>
      }
    >
      <TaskDetailContent />
    </React.Suspense>
  );
}
