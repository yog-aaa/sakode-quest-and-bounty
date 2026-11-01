'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { SakodeAmbientOrnaments, SakodeSmileArc } from '@/components/brand/SakodeAmbientOrnaments';
import {
  profileCompletionSchema,
  SUPPORTED_PAYMENT_PROVIDERS,
  type SupportedPaymentProvider,
} from '@/lib/validations/auth';
import { completeProfileAction } from '@/server/actions/user.actions';
import type { AuthUserProfile } from '@/types/auth';
import {
  ShieldCheck,
  Lock,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  CreditCard,
  User,
  Phone,
  Check,
  Plus,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

const COMMON_SKILLS = [
  'Next.js',
  'React',
  'TypeScript',
  'Tailwind CSS',
  'Node.js',
  'Python',
  'Cloud Firestore',
  'Flutter',
  'UI/UX Design',
  'QA Testing',
  'DevOps',
];

interface OnboardingFormProps {
  user: AuthUserProfile | null;
  refreshProfile: () => Promise<void>;
}

function OnboardingForm({ user, refreshProfile }: OnboardingFormProps) {
  const router = useRouter();

  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || '');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(user?.skills || []);
  const [customSkill, setCustomSkill] = useState('');
  const [bankName, setBankName] = useState<SupportedPaymentProvider>('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(user?.displayName || '');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills((prev) => [...prev, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    const formData = {
      displayName,
      contactNumber,
      skills: selectedSkills,
      bankName,
      accountNumber,
      accountHolderName,
    };

    const validation = profileCompletionSchema.safeParse(formData);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errMap[issue.path[0].toString()] = issue.message;
        }
      });
      setErrors(errMap);
      return;
    }

    setSubmitting(true);
    const userId = user?.id || 'member-sakode-01';

    const res = await completeProfileAction(userId, formData);
    setSubmitting(false);

    if (res.success) {
      await refreshProfile();
      router.push('/pending-approval');
    } else {
      setServerError(res.error || 'Terjadi kesalahan saat menyimpan data profil.');
    }
  };

  // Masked account preview string
  const cleanNum = accountNumber.replace(/\s+/g, '');
  const maskedPreview =
    cleanNum.length > 4
      ? `•••• •••• •••• ${cleanNum.slice(-4)}`
      : cleanNum.length > 0
      ? `•••• ${cleanNum}`
      : '•••• •••• •••• 0000';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl shadow-xl shadow-slate-900/5 dark:shadow-sky-500/5 divide-y divide-slate-100 dark:divide-slate-800/80 overflow-hidden">
        {/* =============================================================== */}
        {/* SECTION 1: IDENTITAS & KONTAK */}
        {/* =============================================================== */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sakode-cyan border border-sky-200/80 dark:border-sky-800/80">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                1. Informasi Identitas &amp; Kontak Resmi
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Nama asli dan nomor aktif untuk koordinasi task dan konfirmasi pencairan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <Input
                label="Nama Lengkap Sesuai KTP"
                placeholder="Contoh: Yoga Pradana"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                error={errors.displayName}
                leftIcon={<User className="h-4 w-4 text-slate-400" />}
                required
                className="bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <Input
                label="Nomor WhatsApp / Telegram Aktif"
                placeholder="08xxxxxxxxxx atau +628xxxxxxxx"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                error={errors.contactNumber}
                helperText="Koordinasi review task & notifikasi pencairan"
                leftIcon={<Phone className="h-4 w-4 text-slate-400" />}
                required
                className="bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* SECTION 2: KEAHLIAN & SKILL TAGS */}
        {/* =============================================================== */}
        <div className="p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-sakode-purple border border-purple-200/80 dark:border-purple-800/80">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  2. Bidang Keahlian &amp; Minat Kontribusi
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pilih skill untuk personalisasi rekomendasi task dan pembentukan tim.
                </p>
              </div>
            </div>
            <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950/90 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              {selectedSkills.length} Dipilih
            </span>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {COMMON_SKILLS.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-sm scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-400 dark:hover:border-purple-600'
                  }`}
                >
                  {isSelected ? (
                    <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                  ) : (
                    <Plus className="h-3.5 w-3.5 opacity-50" />
                  )}
                  <span>{skill}</span>
                </button>
              );
            })}
          </div>

          {/* Tambah Skill Kustom */}
          <div className="flex items-center gap-2 pt-1 max-w-sm">
            <Input
              placeholder="Tambah skill lain..."
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddCustomSkill();
                }
              }}
              className="h-10 text-xs bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomSkill}
              className="h-10 px-4 text-xs font-bold shrink-0 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs"
            >
              Tambah
            </Button>
          </div>

          {errors.skills && (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 pt-1">
              {errors.skills}
            </p>
          )}
        </div>

        {/* =============================================================== */}
        {/* SECTION 3: REKENING PENCAIRAN BOUNTY REWARD & DIGITAL CARD */}
        {/* =============================================================== */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  3. Rekening Pencairan Bounty Reward
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Data rekening tujuan transfer honor kontribusi. Terenkripsi dengan standar AES-256.
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <Lock className="h-3 w-3" />
              <span>AES-256</span>
            </div>
          </div>

          {/* VIRTUAL DIGITAL CARD PREVIEW */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 text-white shadow-xl max-w-md mx-auto space-y-6">
            {/* Ambient Card Watermark */}
            <div className="absolute right-3 -bottom-8 opacity-10 text-[100px] font-mono font-black select-none pointer-events-none">
              &#123;k&#125;
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-6 rounded-md bg-amber-400/90 flex items-center justify-center text-slate-950 shadow-xs">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                  SAKODE REWARD ACCOUNT
                </span>
              </div>
              <span className="text-xs font-mono font-black uppercase px-2.5 py-0.5 rounded-md bg-white/10 text-sakode-cyan border border-white/10">
                {bankName}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                Nomor Rekening Terenkripsi
              </span>
              <p className="font-mono text-lg sm:text-xl font-bold tracking-widest text-white">
                {maskedPreview}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
              <div>
                <span className="text-[9px] uppercase font-mono text-slate-400 block">
                  Nama Pemilik Rekening
                </span>
                <span className="font-bold tracking-wide uppercase text-slate-100">
                  {accountHolderName || 'BELUM DIISI'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                <Lock className="h-3 w-3" />
                Enkripsi Aktif
              </span>
            </div>
          </div>

          {/* Form Inputs Rekening */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide">
                Penyedia Bank / Dompet Digital (E-Wallet) <span className="text-rose-500">*</span>
              </label>
              <select
                value={bankName}
                onChange={(e) => setBankName(e.target.value as SupportedPaymentProvider)}
                className="h-11 w-full rounded-xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950/60 px-3.5 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sakode-cyan cursor-pointer"
              >
                {SUPPORTED_PAYMENT_PROVIDERS.map((provider) => (
                  <option key={provider} value={provider}>
                    {provider}
                  </option>
                ))}
              </select>
              {errors.bankName && (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{errors.bankName}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Nomor Rekening / No. Akun E-Wallet"
                  placeholder="Contoh: 1234567890"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  error={errors.accountNumber}
                  helperText="Hanya angka tanpa spasi atau tanda strip"
                  leftIcon={<CreditCard className="h-4 w-4 text-slate-400" />}
                  required
                  className="bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <Input
                  label="Nama Pemilik Rekening"
                  placeholder="Persis sesuai buku tabungan"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  error={errors.accountHolderName}
                  helperText="Wajib sama dengan nama buku tabungan / e-wallet"
                  leftIcon={<User className="h-4 w-4 text-slate-400" />}
                  required
                  className="bg-white dark:bg-slate-950/60 border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Privacy Callout */}
            <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 flex items-start gap-3 text-xs">
              <ShieldCheck className="h-5 w-5 text-sky-600 dark:text-sakode-cyan shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white block">
                  Jaminan Privasi Data Perbankan SAKODE Work
                </span>
                <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                  Data nomor rekening dienkripsi sebelum disimpan ke database dan ditampilkan secara masked (<em>BCA •••• 1234</em>). Hanya Super Admin yang berwenang membuka data saat mengeksekusi transfer reward.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =============================================================== */}
        {/* FOOTER ACTIONS */}
        {/* =============================================================== */}
        <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/60 dark:bg-slate-950/40">
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <HelpCircle className="h-3.5 w-3.5 text-sky-500" />
            <span>Verifikasi profil ditinjau oleh Admin SAKODE dalam 1x24 jam</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link href="/" className="w-full sm:w-auto">
              <Button
                variant="outline"
                type="button"
                className="w-full sm:w-auto text-xs font-bold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-2xs"
              >
                Batal
              </Button>
            </Link>

            <Button
              variant="primary"
              type="submit"
              isLoading={submitting}
              className="w-full sm:w-auto font-black text-xs gap-2 bg-gradient-to-r from-sky-500 to-[#076991] hover:from-sky-600 hover:to-[#055374] dark:from-sakode-cyan dark:to-sky-400 dark:text-slate-950 dark:hover:from-sky-300 dark:hover:to-cyan-300 shadow-md shadow-sky-500/20"
            >
              <span>Kirim Data &amp; Ajukan Akun</span>
              <ArrowRight className="h-4 w-4 stroke-[2.5]" />
            </Button>
          </div>
        </div>
      </div>

      {serverError && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}
    </form>
  );
}

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070C14] text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-sakode-cyan/30 transition-colors relative overflow-hidden">
      {/* SAKODE Scattered Ornaments & Ambient Lights */}
      <SakodeAmbientOrnaments showForegroundBadges={true} />

      {/* Header */}
      <header className="w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#070C14]/90 backdrop-blur-md relative z-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sakode-work-logo.svg"
              alt="SAKODE Work"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-block text-xs text-slate-500 dark:text-slate-400 font-medium">
              Tahap 2 dari 3: Kelengkapan Profil
            </span>
            <ThemeToggle />
            <Link
              href="/"
              className="text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              ← Beranda
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center justify-center">
        <div className="max-w-2xl w-full space-y-6">
          {/* Headline & Progress Indicator */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                Verifikasi Kontributor SAKODE
              </span>
              <SakodeSmileArc className="w-7 h-2 text-amber-500/80" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Lengkapi Profil &amp; Rekening Reward Anda
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
              Data nomor rekening diperlukan untuk verifikasi identitas dan pencairan honor tunai tanpa potongan.
            </p>

            {/* Stepper Steps Mini Bar */}
            <div className="grid grid-cols-3 gap-2 pt-2 max-w-md mx-auto text-left">
              <div className="p-2.5 rounded-xl border border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Step 1
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Daftar Akun
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-sky-400 dark:border-sky-500 bg-sky-50 dark:bg-sky-950/60 shadow-xs space-y-0.5">
                <span className="text-[9px] font-bold uppercase tracking-wider text-sky-700 dark:text-sakode-cyan flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse"></span>
                  Step 2 (Aktif)
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white block">
                  Lengkapi Profil
                </span>
              </div>
              <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-0.5 opacity-60">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">
                  Step 3
                </span>
                <span className="text-xs font-medium text-slate-600 dark:text-slate-400 block">
                  Review Admin
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Notice if revisi */}
          {user?.rejectionReason && (
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-900 dark:text-rose-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-rose-800 dark:text-rose-300">
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>Catatan Perbaikan dari Admin:</span>
              </div>
              <p className="pl-5 text-rose-700 dark:text-rose-300">{user.rejectionReason}</p>
            </div>
          )}

          <OnboardingForm key={user?.id || 'guest'} user={user} refreshProfile={refreshProfile} />
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800/80 py-5 text-center text-xs text-slate-500">
        <p>&copy; 2026 SAKODE Academy. Seluruh Hak Cipta Dilindungi.</p>
      </footer>
    </div>
  );
}
