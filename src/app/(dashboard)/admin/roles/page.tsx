'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  getAdminStaffListAction,
  getEligibleMembersForPromotionAction,
  manageAdminRoleAction,
} from '@/server/actions/admin-manage.actions';
import { ViewModeToggle, type ViewMode } from '@/components/ui/ViewModeToggle';
import type { UserDocument } from '@/types/database';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  Users,
  Search,
  Loader2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  ArrowLeft,
  Lock,
} from 'lucide-react';

export default function SuperAdminRolesPage() {
  const { user } = useAuth();

  const [staff, setStaff] = useState<UserDocument[]>([]);
  const [members, setMembers] = useState<UserDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State for Promote / Demote
  const [activeModalUser, setActiveModalUser] = useState<UserDocument | null>(null);
  const [modalAction, setModalAction] = useState<'PROMOTE' | 'DEMOTE'>('PROMOTE');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sakode_admin_roles_view_mode') as ViewMode | null;
      if (saved === 'grid' || saved === 'list' || saved === 'table') return saved;
    }
    return 'list';
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [resStaff, resMembers] = await Promise.all([
        getAdminStaffListAction(user.id),
        getEligibleMembersForPromotionAction(user.id),
      ]);

      if (resStaff.success && resStaff.staff) {
        setStaff(resStaff.staff);
      } else if (resStaff.error) {
        setErrorMsg(resStaff.error);
      }

      if (resMembers.success && resMembers.members) {
        setMembers(resMembers.members);
      } else if (resMembers.error) {
        setErrorMsg(resMembers.error);
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memuat data staf admin.');
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

  const handleOpenModal = (targetUser: UserDocument, actionType: 'PROMOTE' | 'DEMOTE') => {
    setActiveModalUser(targetUser);
    setModalAction(actionType);
    setReason('');
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleConfirmRoleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeModalUser) return;

    if (reason.trim().length < 15) {
      setErrorMsg('Alasan mutasi role admin wajib dicantumkan minimal 15 karakter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await manageAdminRoleAction(user.id, {
        targetUserId: activeModalUser.id,
        action: modalAction,
        reason: reason.trim(),
      });

      if (res.success) {
        setSuccessMsg(
          modalAction === 'PROMOTE'
            ? `Berhasil mengangkat ${activeModalUser.displayName || activeModalUser.email} menjadi Administrator!`
            : `Berhasil mencabut hak akses admin dari ${activeModalUser.displayName || activeModalUser.email}.`
        );
        setActiveModalUser(null);
        await loadData();
      } else {
        setErrorMsg(res.error || 'Gagal mengubah role pengguna.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan memproses mutasi role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = members.filter((m) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (m.displayName || '').toLowerCase().includes(term) ||
      m.email.toLowerCase().includes(term)
    );
  });

  return (
    <AuthGuard requireSuperAdmin>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070C14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                  <Lock className="h-3 w-3" />
                  <span>Wewenang Eksklusif Super Admin</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Delegasi Hak Akses Staf
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Manajemen Role Administrator
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Angkat staf baru menjadi Admin atau cabut hak akses dengan kewajiban mencantumkan alasan tertulis pada log audit permanen.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadData}
                disabled={isLoading}
                className="text-xs font-bold gap-1.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Segarkan Data</span>
              </Button>
            </div>
          </div>

          {/* Messages */}
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

          {/* Section 1: Active Staff List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                <span>Daftar Administrator Aktif ({staff.length})</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {staff.map((member) => {
                const isMe = member.id === user?.id;
                const isSuperAdminRole = member.role === 'SUPER_ADMIN';

                return (
                  <Card key={member.id} className="p-4 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 rounded-2xl flex flex-col justify-between space-y-3 shadow-2xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {member.displayName || member.email}
                          </span>
                          {isMe && (
                            <span className="text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold px-1.5 py-0.2 rounded">
                              Anda
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate">{member.email}</span>
                      </div>

                      <Badge variant={isSuperAdminRole ? 'purple' : 'cyan'}>
                        {member.role}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[150px]">
                        UID: {member.id}
                      </span>

                      {!isSuperAdminRole && !isMe ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenModal(member, 'DEMOTE')}
                          className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 h-8 cursor-pointer"
                        >
                          <UserX className="h-3.5 w-3.5 mr-1" />
                          <span>Cabut Akses Admin</span>
                        </Button>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                          Akses Utama Dilindungi
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Section 2: Promote Eligible Members */}
          <div className="space-y-3 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4 text-sky-500" />
                  <span>Anggota Terverifikasi untuk Promosi</span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Hanya anggota yang telah berstatus APPROVED yang dapat diangkat menjadi staf Admin.
                </p>
              </div>

              {/* Search Box & View Mode Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                  <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari nama / email member..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
                  />
                </div>

                <div className="shrink-0 self-end sm:self-auto">
                  <ViewModeToggle
                    currentMode={viewMode}
                    onChange={setViewMode}
                    storageKey="sakode_admin_roles_view_mode"
                  />
                </div>
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <p className="text-xs text-slate-400 dark:text-slate-500 italic py-4">
                Tidak ada anggota terverifikasi yang cocok dengan pencarian.
              </p>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredMembers.map((m) => (
                  <Card
                    key={m.id}
                    className="p-4 border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 rounded-2xl shadow-2xs flex flex-col justify-between space-y-3"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {m.displayName || m.email}
                        </span>
                        <Badge variant="outline">{m.approvalStatus}</Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                        {m.email}
                      </span>
                      {m.skills && m.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {m.skills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                        {m.id.slice(0, 10)}...
                      </span>
                      <Button
                        variant="team"
                        size="sm"
                        onClick={() => handleOpenModal(m, 'PROMOTE')}
                        className="text-xs font-bold gap-1 h-7 cursor-pointer"
                      >
                        <UserCheck className="h-3 w-3" />
                        <span>Angkat Admin</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            ) : viewMode === 'table' ? (
              <div className="border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/80 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3.5">Nama & Email</th>
                        <th className="p-3.5">Skills / Spesialisasi</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                      {filteredMembers.map((m) => (
                        <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {m.displayName || m.email}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">{m.email}</span>
                          </td>
                          <td className="p-3.5">
                            {m.skills && m.skills.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {m.skills.slice(0, 3).map((s) => (
                                  <span
                                    key={s}
                                    className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded"
                                  >
                                    {s}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Belum ada skill</span>
                            )}
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <Badge variant="outline">{m.approvalStatus}</Badge>
                          </td>
                          <td className="p-3.5 whitespace-nowrap text-right">
                            <Button
                              variant="team"
                              size="sm"
                              onClick={() => handleOpenModal(m, 'PROMOTE')}
                              className="text-xs font-bold gap-1 h-7 cursor-pointer"
                            >
                              <UserCheck className="h-3 w-3" />
                              <span>Promosikan</span>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900/80 overflow-hidden shadow-2xs">
                {filteredMembers.map((m) => (
                  <div
                    key={m.id}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {m.displayName || m.email}
                        </span>
                        <Badge variant="outline">{m.approvalStatus}</Badge>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">{m.email}</span>
                      {m.skills && m.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {m.skills.slice(0, 3).map((s) => (
                            <span
                              key={s}
                              className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-1.5 py-0.2 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <Button
                        variant="team"
                        size="sm"
                        onClick={() => handleOpenModal(m, 'PROMOTE')}
                        className="text-xs font-bold gap-1 h-8 cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Angkat Jadi Admin</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Modal Konfirmasi Mutasi Role */}
          {activeModalUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {modalAction === 'PROMOTE' ? (
                      <UserCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <UserX className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    )}
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {modalAction === 'PROMOTE'
                        ? 'Pengangkatan Staf Administrator'
                        : 'Pencabutan Akses Administrator'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveModalUser(null)}
                    className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleConfirmRoleChange} className="p-5 space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Target Pengguna:</span>
                    <strong className="text-slate-900 dark:text-white block font-bold">
                      {activeModalUser.displayName || activeModalUser.email}
                    </strong>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 block">
                      {activeModalUser.email}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Alasan Mutasi Role (Min. 15 Karakter - Wajib Audit):
                    </label>
                    <textarea
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Jelaskan kebutuhan penambahan staf admin atau dasar evaluasi pencabutan wewenang..."
                      className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500 leading-relaxed"
                    />
                  </div>

                  <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveModalUser(null)}
                      className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      variant={modalAction === 'PROMOTE' ? 'team' : 'danger'}
                      size="sm"
                      disabled={isSubmitting || reason.trim().length < 15}
                      className="font-bold text-xs gap-1.5 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      <span>
                        {modalAction === 'PROMOTE' ? 'Konfirmasi Angkat Admin' : 'Konfirmasi Cabut Akses'}
                      </span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
