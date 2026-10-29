'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { FileUploadDropzone } from '@/components/submission/FileUploadDropzone';
import { formatCurrencyIDR, formatDateWIB } from '@/lib/utils';
import { getTaskDetailAction } from '@/server/actions/task.actions';
import { getTeamDetailAction } from '@/server/actions/team.actions';
import { submitTaskWorkAction } from '@/server/actions/submission.actions';
import type { TaskDocument, TeamDocument, EvidenceFile } from '@/types/database';
import { TASK_STATUS, TASK_MODES } from '@/lib/constants';
import {
  ArrowLeft,
  Send,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Clock,
  Save,
  Link as LinkIcon,
} from 'lucide-react';

function TaskSubmitInner() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const taskId = params.id as string;

  const [task, setTask] = useState<TaskDocument | null>(null);
  const [team, setTeam] = useState<TeamDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Form State
  const [notes, setNotes] = useState('');
  const [deliverableLinks, setDeliverableLinks] = useState<string[]>(['']);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);

  // Load Task & Team
  const loadData = useCallback(async () => {
    if (!taskId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getTaskDetailAction(taskId);
      if (res.success && res.task) {
        setTask(res.task);
        if (res.task.mode === TASK_MODES.TEAM && res.task.assignedTeamId) {
          const resTeam = await getTeamDetailAction(res.task.assignedTeamId);
          if (resTeam.success && resTeam.team) {
            setTeam(resTeam.team);
          }
        }
      } else {
        setErrorMsg(res.error || 'Gagal memuat detail task.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat memuat task.');
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Restore Draft from LocalStorage
  useEffect(() => {
    if (!taskId || hasRestoredDraft) return;
    const timer = setTimeout(() => {
      try {
        const draftKey = `sakode_draft_sub_${taskId}`;
        const saved = localStorage.getItem(draftKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.notes) setNotes(parsed.notes);
          if (Array.isArray(parsed.deliverableLinks) && parsed.deliverableLinks.length > 0) {
            setDeliverableLinks(parsed.deliverableLinks);
          }
        }
      } catch (e) {
        console.error('Failed to restore draft:', e);
      } finally {
        setHasRestoredDraft(true);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [taskId, hasRestoredDraft]);

  // Auto-save draft on changes
  useEffect(() => {
    if (!taskId || !hasRestoredDraft) return;
    try {
      const draftKey = `sakode_draft_sub_${taskId}`;
      const dataToSave = {
        notes,
        deliverableLinks: deliverableLinks.filter((l) => l.trim().length > 0),
        savedAt: new Date().toISOString(),
      };
      localStorage.setItem(draftKey, JSON.stringify(dataToSave));
    } catch (e) {
      console.error('Failed to save draft:', e);
    }
  }, [taskId, notes, deliverableLinks, hasRestoredDraft]);

  // Manage Link Inputs
  const handleAddLink = () => {
    if (deliverableLinks.length < 5) {
      setDeliverableLinks([...deliverableLinks, '']);
    }
  };

  const handleUpdateLink = (index: number, val: string) => {
    const copy = [...deliverableLinks];
    copy[index] = val;
    setDeliverableLinks(copy);
  };

  const handleRemoveLink = (index: number) => {
    if (deliverableLinks.length === 1) {
      setDeliverableLinks(['']);
      return;
    }
    setDeliverableLinks(deliverableLinks.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !task) return;

    setErrorMsg(null);
    setSuccessMsg(null);

    // Filter valid URLs
    const cleanLinks = deliverableLinks
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (cleanLinks.length === 0) {
      setErrorMsg('Wajib menyertakan minimal 1 tautan hasil pekerjaan (misal: GitHub repo, staging URL).');
      return;
    }

    if (notes.trim().length < 15) {
      setErrorMsg('Catatan hasil pekerjaan minimal 15 karakter.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitTaskWorkAction(user.id, {
        taskId: task.id,
        notes: notes.trim(),
        deliverableLinks: cleanLinks,
        evidenceFiles,
      });

      if (res.success) {
        setSuccessMsg('Hasil pekerjaan berhasil dikirim! Menunggu peninjauan admin.');
        // Clear local storage draft
        localStorage.removeItem(`sakode_draft_sub_${task.id}`);
        setTimeout(() => {
          router.push(`/member/tasks/${task.id}`);
        }, 1500);
      } else {
        setErrorMsg(res.error || 'Gagal mengirimkan deliverable.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-cyan" />
        <p className="text-xs text-sakode-text-muted mt-2 font-medium">Memuat data task...</p>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-sakode-text mt-3">Task Tidak Ditemukan</h2>
        <Link href="/member/tasks" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Kembali ke Daftar Task</Button>
        </Link>
      </div>
    );
  }

  // Authorization Checks
  const isSolo = task.mode === TASK_MODES.SOLO;
  const isAuthorizedAssignee = isSolo
    ? task.assignedUserId === user?.id
    : team?.teamLeadUserId === user?.id;

  const isEligibleStatus =
    task.status === TASK_STATUS.ACTIVE || task.status === TASK_STATUS.REVISION;

  // Zero-Cron Expiration Check
  const deadlineDate = task.deadlineAt
    ? typeof (task.deadlineAt as { toDate?: () => Date }).toDate === 'function'
      ? (task.deadlineAt as { toDate: () => Date }).toDate()
      : new Date(task.deadlineAt as unknown as string)
    : null;
  const isExpired = deadlineDate ? new Date() > deadlineDate : false;

  return (
    <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href={`/member/tasks/${task.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sakode-text-muted hover:text-sakode-text transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Detail Task</span>
          </Link>

          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 font-medium">
            <Save className="h-3 w-3 text-slate-400" />
            <span>Draft tersimpan otomatis</span>
          </span>
        </div>

        {/* Task Header Summary Card */}
        <Card className="p-4 sm:p-5 border-l-4 border-l-sakode-cyan">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isSolo ? 'cyan' : 'purple'}>
                  {isSolo ? 'Solo Task' : 'Team Task'}
                </Badge>
                <StatusPill status={task.status} size="sm" />
                {task.status === TASK_STATUS.REVISION && (
                  <Badge variant="orange">Revisi Diminta</Badge>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-black text-sakode-text">{task.title}</h1>
              <p className="text-xs text-sakode-text-muted">
                Bounty Reward: <strong className="text-sakode-text">{formatCurrencyIDR(task.totalReward)}</strong>
              </p>
            </div>

            {/* Countdown Timer */}
            <div className="shrink-0 bg-slate-50 p-3 rounded-lg border border-slate-200 text-right sm:min-w-[170px]">
              <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 justify-end mb-1">
                <Clock className="h-3 w-3 text-slate-400" />
                <span>Sisa Waktu:</span>
              </div>
              <CountdownTimer deadline={task.deadlineAt} />
            </div>
          </div>
        </Card>

        {/* Access Warning if not authorized */}
        {!isAuthorizedAssignee ? (
          <div className="p-5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="h-5 w-5 text-rose-600" />
              <span>Akses Ditolak</span>
            </div>
            <p className="text-xs leading-relaxed">
              {isSolo
                ? 'Hanya anggota yang resmi ditugaskan pada task ini yang berhak mengirimkan hasil pekerjaan.'
                : 'Hanya Team Lead dari tim yang ditugaskan yang berwenang menyerahkan hasil pekerjaan tim.'}
            </p>
            <Link href={`/member/tasks/${task.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-2xs"
              >
                Kembali ke Ringkasan
              </Button>
            </Link>
          </div>
        ) : !isEligibleStatus ? (
          <div className="p-5 rounded-xl border border-amber-200 bg-amber-50 text-amber-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span>Status Task Belum Memenuhi Syarat</span>
            </div>
            <p className="text-xs leading-relaxed">
              Pengiriman deliverable hanya dapat dilakukan saat task berstatus <strong>ACTIVE</strong> atau{' '}
              <strong>REVISION</strong>. Saat ini status task adalah <strong>{task.status}</strong>.
            </p>
          </div>
        ) : isExpired ? (
          <div className="p-5 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Clock className="h-5 w-5 text-rose-600" />
              <span>Batas Waktu Telah Berakhir (Zero-Cron)</span>
            </div>
            <p className="text-xs leading-relaxed">
              Waktu pengerjaan untuk task ini telah terlampaui ({formatDateWIB(task.deadlineAt)}).
              Sesuai aturan Zero-Cron, sistem secara otomatis menolak pengiriman baru. Hubungi Admin jika Anda memerlukan perpanjangan waktu.
            </p>
          </div>
        ) : (
          /* Main Submission Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Feedback Banners */}
            {errorMsg && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
                <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900">
                  ×
                </button>
              </div>
            )}

            {successMsg && (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              </div>
            )}

            {/* Section 1: Deliverable Notes */}
            <Card className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                  Catatan Deliverable & Ringkasan Pengerjaan <span className="text-rose-500">*</span>
                </label>
                <p className="text-[11px] text-sakode-text-muted mb-2">
                  Jelaskan fitur apa saja yang telah diselesaikan, cara pengujian, dan instruksi penting untuk Admin penilai (minimal 15 karakter).
                </p>
                <textarea
                  required
                  rows={5}
                  minLength={15}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Kami telah menyelesaikan seluruh kriteria penerimaan. Fitur otentikasi telah teruji dengan unit test (coverage 90%), dan live demo dapat diakses pada link di bawah..."
                  className="w-full text-xs sm:text-sm p-3 rounded-lg border border-sakode-border bg-white focus:outline-none focus:ring-1 focus:ring-sakode-cyan leading-relaxed"
                />
                <div className="text-right text-[10px] text-slate-400 mt-1">
                  {notes.length} karakter (min. 15)
                </div>
              </div>
            </Card>

            {/* Section 2: Deliverable Links */}
            <Card className="p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-0.5">
                    Tautan Hasil Pekerjaan (Deliverable Links) <span className="text-rose-500">*</span>
                  </label>
                  <p className="text-[11px] text-sakode-text-muted">
                    Sertakan tautan repository Git, live staging deployment, atau demo video drive publik (min. 1 tautan).
                  </p>
                </div>

                {deliverableLinks.length < 5 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddLink}
                    className="text-xs gap-1 font-bold h-8"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Tambah Link</span>
                  </Button>
                )}
              </div>

              <div className="space-y-2 pt-2">
                {deliverableLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="url"
                        required={idx === 0}
                        placeholder={
                          idx === 0
                            ? 'https://github.com/username/project-repo'
                            : 'https://staging.sakode.id/demo'
                        }
                        value={link}
                        onChange={(e) => handleUpdateLink(idx, e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-sakode-border bg-white focus:outline-none focus:ring-1 focus:ring-sakode-cyan"
                      />
                    </div>
                    {deliverableLinks.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Hapus tautan ini"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Section 3: Evidence Files Dropzone */}
            <Card className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-0.5">
                  Berkas Bukti Pekerjaan (Evidence Files)
                </label>
                <p className="text-[11px] text-sakode-text-muted mb-3">
                  Unggah tangkapan layar antarmuka, laporan uji coba, atau dokumen arsitektur dalam format JPG, PNG, WebP, atau PDF (maks. 5 berkas, maks. 10 MB per berkas).
                </p>
              </div>

              <FileUploadDropzone
                taskId={task.id}
                files={evidenceFiles}
                onFilesChange={setEvidenceFiles}
                disabled={isSubmitting}
              />
            </Card>

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Link href={`/member/tasks/${task.id}`} className="w-full sm:w-auto">
                <Button variant="ghost" size="sm" type="button" className="w-full sm:w-auto text-xs">
                  Batal
                </Button>
              </Link>

              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || isExpired}
                className="w-full sm:w-auto font-bold gap-2 px-6 h-11 shadow-sm"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>Kirim Hasil Pekerjaan</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function TaskSubmitPage() {
  return (
    <AuthGuard>
      <React.Suspense
        fallback={
          <div className="py-24 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-cyan" />
            <p className="text-xs text-sakode-text-muted mt-2">Menyiapkan form submission...</p>
          </div>
        }
      >
        <TaskSubmitInner />
      </React.Suspense>
    </AuthGuard>
  );
}
