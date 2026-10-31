'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatDateWIB } from '@/lib/utils';
import { getAuditEventsAction } from '@/server/actions/admin-manage.actions';
import type { AuditEventDocument } from '@/types/database';
import {
  FileText,
  ShieldCheck,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Lock,
  ArrowLeft,
  Eye,
} from 'lucide-react';

export default function AdminAuditTrailPage() {
  const { user } = useAuth();

  const [events, setEvents] = useState<AuditEventDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters
  const [selectedAction, setSelectedAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Active Snapshot Modal
  const [activeSnapshotEvent, setActiveSnapshotEvent] = useState<AuditEventDocument | null>(null);

  const loadAuditLogs = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAuditEventsAction(user.id, {
        action: selectedAction !== 'ALL' ? selectedAction : undefined,
        limit: 150,
      });

      if (res.success && res.events) {
        setEvents(res.events);
      } else {
        setErrorMsg(res.error || 'Gagal memuat log audit.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan memuat riwayat audit.');
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedAction]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAuditLogs();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadAuditLogs]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && activeSnapshotEvent) {
        setActiveSnapshotEvent(null);
      }
    }
    if (activeSnapshotEvent) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSnapshotEvent]);

  // Client-side text filter
  const filteredEvents = events.filter((ev) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (ev.actorName || '').toLowerCase().includes(term) ||
      (ev.actorId || '').toLowerCase().includes(term) ||
      (ev.entityId || '').toLowerCase().includes(term) ||
      (ev.action || '').toLowerCase().includes(term) ||
      (ev.reason || '').toLowerCase().includes(term)
    );
  });

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070C14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                  <Lock className="h-3 w-3" />
                  <span>Append-Only & Immutable</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Forensic Audit Log
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Audit Trail Platform SAKODE
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Rekaman historis mutasi sensitif, persetujuan klaim dana, keputusan evaluasi review, dan penjatuhan sanksi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadAuditLogs}
                disabled={isLoading}
                className="text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Segarkan Log</span>
              </Button>
            </div>
          </div>

          {/* Immutability Banner */}
          <div className="p-4 rounded-xl bg-slate-900 text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="h-5 w-5 text-sakode-cyan shrink-0" />
              <div>
                <strong className="block text-sakode-cyan font-bold">
                  Jaminan Keamanan: Koleksi Audit Append-Only Murni
                </strong>
                <span className="text-slate-300 text-[11px] leading-relaxed">
                  Tidak ada fungsi edit (update) maupun hapus (delete) dalam basis kode. Seluruh aksi dan alasan tercatat permanen secara kronologis.
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
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

          {/* Controls: Action Select & Search Input */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">Aksi:</span>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
              >
                <option value="ALL">Semua Aksi</option>
                <option value="REPORT_SUBMITTED">REPORT_SUBMITTED</option>
                <option value="REPORT_RESOLVED">REPORT_RESOLVED</option>
                <option value="PENALTY_ISSUED">PENALTY_ISSUED</option>
                <option value="ADMIN_PROMOTED">ADMIN_PROMOTED</option>
                <option value="ADMIN_DEMOTED">ADMIN_DEMOTED</option>
                <option value="CLAIM_CREATED">CLAIM_CREATED</option>
                <option value="CLAIM_PAID">CLAIM_PAID</option>
                <option value="CLAIM_CONFIRMED">CLAIM_CONFIRMED</option>
                <option value="SUBMISSION_REVIEWED">SUBMISSION_REVIEWED</option>
                <option value="APPEAL_DECIDED">APPEAL_DECIDED</option>
              </select>
            </div>

            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari aktor, entitas, atau alasan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Audit Logs Table */}
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">Memuat log audit...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <Card className="p-12 text-center bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <FileText className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">Tidak Ada Log Audit</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Belum ada aktivitas mutasi yang tercatat untuk filter ini.
              </p>
            </Card>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/80 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">Waktu (WIB)</th>
                      <th className="p-3.5">Aktor</th>
                      <th className="p-3.5">Aksi</th>
                      <th className="p-3.5">Entitas Target</th>
                      <th className="p-3.5">Catatan / Alasan</th>
                      <th className="p-3.5 text-right">Snapshot Diff</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredEvents.map((ev) => {
                      const hasSnapshot = Boolean(ev.beforeSnapshot || ev.afterSnapshot);
                      return (
                        <tr key={ev.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                            {formatDateWIB(ev.timestamp)}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {ev.actorName || ev.actorId}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                              Role: {ev.actorRole}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                ev.action.includes('PENALTY') || ev.action.includes('DEMOTED')
                                  ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/60'
                                  : ev.action.includes('PROMOTED') || ev.action.includes('RESOLVED')
                                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60'
                                  : ev.action.includes('CLAIM')
                                  ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {ev.action}
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                              {ev.entityType}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate block max-w-[140px]">
                              {ev.entityId}
                            </span>
                          </td>
                          <td className="p-3.5 max-w-xs">
                            <p className="truncate text-slate-700 dark:text-slate-300 text-[11px]">
                              {ev.reason || '-'}
                            </p>
                          </td>
                          <td className="p-3.5 text-right whitespace-nowrap">
                            {hasSnapshot ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setActiveSnapshotEvent(ev)}
                                className="text-[11px] font-bold h-7 px-2.5 gap-1.5 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                              >
                                <Eye className="h-3 w-3 text-sky-500" />
                                <span>Lihat Diff</span>
                              </Button>
                            ) : (
                              <span className="text-[10px] text-slate-400 dark:text-slate-600 italic">No snapshot</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SNAPSHOT DIFF VIEWER MODAL */}
          {activeSnapshotEvent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <FileText className="h-4 w-4 text-sky-500" />
                      <span>Snapshot Diff: {activeSnapshotEvent.action}</span>
                    </h3>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Entitas: {activeSnapshotEvent.entityType} #{activeSnapshotEvent.entityId}
                    </span>
                  </div>
                  <button
                    onClick={() => setActiveSnapshotEvent(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4 overflow-y-auto">
                  {activeSnapshotEvent.reason && (
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200">
                      <strong className="text-slate-900 dark:text-white font-semibold">Catatan / Alasan Mutasi:</strong>
                      <p className="mt-0.5">{activeSnapshotEvent.reason}</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Before */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 block">
                        Before Snapshot:
                      </span>
                      <pre className="p-3 rounded-xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 font-mono text-[10px] text-slate-800 dark:text-slate-200 overflow-x-auto max-h-60 leading-relaxed">
                        {activeSnapshotEvent.beforeSnapshot
                          ? JSON.stringify(activeSnapshotEvent.beforeSnapshot, null, 2)
                          : 'null (Initial Creation)'}
                      </pre>
                    </div>

                    {/* After */}
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                        After Snapshot:
                      </span>
                      <pre className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 font-mono text-[10px] text-slate-800 dark:text-slate-200 overflow-x-auto max-h-60 leading-relaxed">
                        {activeSnapshotEvent.afterSnapshot
                          ? JSON.stringify(activeSnapshotEvent.afterSnapshot, null, 2)
                          : 'null'}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveSnapshotEvent(null)}
                    className="text-xs font-bold border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                  >
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
