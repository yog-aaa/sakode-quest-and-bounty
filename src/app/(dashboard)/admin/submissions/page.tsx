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
import {
  getAllSubmissionsForAdminAction,
  getPendingSubmissionsQueueAction,
} from '@/server/actions/submission.actions';
import type { SubmissionDocument } from '@/types/database';
import { SUBMISSION_STATUS } from '@/lib/constants';
import {
  ClipboardCheck,
  Search,
  Clock,
  Shield,
  Lock,
  Unlock,
  AlertCircle,
  Loader2,
  ChevronRight,
  Layers,
} from 'lucide-react';

export default function AdminSubmissionsQueuePage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'PENDING' | 'ALL' | 'APPROVED' | 'REVISION' | 'REJECTED'>(
    'PENDING'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const loadSubmissions = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (filterTab === 'PENDING') {
        const res = await getPendingSubmissionsQueueAction();
        if (res.success && res.submissions) {
          setSubmissions(res.submissions);
        } else {
          setErrorMsg(res.error || 'Gagal memuat antrean submission.');
        }
      } else {
        const res = await getAllSubmissionsForAdminAction();
        if (res.success && res.submissions) {
          setSubmissions(res.submissions);
        } else {
          setErrorMsg(res.error || 'Gagal memuat daftar submission.');
        }
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsLoading(false);
    }
  }, [filterTab]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadSubmissions();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadSubmissions]);

  // Client-side filtering
  const filteredSubmissions = submissions.filter((sub) => {
    // Tab filtering (if not PENDING or ALL)
    if (filterTab === 'APPROVED' && sub.status !== SUBMISSION_STATUS.APPROVED) return false;
    if (filterTab === 'REVISION' && sub.status !== SUBMISSION_STATUS.REVISION_REQUESTED) return false;
    if (filterTab === 'REJECTED' && sub.status !== SUBMISSION_STATUS.REJECTED) return false;

    // Search query
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const matchTask = sub.taskTitle?.toLowerCase().includes(q) || false;
    const matchUser =
      sub.submitterDisplayName?.toLowerCase().includes(q) ||
      sub.submitterEmail?.toLowerCase().includes(q) ||
      false;
    const matchNotes = sub.notes.toLowerCase().includes(q);

    return matchTask || matchUser || matchNotes;
  });

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sakode-border pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="cyan" leftIcon={<Shield className="h-3 w-3" />}>
                  Admin Panel
                </Badge>
                <span className="text-xs text-sakode-text-muted">Sprint 4 • Shared Review Queue</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-sakode-text tracking-tight">
                Antrean Evaluasi Deliverable
              </h1>
              <p className="text-xs sm:text-sm text-sakode-text-muted mt-0.5">
                Review hasil pekerjaan secara terkoordinasi antar 4 admin dengan proteksi Review Locking atomik 15 menit.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/admin/tasks">
                <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 h-10">
                  <Layers className="h-4 w-4 text-sakode-cyan" />
                  <span>Kelola Task</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Filter Bar & Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-sakode-border">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'PENDING', label: 'Antrean Aktif' },
                { id: 'ALL', label: 'Semua Submission' },
                { id: 'APPROVED', label: 'Disetujui' },
                { id: 'REVISION', label: 'Revisi' },
                { id: 'REJECTED', label: 'Ditolak' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as typeof filterTab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterTab === tab.id
                      ? 'bg-sakode-text text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari task, pengirim, atau catatan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-sakode-border focus:outline-none focus:ring-1 focus:ring-sakode-cyan"
              />
            </div>
          </div>

          {/* Submissions List */}
          {isLoading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-cyan" />
              <p className="text-xs text-sakode-text-muted mt-2 font-medium">Memuat antrean evaluasi...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <Card className="py-16 text-center border-dashed">
              <CardContent className="space-y-3">
                <ClipboardCheck className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-sakode-text">Tidak ada submission ditemukan</h3>
                <p className="text-xs text-sakode-text-muted max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ada hasil yang sesuai dengan kata kunci "${searchQuery}".`
                    : filterTab === 'PENDING'
                    ? 'Semua hasil pekerjaan telah selesai dievaluasi! Antrean evaluasi bersih.'
                    : 'Belum ada data pada kategori ini.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredSubmissions.map((sub) => {
                const now = new Date();
                const lockUntil = sub.reviewLockedUntil
                  ? typeof (sub.reviewLockedUntil as { toDate?: () => Date }).toDate === 'function'
                    ? (sub.reviewLockedUntil as { toDate: () => Date }).toDate()
                    : new Date(sub.reviewLockedUntil as unknown as string)
                  : null;

                const isLockActive =
                  sub.reviewLockedByAdminId && lockUntil && lockUntil > now;
                const isLockedBySelf = isLockActive && sub.reviewLockedByAdminId === user?.id;
                const isLockedByOther = isLockActive && sub.reviewLockedByAdminId !== user?.id;

                return (
                  <Card
                    key={sub.id}
                    hoverable
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                      isLockedByOther
                        ? 'border-amber-300 bg-amber-50/20'
                        : isLockedBySelf
                        ? 'border-emerald-300 bg-emerald-50/20 ring-1 ring-emerald-300'
                        : 'border-sakode-border bg-white'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="cyan">Versi {sub.version}</Badge>
                        <StatusPill status={sub.status} size="sm" />

                        {/* Review Lock Indicators */}
                        {isLockedByOther ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Lock className="h-3 w-3 text-amber-700" />
                            <span>Sedang Ditinjau: {sub.reviewerDisplayName || 'Admin Lain'}</span>
                          </span>
                        ) : isLockedBySelf ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Unlock className="h-3 w-3 text-emerald-700" />
                            <span>Kunci Aktif Anda (Sisa 15m)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600">
                            Tersedia untuk Ditinjau
                          </span>
                        )}

                        <span className="text-[11px] font-mono text-slate-400 ml-1">
                          ID: {sub.id.slice(0, 8)}...
                        </span>
                      </div>

                      {/* Task Title */}
                      <Link href={`/admin/submissions/${sub.id}`} className="block group">
                        <h2 className="text-base sm:text-lg font-bold text-sakode-text group-hover:text-sky-600 transition-colors">
                          {sub.taskTitle || 'Task SAKODE'}
                        </h2>
                      </Link>

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-sakode-text-muted">
                        <div>
                          <span>Pengirim: </span>
                          <strong className="text-sakode-text">
                            {sub.submitterDisplayName || sub.submittedByUserId.slice(0, 8)}
                          </strong>
                        </div>
                        {sub.taskTotalReward && (
                          <div>
                            <span>Bounty: </span>
                            <strong className="text-sakode-text">
                              {formatCurrencyIDR(sub.taskTotalReward)}
                            </strong>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Diajukan: {formatDateWIB(sub.createdAt)}</span>
                        </div>
                        <div>
                          <span>Bukti Berkas: </span>
                          <strong className="text-sakode-text">{sub.evidenceFiles?.length || 0} berkas</strong>
                        </div>
                      </div>

                      {/* Brief Notes Snippet */}
                      <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2 rounded border border-slate-200/70">
                        {sub.notes}
                      </p>
                    </div>

                    {/* Action Button on Right */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-sakode-border shrink-0">
                      <Link href={`/admin/submissions/${sub.id}`}>
                        <Button
                          variant={isLockedByOther ? 'outline' : 'primary'}
                          size="sm"
                          className={`font-bold text-xs gap-1.5 h-10 px-4 ${
                            isLockedByOther
                              ? 'text-amber-700 border-amber-300 hover:bg-amber-50'
                              : ''
                          }`}
                        >
                          {isLockedByOther ? (
                            <>
                              <Lock className="h-3.5 w-3.5 text-amber-600" />
                              <span>Lihat Detail (Terkunci)</span>
                            </>
                          ) : isLockedBySelf ? (
                            <>
                              <Unlock className="h-3.5 w-3.5" />
                              <span>Lanjutkan Review</span>
                            </>
                          ) : (
                            <>
                              <ClipboardCheck className="h-3.5 w-3.5" />
                              <span>Mulai Evaluasi</span>
                            </>
                          )}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
