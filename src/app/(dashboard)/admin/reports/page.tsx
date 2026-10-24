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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    if (!user) return;
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
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="orange" leftIcon={<AlertTriangle className="h-3.5 w-3.5" />}>
                  Kepatuhan & Integritas
                </Badge>
                {user?.isSuperAdmin ? (
                  <span className="text-xs bg-sakode-purple/20 text-purple-900 font-bold px-2 py-0.5 rounded">
                    Mode Super Admin
                  </span>
                ) : (
                  <span className="text-xs text-sakode-text-muted">Anti-Konflik Dilindungi</span>
                )}
              </div>
              <h1 className="text-2xl font-black text-sakode-text tracking-tight mt-1">
                Antrean Laporan & Sengketa SAKODE
              </h1>
              <p className="text-xs text-sakode-text-muted">
                Investigasi kronologi sengketa, penegakan anti-konflik kepentingan, dan penjatuhan sanksi penalti progresif.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadReports}
              disabled={isLoading}
              className="text-xs font-bold gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Antrean</span>
            </Button>
          </div>

          {/* Feedback */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
              <button onClick={() => setErrorMsg(null)} className="text-rose-600 hover:text-rose-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Anti-Conflict Notice */}
          <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-sakode-purple shrink-0" />
              <div>
                <strong className="block text-sakode-text font-bold">
                  Protokol Anti-Konflik Kepentingan & Eskalasi Otomatis
                </strong>
                <span className="text-slate-600 text-[11px] leading-relaxed">
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
            <Card className="p-5 border-l-4 border-l-amber-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sakode-text-muted uppercase tracking-wider">
                  Menunggu Investigasi
                </span>
                <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-amber-950">{pendingCount}</div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Perlu ditinjau bukti dan kronologinya
                </span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-sakode-purple bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sakode-text-muted uppercase tracking-wider">
                  Eskalasi Super Admin
                </span>
                <div className="h-8 w-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-purple-950">{escalatedCount}</div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Kasus sengketa mencatut staf Admin
                </span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-emerald-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sakode-text-muted uppercase tracking-wider">
                  Telah Diselesaikan
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-emerald-950">{resolvedCount}</div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Sanksi & resolusi resmi diberlakukan
                </span>
              </div>
            </Card>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-sakode-border">
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  filterStatus === tab.id
                    ? 'bg-sakode-text text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Reports List */}
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-orange" />
              <p className="text-xs text-sakode-text-muted mt-2 font-medium">
                Memuat antrean investigasi sengketa...
              </p>
            </div>
          ) : filteredReports.length === 0 ? (
            <Card className="p-12 text-center bg-white space-y-3">
              <AlertTriangle className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-sakode-text">
                Tidak Ada Laporan yang Cocok
              </h3>
              <p className="text-xs text-sakode-text-muted">
                Tidak ada laporan sengketa aktif dalam kategori filter yang dipilih.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                return (
                  <Card
                    key={report.id}
                    className="p-5 border-sakode-border bg-white hover:border-slate-300 transition-all space-y-3"
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
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : report.status === 'REJECTED'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : report.status === 'NEED_MORE_EVIDENCE'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {report.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            {formatDateWIB(report.createdAt)}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-sakode-text">
                          {report.category}
                        </h3>

                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {report.chronology}
                        </p>
                      </div>

                      <div className="shrink-0 text-left sm:text-right">
                        <Link href={`/admin/reports/${report.id}`}>
                          <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-sakode-orange" />
                            <span>Investigasi Kasus</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-slate-700">
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span>
                          Pelapor: <strong>{report.reporterDisplayName}</strong> ({report.reporterEmail})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-slate-500 font-mono text-[11px]">
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
