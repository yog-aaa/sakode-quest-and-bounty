'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { BountyCard } from '@/components/task/BountyCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { getAvailableTasksAction } from '@/server/actions/task.actions';
import { instantTakeTaskAction, submitApplicationAction } from '@/server/actions/assignment.actions';
import { formatCurrencyIDR } from '@/lib/utils';
import type { TaskDocument } from '@/types/database';
import {
  Compass,
  Search,
  Users,
  User,
  Zap,
  Send,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  X,
  Loader2,
  FileText,
} from 'lucide-react';

export default function MemberTasksExplorePage() {
  const router = useRouter();
  const { user } = useAuth();

  const [tasks, setTasks] = useState<TaskDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [modeFilter, setModeFilter] = useState<'ALL' | 'SOLO' | 'TEAM'>('ALL');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'INSTANT_TAKE' | 'APPLICATION'>('ALL');

  // Modal States
  const [instantTakeTask, setInstantTakeTask] = useState<TaskDocument | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [isTakingTask, setIsTakingTask] = useState(false);

  const [applyTask, setApplyTask] = useState<TaskDocument | null>(null);
  const [motivationMessage, setMotivationMessage] = useState('');
  const [portfolioInput, setPortfolioInput] = useState('');
  const [agreedCommitment, setAgreedCommitment] = useState(false);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // Notification States
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load available tasks
  const loadTasks = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await getAvailableTasksAction({
        mode: modeFilter === 'ALL' ? undefined : modeFilter,
        assignmentType: typeFilter === 'ALL' ? undefined : typeFilter,
      });
      if (res.success && res.tasks) {
        setTasks(res.tasks);
      } else {
        setErrorMsg(res.error || 'Gagal memuat task.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal terhubung ke server.');
    } finally {
      setIsLoading(false);
    }
  }, [modeFilter, typeFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadTasks();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadTasks]);

  // Handle Instant Take Confirmation
  const handleConfirmInstantTake = async () => {
    if (!user || !instantTakeTask) return;
    if (!agreedTerms) {
      setErrorMsg('Anda wajib menyetujui syarat & ketentuan sebelum mengambil task.');
      return;
    }

    setIsTakingTask(true);
    setErrorMsg(null);
    try {
      const res = await instantTakeTaskAction(user.id, {
        taskId: instantTakeTask.id,
        agreedTermsVersion: instantTakeTask.termsSnapshot.version,
      });

      if (res.success) {
        setInstantTakeTask(null);
        // Langsung redirect ke dashboard member (Hero Active Task)
        router.push('/member');
      } else {
        setErrorMsg(res.error || 'Gagal mengambil task.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal memproses instant take.');
    } finally {
      setIsTakingTask(false);
    }
  };

  // Handle Application Submission
  const handleConfirmApply = async () => {
    if (!user || !applyTask) return;
    if (motivationMessage.trim().length < 10) {
      setErrorMsg('Pesan motivasi minimal 10 karakter.');
      return;
    }
    if (!agreedCommitment) {
      setErrorMsg('Anda wajib menyetujui komitmen kriteria penerimaan.');
      return;
    }

    setIsSubmittingApp(true);
    setErrorMsg(null);
    try {
      const portfolioLinks = portfolioInput
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await submitApplicationAction(user.id, {
        taskId: applyTask.id,
        message: motivationMessage,
        portfolioLinks,
      });

      if (res.success) {
        setApplyTask(null);
        setMotivationMessage('');
        setPortfolioInput('');
        setAgreedCommitment(false);
        setSuccessMsg('Aplikasi Anda berhasil dikirim! Pantau statusnya di Dashboard Member.');
        loadTasks();
      } else {
        setErrorMsg(res.error || 'Gagal mengajukan aplikasi.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Gagal mengirim aplikasi.');
    } finally {
      setIsSubmittingApp(false);
    }
  };

  // Search Filter
  const filteredTasks = tasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const matchTitle = t.title.toLowerCase().includes(query);
    const matchSkills = t.requiredSkills.some((s) => s.toLowerCase().includes(query));
    return matchTitle || matchSkills;
  });

  const hasActiveTask = Boolean(user?.activeTaskId);
  const maxApplicationsReached = (user?.pendingApplicationCount || 0) >= 3;

  return (
    <AuthGuard requireApproved>
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sakode-border pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="cyan" leftIcon={<Compass className="h-3 w-3" />}>
                  Eksplorasi Quest & Bounty
                </Badge>
                <span className="text-xs text-sakode-text-muted">SAKODE Academy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-sakode-text tracking-tight">
                Papan Bounty & Task Tersedia
              </h1>
              <p className="text-xs sm:text-sm text-sakode-text-muted mt-0.5">
                Ambil task secara instan atau ajukan aplikasi untuk tugas bernilai tinggi. Selesaikan tepat waktu untuk klaim bounty.
              </p>
            </div>

            <Link href="/member">
              <Button variant="outline" className="font-bold gap-2 text-xs h-10">
                <Users className="h-4 w-4" />
                <span>Dashboard Saya</span>
              </Button>
            </Link>
          </div>

          {/* User Quota & Active Task Status Banners */}
          {hasActiveTask && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold">
                    Anda sedang memegang 1 Active Task
                  </h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Sesuai invariant sistem SAKODE, Anda tidak dapat mengambil atau mendaftar task lain sampai task aktif Anda selesai dan disetujui.
                  </p>
                </div>
              </div>
              <Link href="/member">
                <Button
                  variant="outline"
                  size="sm"
                  className="font-bold text-xs bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-600/40 text-amber-900 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-slate-800 whitespace-nowrap shadow-2xs"
                >
                  <span>Lihat Task Aktif</span>
                  <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Button>
              </Link>
            </div>
          )}

          {maxApplicationsReached && !hasActiveTask && (
            <div className="p-4 rounded-xl bg-sky-50 border border-sky-200 text-sky-900 flex items-center gap-3 shadow-xs">
              <AlertCircle className="h-5 w-5 text-sky-600 shrink-0" />
              <div className="text-xs sm:text-sm">
                <span className="font-bold">Batas kuota aplikasi tercapai (3/3):</span> Anda memiliki 3 aplikasi berstatus pending. Anda dapat membatalkan aplikasi yang belum ditinjau di tab dashboard Anda jika ingin mendaftar ke task lain.
              </div>
            </div>
          )}

          {/* Alerts */}
          {errorMsg && (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-center justify-between gap-2">
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
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-sakode-border shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari berdasarkan judul task atau skill (misal: React, TypeScript, Next.js)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-cyan"
                />
              </div>

              {/* Mode Filter Tabs */}
              <div className="flex items-center gap-1 border border-sakode-border p-1 rounded-lg bg-sakode-bg">
                <button
                  onClick={() => setModeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    modeFilter === 'ALL'
                      ? 'bg-white text-sakode-text shadow-xs'
                      : 'text-sakode-text-muted hover:text-sakode-text'
                  }`}
                >
                  Semua Mode
                </button>
                <button
                  onClick={() => setModeFilter('SOLO')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                    modeFilter === 'SOLO'
                      ? 'bg-white text-sakode-text shadow-xs'
                      : 'text-sakode-text-muted hover:text-sakode-text'
                  }`}
                >
                  <User className="h-3 w-3" />
                  <span>Solo</span>
                </button>
                <button
                  onClick={() => setModeFilter('TEAM')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                    modeFilter === 'TEAM'
                      ? 'bg-white text-sakode-text shadow-xs'
                      : 'text-sakode-text-muted hover:text-sakode-text'
                  }`}
                >
                  <Users className="h-3 w-3" />
                  <span>Team</span>
                </button>
              </div>

              {/* Assignment Type Filter */}
              <div className="flex items-center gap-1 border border-sakode-border p-1 rounded-lg bg-sakode-bg">
                <button
                  onClick={() => setTypeFilter('ALL')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                    typeFilter === 'ALL'
                      ? 'bg-white text-sakode-text shadow-xs'
                      : 'text-sakode-text-muted hover:text-sakode-text'
                  }`}
                >
                  Semua Tipe
                </button>
                <button
                  onClick={() => setTypeFilter('INSTANT_TAKE')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                    typeFilter === 'INSTANT_TAKE'
                      ? 'bg-white text-amber-900 shadow-xs'
                      : 'text-sakode-text-muted hover:text-sakode-text'
                  }`}
                >
                  <Zap className="h-3 w-3 text-amber-500" />
                  <span>Instant Take</span>
                </button>
                <button
                  onClick={() => setTypeFilter('APPLICATION')}
                  className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1 transition-all ${
                    typeFilter === 'APPLICATION'
                      ? 'bg-white text-sky-900 shadow-xs'
                      : 'text-sakode-text-muted hover:text-sakode-text'
                  }`}
                >
                  <Send className="h-3 w-3 text-sky-500" />
                  <span>Application</span>
                </button>
              </div>
            </div>
          </div>

          {/* Task Grid */}
          {isLoading ? (
            <div className="py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-cyan" />
              <p className="text-xs text-sakode-text-muted mt-2 font-medium">Mencari task tersedia...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <Card className="py-16 text-center border-dashed">
              <CardContent className="space-y-3">
                <Compass className="h-12 w-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-sakode-text">Tidak ada task yang tersedia saat ini</h3>
                <p className="text-xs text-sakode-text-muted max-w-sm mx-auto">
                  {searchQuery
                    ? `Tidak ada task yang cocok dengan filter atau kata kunci "${searchQuery}".`
                    : 'Semua task telah diambil atau sedang dikerjakan. Silakan periksa kembali nanti.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTasks.map((task) => (
                <BountyCard
                  key={task.id}
                  task={task}
                  userActiveTaskId={user?.activeTaskId}
                  userPendingAppCount={user?.pendingApplicationCount || 0}
                  userIsApproved={user?.approvalStatus === 'APPROVED'}
                  onInstantTake={(t) => {
                    setInstantTakeTask(t);
                    setAgreedTerms(false);
                    setErrorMsg(null);
                  }}
                  onApply={(t) => {
                    setApplyTask(t);
                    setMotivationMessage('');
                    setPortfolioInput('');
                    setAgreedCommitment(false);
                    setErrorMsg(null);
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Modal: Instant Take Terms Confirmation */}
        {instantTakeTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-sakode-border bg-sakode-bg flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant="cyan" leftIcon={<Zap className="h-3 w-3 text-amber-500" />}>
                      Instant Take Confirmation
                    </Badge>
                    <span className="text-xs text-sakode-text-muted">Terms Snapshot v{instantTakeTask.termsSnapshot.version}</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-sakode-text leading-snug">
                    {instantTakeTask.title}
                  </h2>
                  <p className="text-xs text-sakode-text-muted mt-0.5">
                    Reward: <strong className="text-sakode-text">{formatCurrencyIDR(instantTakeTask.totalReward)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setInstantTakeTask(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Terms Content Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Perhatian Invariant:</span> Dengan mengambil task ini, task akan langsung berstatus <strong>ACTIVE</strong> atas nama Anda, batas waktu (countdown) akan langsung berjalan, dan Anda tidak dapat mengambil task lain sampai task ini selesai.
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-sakode-text uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-sakode-cyan" />
                    <span>Syarat & Ketentuan Pengerjaan (Terms Snapshot):</span>
                  </h4>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto">
                    {instantTakeTask.termsSnapshot.content}
                  </div>
                </div>

                {/* Acceptance Checkbox */}
                <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-sakode-border text-sakode-cyan focus:ring-sakode-cyan"
                  />
                  <span className="text-xs text-sakode-text leading-snug">
                    Saya telah membaca, memahami, dan menyetujui seluruh syarat & ketentuan pengerjaan di atas. Saya berkomitmen menyelesaikan seluruh kriteria penerimaan tepat waktu.
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-sakode-border bg-sakode-bg flex items-center justify-between gap-3">
                <Button variant="outline" size="sm" onClick={() => setInstantTakeTask(null)} className="text-xs">
                  Batal
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={!agreedTerms || isTakingTask}
                  onClick={handleConfirmInstantTake}
                  className="font-bold text-xs gap-1.5 h-10 px-4"
                >
                  {isTakingTask ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  <span>Konfirmasi & Mulai Bekerja</span>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Application Submission */}
        {applyTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl border border-sakode-border w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-sakode-border bg-sakode-bg flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Badge variant="purple" leftIcon={<Send className="h-3 w-3" />}>
                      Pengajuan Aplikasi Task
                    </Badge>
                  </div>
                  <h2 className="text-base sm:text-lg font-black text-sakode-text leading-snug">
                    {applyTask.title}
                  </h2>
                  <p className="text-xs text-sakode-text-muted mt-0.5">
                    Bounty: <strong className="text-sakode-text">{formatCurrencyIDR(applyTask.totalReward)}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setApplyTask(null)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
                <div>
                  <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                    Pesan Motivasi & Rencana Pengerjaan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Jelaskan pengalaman Anda, pendekatan teknis yang akan digunakan, dan komitmen waktu penyelesaian (minimal 10 karakter)..."
                    value={motivationMessage}
                    onChange={(e) => setMotivationMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-sakode-border focus:outline-none focus:ring-2 focus:ring-sakode-cyan leading-relaxed"
                  />
                  <p className="text-[10px] text-sakode-text-muted mt-1">
                    Panjang pesan: {motivationMessage.length} karakter (minimal 10 karakter).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
                    Tautan Portofolio / GitHub / Contoh Kode (Opsional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Satu URL per baris (misal: https://github.com/username/project)..."
                    value={portfolioInput}
                    onChange={(e) => setPortfolioInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-sakode-border focus:outline-none focus:ring-1 focus:ring-sakode-cyan font-mono"
                  />
                </div>

                {/* Commitment Checkbox */}
                <label className="flex items-start gap-2 pt-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={agreedCommitment}
                    onChange={(e) => setAgreedCommitment(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-sakode-border text-sakode-cyan focus:ring-sakode-cyan"
                  />
                  <span className="text-xs text-sakode-text leading-snug">
                    Saya berkomitmen menyelesaikan seluruh kriteria penerimaan tepat waktu jika terpilih oleh tim reviewer.
                  </span>
                </label>
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-sakode-border bg-sakode-bg flex items-center justify-between gap-3">
                <Button variant="outline" size="sm" onClick={() => setApplyTask(null)} className="text-xs">
                  Batal
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  disabled={!agreedCommitment || motivationMessage.trim().length < 10 || isSubmittingApp}
                  onClick={handleConfirmApply}
                  className="font-bold text-xs gap-1.5 h-10 px-4"
                >
                  {isSubmittingApp ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Kirim Permohonan</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}
