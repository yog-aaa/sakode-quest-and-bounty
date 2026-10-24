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
import { formatCurrencyIDR, formatDateWIB } from '@/lib/utils';
import {
  getSubmissionDetailAction,
  acquireReviewLockAction,
  releaseReviewLockAction,
  reviewSubmissionAction,
} from '@/server/actions/submission.actions';
import type { SubmissionDocument, TaskDocument } from '@/types/database';
import { SUBMISSION_STATUS } from '@/lib/constants';
import {
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Loader2,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  RotateCcw,
  Calendar,
  XCircle,
  X,
} from 'lucide-react';

function SubmissionDetailInner() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<SubmissionDocument | null>(null);
  const [task, setTask] = useState<TaskDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Review Lock State
  const [isLockedByMe, setIsLockedByMe] = useState(false);
  const [isLockedByOther, setIsLockedByOther] = useState(false);
  const [lockedByAdminName, setLockedByAdminName] = useState<string | null>(null);
  const [lockExpiresAt, setLockExpiresAt] = useState<Date | null>(null);
  const [lockRemainingSeconds, setLockRemainingSeconds] = useState<number | null>(null);

  // Modal Decision State
  const [activeModal, setActiveModal] = useState<
    'APPROVE' | 'REVISION' | 'EXTEND' | 'REJECT' | null
  >(null);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [revisionDeadline, setRevisionDeadline] = useState('');
  const [extensionDays, setExtensionDays] = useState(3);
  const [extensionReason, setExtensionReason] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Preview Image Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Load Submission & Acquire Lock
  const loadData = useCallback(async () => {
    if (!submissionId || !user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getSubmissionDetailAction(submissionId);
      if (res.success && res.submission && res.task) {
        setSubmission(res.submission);
        setTask(res.task);

        // Attempt to acquire review lock
        const lockRes = await acquireReviewLockAction(user.id, submissionId);
        if (lockRes.success) {
          if (lockRes.locked) {
            setIsLockedByMe(true);
            setIsLockedByOther(false);
            if (lockRes.expiresAt) {
              setLockExpiresAt(new Date(lockRes.expiresAt));
            }
          } else if (lockRes.lockedByOther) {
            setIsLockedByMe(false);
            setIsLockedByOther(true);
            setLockedByAdminName(lockRes.lockedByAdminName || 'Admin Lain');
            if (lockRes.expiresAt) {
              setLockExpiresAt(new Date(lockRes.expiresAt));
            }
          }
        }
      } else {
        setErrorMsg(res.error || 'Gagal memuat detail submission.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  }, [submissionId, user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Release Lock on Unload
  useEffect(() => {
    return () => {
      if (user && submissionId && isLockedByMe) {
        releaseReviewLockAction(user.id, submissionId);
      }
    };
  }, [user, submissionId, isLockedByMe]);

  // Countdown Interval for Review Lock
  useEffect(() => {
    if (!lockExpiresAt) return;

    const interval = setInterval(() => {
      const remainingMs = lockExpiresAt.getTime() - Date.now();
      if (remainingMs <= 0) {
        setLockRemainingSeconds(0);
        setIsLockedByMe(false);
        clearInterval(interval);
      } else {
        setLockRemainingSeconds(Math.floor(remainingMs / 1000));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lockExpiresAt]);

  const formatLockTimer = (seconds: number | null): string => {
    if (seconds === null) return '15:00';
    if (seconds <= 0) return 'Kedaluwarsa';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Execute Review Actions
  const handleExecuteReview = async (action: 'APPROVE' | 'REQUEST_REVISION' | 'EXTEND_DEADLINE' | 'REJECT') => {
    if (!user || !submission) return;
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await reviewSubmissionAction(user.id, {
        submissionId: submission.id,
        action,
        revisionNotes: action === 'REQUEST_REVISION' ? revisionNotes.trim() : undefined,
        revisionDeadline: action === 'REQUEST_REVISION' && revisionDeadline ? revisionDeadline : undefined,
        extensionDays: action === 'EXTEND_DEADLINE' ? extensionDays : undefined,
        reason:
          action === 'EXTEND_DEADLINE'
            ? extensionReason.trim()
            : action === 'REJECT'
            ? rejectReason.trim()
            : undefined,
      });

      if (res.success && res.submission && res.task) {
        setSubmission(res.submission);
        setTask(res.task);
        setActiveModal(null);
        setIsLockedByMe(false);

        const actionText =
          action === 'APPROVE'
            ? 'Submission disetujui!'
            : action === 'REQUEST_REVISION'
            ? 'Permintaan revisi telah dikirim ke member.'
            : action === 'EXTEND_DEADLINE'
            ? 'Batas waktu pengerjaan task berhasil diperpanjang.'
            : 'Submission ditolak.';
        setSuccessMsg(actionText);

        setTimeout(() => {
          router.push('/admin/submissions');
        }, 1800);
      } else {
        setErrorMsg(res.error || 'Gagal memproses evaluasi.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memproses evaluasi submission.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-cyan" />
        <p className="text-xs text-sakode-text-muted mt-2 font-medium">Memuat data deliverable...</p>
      </div>
    );
  }

  if (!submission || !task) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
        <h2 className="text-base font-bold text-sakode-text mt-3">Data Submission Tidak Ditemukan</h2>
        <Link href="/admin/submissions" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Kembali ke Antrean</Button>
        </Link>
      </div>
    );
  }

  const isPending =
    submission.status === SUBMISSION_STATUS.SUBMITTED ||
    submission.status === SUBMISSION_STATUS.IN_REVIEW;

  return (
    <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/admin/submissions"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-sakode-text-muted hover:text-sakode-text transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Antrean Evaluasi</span>
          </Link>

          <span className="text-xs text-sakode-text-muted">
            Submission ID: <span className="font-mono">{submission.id.slice(0, 8)}...</span>
          </span>
        </div>

        {/* Review Lock Banner */}
        {isLockedByOther ? (
          <div className="p-4 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 flex items-start gap-3">
            <Lock className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs">
              <h4 className="font-bold text-sm">
                Sedang Ditinjau oleh {lockedByAdminName || 'Admin Lain'}
              </h4>
              <p className="leading-relaxed">
                Kunci evaluasi sementara sedang dipegang oleh admin lain (sisa waktu:{' '}
                <strong>{formatLockTimer(lockRemainingSeconds)}</strong>). Seluruh tombol aksi dinonaktifkan untuk mencegah tabrakan keputusan.
              </p>
            </div>
          </div>
        ) : isLockedByMe && isPending ? (
          <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Unlock className="h-5 w-5 text-emerald-700 shrink-0" />
              <div>
                <h4 className="font-bold text-xs sm:text-sm">
                  Kunci Evaluasi Aktif Anda (Sisa: {formatLockTimer(lockRemainingSeconds)})
                </h4>
                <p className="text-[11px] text-emerald-800">
                  Kunci sementara 15 menit mencegah admin lain mengevaluasi submission ini bersamaan.
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (user) {
                  await releaseReviewLockAction(user.id, submission.id);
                  router.push('/admin/submissions');
                }
              }}
              className="text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100/50 shrink-0"
            >
              Lepas Kunci & Kembali
            </Button>
          </div>
        ) : null}

        {/* Feedback Banners */}
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
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Task & Submitter Overview */}
        <Card className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-sakode-border pb-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={task.mode === 'SOLO' ? 'cyan' : 'purple'}>
                  {task.mode === 'SOLO' ? 'Solo Task' : 'Team Task'}
                </Badge>
                <Badge variant="outline">Versi {submission.version}</Badge>
                <StatusPill status={submission.status} size="sm" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-sakode-text tracking-tight">
                {task.title}
              </h1>
              <p className="text-xs text-sakode-text-muted">
                Bounty Total: <strong className="text-sakode-text font-bold">{formatCurrencyIDR(task.totalReward)}</strong>
              </p>
            </div>

            <Link href={`/member/tasks/${task.id}`} target="_blank">
              <Button variant="ghost" size="sm" className="text-xs gap-1 text-slate-500">
                <span>Lihat Detail Task Asli</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">Pengirim</span>
              <span className="font-bold text-sakode-text mt-0.5 block">
                {submission.submitterDisplayName || submission.submittedByUserId}
              </span>
              <span className="text-[10px] text-slate-400">{submission.submitterEmail}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">Waktu Kirim</span>
              <span className="font-bold text-slate-700 mt-0.5 block">
                {formatDateWIB(submission.createdAt)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">Batas Waktu Task</span>
              <span className="font-bold text-slate-700 mt-0.5 block">
                {formatDateWIB(task.deadlineAt)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] font-semibold">Evaluator</span>
              <span className="font-bold text-slate-700 mt-0.5 block">
                {submission.reviewedByAdminId ? 'Selesai dievaluasi' : isLockedByMe ? 'Anda (Sedang Menilai)' : 'Belum selesai'}
              </span>
            </div>
          </div>
        </Card>

        {/* Section 1: Deliverable Notes */}
        <Card className="p-5 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sakode-text-muted">
            Catatan Deliverable & Laporan Hasil
          </h3>
          <div className="p-4 rounded-lg bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-800 whitespace-pre-line leading-relaxed">
            {submission.notes}
          </div>
        </Card>

        {/* Section 2: Deliverable Links */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sakode-text-muted">
            Tautan Hasil Pekerjaan ({submission.deliverableLinks?.length || 0})
          </h3>
          <div className="space-y-2">
            {submission.deliverableLinks?.map((link, idx) => (
              <a
                key={idx}
                href={link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-lg border border-sakode-border bg-white hover:border-sky-300 hover:bg-sky-50/30 transition-colors group"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-7 h-7 rounded bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-sakode-text group-hover:text-sky-600 transition-colors truncate">
                    {link}
                  </span>
                </div>
                <span className="text-[11px] text-sky-600 font-bold shrink-0">Buka Tautan ↗</span>
              </a>
            ))}
          </div>
        </Card>

        {/* Section 3: Evidence Files Gallery */}
        <Card className="p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-sakode-text-muted">
            Berkas Bukti Pekerjaan ({submission.evidenceFiles?.length || 0})
          </h3>

          {!submission.evidenceFiles || submission.evidenceFiles.length === 0 ? (
            <p className="text-xs text-sakode-text-muted py-4 text-center">
              Tidak ada berkas bukti yang dilampirkan.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {submission.evidenceFiles.map((file) => {
                const isPdf =
                  file.fileName.toLowerCase().endsWith('.pdf') ||
                  file.fileType.toLowerCase().includes('pdf');

                return (
                  <div
                    key={file.publicId}
                    className="p-3 rounded-lg border border-sakode-border bg-white space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center shrink-0">
                        {isPdf ? (
                          <FileText className="h-4 w-4 text-rose-500" />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-sky-500" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-sakode-text truncate" title={file.fileName}>
                          {file.fileName}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {isPdf ? 'Dokumen PDF' : 'Tangkapan Layar'}
                        </p>
                      </div>
                    </div>

                    {!isPdf ? (
                      <div
                        onClick={() => setPreviewImage(file.url)}
                        className="relative h-28 w-full bg-slate-100 rounded overflow-hidden cursor-pointer group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={file.url}
                          alt={file.fileName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-bold transition-opacity">
                          Klik untuk Perbesar
                        </div>
                      </div>
                    ) : (
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 rounded bg-slate-50 hover:bg-slate-100 text-center block text-xs font-semibold text-rose-600 transition-colors"
                      >
                        Lihat Dokumen PDF ↗
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Section 4: Admin Decision Panel */}
        {isPending && (
          <Card className="p-5 border-t-4 border-t-sakode-cyan space-y-4">
            <div>
              <h3 className="text-sm font-black text-sakode-text">Keputusan Evaluasi Admin</h3>
              <p className="text-xs text-sakode-text-muted mt-0.5">
                Pilih salah satu dari 4 tindakan evaluasi resmi SAKODE Academy. Keputusan dicatat permanen di audit trail.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* Approve */}
              <Button
                variant="primary"
                disabled={isLockedByOther || isProcessing}
                onClick={() => setActiveModal('APPROVE')}
                className="font-bold text-xs gap-1.5 h-11 bg-emerald-600 hover:bg-emerald-700 border-emerald-600 text-white shadow-xs"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Setujui Hasil</span>
              </Button>

              {/* Request Revision */}
              <Button
                variant="outline"
                disabled={isLockedByOther || isProcessing}
                onClick={() => setActiveModal('REVISION')}
                className="font-bold text-xs gap-1.5 h-11 text-amber-800 border-amber-300 hover:bg-amber-50"
              >
                <RotateCcw className="h-4 w-4 text-amber-600" />
                <span>Minta Revisi</span>
              </Button>

              {/* Extend Deadline */}
              <Button
                variant="outline"
                disabled={isLockedByOther || isProcessing}
                onClick={() => setActiveModal('EXTEND')}
                className="font-bold text-xs gap-1.5 h-11 text-sky-800 border-sky-300 hover:bg-sky-50"
              >
                <Calendar className="h-4 w-4 text-sky-600" />
                <span>Perpanjang Waktu</span>
              </Button>

              {/* Reject */}
              <Button
                variant="outline"
                disabled={isLockedByOther || isProcessing}
                onClick={() => setActiveModal('REJECT')}
                className="font-bold text-xs gap-1.5 h-11 text-rose-700 border-rose-300 hover:bg-rose-50"
              >
                <XCircle className="h-4 w-4 text-rose-600" />
                <span>Tolak Hasil</span>
              </Button>
            </div>
          </Card>
        )}

        {/* Modal: Approve Confirmation */}
        {activeModal === 'APPROVE' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-md p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-sakode-text">Setujui Hasil Pekerjaan</h3>
                  <p className="text-xs text-sakode-text-muted">Konfirmasi evaluasi deliverable</p>
                </div>
              </div>

              <p className="text-xs text-slate-700 leading-relaxed">
                Apakah Anda yakin ingin menyetujui submission ini? Status task akan diperbarui menjadi <strong>APPROVED</strong> dan membuka hak pencairan reward bagi member.
              </p>

              <div className="flex justify-end gap-2 pt-2 border-t border-sakode-border">
                <Button variant="ghost" size="sm" onClick={() => setActiveModal(null)} disabled={isProcessing} className="text-xs">
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isProcessing}
                  onClick={() => handleExecuteReview('APPROVE')}
                  className="bg-emerald-600 hover:bg-emerald-700 font-bold text-xs gap-1.5"
                >
                  {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>Ya, Setujui Sekarang</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Request Revision */}
        {activeModal === 'REVISION' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-sakode-border pb-3">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-amber-600" />
                  <h3 className="text-base font-bold text-sakode-text">Minta Perbaikan / Revisi</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catatan Perbaikan (Wajib, minimal 10 karakter)
                  </label>
                  <textarea
                    rows={4}
                    required
                    minLength={10}
                    value={revisionNotes}
                    onChange={(e) => setRevisionNotes(e.target.value)}
                    placeholder="Sebutkan bagian atau kriteria yang belum terpenuhi dan apa yang perlu diperbaiki..."
                    className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Batas Waktu Revisi Baru (Opsional)
                  </label>
                  <input
                    type="datetime-local"
                    value={revisionDeadline}
                    onChange={(e) => setRevisionDeadline(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sakode-border">
                <Button variant="ghost" size="sm" onClick={() => setActiveModal(null)} disabled={isProcessing} className="text-xs">
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isProcessing || revisionNotes.trim().length < 10}
                  onClick={() => handleExecuteReview('REQUEST_REVISION')}
                  className="bg-amber-600 hover:bg-amber-700 font-bold text-xs gap-1.5"
                >
                  {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                  <span>Kirim Permintaan Revisi</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Extend Deadline */}
        {activeModal === 'EXTEND' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-sakode-border pb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-sky-600" />
                  <h3 className="text-base font-bold text-sakode-text">Beri Perpanjangan Waktu Task</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tambahan Hari (1 - 30 Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={extensionDays}
                    onChange={(e) => setExtensionDays(parseInt(e.target.value) || 1)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Alasan Perpanjangan (Audit Trail, minimal 10 karakter)
                  </label>
                  <textarea
                    rows={3}
                    required
                    minLength={10}
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    placeholder="Contoh: Mengakomodasi kendala integrasi API eksternal yang di luar kendali member..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sakode-border">
                <Button variant="ghost" size="sm" onClick={() => setActiveModal(null)} disabled={isProcessing} className="text-xs">
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isProcessing || extensionReason.trim().length < 10 || extensionDays < 1}
                  onClick={() => handleExecuteReview('EXTEND_DEADLINE')}
                  className="bg-sky-600 hover:bg-sky-700 font-bold text-xs gap-1.5"
                >
                  {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calendar className="h-3.5 w-3.5" />}
                  <span>Terapkan Perpanjangan</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Reject Confirmation */}
        {activeModal === 'REJECT' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-rose-200 w-full max-w-lg p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-sakode-border pb-3">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-rose-600" />
                  <h3 className="text-base font-bold text-rose-900">Tolak Hasil Pekerjaan</h3>
                </div>
                <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
                <strong>Perhatian:</strong> Penolakan submission akan menggagalkan task ini (status <strong>FAILED</strong>). Member akan mendapatkan hak mengajukan sanggah (appeal).
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alasan Penolakan (Wajib, minimal 10 karakter)
                </label>
                <textarea
                  rows={4}
                  required
                  minLength={10}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Jelaskan secara transparan mengapa hasil pekerjaan tidak dapat diterima..."
                  className="w-full text-xs p-3 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sakode-border">
                <Button variant="ghost" size="sm" onClick={() => setActiveModal(null)} disabled={isProcessing} className="text-xs">
                  Batal
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isProcessing || rejectReason.trim().length < 10}
                  onClick={() => handleExecuteReview('REJECT')}
                  className="bg-rose-600 hover:bg-rose-700 font-bold text-xs gap-1.5"
                >
                  {isProcessing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
                  <span>Tolak Hasil Sekarang</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Fullscreen Image Preview */}
        {previewImage && (
          <div
            onClick={() => setPreviewImage(null)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 cursor-zoom-out"
          >
            <div className="relative max-w-4xl max-h-[90vh] overflow-hidden rounded-xl bg-black">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewImage} alt="Preview Bukti" className="w-full h-auto object-contain max-h-[85vh]" />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SubmissionDetailPage() {
  return (
    <AuthGuard requireAdmin>
      <React.Suspense
        fallback={
          <div className="py-24 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-cyan" />
            <p className="text-xs text-sakode-text-muted mt-2">Memuat halaman evaluasi deliverable...</p>
          </div>
        }
      >
        <SubmissionDetailInner />
      </React.Suspense>
    </AuthGuard>
  );
}
