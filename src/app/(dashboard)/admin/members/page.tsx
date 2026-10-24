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
    const adminUid = currentAdmin?.id || 'admin-sakode-01';

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
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header & Breadcrumb */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sakode-border pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Link
                  href="/admin"
                  className="text-xs text-sakode-text-muted hover:text-sakode-text flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Antrean Admin</span>
                </Link>
                <span className="text-sakode-text-muted">/</span>
                <span className="text-xs font-bold text-sakode-text">Verifikasi Pendaftar</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-sakode-text tracking-tight flex items-center gap-2.5">
                <span>Antrean Persetujuan Member</span>
                {pendingCount > 0 && (
                  <Badge variant="orange" className="text-xs">
                    {pendingCount} Menunggu
                  </Badge>
                )}
              </h1>
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
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Filter Tabs */}
            <div className="flex items-center p-1 bg-sakode-card rounded-lg border border-sakode-border w-full sm:w-auto overflow-x-auto">
              {(
                [
                  { id: 'PENDING', label: 'Menunggu (PENDING)' },
                  { id: 'APPROVED', label: 'Disetujui' },
                  { id: 'REJECTED', label: 'Ditolak' },
                  { id: 'ALL', label: 'Semua Status' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterStatus(tab.id)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    filterStatus === tab.id
                      ? 'bg-sakode-cyan text-sakode-text shadow-xs font-extrabold'
                      : 'text-sakode-text-muted hover:text-sakode-text'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <Input
                placeholder="Cari nama, email, kontak..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                leftIcon={<Search className="h-4 w-4" />}
                className="h-10 text-xs"
              />
            </div>
          </div>

          {/* Members List */}
          {isLoading ? (
            <div className="min-h-[30vh] flex flex-col items-center justify-center p-12 text-sakode-text-muted text-xs space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-sakode-cyan" />
              <span>Memuat antrean pendaftar...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <Card className="text-center p-12">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Clock className="h-6 w-6" />
              </div>
              <CardTitle className="text-base text-sakode-text">Tidak Ada Pendaftar</CardTitle>
              <CardDescription className="text-xs">
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
                    className="flex flex-col justify-between shadow-xs hover:border-sakode-cyan/50 transition-colors"
                  >
                    <CardHeader className="space-y-3 pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-base text-sakode-text">
                            {member.displayName || 'Nama Belum Diisi'}
                          </span>
                          <Badge variant="outline" className="text-[10px]">
                            {member.role}
                          </Badge>
                        </div>
                        <StatusPill status={member.approvalStatus} size="sm" />
                      </div>

                      {/* Contact metadata */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-sakode-text-muted">
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-sakode-cyan shrink-0" />
                          <span className="truncate">{member.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          <span>{member.contactNumber || 'Belum ada kontak'}</span>
                        </div>
                      </div>

                      {/* Registered Date in WIB */}
                      <div className="text-[11px] text-sakode-text-muted">
                        Mendaftar: <span className="font-semibold text-sakode-text">{formatDateWIB(member.createdAt)}</span>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-0">
                      {/* Skills Tags */}
                      {member.skills && member.skills.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[11px] text-sakode-text-muted font-bold block">
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
                      <div className="p-3 rounded-lg bg-sakode-bg border border-sakode-border space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sakode-text flex items-center gap-1.5">
                            <Lock className="h-3.5 w-3.5 text-sakode-orange" />
                            <span>Data Rekening Reward:</span>
                          </span>

                          <button
                            type="button"
                            onClick={() => handleToggleRevealPayment(member)}
                            disabled={revealingId === member.id}
                            className="text-[11px] font-bold text-sakode-cyan hover:underline flex items-center gap-1 cursor-pointer"
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
                          <div className="p-2.5 rounded bg-white border border-sakode-cyan/50 space-y-1 text-slate-800">
                            <div className="text-[10px] uppercase font-bold text-emerald-700 flex items-center gap-1">
                              <ShieldCheck className="h-3 w-3" />
                              <span>Data Terdekripsi (Audit Trail Dicatat)</span>
                            </div>
                            <div>Bank / Dompet: <strong className="font-bold">{paymentInfo.bankName}</strong></div>
                            <div>No. Rekening: <strong className="font-mono font-bold text-sm text-sakode-text">{paymentInfo.accountNumber}</strong></div>
                            <div>Atas Nama: <strong className="font-bold">{paymentInfo.accountHolderName}</strong></div>
                          </div>
                        ) : (
                          <div className="font-mono text-xs font-semibold text-sakode-text">
                            {member.paymentAccountMasked || 'Belum mengisi rekening'}
                          </div>
                        )}
                      </div>

                      {/* Rejection / Revision Note if present */}
                      {member.rejectionReason && (
                        <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-0.5">
                          <span className="font-bold block">Alasan Penolakan:</span>
                          <p>{member.rejectionReason}</p>
                        </div>
                      )}
                    </CardContent>

                    {/* Action Buttons */}
                    <div className="p-4 pt-0 border-t border-sakode-border/50 mt-2 flex flex-wrap items-center justify-end gap-2">
                      {member.approvalStatus === 'PENDING' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs text-slate-700 h-9"
                            onClick={() => openActionDialog(member, 'REVISION')}
                            disabled={actionLoadingId === member.id}
                          >
                            Minta Revisi
                          </Button>

                          <Button
                            size="sm"
                            variant="danger"
                            className="text-xs h-9 gap-1"
                            onClick={() => openActionDialog(member, 'REJECT')}
                            disabled={actionLoadingId === member.id}
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            <span>Tolak</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="primary"
                            className="text-xs font-bold h-9 gap-1"
                            onClick={() => handleApprove(member)}
                            isLoading={actionLoadingId === member.id}
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>Setujui Member</span>
                          </Button>
                        </>
                      )}

                      {member.approvalStatus === 'APPROVED' && (
                        <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 py-1">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
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

          {/* Modal Input Alasan Tolak / Revisi */}
          {dialogState.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
              <Card className="max-w-md w-full shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-sakode-orange" />
                    <span>
                      {dialogState.type === 'REJECT'
                        ? 'Tolak Pendaftaran Member'
                        : 'Minta Perbaikan Data Profil'}
                    </span>
                  </CardTitle>
                  <CardDescription>
                    Member: <strong>{dialogState.targetUser?.displayName || dialogState.targetUser?.email}</strong>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-sakode-text">
                      {dialogState.type === 'REJECT'
                        ? 'Alasan Penolakan (Akan dibaca oleh member)'
                        : 'Catatan Hal yang Perlu Diperbaiki'}
                    </label>
                    <textarea
                      rows={3}
                      value={dialogState.reasonText}
                      onChange={(e) =>
                        setDialogState((prev) => ({ ...prev, reasonText: e.target.value, error: undefined }))
                      }
                      placeholder="Contoh: Nomor rekening dan nama buku tabungan tidak cocok..."
                      className="w-full rounded-lg border border-sakode-border p-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakode-cyan"
                    />
                    {dialogState.error && (
                      <p className="text-xs font-semibold text-sakode-orange">{dialogState.error}</p>
                    )}
                  </div>
                </CardContent>
                <div className="p-4 pt-0 flex justify-end gap-2 border-t border-sakode-border/50">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDialogState({ isOpen: false, type: 'REJECT', targetUser: null, reasonText: '' })
                    }
                  >
                    Batal
                  </Button>
                  <Button
                    variant={dialogState.type === 'REJECT' ? 'danger' : 'primary'}
                    size="sm"
                    onClick={handleDialogSubmit}
                  >
                    {dialogState.type === 'REJECT' ? 'Konfirmasi Tolak' : 'Kirim Catatan Revisi'}
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
