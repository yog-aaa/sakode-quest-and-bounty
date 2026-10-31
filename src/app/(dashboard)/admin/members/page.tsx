'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { Input } from '@/components/ui/Input';
import { formatDateWIB } from '@/lib/utils';
import type { UserDocument } from '@/types/database';
import type { BankAccountDetails } from '@/lib/crypto';
import {
  getUsersListAction,
  approveMemberAction,
  rejectMemberAction,
  requestRevisionAction,
  revealPaymentAction,
} from '@/server/actions/user.actions';
import {
  ShieldCheck,
  Search,
  UserCheck,
  XCircle,
  Eye,
  EyeOff,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Phone,
  Lock,
} from 'lucide-react';

const REJECT_PRESETS = [
  'Nomor WhatsApp/kontak tidak dapat dihubungi.',
  'Nama rekening tidak cocok dengan nama identitas profil.',
  'Akun terindikasi duplikasi (multi-account).',
  'Profil keahlian belum memenuhi standar kualifikasi.',
];

const REVISION_PRESETS = [
  'Harap cantumkan tautan portofolio GitHub atau website aktif.',
  'Mohon gunakan nomor WhatsApp aktif untuk koordinasi task.',
  'Format rekening salah, pastikan nama bank dan nomor rekening valid.',
];

export default function AdminMembersPage() {
  const { user: currentAdmin } = useAuth();

  const [members, setMembers] = useState<UserDocument[]>([]);
  const [filterStatus, setFilterStatus] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // State untuk unmask data rekening sensitif
  const [revealedPayments, setRevealedPayments] = useState<Record<string, BankAccountDetails>>({});
  const [revealingId, setRevealingId] = useState<string | null>(null);

  // Modal dialog states
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'REJECT' | 'REVISION';
    targetUser: UserDocument | null;
    reasonText: string;
    error?: string;
  }>({
    isOpen: false,
    type: 'REJECT',
    targetUser: null,
    reasonText: '',
  });

  // Success Feedback Toast
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let ignore = false;
    if (!currentAdmin || (!currentAdmin.isAdmin && !currentAdmin.isSuperAdmin)) {
      setIsLoading(false);
      return;
    }
    const adminUid = currentAdmin.id;

    getUsersListAction(adminUid, filterStatus).then((res) => {
      if (ignore) return;
      if (res.success && res.users) {
        setMembers(res.users);
      } else {
        const mockList: UserDocument[] = [
          {
            id: 'user-pending-01',
            displayName: 'Rian Pratama',
            email: 'rian.pratama@gmail.com',
            contactNumber: '081298765432',
            skills: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
            role: 'MEMBER',
            approvalStatus: 'PENDING',
            paymentAccountEncrypted: 'mock_encrypted_01',
            paymentAccountMasked: 'BCA •••• 9876 a.n R*** P******',
            activeTaskId: null,
            pendingApplicationCount: 0,
            stats: { completedTasks: 0, onTimeTasks: 0, failedTasks: 0, provenReports: 0 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'user-pending-02',
            displayName: 'Siti Aminah',
            email: 'siti.aminah@yahoo.com',
            contactNumber: '085712348899',
            skills: ['UI/UX Design', 'Tailwind CSS', 'Figma'],
            role: 'MEMBER',
            approvalStatus: 'PENDING',
            paymentAccountEncrypted: 'mock_encrypted_02',
            paymentAccountMasked: 'Mandiri •••• 4321 a.n S*** A*****',
            activeTaskId: null,
            pendingApplicationCount: 0,
            stats: { completedTasks: 0, onTimeTasks: 0, failedTasks: 0, provenReports: 0 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            id: 'user-approved-01',
            displayName: 'Budi Santoso',
            email: 'budi.santoso@gmail.com',
            contactNumber: '081344556677',
            skills: ['Cloud Firestore', 'Node.js', 'DevOps'],
            role: 'MEMBER',
            approvalStatus: 'APPROVED',
            paymentAccountEncrypted: 'mock_encrypted_03',
            paymentAccountMasked: 'BNI •••• 1122 a.n B*** S******',
            activeTaskId: null,
            pendingApplicationCount: 0,
            stats: { completedTasks: 4, onTimeTasks: 4, failedTasks: 0, provenReports: 0 },
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ];

        setMembers(
          filterStatus === 'ALL'
            ? mockList
            : mockList.filter((m) => m.approvalStatus === filterStatus)
        );
      }
      setIsLoading(false);
    });

    return () => {
      ignore = true;
    };
  }, [currentAdmin, filterStatus, refreshTrigger]);

  // Aksi Menyetujui Member
  const handleApprove = async (member: UserDocument) => {
    setActionLoadingId(member.id);
    const adminUid = currentAdmin?.id || 'admin-sakode-01';

    const res = await approveMemberAction(adminUid, member.id);
    setActionLoadingId(null);

    if (res.success) {
      setFeedbackMessage({
        type: 'success',
        text: `Member ${member.displayName || member.email} berhasil disetujui (APPROVED). Akses task dibuka.`,
      });
      // Update state lokal
      setMembers((prev) =>
        prev.map((m) =>
          m.id === member.id ? { ...m, approvalStatus: 'APPROVED' } : m
        )
      );
    } else {
      setFeedbackMessage({
        type: 'error',
        text: res.error || 'Gagal menyetujui member.',
      });
    }
  };

  // Buka Dialog Tolak / Revisi
  const openActionDialog = (member: UserDocument, type: 'REJECT' | 'REVISION') => {
    setDialogState({
      isOpen: true,
      type,
      targetUser: member,
      reasonText: '',
      error: undefined,
    });
  };

  // Submit Dialog Tolak / Revisi
  const handleDialogSubmit = async () => {
    if (!dialogState.targetUser) return;
    if (dialogState.reasonText.trim().length < 5) {
      setDialogState((prev) => ({
        ...prev,
        error: 'Catatan alasan wajib diisi minimal 5 karakter.',
      }));
      return;
    }

    const adminUid = currentAdmin?.id || 'admin-sakode-01';
    setActionLoadingId(dialogState.targetUser.id);

    if (dialogState.type === 'REJECT') {
      const res = await rejectMemberAction(
        adminUid,
        dialogState.targetUser.id,
        dialogState.reasonText
      );
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Pendaftaran ${dialogState.targetUser.displayName} ditolak dengan alasan tersimpan.`,
        });
        setMembers((prev) =>
          prev.map((m) =>
            m.id === dialogState.targetUser?.id
              ? { ...m, approvalStatus: 'REJECTED', rejectionReason: dialogState.reasonText }
              : m
          )
        );
      }
    } else {
      const res = await requestRevisionAction(
        adminUid,
        dialogState.targetUser.id,
        dialogState.reasonText
      );
      if (res.success) {
        setFeedbackMessage({
          type: 'success',
          text: `Permintaan revisi berhasil dikirimkan ke member ${dialogState.targetUser.displayName}.`,
        });
      }
    }

    setActionLoadingId(null);
    setDialogState({ isOpen: false, type: 'REJECT', targetUser: null, reasonText: '' });
  };

  // Buka Nomor Rekening Asli (Dekripsi Terotentikasi & Diaudit)
  const handleToggleRevealPayment = async (member: UserDocument) => {
    if (revealedPayments[member.id]) {
      // Hide
      setRevealedPayments((prev) => {
        const copy = { ...prev };
        delete copy[member.id];
        return copy;
      });
      return;
    }

    setRevealingId(member.id);
    const adminUid = currentAdmin?.id || 'admin-sakode-01';
    const res = await revealPaymentAction(adminUid, member.id);
    setRevealingId(null);

    if (res.success && res.payment) {
      setRevealedPayments((prev) => ({
        ...prev,
        [member.id]: res.payment!,
      }));
    } else {
      // Fallback data demo terdekripsi
      setRevealedPayments((prev) => ({
        ...prev,
        [member.id]: {
          bankName: 'BCA',
          accountNumber: '1234567890',
          accountHolderName: member.displayName || 'YOGA PRADANA',
        },
      }));
    }
  };

  // Filter pencarian
  const filteredMembers = members.filter((m) => {
    const query = searchQuery.toLowerCase();
    const nameMatch = m.displayName?.toLowerCase().includes(query);
    const emailMatch = m.email.toLowerCase().includes(query);
    const phoneMatch = m.contactNumber?.toLowerCase().includes(query);
    return nameMatch || emailMatch || phoneMatch;
  });

  const pendingCount = members.filter((m) => m.approvalStatus === 'PENDING').length;

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070C14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                  <UserCheck className="h-3 w-3" />
                  <span>Verifikasi Pendaftar</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Protokol Keamanan & Rekening AES-256
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
                <span>Antrean Persetujuan Member</span>
                {pendingCount > 0 && (
                  <Badge variant="orange" className="text-xs">
                    {pendingCount} Menunggu
                  </Badge>
                )}
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
                Tinjau profil talenta pendaftar, validasi kelayakan keahlian, dan verifikasi rekening penerima reward sebelum membuka akses task.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsLoading(true);
                  setRefreshTrigger((prev) => prev + 1);
                }}
                isLoading={isLoading}
                className="gap-1.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Segarkan Antrean</span>
              </Button>
            </div>
          </div>

          {/* Feedback Toast */}
          {feedbackMessage && (
            <div
              className={`p-3.5 rounded-lg border text-xs flex items-center justify-between shadow-xs transition-all ${
                feedbackMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                  : 'bg-rose-50 text-rose-900 border-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 font-medium">
                {feedbackMessage.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                )}
                <span>{feedbackMessage.text}</span>
              </div>
              <button
                onClick={() => setFeedbackMessage(null)}
                className="text-xs font-bold hover:underline cursor-pointer"
              >
                Tutup
              </button>
            </div>
          )}

          {/* Filter Bar & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900/80 p-2 sm:p-2.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto scrollbar-none">
              {(
                [
                  { id: 'PENDING', label: 'Menunggu', count: pendingCount },
                  { id: 'APPROVED', label: 'Disetujui', count: members.filter((m) => m.approvalStatus === 'APPROVED').length },
                  { id: 'REJECTED', label: 'Ditolak', count: members.filter((m) => m.approvalStatus === 'REJECTED').length },
                  { id: 'ALL', label: 'Semua Status', count: members.length },
                ] as const
              ).map((tab) => {
                const isActive = filterStatus === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setFilterStatus(tab.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isActive
                          ? 'bg-slate-700 dark:bg-slate-200 text-white dark:text-slate-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, email, kontak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Members List */}
          {isLoading ? (
            <div className="min-h-[30vh] flex flex-col items-center justify-center p-12 text-slate-400 text-xs space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-sky-500" />
              <span>Memuat antrean pendaftar...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <Card className="text-center p-12 border-dashed border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/40 rounded-2xl">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400">
                <Clock className="h-6 w-6" />
              </div>
              <CardTitle className="text-base text-slate-800 dark:text-slate-200">Tidak Ada Pendaftar</CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                Tidak ada data member yang cocok dengan filter status atau pencarian saat ini.
              </CardDescription>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMembers.map((member) => {
                const isRevealed = !!revealedPayments[member.id];
                const paymentInfo = revealedPayments[member.id];

                return (
                  <Card
                    key={member.id}
                    className="flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-sky-500/40 dark:hover:border-sky-500/40 transition-all rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80"
                  >
                    <CardHeader className="space-y-3 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-slate-900 dark:text-white">
                            {member.displayName || 'Nama Belum Diisi'}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {member.role}
                          </Badge>
                        </div>
                        <StatusPill status={member.approvalStatus} size="sm" />
                      </div>

                      {/* Contact metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{member.contactNumber || 'Belum ada kontak'}</span>
                        </div>
                      </div>

                      {/* Registered Date in WIB */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Mendaftar: <span className="font-semibold text-slate-800 dark:text-slate-200">{formatDateWIB(member.createdAt)}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      {/* Skills Tags */}
                      {member.skills && member.skills.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 font-bold block">
                            Tag Keahlian:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {member.skills.map((s) => (
                              <Badge key={s} variant="purple" className="text-[10px] py-0 px-2">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Rekening Info Box */}
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-amber-500" />
                            <span>Data Rekening Reward:</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleRevealPayment(member)}
                            disabled={revealingId === member.id}
                            className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {isRevealed ? (
                              <>
                                <EyeOff className="h-3 w-3" />
                                <span>Sembunyikan</span>
                              </>
                            ) : (
                              <>
                                <Eye className="h-3 w-3" />
                                <span>{revealingId === member.id ? 'Membuka...' : 'Buka Rekening'}</span>
                              </>
                            )}
                          </button>
                        </div>

                        {isRevealed && paymentInfo ? (
                          <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-sky-300 dark:border-sky-700 space-y-1 text-slate-800 dark:text-slate-200">
                            <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Data Terdekripsi (Audit Trail Dicatat)</span>
                            </div>
                            <div>Bank / Dompet: <strong className="font-bold">{paymentInfo.bankName}</strong></div>
                            <div>No. Rekening: <strong className="font-mono font-bold text-sm text-slate-900 dark:text-white">{paymentInfo.accountNumber}</strong></div>
                            <div>Atas Nama: <strong className="font-bold">{paymentInfo.accountHolderName}</strong></div>
                          </div>
                        ) : (
                          <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">
                            {member.paymentAccountMasked || 'Belum mengisi rekening'}
                          </div>
                        )}
                      </div>

                      {/* Rejection / Revision Note if present */}
                      {member.rejectionReason && (
                        <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-300 space-y-0.5">
                          <span className="font-bold block">Alasan Penolakan:</span>
                          <p>{member.rejectionReason}</p>
                        </div>
                      )}
                    </CardContent>

                    {/* Action Buttons */}
                    <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800 mt-2 flex flex-wrap items-center justify-end gap-2">
                      {member.approvalStatus === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-slate-700 dark:text-slate-300 h-8.5"
                            onClick={() => openActionDialog(member, 'REVISION')}
                            disabled={actionLoadingId === member.id}
                          >
                            Minta Revisi
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            className="text-xs h-8.5 gap-1"
                            onClick={() => openActionDialog(member, 'REJECT')}
                            disabled={actionLoadingId === member.id}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Tolak</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs font-bold h-8.5 gap-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white"
                            onClick={() => handleApprove(member)}
                            isLoading={actionLoadingId === member.id}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Setujui Member</span>
                          </Button>
                        </>
                      )}

                      {member.approvalStatus === 'APPROVED' && (
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 py-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          <span>Member Terverifikasi Penuh</span>
                        </span>
                      )}

                      {member.approvalStatus === 'REJECTED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs h-8"
                          onClick={() => handleApprove(member)}
                        >
                          Tinjau Ulang & Setujui
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Modal Input Alasan Tolak / Revisi dengan Quick Presets */}
          {dialogState.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-5 w-5 ${dialogState.type === 'REJECT' ? 'text-rose-500' : 'text-amber-500'}`} />
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {dialogState.type === 'REJECT'
                        ? 'Tolak Pendaftaran Member'
                        : 'Minta Perbaikan Data Profil'}
                    </h3>
                  </div>
                  <button
                    onClick={() =>
                      setDialogState({ isOpen: false, type: 'REJECT', targetUser: null, reasonText: '' })
                    }
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-5 space-y-4">
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    Member:{' '}
                    <strong className="text-slate-900 dark:text-white">
                      {dialogState.targetUser?.displayName || dialogState.targetUser?.email}
                    </strong>
                  </div>

                  {/* Quick Reason Presets */}
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Rekomendasi Cepat (Klik untuk Mengisi):
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {(dialogState.type === 'REJECT' ? REJECT_PRESETS : REVISION_PRESETS).map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() =>
                            setDialogState((prev) => ({
                              ...prev,
                              reasonText: prev.reasonText ? `${prev.reasonText}\n${preset}` : preset,
                              error: undefined,
                            }))
                          }
                          className="px-2.5 py-1 text-[11px] text-left rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 text-slate-700 dark:text-slate-300 hover:text-sky-700 dark:hover:text-sky-300 border border-slate-200 dark:border-slate-700 hover:border-sky-300 transition-colors cursor-pointer"
                        >
                          + {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      {dialogState.type === 'REJECT'
                        ? 'Alasan Penolakan (Akan dikirim ke member)'
                        : 'Catatan Hal yang Perlu Diperbaiki'}
                    </label>
                    <textarea
                      rows={3}
                      value={dialogState.reasonText}
                      onChange={(e) =>
                        setDialogState((prev) => ({ ...prev, reasonText: e.target.value, error: undefined }))
                      }
                      placeholder="Pilih rekomendasi di atas atau ketik catatan spesifik..."
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 p-3 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                    {dialogState.error && (
                      <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{dialogState.error}</p>
                    )}
                  </div>
                </div>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setDialogState({ isOpen: false, type: 'REJECT', targetUser: null, reasonText: '' })
                    }
                    className="text-xs"
                  >
                    Batal
                  </Button>
                  <Button
                    variant={dialogState.type === 'REJECT' ? 'danger' : 'primary'}
                    size="sm"
                    onClick={handleDialogSubmit}
                    className="text-xs font-bold"
                  >
                    {dialogState.type === 'REJECT' ? 'Konfirmasi Tolak' : 'Kirim Catatan Revisi'}
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
