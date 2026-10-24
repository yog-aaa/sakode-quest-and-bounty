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
    if (!user) return;
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
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="cyan" leftIcon={<Wallet className="h-3.5 w-3.5" />}>
                  Admin Keuangan
                </Badge>
                <span className="text-xs text-sakode-text-muted">Antrean Pencairan Dana</span>
              </div>
              <h1 className="text-2xl font-black text-sakode-text tracking-tight mt-1">
                Manajemen Pencairan Klaim Reward
              </h1>
              <p className="text-xs text-sakode-text-muted">
                Verifikasi rekening snapshot tujuan transfer, unggah bukti pembayaran bank manual, dan kelola integritas ledger.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadClaims}
              disabled={isLoading}
              className="text-xs font-bold gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Antrean</span>
            </Button>
          </div>

          {/* Feedback Messages */}
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

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
              <button
                onClick={() => setSuccessMsg(null)}
                className="text-emerald-600 hover:text-emerald-900"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* 2 Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="p-5 border-l-4 border-l-amber-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sakode-text-muted uppercase tracking-wider">
                  Total Menunggu Pembayaran
                </span>
                <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-amber-950">
                  {formatCurrencyIDR(totalPendingPayout)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Perlu ditransfer manual ke rekening member
                </span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-emerald-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sakode-text-muted uppercase tracking-wider">
                  Total Telah Ditransfer
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-emerald-950">
                  {formatCurrencyIDR(totalPaidOut)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Honor berhasil disalurkan ke member
                </span>
              </div>
            </Card>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-sakode-border">
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

          {/* Claims List */}
          {claims.length === 0 ? (
            <Card className="p-12 text-center bg-white space-y-3">
              <Wallet className="h-12 w-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-sakode-text">
                Tidak Ada Antrean Klaim
              </h3>
              <p className="text-xs text-sakode-text-muted">
                Tidak ada permohonan pencairan dana yang cocok dengan filter yang dipilih.
              </p>
            </Card>
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
                  <Card key={claim.id} className="p-5 border-sakode-border bg-white space-y-4">
                    {/* Top Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-500">
                            #{claim.id}
                          </span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {claim.userDisplayName || claim.userId}
                          </span>
                          <span className="text-xs text-slate-400">({claim.userEmail})</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xl font-black text-sakode-text">
                            {formatCurrencyIDR(claim.totalAmount)}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({claim.rewardLedgerIds?.length || 1} task item)
                          </span>
                        </div>
                      </div>

                      <div>
                        {claim.status === 'CLAIMED' && (
                          <span className="text-xs font-bold text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-amber-600" />
                            <span>Menunggu Transfer</span>
                          </span>
                        )}
                        {claim.status === 'PROCESSING' && (
                          <span className="text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 flex items-center gap-1.5">
                            <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                            <span>Sedang Diproses</span>
                          </span>
                        )}
                        {claim.status === 'PAID' && (
                          <span className="text-xs font-bold text-cyan-900 bg-cyan-50 px-3 py-1 rounded-full border border-cyan-200 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-sakode-cyan" />
                            <span>Telah Ditransfer</span>
                          </span>
                        )}
                        {claim.status === 'CONFIRMED' && (
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            <span>Pencairan Selesai</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Snapshot Rekening Tujuan Transfer */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-slate-500" />
                          <span className="text-xs font-bold text-slate-800">
                            {claim.bankAccountSnapshot?.bankName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <CreditCard className="h-4 w-4 text-slate-400" />
                          <span className="font-mono font-bold text-slate-900">
                            {displayAccountNum}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleUnmaskAccount(claim.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors"
                            title={isUnmasked ? 'Sembunyikan Nomor' : 'Buka Nomor Rekening Lengkap'}
                          >
                            {isUnmasked ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-700">
                            a.n. <strong>{claim.bankAccountSnapshot?.accountHolderName}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="text-left md:text-right">
                        <span className="text-[11px] text-slate-400 font-mono block">
                          Idempotency: {claim.idempotencyKey}
                        </span>
                        {claim.adminNotes && (
                          <span className="text-[11px] text-slate-600 italic block mt-0.5">
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
                            className="text-xs font-bold gap-1 text-slate-700"
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
              <div className="bg-white rounded-2xl shadow-2xl border border-sakode-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
                <div className="p-4 sm:p-5 border-b border-sakode-border bg-sakode-bg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-sakode-cyan" />
                    <h3 className="text-base font-extrabold text-sakode-text">
                      Konfirmasi Transfer Pembayaran
                    </h3>
                  </div>
                  <button
                    onClick={() => setActivePaymentClaim(null)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmitPayment} className="p-5 space-y-4 overflow-y-auto">
                  {/* Rekening Target Snapshot */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Target Rekening Snapshot:
                    </span>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Bank / Channel:</span>
                        <strong className="text-slate-900">
                          {activePaymentClaim.bankAccountSnapshot?.bankName}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Nomor Rekening:</span>
                        <strong className="font-mono text-slate-900 text-sm">
                          {activePaymentClaim.bankAccountSnapshot?.accountNumber}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Nama Penerima:</span>
                        <strong className="text-slate-900">
                          {activePaymentClaim.bankAccountSnapshot?.accountHolderName}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                        <span className="text-slate-600 font-bold">Nominal Transfer:</span>
                        <strong className="text-base font-black text-sakode-text">
                          {formatCurrencyIDR(activePaymentClaim.totalAmount)}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Transfer Proof Upload */}
                  <div>
                    <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1.5">
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
                    <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                      Catatan Referensi Transfer (Opsional)
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Contoh: No. Ref BCA 892348234 / Transfer Berhasil"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-sakode-border bg-white focus:outline-none focus:ring-1 focus:ring-sakode-cyan"
                    />
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
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
              <div className="bg-white rounded-2xl shadow-2xl border border-sakode-border w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-sakode-border flex items-center justify-between bg-sakode-bg">
                  <h4 className="text-sm font-bold text-sakode-text flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-sakode-cyan" />
                    <span>Bukti Transfer Pembayaran</span>
                  </h4>
                  <button
                    onClick={() => setActiveProofUrl(null)}
                    className="p-1 text-slate-400 hover:text-slate-700"
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
