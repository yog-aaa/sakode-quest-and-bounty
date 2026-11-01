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
import { getAppealsQueueAction } from '@/server/actions/appeal.actions';
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
  Scale,
  PieChart,
} from 'lucide-react';
import { ViewModeToggle, type ViewMode } from '@/components/ui/ViewModeToggle';

export default function AdminSubmissionsQueuePage() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<
    'PENDING' | 'APPEALS' | 'ALL' | 'APPROVED' | 'REVISION' | 'REJECTED'
  >('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // View Mode: 'list' | 'grid' | 'table'
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sakode_admin_submissions_view_mode') as ViewMode | null;
      if (saved && (saved === 'grid' || saved === 'list' || saved === 'table')) {
        setViewMode(saved);
      }
    } catch {
      // Ignore
    }
  }, []);

  const loadSubmissions = useCallback(async () => {
    if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
      setIsLoading(false);
      return;
    }
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
      } else if (filterTab === 'APPEALS') {
        const res = await getAppealsQueueAction();
        if (res.success && res.submissions) {
          setSubmissions(res.submissions);
        } else {
          setErrorMsg(res.error || 'Gagal memuat antrean sanggahan.');
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
      <div className="min-h-screen bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                  <ClipboardCheck className="h-3 w-3" />
                  <span>Review & Evaluasi Kerja</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Shared Review Queue (Lock 15 Min)
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Antrean Evaluasi Deliverable
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Review hasil pekerjaan secara terkoordinasi antar staf admin dengan proteksi Review Locking atomik 15 menit.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/admin/tasks">
                <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 h-10 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                  <Layers className="h-4 w-4 text-sky-500" />
                  <span>Kelola Task</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Alert Error */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200 text-xs sm:text-sm flex items-center gap-2 shadow-xs">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Filter Bar & Tabs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              {[
                { id: 'PENDING', label: 'Antrean Aktif' },
                { id: 'APPEALS', label: 'Sanggahan (Appeals)' },
                { id: 'ALL', label: 'Semua Submission' },
                { id: 'APPROVED', label: 'Disetujui' },
                { id: 'REVISION', label: 'Revisi' },
                { id: 'REJECTED', label: 'Ditolak' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as typeof filterTab)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    filterTab === tab.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-750'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-end">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari task, pengirim, atau catatan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <ViewModeToggle
                value={viewMode}
                onChange={setViewMode}
                storageKey="sakode_admin_submissions_view_mode"
              />
            </div>
          </div>

          {/* Submissions List */}
          {isLoading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Memuat antrean evaluasi...</p>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <Card className="py-16 text-center border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 rounded-2xl">
              <CardContent className="space-y-3">
                <ClipboardCheck className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">Tidak ada submission ditemukan</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ada hasil yang sesuai dengan kata kunci "${searchQuery}".`
                    : filterTab === 'PENDING'
                    ? 'Semua hasil pekerjaan telah selesai dievaluasi! Antrean evaluasi bersih.'
                    : 'Belum ada data pada kategori ini.'}
                </p>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            /* =============================================================== */
            /* VIEW MODE A: CARD BESAR (GRID)                                  */
            /* =============================================================== */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    className={`p-5 flex flex-col justify-between space-y-4 rounded-2xl transition-all ${
                      isLockedByOther
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/20'
                        : isLockedBySelf
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-300'
                        : 'border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-2xs hover:shadow-md'
                    }`}
                  >
                    <div className="space-y-3">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 justify-between">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="cyan">Versi {sub.version}</Badge>
                          <StatusPill status={sub.status} size="sm" />
                          {sub.appeal && (
                            <Badge variant="purple" leftIcon={<Scale className="h-3 w-3" />}>
                              Sanggahan
                            </Badge>
                          )}
                          {sub.status === 'PARTIAL' && (
                            <Badge variant="outline" leftIcon={<PieChart className="h-3 w-3 text-blue-600" />}>
                              Partial
                            </Badge>
                          )}
                        </div>

                        {/* Review Lock Indicators */}
                        {isLockedByOther ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Lock className="h-3 w-3 text-amber-700" />
                            <span>Terkunci Admin Lain</span>
                          </span>
                        ) : isLockedBySelf ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Unlock className="h-3 w-3 text-emerald-700" />
                            <span>Kunci Anda (15m)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400">
                            #{sub.id.slice(0, 8)}
                          </span>
                        )}
                      </div>

                      {/* Task Title */}
                      <Link href={`/admin/submissions/${sub.id}`} className="block group">
                        <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2">
                          {sub.taskTitle || 'Task SAKODE'}
                        </h2>
                      </Link>

                      {/* Meta Information */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Pengirim</span>
                          <strong className="text-slate-800 dark:text-slate-200 truncate block">
                            {sub.submitterDisplayName || sub.submittedByUserId.slice(0, 8)}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Bounty Reward</span>
                          <strong className="text-slate-900 dark:text-white font-mono block">
                            {sub.taskTotalReward ? formatCurrencyIDR(sub.taskTotalReward) : '-'}
                          </strong>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Waktu Kirim</span>
                          <span className="text-slate-700 dark:text-slate-300 block text-[11px]">
                            {formatDateWIB(sub.createdAt)}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[10px] uppercase text-slate-400">Lampiran</span>
                          <span className="text-slate-700 dark:text-slate-300 block text-[11px]">
                            {sub.evidenceFiles?.length || 0} berkas bukti
                          </span>
                        </div>
                      </div>

                      {/* Brief Notes */}
                      {sub.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/70 leading-relaxed">
                          {sub.notes}
                        </p>
                      )}
                    </div>

                    {/* Bottom Action */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                      <Link href={`/admin/submissions/${sub.id}`} className="w-full sm:w-auto">
                        <Button
                          variant={isLockedByOther ? 'outline' : 'primary'}
                          size="sm"
                          className="font-bold text-xs gap-1.5 h-9 w-full sm:w-auto cursor-pointer"
                        >
                          {isLockedByOther ? (
                            <>
                              <Lock className="h-3.5 w-3.5 text-amber-600" />
                              <span>Lihat Detail</span>
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
          ) : viewMode === 'list' ? (
            /* =============================================================== */
            /* VIEW MODE B: MEMANJANG (HORIZONTAL LIST)                        */
            /* =============================================================== */
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
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all rounded-2xl ${
                      isLockedByOther
                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/20'
                        : isLockedBySelf
                        ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/20 dark:bg-emerald-950/20 ring-1 ring-emerald-300'
                        : 'border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-2xs'
                    }`}
                  >
                    <div className="space-y-2 flex-1">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="cyan">Versi {sub.version}</Badge>
                        <StatusPill status={sub.status} size="sm" />
                        {sub.appeal && (
                          <Badge variant="purple" leftIcon={<Scale className="h-3 w-3" />}>
                            Sanggahan Aktif
                          </Badge>
                        )}
                        {sub.status === 'PARTIAL' && (
                          <Badge variant="outline" leftIcon={<PieChart className="h-3 w-3 text-blue-600" />}>
                            Partial
                          </Badge>
                        )}

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
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            Tersedia untuk Ditinjau
                          </span>
                        )}

                        <span className="text-[11px] font-mono text-slate-400 ml-1">
                          ID: {sub.id.slice(0, 8)}...
                        </span>
                      </div>

                      {/* Task Title */}
                      <Link href={`/admin/submissions/${sub.id}`} className="block group">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-cyan-400 transition-colors">
                          {sub.taskTitle || 'Task SAKODE'}
                        </h2>
                      </Link>

                      {/* Meta Information */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <div>
                          <span>Pengirim: </span>
                          <strong className="text-slate-800 dark:text-slate-200">
                            {sub.submitterDisplayName || sub.submittedByUserId.slice(0, 8)}
                          </strong>
                        </div>
                        {sub.taskTotalReward && (
                          <div>
                            <span>Bounty: </span>
                            <strong className="text-slate-900 dark:text-white font-mono">
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
                          <strong className="text-slate-800 dark:text-slate-200">{sub.evidenceFiles?.length || 0} berkas</strong>
                        </div>
                      </div>

                      {/* Brief Notes Snippet */}
                      {sub.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl border border-slate-200/70 dark:border-slate-700/70">
                          {sub.notes}
                        </p>
                      )}
                    </div>

                    {/* Action Button on Right */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800 shrink-0">
                      <Link href={`/admin/submissions/${sub.id}`}>
                        <Button
                          variant={isLockedByOther ? 'outline' : 'primary'}
                          size="sm"
                          className={`font-bold text-xs gap-1.5 h-10 px-4 cursor-pointer ${
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
                      <th className="p-3.5">Pengirim</th>
                      <th className="p-3.5">Status &amp; Kunci</th>
                      <th className="p-3.5">Bounty (IDR)</th>
                      <th className="p-3.5">Versi &amp; Berkas</th>
                      <th className="p-3.5">Diajukan</th>
                      <th className="p-3.5 pr-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
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
                        <tr key={sub.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 pl-4 max-w-xs">
                            <Link
                              href={`/admin/submissions/${sub.id}`}
                              className="font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-cyan-400 line-clamp-1 block text-xs"
                            >
                              {sub.taskTitle || 'Task SAKODE'}
                            </Link>
                            <span className="text-[10px] font-mono text-slate-400 block truncate">
                              #{sub.id}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                              {sub.submitterDisplayName || 'Member'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              UID: {sub.submittedByUserId.slice(0, 8)}...
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <StatusPill status={sub.status} size="sm" />
                              {isLockedByOther ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800">
                                  <Lock className="h-2.5 w-2.5" />
                                  <span>Terkunci</span>
                                </span>
                              ) : isLockedBySelf ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                  <Unlock className="h-2.5 w-2.5" />
                                  <span>Kunci Anda</span>
                                </span>
                              ) : null}
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap font-mono font-bold text-slate-900 dark:text-white">
                            {sub.taskTotalReward ? formatCurrencyIDR(sub.taskTotalReward) : '-'}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              v{sub.version}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              {sub.evidenceFiles?.length || 0} berkas bukti
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            {formatDateWIB(sub.createdAt)}
                          </td>
                          <td className="p-3.5 pr-4 text-right whitespace-nowrap">
                            <Link href={`/admin/submissions/${sub.id}`}>
                              <Button
                                variant={isLockedByOther ? 'outline' : 'primary'}
                                size="sm"
                                className="font-bold text-[11px] h-7 px-2.5 gap-1 cursor-pointer"
                              >
                                {isLockedByOther ? (
                                  <>
                                    <Lock className="h-3 w-3 text-amber-600" />
                                    <span>Detail</span>
                                  </>
                                ) : (
                                  <>
                                    <ClipboardCheck className="h-3 w-3" />
                                    <span>Evaluasi</span>
                                  </>
                                )}
                              </Button>
                            </Link>
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
      </div>
    </AuthGuard>
  );
}
