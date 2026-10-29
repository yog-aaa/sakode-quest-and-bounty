'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDateWIB } from '@/lib/utils';
import { SUPPORTED_PAYMENT_PROVIDERS, type SupportedPaymentProvider } from '@/lib/validations/auth';
import { getUserProfileAction, updateSelfProfileAction } from '@/server/actions/user.actions';
import type { UserDocument } from '@/types/database';
import {
  User,
  ShieldCheck,
  Mail,
  Phone,
  CreditCard,
  Building,
  Lock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Save,
} from 'lucide-react';

export default function AdminProfilePage() {
  const { user: authUser, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Form State
  const [displayName, setDisplayName] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Rekening Form State
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [bankName, setBankName] = useState<SupportedPaymentProvider>('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const authUserId = authUser?.id;

  // Load profil detail dari database
  useEffect(() => {
    let ignore = false;
    if (!authUserId) return;

    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getUserProfileAction(authUserId!);
        if (!ignore && res.success && res.user) {
          setProfile(res.user);
          setDisplayName(res.user.displayName || '');
          setContactNumber(res.user.contactNumber || '');
        }
      } catch (err) {
        console.error('Gagal memuat profil admin:', err);
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [authUserId]);

  // Submit Update Profil
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser?.id) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const payload: {
        displayName: string;
        contactNumber: string;
        bankName?: SupportedPaymentProvider;
        accountNumber?: string;
        accountHolderName?: string;
      } = {
        displayName: displayName.trim(),
        contactNumber: contactNumber.trim(),
      };

      if (isEditingPayment) {
        if (!accountNumber.trim() || !accountHolderName.trim()) {
          setFeedback({
            type: 'error',
            message: 'Jika ingin memperbarui rekening, mohon lengkapi nomor dan nama pemilik rekening.',
          });
          setIsSaving(false);
          return;
        }
        payload.bankName = bankName;
        payload.accountNumber = accountNumber.trim();
        payload.accountHolderName = accountHolderName.trim();
      }

      const res = await updateSelfProfileAction(authUser.id, payload);

      if (res.success && res.user) {
        setProfile(res.user);
        setDisplayName(res.user.displayName || '');
        setContactNumber(res.user.contactNumber || '');
        setIsEditingPayment(false);
        setAccountNumber('');
        setAccountHolderName('');
        await refreshProfile();
        setFeedback({
          type: 'success',
          message: 'Profil administrator berhasil diperbarui! Perubahan tercatat di audit log.',
        });
      } else {
        setFeedback({
          type: 'error',
          message: res.error || 'Gagal memperbarui profil.',
        });
      }
    } catch (err) {
      console.error(err);
      setFeedback({
        type: 'error',
        message: 'Terjadi kesalahan sistem saat memperbarui profil.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const initial = (profile?.displayName || authUser?.email || 'A')[0].toUpperCase();
  const roleName = authUser?.isSuperAdmin ? 'Super Admin' : 'Admin';

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070C14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                  <User className="h-3 w-3" />
                  <span>Manajemen Profil Staf</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Akun Resmi Administrator
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Profil & Informasi Akun Saya
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Kelola identitas staf, nomor kontak operasional WhatsApp, dan rekening penerima honor/payout SAKODE.
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {feedback && (
            <div
              className={`p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-150 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {feedback.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <span>{feedback.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-500 mb-2" />
              <p className="text-xs">Memuat informasi akun staf...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Card 1: Header Identitas & Ringkasan Kredensial */}
              <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs overflow-hidden">
                <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-gradient-to-r from-sky-500/5 via-cyan-500/5 to-purple-500/5 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="relative">
                    <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-sky-400 via-cyan-500 to-purple-500 text-white flex items-center justify-center text-3xl font-black shadow-lg ring-4 ring-white dark:ring-slate-900">
                      {initial}
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 shadow-xs" title="Akun Aktif" />
                  </div>

                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h2 className="text-xl font-black text-slate-900 dark:text-white">
                        {profile?.displayName || 'Administrator SAKODE'}
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-xs font-bold text-purple-700 dark:text-purple-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span>{roleName}</span>
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-slate-400" />
                      <span>{profile?.email || authUser?.email}</span>
                    </p>

                    <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>ID Akun: <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">{authUser?.id}</code></span>
                      <span>Terdaftar: {formatDateWIB(profile?.createdAt || new Date().toISOString())}</span>
                    </div>
                  </div>
                </div>

                {/* Form Isian Profil Dasar */}
                <CardContent className="p-6 sm:p-8 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Nama Tampilan Lengkap <span className="text-rose-500">*</span>
                      </label>
                      <Input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Contoh: Yoga Pradana"
                        required
                        className="h-10 text-xs bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Nama ini akan tertera pada log audit dan keputusan review.
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                        Nomor WhatsApp / Kontak <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Input
                          type="tel"
                          value={contactNumber}
                          onChange={(e) => setContactNumber(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          required
                          className="h-10 text-xs pl-9 bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
                        />
                        <Phone className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Digunakan untuk koordinasi darurat dan notifikasi staf.
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Card 2: Informasi Rekening Pencairan / Honor (Terenkripsi AES-256) */}
              <Card className="border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/80 shadow-xs">
                <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                        <CreditCard className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                          Rekening Bank & E-Wallet Penerima Honor
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-500 dark:text-slate-400">
                          Terenkripsi aman dengan standar AES-256-GCM.
                        </CardDescription>
                      </div>
                    </div>

                    {!isEditingPayment ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsEditingPayment(true)}
                        className="text-xs font-bold border-slate-200 dark:border-slate-700"
                      >
                        Ubah Rekening
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingPayment(false)}
                        className="text-xs font-bold text-slate-500"
                      >
                        Batal Ubah
                      </Button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-4">
                  {/* Tampilan Rekening Saat Ini */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                        Rekening Terdaftar
                      </span>
                      <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-cyan-500" />
                        <span>{profile?.paymentAccountMasked || 'Belum ada rekening yang didaftarkan'}</span>
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="h-3 w-3" />
                      <span>AES-256 Terlindungi</span>
                    </div>
                  </div>

                  {/* Form Ganti Rekening jika mode edit aktif */}
                  {isEditingPayment && (
                    <div className="p-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 space-y-4 animate-in fade-in duration-200">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Building className="h-3.5 w-3.5 text-cyan-500" />
                        <span>Masukkan Data Rekening Baru</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Penyedia Bank / E-Wallet
                          </label>
                          <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value as SupportedPaymentProvider)}
                            className="w-full h-10 px-3 rounded-lg text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-cyan-500"
                          >
                            {SUPPORTED_PAYMENT_PROVIDERS.map((prov) => (
                              <option key={prov} value={prov}>
                                {prov}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Nomor Rekening
                          </label>
                          <Input
                            type="text"
                            value={accountNumber}
                            onChange={(e) => setAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Contoh: 1234567890"
                            className="h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Nama Pemilik Rekening
                          </label>
                          <Input
                            type="text"
                            value={accountHolderName}
                            onChange={(e) => setAccountHolderName(e.target.value)}
                            placeholder="Sesuai buku tabungan"
                            className="h-10 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Button Save */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSaving}
                  className="font-bold gap-2 h-11 px-6 shadow-sm"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>Simpan Perubahan Profil</span>
                </Button>
              </div>
            </form>
          )}

          {/* Card 3: Informasi Kepatuhan Integritas & Audit Trail */}
          <div className="p-4 rounded-xl bg-slate-900 text-white text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-5 w-5 text-sakode-cyan shrink-0" />
              <div>
                <strong className="block text-sakode-cyan font-bold">
                  Integritas Akun Staf & Jejak Forensik
                </strong>
                <span className="text-slate-300 text-[11px] leading-relaxed">
                  Setiap mutasi profil staf (termasuk penggantian rekening payout) otomatis dicatat dalam log audit append-only yang tidak dapat diubah maupun dihapus.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
