'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrencyIDR } from '@/lib/utils';
import {
  getUserRewardLedgersAction,
  getUserClaimsAction,
  submitBatchClaimAction,
  confirmClaimReceiptAction,
} from '@/server/actions/claim.actions';
import type { RewardLedgerDocument, ClaimDocument } from '@/types/database';
import {
  Coins,
  Wallet,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  FileText,
  ExternalLink,
  Loader2,
  Check,
  X,
  CreditCard,
  Building,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export default function MemberRewardsPage() {
  const { user } = useAuth();

  const [ledgers, setLedgers] = useState<RewardLedgerDocument[]>([]);
  const [claims, setClaims] = useState<ClaimDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Selection state
  const [selectedLedgerIds, setSelectedLedgerIds] = useState<string[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmittingClaim, setIsSubmittingClaim] = useState(false);

  // Transfer Proof Viewer State
  const [activeProofUrl, setActiveProofUrl] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<'available' | 'history'>('available');

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [resLedgers, resClaims] = await Promise.all([
        getUserRewardLedgersAction(user.id),
        getUserClaimsAction(user.id),
      ]);

      if (resLedgers.success && resLedgers.ledgers) {
        setLedgers(resLedgers.ledgers);
      } else if (resLedgers.error) {
        setErrorMsg(resLedgers.error);
      }

      if (resClaims.success && resClaims.claims) {
        setClaims(resClaims.claims);
      } else if (resClaims.error) {
        setErrorMsg(resClaims.error);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memuat data keuangan.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadData]);

  // Available rewards
  const availableLedgers = ledgers.filter((l) => l.status === 'AVAILABLE');

  // Summary Metrics
  const balanceReadyToClaim = availableLedgers.reduce((sum, l) => sum + (l.amount || 0), 0);

  const balanceProcessing = claims
    .filter((c) => c.status === 'CLAIMED' || c.status === 'PROCESSING')
    .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  const balancePaidConfirmed = claims
    .filter((c) => c.status === 'PAID' || c.status === 'CONFIRMED')
    .reduce((sum, c) => sum + (c.totalAmount || 0), 0);

  // Selection handlers
  const handleToggleSelect = (id: string) => {
    setSelectedLedgerIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLedgerIds.length === availableLedgers.length) {
      setSelectedLedgerIds([]);
    } else {
      setSelectedLedgerIds(availableLedgers.map((l) => l.id));
    }
  };

  const selectedItems = availableLedgers.filter((l) => selectedLedgerIds.includes(l.id));
  const selectedTotalAmount = selectedItems.reduce((sum, l) => sum + (l.amount || 0), 0);

  // Submit Batch Claim
  const handleProceedClaim = async () => {
    if (!user || selectedLedgerIds.length === 0) return;

    if (!user.paymentAccountMasked) {
      setErrorMsg('Rekening perbankan belum diisi. Silakan perbarui profil Anda terlebih dahulu.');
      setShowConfirmModal(false);
      return;
    }

    setIsSubmittingClaim(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Generate unique idempotency key
    const idempotencyKey = `idemp_${user.id.slice(0, 5)}_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 7)}`;

    try {
      const res = await submitBatchClaimAction(user.id, {
        rewardLedgerIds: selectedLedgerIds,
        idempotencyKey,
      });

      if (res.success && res.claim) {
        setSuccessMsg(
          `Permohonan pencairan dana sebesar ${formatCurrencyIDR(
            res.claim.totalAmount
          )} berhasil diajukan! Menunggu verifikasi admin.`
        );
        setShowConfirmModal(false);
        setSelectedLedgerIds([]);
        setActiveTab('history');
        await loadData();
      } else {
        setErrorMsg(res.error || 'Gagal mengajukan pencairan dana.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat memproses klaim.');
    } finally {
      setIsSubmittingClaim(false);
    }
  };

  // Confirm Receipt
  const handleConfirmReceipt = async (claimId: string) => {
    if (!user) return;
    setActionLoadingId(claimId);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await confirmClaimReceiptAction(user.id, claimId);
      if (res.success) {
        setSuccessMsg('Terima kasih! Penerimaan dana telah berhasil dikonfirmasi.');
        await loadData();
      } else {
        setErrorMsg(res.error || 'Gagal mengonfirmasi penerimaan.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan saat konfirmasi penerimaan.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <AuthGuard requireApproved>
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="cyan" leftIcon={<Coins className="h-3.5 w-3.5" />}>
                  Dompet Reward
                </Badge>
                <span className="text-xs text-sakode-text-muted">SAKODE Academy</span>
              </div>
              <h1 className="text-2xl font-black text-sakode-text tracking-tight mt-1">
                Klaim & Saldo Reward
              </h1>
              <p className="text-xs text-sakode-text-muted">
                Kelola pencairan honor pengerjaan task solo dan reward hasil kolaborasi tim Anda.
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={isLoading}
              className="text-xs font-bold gap-1.5 self-start sm:self-auto"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Segarkan Data</span>
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

          {/* 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="p-5 border-l-4 border-l-sakode-cyan bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sakode-text-muted uppercase tracking-wider">
                  Siap Dicairkan
                </span>
                <div className="h-8 w-8 rounded-lg bg-sakode-cyan/20 text-[#076991] flex items-center justify-center">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-sakode-text">
                  {formatCurrencyIDR(balanceReadyToClaim)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {availableLedgers.length} item reward tersedia
                </span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-amber-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sakode-text-muted uppercase tracking-wider">
                  Sedang Diproses
                </span>
                <div className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Clock className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-sakode-text">
                  {formatCurrencyIDR(balanceProcessing)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Dalam antrean transfer admin
                </span>
              </div>
            </Card>

            <Card className="p-5 border-l-4 border-l-emerald-500 bg-white">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-sakode-text-muted uppercase tracking-wider">
                  Total Diterima
                </span>
                <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-sakode-text">
                  {formatCurrencyIDR(balancePaidConfirmed)}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Telah berhasil dicairkan
                </span>
              </div>
            </Card>
          </div>

          {/* Bank Account Banner */}
          <div className="p-4 rounded-xl border border-sakode-border bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Rekening Penerima Terdaftar:
                </span>
                <span className="text-sm font-black text-sakode-text">
                  {user?.paymentAccountMasked || 'Belum diatur'}
                </span>
              </div>
            </div>

            <Link href="/member/settings">
              <Button variant="ghost" size="sm" className="text-xs font-bold text-sakode-cyan">
                <span>Ubah Rekening</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          </div>

          {/* Tabs Control */}
          <div className="flex items-center gap-2 border-b border-sakode-border">
            <button
              onClick={() => setActiveTab('available')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'available'
                  ? 'border-sakode-cyan text-sakode-text'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Coins className="h-4 w-4" />
              <span>Reward Tersedia ({availableLedgers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`pb-3 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'border-sakode-cyan text-sakode-text'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>Riwayat Pencairan ({claims.length})</span>
            </button>
          </div>

          {/* TAB 1: AVAILABLE REWARDS & BATCH CLAIM */}
          {activeTab === 'available' && (
            <div className="space-y-4">
              {availableLedgers.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-sakode-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-sakode-text cursor-pointer select-none"
                    >
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors ${
                          selectedLedgerIds.length === availableLedgers.length
                            ? 'bg-sakode-cyan border-sakode-cyan text-sakode-text'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {selectedLedgerIds.length === availableLedgers.length && (
                          <Check className="h-3 w-3 stroke-[3]" />
                        )}
                      </div>
                      <span>
                        Pilih Semua ({selectedLedgerIds.length}/{availableLedgers.length})
                      </span>
                    </button>

                    {selectedTotalAmount > 0 && (
                      <span className="text-xs text-slate-500 font-medium border-l border-slate-200 pl-3">
                        Total Pilihan: <strong className="text-sakode-text">{formatCurrencyIDR(selectedTotalAmount)}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedLedgerIds(availableLedgers.map((l) => l.id));
                        setShowConfirmModal(true);
                      }}
                      className="text-xs font-bold gap-1"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-sakode-cyan" />
                      <span>Cairkan Semua (Claim All)</span>
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      disabled={selectedLedgerIds.length === 0}
                      onClick={() => setShowConfirmModal(true)}
                      className="font-bold text-xs gap-1.5"
                    >
                      <Wallet className="h-3.5 w-3.5" />
                      <span>Cairkan Terpilih ({selectedLedgerIds.length})</span>
                    </Button>
                  </div>
                </div>
              )}

              {availableLedgers.length === 0 ? (
                <Card className="p-12 text-center bg-white space-y-3">
                  <Coins className="h-12 w-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-extrabold text-sakode-text">
                    Belum Ada Saldo Reward Tersedia
                  </h3>
                  <p className="text-xs text-sakode-text-muted max-w-md mx-auto">
                    Selesaikan tugas bounty di menu Eksplor Task atau klaim bagian dari kolaborasi tim Anda untuk mengumpulkan saldo reward di sini.
                  </p>
                  <Link href="/member/tasks">
                    <Button variant="primary" size="sm" className="font-bold text-xs mt-2">
                      Eksplor Task Tersedia
                    </Button>
                  </Link>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {availableLedgers.map((ledger) => {
                    const isSelected = selectedLedgerIds.includes(ledger.id);
                    return (
                      <div
                        key={ledger.id}
                        onClick={() => handleToggleSelect(ledger.id)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'border-sakode-cyan ring-1 ring-sakode-cyan bg-sakode-cyan/5'
                            : 'border-sakode-border hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-sakode-cyan border-sakode-cyan text-sakode-text'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-sakode-text">
                                {ledger.taskTitle || 'Bounty Task'}
                              </span>
                              {ledger.teamId ? (
                                <Badge variant="purple">Klaim Tim</Badge>
                              ) : (
                                <Badge variant="cyan">Solo</Badge>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              ID: {ledger.id}
                            </span>
                          </div>
                        </div>

                        <div className="text-right sm:text-right pl-8 sm:pl-0">
                          <span className="text-base font-black text-sakode-text block">
                            {formatCurrencyIDR(ledger.amount)}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Siap Dicairkan
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RIWAYAT KLAIM & TRACKER PEMBAYARAN */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {claims.length === 0 ? (
                <Card className="p-12 text-center bg-white space-y-3">
                  <Clock className="h-12 w-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-extrabold text-sakode-text">
                    Belum Ada Riwayat Pencairan
                  </h3>
                  <p className="text-xs text-sakode-text-muted">
                    Ketika Anda mencairkan saldo reward, pelacakan proses verifikasi dan transfer bank akan muncul di sini.
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {claims.map((claim) => {
                    const isPaid = claim.status === 'PAID';

                    return (
                      <Card key={claim.id} className="p-5 border-sakode-border bg-white space-y-4">
                        {/* Header claim card */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-500">
                                #{claim.id}
                              </span>
                              <span className="text-xs text-slate-400">•</span>
                              <span className="text-xs text-slate-600">
                                {claim.rewardLedgerIds?.length || 1} task
                              </span>
                            </div>
                            <h3 className="text-lg font-black text-sakode-text mt-0.5">
                              {formatCurrencyIDR(claim.totalAmount)}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2">
                            {claim.status === 'CLAIMED' && (
                              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                                <span>Menunggu Verifikasi Admin</span>
                              </span>
                            )}
                            {claim.status === 'PROCESSING' && (
                              <span className="text-xs font-bold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200 flex items-center gap-1">
                                <RefreshCw className="h-3.5 w-3.5 text-blue-600 animate-spin" />
                                <span>Sedang Diproses Transfer</span>
                              </span>
                            )}
                            {claim.status === 'PAID' && (
                              <span className="text-xs font-bold text-cyan-900 bg-cyan-50 px-2.5 py-1 rounded-full border border-cyan-200 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-sakode-cyan" />
                                <span>Telah Ditransfer (Menunggu Konfirmasi)</span>
                              </span>
                            )}
                            {claim.status === 'CONFIRMED' && (
                              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Pencairan Selesai</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Snapshot Rekening Tujuan */}
                        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-slate-700">
                            <CreditCard className="h-4 w-4 text-slate-400 shrink-0" />
                            <span>
                              Rekening Tujuan (Snapshot):{' '}
                              <strong>
                                {claim.bankAccountSnapshot?.bankName} - {claim.bankAccountSnapshot?.accountNumber}
                              </strong>{' '}
                              (a.n. {claim.bankAccountSnapshot?.accountHolderName})
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400 font-mono">
                            Idempotency: {claim.idempotencyKey.slice(0, 16)}...
                          </span>
                        </div>

                        {/* Actions & Proof */}
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
                                <span>Lihat Bukti Transfer Admin</span>
                              </Button>
                            )}
                          </div>

                          {isPaid && (
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={actionLoadingId === claim.id}
                              onClick={() => handleConfirmReceipt(claim.id)}
                              className="font-bold text-xs gap-1.5 shadow-sm"
                            >
                              {actionLoadingId === claim.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              )}
                              <span>Konfirmasi Penerimaan Dana</span>
                            </Button>
                          )}
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CONFIRMATION MODAL */}
          {showConfirmModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-sakode-border w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 border-b border-sakode-border bg-sakode-bg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-sakode-cyan" />
                    <h3 className="text-base font-extrabold text-sakode-text">
                      Konfirmasi Pencairan Dana
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="p-1 text-slate-400 hover:text-slate-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Anda akan mencairkan <strong>{selectedItems.length} reward item</strong> dengan rincian:
                  </p>

                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-lg p-2 bg-slate-50 text-xs">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="py-1.5 flex items-center justify-between">
                        <span className="truncate max-w-[220px] font-medium text-slate-700">
                          {item.taskTitle || item.id}
                        </span>
                        <strong className="text-sakode-text">{formatCurrencyIDR(item.amount)}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 rounded-lg bg-cyan-50/60 border border-sakode-cyan/30 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Total Pencairan:</span>
                    <span className="text-lg font-black text-sakode-text">
                      {formatCurrencyIDR(selectedTotalAmount)}
                    </span>
                  </div>

                  {/* Rekening Tujuan Snapshot Info */}
                  <div className="p-3 rounded-lg bg-slate-100/70 border border-slate-200 text-xs space-y-1">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Rekening Penerima (Tersimpan Permanen):
                    </span>
                    <span className="font-bold text-slate-800 block">
                      {user?.paymentAccountMasked || 'Belum diatur'}
                    </span>
                    <span className="text-[10px] text-slate-500 block leading-tight">
                      * Snapshot rekening tujuan akan disimpan permanen pada catatan permohonan klaim.
                    </span>
                  </div>
                </div>

                <div className="p-4 border-t border-sakode-border bg-sakode-bg flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowConfirmModal(false)}
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={isSubmittingClaim}
                    onClick={handleProceedClaim}
                    className="font-bold text-xs gap-1.5"
                  >
                    {isSubmittingClaim ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>Ajukan Pencairan Sekarang</span>
                  </Button>
                </div>
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
                    <span>Bukti Transfer Pembayaran Admin</span>
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
