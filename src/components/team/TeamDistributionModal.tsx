'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  getTeamDistributionAction,
  proposeTeamSplitAction,
  voteTeamSplitAction,
  uploadLeadTransferProofAction,
  confirmTeamMemberDistributionAction,
} from '@/server/actions/claim.actions';
import { formatCurrencyIDR } from '@/lib/utils';
import { getClientFirestore } from '@/lib/firebase/client';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import type {
  TeamDistributionDocument,
  TeamMembershipDocument,
} from '@/types/database';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { TransferProofUploader } from '@/components/claim/TransferProofUploader';
import {
  Coins,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Shield,
  Send,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface TeamDistributionModalProps {
  teamId: string;
  taskId: string;
  taskTitle: string;
  totalReward: number;
  members: TeamMembershipDocument[];
  currentUserId: string;
  isTeamLead: boolean;
  onRefresh?: () => void;
}

export function TeamDistributionModal({
  teamId,
  taskId,
  taskTitle,
  totalReward,
  members,
  currentUserId,
  isTeamLead,
  onRefresh,
}: TeamDistributionModalProps) {
  const [distribution, setDistribution] = useState<TeamDistributionDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Lead Proposal Form State
  const [allocations, setAllocations] = useState<{ userId: string; amount: number }[]>([]);

  // Member Vote State
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Lead Transfer Proof Upload State (per member)
  const [uploadingForMemberId, setUploadingForMemberId] = useState<string | null>(null);

  // Load Distribution Data
  const loadDistribution = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // 1. Prioritaskan Client SDK Firestore
      try {
        const db = getClientFirestore();
        const q = query(collection(db, 'teamDistributions'), where('teamId', '==', teamId), limit(1));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const doc = snap.docs[0];
          setDistribution({ ...(doc.data() as TeamDistributionDocument), id: doc.id });
          setIsLoading(false);
          return;
        } else {
          setDistribution(null);
          const activeMembers = members.filter(
            (m) => m.status === 'APPROVED' || m.status === 'TERMS_ACCEPTED'
          );
          const count = activeMembers.length || 1;
          const equalShare = Math.floor(totalReward / count);
          const remainder = totalReward - equalShare * count;
          setAllocations(
            activeMembers.map((m, idx) => ({
              userId: m.userId,
              amount: equalShare + (idx === 0 ? remainder : 0),
            }))
          );
          setIsLoading(false);
          return;
        }
      } catch (clientErr) {
        console.warn('Client distribution fallback:', clientErr);
      }

      // 2. Fallback Server Action
      const res = await getTeamDistributionAction(teamId);
      if (res.success && res.distribution) {
        setDistribution(res.distribution);
      } else {
        setDistribution(null);
        const activeMembers = members.filter(
          (m) => m.status === 'APPROVED' || m.status === 'TERMS_ACCEPTED'
        );
        const count = activeMembers.length || 1;
        const equalShare = Math.floor(totalReward / count);
        const remainder = totalReward - equalShare * count;

        setAllocations(
          activeMembers.map((m, idx) => ({
            userId: m.userId,
            amount: equalShare + (idx === 0 ? remainder : 0),
          }))
        );
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memuat status pembagian reward tim.');
    } finally {
      setIsLoading(false);
    }
  }, [teamId, members, totalReward]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDistribution();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadDistribution]);

  // Real-time Calculation for Lead Allocation Form
  const totalAllocated = allocations.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);
  const remainingReward = totalReward - totalAllocated;
  const isAllocationValid = remainingReward === 0 && allocations.every((a) => a.amount > 0);

  const handleAllocationChange = (userId: string, value: string) => {
    const parsed = parseInt(value.replace(/\D/g, ''), 10) || 0;
    setAllocations((prev) =>
      prev.map((a) => (a.userId === userId ? { ...a, amount: parsed } : a))
    );
  };

  // Submit Proposal (Team Lead)
  const handleProposeSplit = async () => {
    if (!isAllocationValid) {
      setErrorMsg('Sisa alokasi harus tepat Rp 0.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await proposeTeamSplitAction(currentUserId, {
        teamId,
        taskId,
        allocations,
      });

      if (res.success && res.distribution) {
        setDistribution(res.distribution);
        setSuccessMsg('Proposal pembagian reward tim berhasil diajukan untuk musyawarah!');
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg(res.error || 'Gagal mengajukan proposal pembagian.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Vote Split (Member)
  const handleVote = async (agreed: boolean) => {
    if (!agreed && rejectionReason.trim().length < 10) {
      setErrorMsg('Catatan alasan penolakan wajib diisi minimal 10 karakter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await voteTeamSplitAction(currentUserId, {
        teamId,
        agreed,
        rejectionReason: agreed ? undefined : rejectionReason.trim(),
      });

      if (res.success && res.distribution) {
        setDistribution(res.distribution);
        setSuccessMsg(
          agreed
            ? 'Persetujuan Anda berhasil dicatat!'
            : 'Penolakan dicatat. Proposal dikembalikan ke tahap musyawarah.'
        );
        setIsRejecting(false);
        setRejectionReason('');
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg(res.error || 'Gagal mengirimkan keputusan suara.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Upload Member Proof (Team Lead)
  const handleUploadMemberProof = async (memberUserId: string, url: string) => {
    if (!url) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await uploadLeadTransferProofAction(currentUserId, {
        teamId,
        memberUserId,
        transferProofUrl: url,
      });
      if (res.success && res.distribution) {
        setDistribution(res.distribution);
        setSuccessMsg('Bukti transfer untuk anggota berhasil diunggah.');
        setUploadingForMemberId(null);
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg(res.error || 'Gagal mengunggah bukti transfer.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal mengunggah bukti.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Receipt (Member)
  const handleConfirmReceipt = async () => {
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await confirmTeamMemberDistributionAction(currentUserId, teamId);
      if (res.success && res.distribution) {
        setDistribution(res.distribution);
        setSuccessMsg('Penerimaan honor tim berhasil dikonfirmasi. Terima kasih atas kerja keras Anda!');
        if (onRefresh) onRefresh();
      } else {
        setErrorMsg(res.error || 'Gagal mengonfirmasi penerimaan honor.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal mengonfirmasi penerimaan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-sakode-purple" />
        <p className="text-xs text-sakode-text-muted mt-2 font-medium">
          Memuat status distribusi tim...
        </p>
      </Card>
    );
  }

  const userAllocation = distribution?.allocations.find((a) => a.userId === currentUserId);

  return (
    <div className="space-y-5">
      {/* Messages */}
      {errorMsg && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* CASE 1: PROPOSAL BELUM DIBUAT ATAU DITOLAK (DELIBERATION_REJECTED) */}
      {(!distribution || distribution.status === 'DELIBERATION_REJECTED') && isTeamLead && (
        <Card className="p-5 border-l-4 border-l-purple-500 space-y-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <Badge variant="purple" leftIcon={<Coins className="h-3.5 w-3.5" />}>
                Musyawarah Pembagian Bounty
              </Badge>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                Formulir Alokasi Reward: {taskTitle}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">
                Total Bounty Task
              </span>
              <strong className="text-base font-black text-slate-900 dark:text-white">
                {formatCurrencyIDR(totalReward)}
              </strong>
            </div>
          </div>

          {distribution?.status === 'DELIBERATION_REJECTED' && (
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Proposal Sebelumnya Membutuhkan Revisi</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300">
                Catatan Musyawarah: &quot;{distribution.rejectionNotes || 'Perlu penyesuaian nominal alokasi.'}&quot;
              </p>
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Sebagai Team Lead, tentukan nominal final Rupiah untuk setiap anggota tim. Seluruh nominal harus bulat (Integer Rupiah) dan total alokasi harus persis 100% sama dengan total bounty task.
          </p>

          <div className="space-y-3 pt-2">
            {allocations.map((item) => {
              const memberInfo = members.find((m) => m.userId === item.userId);
              const isLead = item.userId === currentUserId;
              return (
                <div
                  key={item.userId}
                  className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                      {(memberInfo?.userDisplayName || 'M')[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {memberInfo?.userDisplayName || memberInfo?.userEmail || item.userId}
                        </span>
                        {isLead && (
                          <span className="text-[10px] bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 px-1.5 py-0.2 rounded font-bold">
                            Lead
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{memberInfo?.userEmail}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Rp</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.amount ? item.amount.toLocaleString('id-ID') : ''}
                      onChange={(e) => handleAllocationChange(item.userId, e.target.value)}
                      placeholder="0"
                      className="w-36 px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-right focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Validation Status Tracker */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-600 dark:text-slate-400">Total Dialokasikan: {formatCurrencyIDR(totalAllocated)}</span>
            <span
              className={
                remainingReward === 0
                  ? 'text-emerald-700 dark:text-emerald-400 flex items-center gap-1'
                  : 'text-rose-700 dark:text-rose-400 flex items-center gap-1'
              }
            >
              {remainingReward === 0 ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Sisa Alokasi: Rp 0 (100% Pas)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  <span>
                    Sisa Alokasi: {remainingReward > 0 ? '+' : ''}
                    {formatCurrencyIDR(remainingReward)}
                  </span>
                </>
              )}
            </span>
          </div>

          <Button
            variant="team"
            disabled={!isAllocationValid || isSubmitting}
            onClick={handleProposeSplit}
            className="w-full font-bold gap-2 h-11 shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            <span>Ajukan Proposal Musyawarah Tim</span>
          </Button>
        </Card>
      )}

      {/* CASE 2: SEDANG DALAM TAHAP MUSYAWARAH / VOTING (DELIBERATION) */}
      {distribution && distribution.status === 'DELIBERATION' && (
        <Card className="p-5 border-l-4 border-l-amber-500 space-y-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <Badge variant="orange" leftIcon={<Clock className="h-3.5 w-3.5" />}>
                Voting Konsensus 100% Berjalan
              </Badge>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                Proposal Pembagian Honor Sedang Dimusyawarahkan
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Total Bounty: {formatCurrencyIDR(distribution.totalReward)}
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Setiap anggota wajib menyatakan persetujuan. Jika ada 1 anggota yang menolak, proposal akan dikembalikan ke Team Lead untuk direvisi.
          </p>

          {/* Allocation Table */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            {distribution.allocations.map((a) => (
              <div
                key={a.userId}
                className="p-3.5 flex items-center justify-between bg-white dark:bg-slate-900 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-7 w-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                    {(a.userDisplayName || 'M')[0]}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block">
                      {a.userDisplayName || a.userId}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Alokasi: <strong className="text-slate-800 dark:text-slate-200">{formatCurrencyIDR(a.amount)}</strong>
                    </span>
                  </div>
                </div>

                <div>
                  {a.agreed ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full text-[11px] border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Setuju</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 rounded-full text-[11px] border border-amber-200 dark:border-amber-800">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Menunggu Suara</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Member Voting Action Banner */}
          {userAllocation && !userAllocation.agreed && (
            <div className="p-4 rounded-xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/40 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <h4 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  Keputusan Persetujuan Anda
                </h4>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Anda dialokasikan nominal <strong>{formatCurrencyIDR(userAllocation.amount)}</strong>. Apakah Anda menyetujui nominal ini?
              </p>

              {!isRejecting ? (
                <div className="flex items-center gap-2 pt-1">
                  <Button
                    variant="team"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => handleVote(true)}
                    className="font-bold text-xs gap-1.5 shadow-sm"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Saya Setuju (100% Konsensus)</span>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isSubmitting}
                    onClick={() => setIsRejecting(true)}
                    className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>Tolak & Ajukan Musyawarah</span>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Tuliskan alasan musyawarah penolakan pembagian (minimal 10 karakter)..."
                    className="w-full p-2.5 text-xs rounded-xl border border-rose-300 dark:border-rose-900/50 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  />
                  <div className="flex items-center gap-2">
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={isSubmitting || rejectionReason.trim().length < 10}
                      onClick={() => handleVote(false)}
                      className="font-bold text-xs shadow-sm"
                    >
                      Kirim Penolakan
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIsRejecting(false);
                        setRejectionReason('');
                      }}
                      className="text-xs"
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

      {/* CASE 3: KONSENSUS 100% TERCAPAI (CONSENSUS_REACHED) */}
      {distribution &&
        (distribution.status === 'CONSENSUS_REACHED' ||
          distribution.status === 'COMPLETED') && (
          <Card className="p-5 border-l-4 border-l-emerald-500 space-y-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Badge variant="cyan" leftIcon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                  Konsensus 100% Tercapai
                </Badge>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                  Penyaluran Honor Anggota Tim
                </h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                {distribution.status === 'COMPLETED' ? 'Distribusi Selesai' : 'Tahap Pencairan'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Seluruh anggota tim telah menyetujui nominal alokasi reward. Dana penuh dicairkan oleh Team Lead dari Admin, lalu Team Lead mentransfer ke masing-masing anggota dan melampirkan bukti transfer.
            </p>

            {/* Transfer List per Member */}
            <div className="space-y-3 pt-2">
              {distribution.allocations.map((a) => {
                const proof = distribution.leadTransferProofs?.find(
                  (p) => p.memberUserId === a.userId
                );
                const isMe = a.userId === currentUserId;
                const isLeadPerson = a.userId === distribution.teamLeadUserId;

                return (
                  <div
                    key={a.userId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center">
                          {(a.userDisplayName || 'M')[0]}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {a.userDisplayName || a.userId}
                            </span>
                            {isLeadPerson && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-1.5 py-0.2 rounded">
                                Lead
                              </span>
                            )}
                            {isMe && (
                              <span className="text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold px-1.5 py-0.2 rounded">
                                Anda
                              </span>
                            )}
                          </div>
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            {formatCurrencyIDR(a.amount)}
                          </span>
                        </div>
                      </div>

                      <div>
                        {isLeadPerson ? (
                          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Transfer Admin
                          </span>
                        ) : proof?.confirmedByMember ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>Honor Dikonfirmasi</span>
                          </span>
                        ) : proof ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-800 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 px-2.5 py-1 rounded-full border border-cyan-200 dark:border-cyan-800">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Menunggu Konfirmasi</span>
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Menunggu Transfer Lead
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Proof Details or Upload Button for Team Lead */}
                    {!isLeadPerson && (
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        {proof ? (
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <a
                              href={proof.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-sky-600 dark:text-sky-400 underline hover:text-sky-700 font-bold flex items-center gap-1"
                            >
                              <span>Lihat Bukti Transfer Lead</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            Belum ada bukti transfer yang diunggah oleh Team Lead.
                          </span>
                        )}

                        {/* Team Lead: Upload/Change Proof */}
                        {isTeamLead && !proof?.confirmedByMember && (
                          <div className="shrink-0">
                            {uploadingForMemberId === a.userId ? (
                              <div className="w-full sm:w-72">
                                <TransferProofUploader
                                  claimIdOrContext={`team_${teamId}_${a.userId}`}
                                  onUploaded={(url) => handleUploadMemberProof(a.userId, url)}
                                  disabled={isSubmitting}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setUploadingForMemberId(null)}
                                  className="text-[11px] mt-1"
                                >
                                  Tutup
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setUploadingForMemberId(a.userId)}
                                className="text-xs font-bold"
                              >
                                {proof ? 'Ganti Bukti Transfer' : 'Unggah Bukti Transfer'}
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Member: Confirm Receipt Button */}
                        {isMe && proof && !proof.confirmedByMember && (
                          <Button
                            variant="primary"
                            size="sm"
                            disabled={isSubmitting}
                            onClick={handleConfirmReceipt}
                            className="font-bold text-xs gap-1.5 shadow-sm"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Konfirmasi Telah Menerima Honor</span>
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
    </div>
  );
}
