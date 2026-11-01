'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrencyIDR } from '@/lib/utils';
import {
  getAllClaimsForAdminAction,
  adminProcessClaimAction,
} from '@/server/actions/claim.actions';
import { TransferProofUploader } from '@/components/claim/TransferProofUploader';
import { ViewModeToggle, type ViewMode } from '@/components/ui/ViewModeToggle';
import type { ClaimDocument } from '@/types/database';
import type { ClaimStatus } from '@/lib/constants';
import {
  Wallet,
  CheckCircle2,
  Clock,
  Building,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
  X,
  Send,
} from 'lucide-react';

export default function AdminClaimsPage() {
  const { user } = useAuth();

  const [claims, setClaims] = useState<ClaimDocument[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sakode_admin_claims_view_mode') as ViewMode | null;
      if (saved === 'grid' || saved === 'list' || saved === 'table') return saved;
    }
    return 'list';
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Unmasked Accounts tracking by claimId
  const [unmaskedClaimIds, setUnmaskedClaimIds] = useState<string[]>([]);

  // Payment Modal State
  const [activePaymentClaim, setActivePaymentClaim] = useState<ClaimDocument | null>(null);
  const [transferProofUrl, setTransferProofUrl] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Transfer Proof Viewer State
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadClaims = useCallback(async () => {
    if (!user || (!user.isAdmin && !user.isSuperAdmin)) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAllClaimsForAdminAction(
        user.id,
        filterStatus !== 'ALL' ? (filterStatus as ClaimStatus) : undefined
      );

      if (res.success && res.claims) {
        setClaims(res.claims);
      } else {
        setErrorMsg(res.error || 'Gagal memuat daftar klaim reward.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memuat data antrean klaim.');
    } finally {
      setIsLoading(false);
    }
  }, [user, filterStatus]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadClaims();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadClaims]);

  const toggleUnmaskAccount = (claimId: string) => {
    setUnmaskedClaimIds((prev) =>
      prev.includes(claimId) ? prev.filter((id) => id !== claimId) : [...prev, claimId]
    );
  };

  // Mark Processing
  const handleMarkProcessing = async (claimId: string) => {
    if (!user) return;
    setActionLoadingId(claimId);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await adminProcessClaimAction(user.id, {
        claimId,
        action: 'PROCESS',
      });
      if (res.success) {
        setSuccessMsg('Klaim berhasil ditandai sedang diproses transfer.');
        await loadClaims();
      } else {
        setErrorMsg(res.error || 'Gagal memperbarui status klaim.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memproses klaim.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (claim: ClaimDocument) => {
    setActivePaymentClaim(claim);
    setTransferProofUrl('');
    setAdminNotes('');
  };

  // Submit Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activePaymentClaim) return;

    if (!transferProofUrl || transferProofUrl.trim().length === 0) {
      setErrorMsg('Wajib mengunggah bukti transfer sebelum menyelesaikan pembayaran klaim.');
      return;
    }

    setIsSubmittingPayment(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await adminProcessClaimAction(user.id, {
        claimId: activePaymentClaim.id,
        action: 'PAY',
        transferProofUrl,
        adminNotes: adminNotes.trim() || undefined,
      });

      if (res.success) {
        setSuccessMsg(
          `Pembayaran klaim sebesar ${formatCurrencyIDR(
            activePaymentClaim.totalAmount
          )} berhasil dicatat! Notifikasi dikirimkan ke member.`
        );
        setActivePaymentClaim(null);
        await loadClaims();
      } else {
        setErrorMsg(res.error || 'Gagal menyelesaikan pembayaran klaim.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat memproses pembayaran.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Metrics
  const totalPendingPayout = claims
    .filter((c) => c.status === 'CLAIMED' || c.status === 'PROCESSING')
    .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  const totalPaidOut = claims
    .filter((c) => c.status === 'PAID' || c.status === 'CONFIRMED')
    .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 py-6 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                  <Wallet className="h-3 w-3" />
                  <span>Admin Keuangan & Escrow</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Pencairan Terverifikasi
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Manajemen Pencairan Klaim Reward
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Verifikasi rekening snapshot tujuan transfer, unggah bukti pembayaran bank manual, dan kelola integritas ledger IDR.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadClaims}
              disabled={isLoading}
              className="text-xs font-bold gap-1.5 self-start sm:self-auto border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Antrean</span>
            </Button>
          </div>

          {/* Feedback Messages */}
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

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{successMsg}</span>
              </div>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 2 Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 border-l-4 border-l-amber-500 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Menunggu Pembayaran
                </span>
                <div className="h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">
                  {formatCurrencyIDR(totalPendingPayout)}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Perlu ditransfer manual ke rekening member
                </span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total Telah Ditransfer
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">
                  {formatCurrencyIDR(totalPaidOut)}
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Honor berhasil disalurkan ke member
                </span>
              </div>
            </Card>
          </div>

          {/* Status Filter Tabs & View Mode */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'ALL', label: 'Semua Status' },
                { id: 'CLAIMED', label: 'Menunggu Verifikasi' },
                { id: 'PROCESSING', label: 'Sedang Diproses' },
                { id: 'PAID', label: 'Sudah Ditransfer' },
                { id: 'CONFIRMED', label: 'Selesai & Dikonfirmasi' },
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
                storageKey="sakode_admin_claims_view_mode"
              />
            </div>
          </div>

          {/* Claims List */}
          {claims.length === 0 ? (
            <Card className="p-12 text-center bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 rounded-2xl">
              <Wallet className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Tidak Ada Antrean Klaim
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tidak ada permohonan pencairan dana yang cocok dengan filter yang dipilih.
              </p>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claims.map((claim) => {
                const isUnmasked = unmaskedClaimIds.includes(claim.id);
                const accountNumber = claim.bankAccountSnapshot?.accountNumber || '';
                const displayAccountNum = isUnmasked
                  ? accountNumber
                  : accountNumber.length > 4
                  ? `${'•'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
                  : accountNumber;

                return (
                  <Card key={claim.id} className="p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-4 rounded-2xl shadow-2xs flex flex-col justify-between">
                    <div>
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                              #{claim.id.slice(0, 8)}
                            </span>
                            <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {claim.userDisplayName || claim.userId}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">{claim.userEmail}</span>
                        </div>

                        <div>
                          {claim.status === 'CLAIMED' && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                              <span>Menunggu Transfer</span>
                            </span>
                          )}
                          {claim.status === 'PROCESSING' && (
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                              <RefreshCw className="h-3 w-3 text-blue-600 dark:text-blue-400 animate-spin" />
                              <span>Sedang Diproses</span>
                            </span>
                          )}
                          {claim.status === 'PAID' && (
                            <span className="text-[10px] font-bold text-cyan-900 bg-cyan-50 dark:bg-cyan-950/60 dark:text-cyan-300 px-2.5 py-1 rounded-full border border-cyan-200 dark:border-cyan-800 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-sakode-cyan" />
                              <span>Telah Ditransfer</span>
                            </span>
                          )}
                          {claim.status === 'CONFIRMED' && (
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                              <span>Pencairan Selesai</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="py-2.5 flex items-baseline justify-between">
                        <div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">Total Pencairan</span>
                          <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                            {formatCurrencyIDR(claim.totalAmount)}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                          {claim.rewardLedgerIds?.length || 1} task ledger
                        </span>
                      </div>

                      {/* Snapshot Rekening */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
                            <Building className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                            <span>{claim.bankAccountSnapshot?.bankName}</span>
                          </div>
                          <span className="text-[11px] text-slate-700 dark:text-slate-300">
                            a.n. <strong className="text-slate-900 dark:text-white">{claim.bankAccountSnapshot?.accountHolderName}</strong>
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          <div className="flex items-center gap-1.5">
                            <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-mono font-bold text-slate-900 dark:text-white text-xs">
                              {displayAccountNum}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleUnmaskAccount(claim.id)}
                              className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                              title={isUnmasked ? 'Sembunyikan Nomor' : 'Buka Nomor Rekening Lengkap'}
                            >
                              {isUnmasked ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </button>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            {claim.idempotencyKey.slice(0, 16)}...
                          </span>
                        </div>
                      </div>

                      {claim.adminNotes && (
                        <p className="text-[11px] text-slate-600 dark:text-slate-400 italic mt-2">
                          Catatan: {claim.adminNotes}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        {claim.transferProofUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveProofUrl(claim.transferProofUrl)}
                            className="text-xs font-bold gap-1 text-slate-700 dark:text-slate-200"
                          >
                            <FileText className="h-3.5 w-3.5 text-sakode-cyan" />
                            <span>Bukti</span>
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {claim.status === 'CLAIMED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoadingId === claim.id}
                            onClick={() => handleMarkProcessing(claim.id)}
                            className="text-xs font-bold"
                          >
                            {actionLoadingId === claim.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            <span>Proses</span>
                          </Button>
                        )}

                        {(claim.status === 'CLAIMED' || claim.status === 'PROCESSING') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenPaymentModal(claim)}
                            className="font-bold text-xs gap-1.5 shadow-sm"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Kirim Pembayaran</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : viewMode === 'table' ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/90 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="table-auto w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3.5">ID & Pemohon</th>
                      <th className="p-3.5">Rekening Snapshot</th>
                      <th className="p-3.5">Total Bounty</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5">Idempotency</th>
                      <th className="p-3.5 text-right">Aksi Cepat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {claims.map((claim) => {
                      const isUnmasked = unmaskedClaimIds.includes(claim.id);
                      const accountNumber = claim.bankAccountSnapshot?.accountNumber || '';
                      const displayAccountNum = isUnmasked
                        ? accountNumber
                        : accountNumber.length > 4
                        ? `${'•'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
                        : accountNumber;

                      return (
                        <tr key={claim.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                                #{claim.id.slice(0, 8)}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 dark:text-slate-100 block">
                                  {claim.userDisplayName || claim.userId}
                                </span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">
                                  {claim.userEmail}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="text-xs">
                              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                                <Building className="h-3 w-3 text-slate-400" />
                                <span>{claim.bankAccountSnapshot?.bankName}</span>
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <CreditCard className="h-3 w-3 text-slate-400" />
                                <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                                  {displayAccountNum}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleUnmaskAccount(claim.id)}
                                  className="p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded cursor-pointer"
                                  title={isUnmasked ? 'Sembunyikan Nomor' : 'Buka Nomor Rekening Lengkap'}
                                >
                                  {isUnmasked ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                </button>
                                <span className="text-slate-400">•</span>
                                <span className="text-[11px] text-slate-600 dark:text-slate-400">
                                  {claim.bankAccountSnapshot?.accountHolderName}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-black text-slate-900 dark:text-white font-mono text-sm block">
                              {formatCurrencyIDR(claim.totalAmount)}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {claim.rewardLedgerIds?.length || 1} task
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            {claim.status === 'CLAIMED' && (
                              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                                <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                                <span>Menunggu Transfer</span>
                              </span>
                            )}
                            {claim.status === 'PROCESSING' && (
                              <span className="text-[10px] font-bold text-blue-800 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800 inline-flex items-center gap-1">
                                <RefreshCw className="h-3 w-3 text-blue-600 dark:text-blue-400 animate-spin" />
                                <span>Diproses</span>
                              </span>
                            )}
                            {claim.status === 'PAID' && (
                              <span className="text-[10px] font-bold text-cyan-900 bg-cyan-50 dark:bg-cyan-950/60 dark:text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-200 dark:border-cyan-800 inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-sakode-cyan" />
                                <span>Ditransfer</span>
                              </span>
                            )}
                            {claim.status === 'CONFIRMED' && (
                              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                <span>Selesai</span>
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {claim.idempotencyKey.slice(0, 14)}...
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-right">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {claim.transferProofUrl && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setActiveProofUrl(claim.transferProofUrl)}
                                  className="text-xs font-bold gap-1 text-slate-700 dark:text-slate-200"
                                >
                                  <FileText className="h-3 w-3 text-sakode-cyan" />
                                  <span>Bukti</span>
                                </Button>
                              )}

                              {claim.status === 'CLAIMED' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={actionLoadingId === claim.id}
                                  onClick={() => handleMarkProcessing(claim.id)}
                                  className="text-xs font-bold"
                                >
                                  {actionLoadingId === claim.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <RefreshCw className="h-3 w-3" />
                                  )}
                                  <span>Proses</span>
                                </Button>
                              )}

                              {(claim.status === 'CLAIMED' || claim.status === 'PROCESSING') && (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleOpenPaymentModal(claim)}
                                  className="font-bold text-xs gap-1 shadow-xs"
                                >
                                  <Send className="h-3 w-3" />
                                  <span>Bayar</span>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {claims.map((claim) => {
                const isUnmasked = unmaskedClaimIds.includes(claim.id);
                const accountNumber = claim.bankAccountSnapshot?.accountNumber || '';
                const displayAccountNum = isUnmasked
                  ? accountNumber
                  : accountNumber.length > 4
                  ? `${'•'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`
                  : accountNumber;

                return (
                  <Card key={claim.id} className="p-5 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 space-y-4 rounded-2xl shadow-2xs">
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
                            #{claim.id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {claim.userDisplayName || claim.userId}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">({claim.userEmail})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                            {formatCurrencyIDR(claim.totalAmount)}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            ({claim.rewardLedgerIds?.length || 1} task item)
                          </span>
                        </div>
                      </div>

                      <div>
                        {claim.status === 'CLAIMED' && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            <span>Menunggu Transfer</span>
                          </span>
                        )}
                        {claim.status === 'PROCESSING' && (
                          <span className="text-xs font-bold text-blue-800 bg-blue-50 dark:bg-blue-950/60 dark:text-blue-300 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-spin" />
                            <span>Sedang Diproses</span>
                          </span>
                        )}
                        {claim.status === 'PAID' && (
                          <span className="text-xs font-bold text-cyan-900 bg-cyan-50 dark:bg-cyan-950/60 dark:text-cyan-300 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-800 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-sakode-cyan" />
                            <span>Telah Ditransfer</span>
                          </span>
                        )}
                        {claim.status === 'CONFIRMED' && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Pencairan Selesai</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Snapshot Rekening Tujuan Transfer */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {claim.bankAccountSnapshot?.bankName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <span className="font-mono font-bold text-slate-900 dark:text-white">
                            {displayAccountNum}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleUnmaskAccount(claim.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                            title={isUnmasked ? 'Sembunyikan Nomor' : 'Buka Nomor Rekening Lengkap'}
                          >
                            {isUnmasked ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <span className="text-slate-400 dark:text-slate-600">•</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            a.n. <strong className="text-slate-900 dark:text-white">{claim.bankAccountSnapshot?.accountHolderName}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-left md:text-right">
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono block">
                          Idempotency: {claim.idempotencyKey}
                        </span>
                        {claim.adminNotes && (
                          <span className="text-[11px] text-slate-600 dark:text-slate-400 italic block mt-0.5">
                            Catatan: {claim.adminNotes}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center gap-2">
                        {claim.transferProofUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setActiveProofUrl(claim.transferProofUrl)}
                            className="text-xs font-bold gap-1 text-slate-700 dark:text-slate-200"
                          >
                            <FileText className="h-3.5 w-3.5 text-sakode-cyan" />
                            <span>Lihat Bukti Transfer</span>
                          </Button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {claim.status === 'CLAIMED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actionLoadingId === claim.id}
                            onClick={() => handleMarkProcessing(claim.id)}
                            className="text-xs font-bold"
                          >
                            {actionLoadingId === claim.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                            <span>Tandai Sedang Diproses</span>
                          </Button>
                        )}

                        {(claim.status === 'CLAIMED' || claim.status === 'PROCESSING') && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleOpenPaymentModal(claim)}
                            className="font-bold text-xs gap-1.5 shadow-sm"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Kirim Pembayaran & Unggah Bukti</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* PAYMENT CONFIRMATION & UPLOAD MODAL */}
          {activePaymentClaim && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-sky-500" />
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Konfirmasi Transfer Pembayaran
                    </h3>
                  </div>
                  <button
                    onClick={() => setActivePaymentClaim(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitPayment} className="p-5 space-y-4 overflow-y-auto">
                  {/* Rekening Target Snapshot */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                      Target Rekening Snapshot:
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Bank / Channel:</span>
                        <strong className="text-slate-900 dark:text-white">
                          {activePaymentClaim.bankAccountSnapshot?.bankName}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Nomor Rekening:</span>
                        <strong className="font-mono text-slate-900 dark:text-white text-sm">
                          {activePaymentClaim.bankAccountSnapshot?.accountNumber}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Nama Penerima:</span>
                        <strong className="text-slate-900 dark:text-white">
                          {activePaymentClaim.bankAccountSnapshot?.accountHolderName}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400 font-bold">Nominal Transfer:</span>
                        <strong className="text-base font-black text-slate-900 dark:text-white font-mono">
                          {formatCurrencyIDR(activePaymentClaim.totalAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Proof Upload */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Unggah Bukti Struk Transfer Bank (Wajib)
                    </label>
                    <TransferProofUploader
                      claimIdOrContext={activePaymentClaim.id}
                      onUploaded={(url) => setTransferProofUrl(url)}
                      existingUrl={transferProofUrl}
                      disabled={isSubmittingPayment}
                    />
                  </div>

                  {/* Optional Admin Notes */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Catatan Referensi Transfer (Opsional)
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Contoh: No. Ref BCA 892348234 / Transfer Berhasil"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActivePaymentClaim(null)}
                      className="text-xs"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSubmittingPayment || !transferProofUrl}
                      className="font-bold text-xs gap-1.5"
                    >
                      {isSubmittingPayment ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      <span>Konfirmasi Transfer Selesai</span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TRANSFER PROOF VIEWER MODAL */}
          {activeProofUrl && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-sky-500" />
                    <span>Bukti Transfer Pembayaran</span>
                  </h4>
                  <button
                    onClick={() => setActiveProofUrl(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-4 overflow-auto flex-1 text-center bg-slate-900/5 flex items-center justify-center min-h-[300px]">
                  {activeProofUrl.toLowerCase().endsWith('.pdf') ? (
                    <div className="space-y-3">
                      <FileText className="h-16 w-16 text-rose-500 mx-auto" />
                      <p className="text-xs text-slate-600">Dokumen PDF Bukti Transfer</p>
                      <a
                        href={activeProofUrl}
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
                      src={activeProofUrl}
                      alt="Bukti Transfer Pembayaran"
                      className="max-h-[70vh] object-contain rounded-lg shadow-xs"
                    />
                  )}
                </div>

                <div className="p-3 border-t border-sakode-border bg-sakode-bg flex items-center justify-between">
                  <a
                    href={activeProofUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-bold text-sakode-cyan flex items-center gap-1"
                  >
                    <span>Buka Tautan Asli</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveProofUrl(null)}
                    className="text-xs"
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
