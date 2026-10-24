'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateWIB } from '@/lib/utils';
import {
  getReportDetailAction,
  resolveReportAction,
} from '@/server/actions/report.actions';
import { getRecommendedPenalty } from '@/lib/validations/report';
import { PENALTY_TYPES, type PenaltyType } from '@/lib/constants';
import type { ReportDocument, EvidenceFile } from '@/types/database';
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
  User,
  Sparkles,
  Check,
} from 'lucide-react';

function ReportDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reportId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [report, setReport] = useState<ReportDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Resolution Form State
  const [action, setAction] = useState<'RESOLVE' | 'REJECT' | 'REQUEST_EVIDENCE'>('RESOLVE');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [applyPenalty, setApplyPenalty] = useState(false);
  const [penaltyType, setPenaltyType] = useState<PenaltyType>(PENALTY_TYPES.WARNING);
  const [penaltyDurationDays, setPenaltyDurationDays] = useState<number>(3);
  const [penaltyTargetUserId, setPenaltyTargetUserId] = useState('');
  const [isOverride, setIsOverride] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Evidence File Modal
  const [activeEvidence, setActiveEvidence] = useState<EvidenceFile | null>(null);

  const loadReport = useCallback(async () => {
    if (!user || !reportId) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getReportDetailAction(user.id, reportId);
      if (res.success && res.report) {
        setReport(res.report);
        // Default target terlapor ke reporter atau target ID
        setPenaltyTargetUserId(res.report.targetId);

        // Pre-fill rekomendasi sistem
        const rec = getRecommendedPenalty(res.report.category);
        setPenaltyType(rec.penaltyType);
        if (rec.durationDays) {
          setPenaltyDurationDays(rec.durationDays);
        }
      } else {
        setErrorMsg(res.error || 'Gagal memuat rincian laporan.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan memuat detail laporan.');
    } finally {
      setIsLoading(false);
    }
  }, [user, reportId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadReport();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadReport]);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !report) return;

    if (resolutionNotes.trim().length < 15) {
      setErrorMsg('Catatan resolusi investigasi wajib diisi minimal 15 karakter.');
      return;
    }

    if (applyPenalty && !penaltyTargetUserId.trim()) {
      setErrorMsg('ID pengguna terlapor wajib disertakan untuk penjatuhan penalti.');
      return;
    }

    if (isOverride && overrideReason.trim().length < 15) {
      setErrorMsg(
        'Alasan penulisan override rekomendasi sistem wajib dicantumkan minimal 15 karakter (Strict Invariant).'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await resolveReportAction(user.id, {
        reportId: report.id,
        action,
        resolutionNotes: resolutionNotes.trim(),
        applyPenalty,
        penaltyType: applyPenalty ? penaltyType : undefined,
        penaltyDurationDays:
          applyPenalty && (penaltyType === PENALTY_TYPES.COOLDOWN || penaltyType === PENALTY_TYPES.TEMPORARY_SUSPEND)
            ? penaltyDurationDays
            : undefined,
        penaltyTargetUserId: applyPenalty ? penaltyTargetUserId.trim() : undefined,
        isOverride,
        overrideReason: isOverride ? overrideReason.trim() : undefined,
      });

      if (res.success && res.report) {
        setSuccessMsg('Keputusan investigasi dan resolusi sengketa berhasil diberlakukan!');
        setReport(res.report);
        setTimeout(() => {
          router.push('/admin/reports');
        }, 2000);
      } else {
        setErrorMsg(res.error || 'Gagal menyimpan keputusan resolusi.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat memproses resolusi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sakode-bg py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-orange" />
        <p className="text-xs text-sakode-text-muted mt-2 font-medium">Memuat data sengketa...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-sakode-bg py-16 px-4 text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold text-sakode-text mt-3">Laporan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-500 mt-1">{errorMsg}</p>
        <Link href="/admin/reports" className="mt-4 inline-block">
          <Button variant="outline" size="sm">Kembali ke Antrean Laporan</Button>
        </Link>
      </div>
    );
  }

  const systemRec = getRecommendedPenalty(report.category);
  const isAlreadyResolved = report.status === 'RESOLVED' || report.status === 'REJECTED';

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Back Navigation */}
          <div className="flex items-center justify-between">
            <Link
              href="/admin/reports"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-sakode-text-muted hover:text-sakode-text transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Kembali ke Antrean Laporan</span>
            </Link>

            <span className="text-xs text-slate-500 font-mono">ID: #{report.id}</span>
          </div>

          {/* Feedback */}
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
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
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Report Summary Card */}
          <Card className="p-6 border-sakode-border bg-white space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="orange">{report.targetType}</Badge>
                  {report.escalatedToSuperAdmin && (
                    <Badge variant="purple" leftIcon={<ShieldAlert className="h-3 w-3" />}>
                      Eskalasi Super Admin
                    </Badge>
                  )}
                  <span className="text-xs font-bold text-slate-500">
                    {formatDateWIB(report.createdAt)}
                  </span>
                </div>
                <h1 className="text-xl font-black text-sakode-text mt-1">{report.category}</h1>
                <p className="text-xs text-slate-500">
                  Target Entitas: <strong>{report.targetTitle || report.targetId}</strong>
                </p>
              </div>

              <div>
                <span
                  className={`text-xs font-bold px-3 py-1 rounded-full border ${
                    report.status === 'RESOLVED'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : report.status === 'REJECTED'
                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  Status: {report.status}
                </span>
              </div>
            </div>

            {/* Reporter Profile */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-800">
                <User className="h-4 w-4 text-slate-400" />
                <span>
                  Pelapor: <strong>{report.reporterDisplayName}</strong> ({report.reporterEmail})
                </span>
              </div>
              <span className="font-mono text-slate-500 text-[11px]">UID: {report.reporterUserId}</span>
            </div>

            {/* Chronology */}
            <div>
              <h3 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-sakode-orange" />
                <span>Kronologi Kejadian Terlapor:</span>
              </h3>
              <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                {report.chronology}
              </div>
            </div>

            {/* Evidence Files */}
            <div>
              <h3 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-2">
                Berkas Bukti Pendukung ({report.evidenceFiles?.length || 0}):
              </h3>
              {(!report.evidenceFiles || report.evidenceFiles.length === 0) ? (
                <p className="text-xs text-slate-400 italic">Tidak ada berkas bukti yang dilampirkan.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {report.evidenceFiles.map((file, idx) => (
                    <div
                      key={idx}
                      onClick={() => setActiveEvidence(file)}
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-center space-y-1.5"
                    >
                      <FileText className="h-6 w-6 text-sakode-orange mx-auto" />
                      <span className="text-[11px] font-bold text-slate-700 block truncate">
                        {file.fileName || `Bukti #${idx + 1}`}
                      </span>
                      <span className="text-[10px] text-sakode-cyan underline font-medium block">
                        Klik untuk Tinjau
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* System Recommendation Panel */}
          <Card className="p-5 border-l-4 border-l-sakode-cyan bg-white space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-sakode-cyan" />
              <h3 className="text-xs font-bold text-sakode-text uppercase tracking-wider">
                Rekomendasi Penalti Otomatis Sistem SAKODE
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700">Tingkat Penalti:</span>
              <Badge variant="orange">{systemRec.penaltyType}</Badge>
              {systemRec.durationDays && (
                <span className="font-mono text-slate-500 font-bold">
                  ({systemRec.durationDays} Hari)
                </span>
              )}
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{systemRec.explanation}</p>
          </Card>

          {/* Resolution Form / Decision Result */}
          {isAlreadyResolved ? (
            <Card className="p-5 border-sakode-border bg-white space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <h3 className="text-sm font-bold text-sakode-text">
                  Laporan Telah Diselesaikan
                </h3>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <span className="font-bold block">Catatan Resolusi Admin ({report.assignedAdminName}):</span>
                <p className="leading-relaxed">{report.resolutionNotes}</p>
              </div>
            </Card>
          ) : (
            <Card className="p-6 border-sakode-border bg-white space-y-5">
              <div>
                <h3 className="text-base font-extrabold text-sakode-text">
                  Formulir Resolusi & Penjatuhan Sanksi
                </h3>
                <p className="text-xs text-sakode-text-muted">
                  Tetapkan keputusan investigasi resmi. Seluruh keputusan dan penjatuhan sanksi akan dicatat permanen di log audit.
                </p>
              </div>

              <form onSubmit={handleResolve} className="space-y-4">
                {/* 1. Action Decision */}
                <div>
                  <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-2">
                    Keputusan Tindakan:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <label
                      onClick={() => setAction('RESOLVE')}
                      className={`p-3 rounded-lg border block cursor-pointer transition-all text-xs font-bold ${
                        action === 'RESOLVE'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="action"
                        checked={action === 'RESOLVE'}
                        onChange={() => setAction('RESOLVE')}
                        className="mr-2"
                      />
                      <span>Setujui Sengketa (RESOLVE)</span>
                    </label>

                    <label
                      onClick={() => setAction('REJECT')}
                      className={`p-3 rounded-lg border block cursor-pointer transition-all text-xs font-bold ${
                        action === 'REJECT'
                          ? 'border-rose-500 bg-rose-50 text-rose-900 ring-1 ring-rose-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="action"
                        checked={action === 'REJECT'}
                        onChange={() => setAction('REJECT')}
                        className="mr-2"
                      />
                      <span>Tolak Sengketa (REJECT)</span>
                    </label>

                    <label
                      onClick={() => setAction('REQUEST_EVIDENCE')}
                      className={`p-3 rounded-lg border block cursor-pointer transition-all text-xs font-bold ${
                        action === 'REQUEST_EVIDENCE'
                          ? 'border-blue-500 bg-blue-50 text-blue-900 ring-1 ring-blue-500'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="action"
                        checked={action === 'REQUEST_EVIDENCE'}
                        onChange={() => setAction('REQUEST_EVIDENCE')}
                        className="mr-2"
                      />
                      <span>Minta Bukti Tambahan</span>
                    </label>
                  </div>
                </div>

                {/* 2. Resolution Notes */}
                <div>
                  <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                    Catatan Resolusi Investigasi (Min. 15 Karakter):
                  </label>
                  <textarea
                    rows={3}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Tuliskan temuan investigasi, pertimbangan bukti, dan dasar putusan..."
                    className="w-full p-3 text-xs rounded-lg border border-sakode-border bg-white text-sakode-text focus:outline-none focus:ring-1 focus:ring-sakode-cyan leading-relaxed"
                  />
                </div>

                {/* 3. Apply Penalty Toggle */}
                {action === 'RESOLVE' && (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={applyPenalty}
                        onChange={(e) => setApplyPenalty(e.target.checked)}
                        className="h-4 w-4 rounded text-sakode-orange focus:ring-sakode-orange"
                      />
                      <span className="text-xs font-bold text-sakode-text">
                        Jatuhkan Sanksi Penalti Progresif kepada Pihak Terlapor
                      </span>
                    </label>

                    {applyPenalty && (
                      <div className="space-y-3 pt-2 border-t border-slate-200">
                        {/* Target User UID */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                            UID Pengguna Terlapor:
                          </label>
                          <input
                            type="text"
                            value={penaltyTargetUserId}
                            onChange={(e) => setPenaltyTargetUserId(e.target.value)}
                            placeholder="Contoh: user_12345"
                            className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-sakode-orange"
                          />
                        </div>

                        {/* Penalty Type Select */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                              Tingkatan Sanksi Penalti:
                            </label>
                            <select
                              value={penaltyType}
                              onChange={(e) => setPenaltyType(e.target.value as PenaltyType)}
                              className="w-full p-2 text-xs rounded-lg border border-slate-300 bg-white font-bold text-slate-800"
                            >
                              <option value={PENALTY_TYPES.WARNING}>WARNING (Peringatan Tertulis)</option>
                              <option value={PENALTY_TYPES.COOLDOWN}>COOLDOWN (Jeda Task Baru)</option>
                              <option value={PENALTY_TYPES.TEAM_ONLY}>TEAM_ONLY (Hanya Boleh Task Tim)</option>
                              <option value={PENALTY_TYPES.NO_LEAD}>NO_LEAD (Dilarang Jadi Team Lead)</option>
                              <option value={PENALTY_TYPES.TEMPORARY_SUSPEND}>TEMPORARY_SUSPEND (Suspend Sementara)</option>
                              <option value={PENALTY_TYPES.ACCOUNT_SUSPEND}>ACCOUNT_SUSPEND (Suspend Permanen)</option>
                            </select>
                          </div>

                          {(penaltyType === PENALTY_TYPES.COOLDOWN ||
                            penaltyType === PENALTY_TYPES.TEMPORARY_SUSPEND) && (
                            <div>
                              <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                                Durasi Sanksi (Hari):
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={90}
                                value={penaltyDurationDays}
                                onChange={(e) => setPenaltyDurationDays(parseInt(e.target.value, 10) || 1)}
                                className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-300 bg-white"
                              />
                            </div>
                          )}
                        </div>

                        {/* Override System Recommendation Option */}
                        <div className="pt-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={isOverride}
                              onChange={(e) => setIsOverride(e.target.checked)}
                              className="h-4 w-4 rounded text-sakode-purple focus:ring-sakode-purple"
                            />
                            <span className="text-xs font-bold text-purple-900">
                              Override Rekomendasi Sistem ({systemRec.penaltyType})
                            </span>
                          </label>

                          {isOverride && (
                            <div className="mt-2 space-y-1">
                              <label className="block text-[11px] font-bold text-rose-700 uppercase">
                                Alasan Wajib Override (Min. 15 Karakter - Strict Invariant):
                              </label>
                              <textarea
                                rows={2}
                                value={overrideReason}
                                onChange={(e) => setOverrideReason(e.target.value)}
                                placeholder="Jelaskan dasar pertimbangan objektif mengapa sanksi berbeda dari rekomendasi otomatis sistem..."
                                className="w-full p-2.5 text-xs rounded-lg border border-purple-300 bg-white focus:outline-none focus:ring-1 focus:ring-sakode-purple"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <Link href="/admin/reports">
                    <Button type="button" variant="ghost" size="sm" className="text-xs">
                      Batal
                    </Button>
                  </Link>

                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || resolutionNotes.trim().length < 15}
                    className="font-bold text-xs gap-1.5 shadow-sm h-10 px-5"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    <span>Terapkan Keputusan Investigasi</span>
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Evidence Viewer Modal */}
          {activeEvidence && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-sakode-border w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-sakode-border flex items-center justify-between bg-sakode-bg">
                  <h4 className="text-sm font-bold text-sakode-text flex items-center gap-1.5 truncate">
                    <FileText className="h-4 w-4 text-sakode-orange shrink-0" />
                    <span className="truncate">{activeEvidence.fileName || 'Berkas Bukti'}</span>
                  </h4>
                  <button onClick={() => setActiveEvidence(null)} className="p-1 text-slate-400 hover:text-slate-700">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-4 overflow-auto flex-1 text-center bg-slate-900/5 flex items-center justify-center min-h-[300px]">
                  {activeEvidence.url.toLowerCase().endsWith('.pdf') ? (
                    <div className="space-y-3">
                      <FileText className="h-16 w-16 text-rose-500 mx-auto" />
                      <p className="text-xs text-slate-600">Dokumen Bukti PDF</p>
                      <a
                        href={activeEvidence.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-bold text-sakode-cyan underline"
                      >
                        <span>Buka PDF di Tab Baru</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={activeEvidence.url}
                      alt="Berkas Bukti Laporan"
                      className="max-h-[70vh] object-contain rounded-lg shadow-xs"
                    />
                  )}
                </div>

                <div className="p-3 border-t border-sakode-border bg-sakode-bg flex items-center justify-between">
                  <a
                    href={activeEvidence.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-sakode-cyan flex items-center gap-1"
                  >
                    <span>Buka Tautan Asli</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <Button variant="outline" size="sm" onClick={() => setActiveEvidence(null)} className="text-xs">
                    Tutup
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}

export default function ReportDetailPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-sakode-bg py-20 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-orange" />
          <p className="text-xs text-sakode-text-muted mt-2 font-medium">Memuat investigasi...</p>
        </div>
      }
    >
      <ReportDetailContent />
    </React.Suspense>
  );
}
