'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateWIB } from '@/lib/utils';
import { getReportsQueueAction } from '@/server/actions/report.actions';
import { ViewModeToggle, type ViewMode } from '@/components/ui/ViewModeToggle';
import type { ReportDocument } from '@/types/database';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Eye,
  User,
} from 'lucide-react';

export default function AdminReportsPage() {
  const { user } = useAuth();

  const [reports, setReports] = useState<ReportDocument[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sakode_admin_reports_view_mode') as ViewMode | null;
      if (saved === 'grid' || saved === 'list' || saved === 'table') return saved;
    }
    return 'list';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getReportsQueueAction(user.id);
      if (res.success && res.reports) {
        setReports(res.reports);
      } else {
        setErrorMsg(res.error || 'Gagal memuat antrean laporan sengketa.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memuat data laporan.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReports();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadReports]);

  // Filtered reports
  const filteredReports = reports.filter((r) => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  // KPI Metrics
  const pendingCount = reports.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'
  ).length;
  const escalatedCount = reports.filter((r) => r.escalatedToSuperAdmin).length;
  const resolvedCount = reports.filter((r) => r.status === 'RESOLVED').length;

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070C14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                  <AlertTriangle className="h-3 w-3" />
                  <span>Kepatuhan & Integritas</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                {user?.isSuperAdmin ? (
                  <span className="text-xs bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 font-bold px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                    Mode Super Admin
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Anti-Konflik Kepentingan Dilindungi
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Antrean Laporan & Sengketa SAKODE
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Investigasi kronologi sengketa, penegakan anti-konflik kepentingan, dan penjatuhan sanksi penalti progresif secara adil.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadReports}
              disabled={isLoading}
              className="text-xs font-bold gap-1.5 self-start sm:self-auto border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Antrean</span>
            </Button>
          </div>

          {/* Feedback */}
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

          {/* Anti-Conflict Notice */}
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/70 text-purple-950 dark:text-purple-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-purple-600 dark:text-purple-400 shrink-0" />
              <div>
                <strong className="block text-slate-900 dark:text-white font-bold">
                  Protokol Anti-Konflik Kepentingan &amp; Eskalasi Otomatis
                </strong>
                <span className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {user?.isSuperAdmin
                    ? 'Sebagai Super Admin, Anda memiliki hak penuh untuk meninjau dan menyelesaikan seluruh laporan termasuk yang melibatkan staf Admin.'
                    : 'Laporan yang melibatkan diri Anda disaring secara otomatis dari antrean Anda dan dialihkan ke Super Admin.'}
                </span>
              </div>
            </div>

            {user?.isSuperAdmin && (
              <Link href="/admin/roles">
                <Button variant="team" size="sm" className="text-xs font-bold shrink-0">
                  Kelola Role Admin
                </Button>
              </Link>
            )}
          </div>

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 border-l-4 border-l-amber-500 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Menunggu Investigasi
                </span>
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-amber-800 dark:text-amber-300 font-mono">{pendingCount}</div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Perlu ditinjau bukti dan kronologinya
                </span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-purple-500 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Eskalasi Super Admin
                </span>
                <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-purple-800 dark:text-purple-300 font-mono">{escalatedCount}</div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Kasus sengketa mencatut staf Admin
                </span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-emerald-500 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-2xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Telah Diselesaikan
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-emerald-800 dark:text-emerald-300 font-mono">{resolvedCount}</div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Sanksi &amp; resolusi resmi diberlakukan
                </span>
              </div>
            </Card>
          </div>

          {/* Status Filter Tabs & View Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'ALL', label: 'Semua Status' },
                { id: 'SUBMITTED', label: 'Baru Masuk' },
                { id: 'UNDER_REVIEW', label: 'Dalam Investigasi' },
                { id: 'NEED_MORE_EVIDENCE', label: 'Butuh Bukti Tambahan' },
                { id: 'RESOLVED', label: 'Diselesaikan' },
                { id: 'REJECTED', label: 'Ditolak' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                    filterStatus === tab.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="shrink-0 flex items-center gap-2">
              <ViewModeToggle
                currentMode={viewMode}
                onChange={setViewMode}
                storageKey="sakode_admin_reports_view_mode"
              />
            </div>
          </div>

          {/* Reports List */}
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-amber-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                Memuat antrean investigasi sengketa...
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="p-12 text-center bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 rounded-2xl">
              <AlertTriangle className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Tidak Ada Laporan yang Cocok
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tidak ada laporan sengketa aktif dalam kategori filter yang dipilih.
              </p>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredReports.map((report) => (
                <Card
                  key={report.id}
                  className="p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all rounded-2xl shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="orange">{report.targetType}</Badge>
                      {report.escalatedToSuperAdmin && (
                        <Badge variant="purple" leftIcon={<ShieldAlert className="h-3 w-3" />}>
                          Super Admin
                        </Badge>
                      )}
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                          report.status === 'RESOLVED'
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : report.status === 'REJECTED'
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            : report.status === 'NEED_MORE_EVIDENCE'
                            ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                        }`}
                      >
                        {report.status}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 ml-auto font-mono">
                        {formatDateWIB(report.createdAt)}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1">
                        {report.category}
                      </h3>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3 leading-relaxed mt-1">
                        {report.chronology}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          Pelapor: <strong className="text-slate-900 dark:text-white">{report.reporterDisplayName}</strong>
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        <span className="truncate">Target: {report.targetTitle || report.targetId}</span>
                        <span>{report.evidenceFiles?.length || 0} bukti</span>
                      </div>
                    </div>

                    <Link href={`/admin/reports/${report.id}`} className="block">
                      <Button variant="outline" size="sm" className="w-full font-bold text-xs gap-1.5 justify-center">
                        <Eye className="h-3.5 w-3.5 text-amber-500" />
                        <span>Investigasi Kasus</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          ) : viewMode === 'table' ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/90 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Kategori & Sasaran</th>
                      <th className="p-3.5">Pelapor</th>
                      <th className="p-3.5">Kronologi</th>
                      <th className="p-3.5">Status & Eskalasi</th>
                      <th className="p-3.5">Tanggal</th>
                      <th className="p-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredReports.map((report) => (
                      <tr key={report.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Badge variant="orange">{report.targetType}</Badge>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                {report.category}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                Target: {report.targetTitle || report.targetId.slice(0, 10)}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">
                            {report.reporterDisplayName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {report.reporterEmail}
                          </span>
                        </td>
                        <td className="p-3.5 max-w-xs">
                          <p className="truncate text-slate-600 dark:text-slate-400 text-xs">
                            {report.chronology}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {report.evidenceFiles?.length || 0} berkas bukti
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                report.status === 'RESOLVED'
                                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                  : report.status === 'REJECTED'
                                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  : report.status === 'NEED_MORE_EVIDENCE'
                                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                  : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                              }`}
                            >
                              {report.status}
                            </span>
                            {report.escalatedToSuperAdmin && (
                              <span className="text-[9px] font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                                Super Admin
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-[11px] font-mono text-slate-400">
                          {formatDateWIB(report.createdAt)}
                        </td>
                        <td className="p-3.5 whitespace-nowrap text-right">
                          <Link href={`/admin/reports/${report.id}`}>
                            <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5">
                              <Eye className="h-3.5 w-3.5 text-amber-500" />
                              <span>Investigasi</span>
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                return (
                  <Card
                    key={report.id}
                    className="p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-amber-500/40 dark:hover:border-amber-500/40 transition-all rounded-2xl shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="orange">{report.targetType}</Badge>
                          {report.escalatedToSuperAdmin && (
                            <Badge variant="purple" leftIcon={<ShieldAlert className="h-3 w-3" />}>
                              Eskalasi Super Admin
                            </Badge>
                          )}
                          <span
                            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                              report.status === 'RESOLVED'
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                : report.status === 'REJECTED'
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                : report.status === 'NEED_MORE_EVIDENCE'
                                ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            }`}
                          >
                            {report.status}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            {formatDateWIB(report.createdAt)}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-slate-900 dark:text-white">
                          {report.category}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {report.chronology}
                        </p>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <Link href={`/admin/reports/${report.id}`}>
                          <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-amber-500" />
                            <span>Investigasi Kasus</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Pelapor: <strong className="text-slate-900 dark:text-white">{report.reporterDisplayName}</strong> ({report.reporterEmail})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <span>Target: {report.targetTitle || report.targetId}</span>
                        <span>•</span>
                        <span>{report.evidenceFiles?.length || 0} berkas bukti</span>
                      </div>
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
