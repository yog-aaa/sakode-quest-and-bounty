'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
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
  Sparkles,
  AlertCircle,
  CreditCard,
  User,
  Phone,
  Check,
  Plus,
  HelpCircle,
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

  return (
    <form onSubmit={handleSubmit}>
      <Card className="shadow-md border-sakode-border divide-y divide-sakode-border/60">
        {/* Section 1: Identitas & Kontak */}
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2 text-sakode-text">
            <User className="h-5 w-5 text-sakode-cyan" />
            <CardTitle className="text-base sm:text-lg">
              1. Informasi Identitas & Kontak
            </CardTitle>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Lengkap Sesuai KTP"
              placeholder="Contoh: Yoga Pradana"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              error={errors.displayName}
              leftIcon={<User className="h-4 w-4" />}
              required
            />

            <Input
              label="Nomor WhatsApp / Telegram"
              placeholder="08xxxxxxxxxx atau +628xxxxxxxx"
              value={contactNumber}
              onChange={(e) => setContactNumber(e.target.value)}
              error={errors.contactNumber}
              helperText="Digunakan untuk koordinasi task dan konfirmasi klaim"
              leftIcon={<Phone className="h-4 w-4" />}
              required
            />
          </div>
        </CardHeader>

        {/* Section 2: Keahlian & Skill Tags */}
        <CardContent className="pt-6 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sakode-text">
              <Sparkles className="h-5 w-5 text-sakode-purple" />
              <CardTitle className="text-base sm:text-lg">
                2. Tag Keahlian & Kualifikasi (Skills)
              </CardTitle>
            </div>
            <Badge variant="purple" className="text-[11px]">
              {selectedSkills.length} Dipilih
            </Badge>
          </div>
          <CardDescription>
            Pilih minimal 1 bidang keahlian Anda untuk filter rekomendasi task yang relevan:
          </CardDescription>

          <div className="flex flex-wrap gap-2 pt-2">
            {COMMON_SKILLS.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <button
                  type="button"
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-sakode-purple text-white border-sakode-purple shadow-xs'
                      : 'bg-sakode-bg text-sakode-text border-sakode-border hover:border-sakode-purple/40'
                  }`}
                >
                  {isSelected ? (
                    <Check className="h-3 w-3 stroke-[3]" />
                  ) : (
                    <Plus className="h-3 w-3 opacity-60" />
                  )}
                  <span>{skill}</span>
                </button>
              );
            })}
          </div>

          {/* Tambah Skill Custom */}
          <div className="flex items-center gap-2 pt-2 max-w-sm">
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
              className="h-9 text-xs"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCustomSkill}
              className="h-9 shrink-0"
            >
              Tambah
            </Button>
          </div>

          {errors.skills && (
            <p className="text-xs font-semibold text-sakode-orange pt-1">
              {errors.skills}
            </p>
          )}
        </CardContent>

        {/* Section 3: Data Rekening Perbankan / E-Wallet (Terenkripsi) */}
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sakode-text">
              <CreditCard className="h-5 w-5 text-sakode-orange" />
              <CardTitle className="text-base sm:text-lg">
                3. Rekening Pencairan Bounty Reward
              </CardTitle>
            </div>
            <Badge variant="cyan" leftIcon={<Lock className="h-3 w-3" />}>
              Enkripsi AES-256
            </Badge>
          </div>
          <CardDescription>
            Pilih bank atau dompet digital Anda. Data ini akan disimpan dalam format terenkripsi.
          </CardDescription>

          {/* Bank Selector */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-sakode-text tracking-wide">
              Penyedia Bank / E-Wallet <span className="text-sakode-orange ml-1">*</span>
            </label>
            <select
              value={bankName}
              onChange={(e) => setBankName(e.target.value as SupportedPaymentProvider)}
              className="h-11 w-full rounded-lg border border-sakode-border bg-sakode-card px-3.5 text-sm text-sakode-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sakode-cyan cursor-pointer"
            >
              {SUPPORTED_PAYMENT_PROVIDERS.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
            {errors.bankName && (
              <p className="text-xs font-semibold text-sakode-orange">{errors.bankName}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nomor Rekening / No. Akun"
              placeholder="Contoh: 1234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              error={errors.accountNumber}
              helperText="Hanya angka tanpa spasi atau strip"
              leftIcon={<CreditCard className="h-4 w-4" />}
              required
            />

            <Input
              label="Nama Pemilik Rekening"
              placeholder="Nama persis di buku tabungan"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              error={errors.accountHolderName}
              helperText="Wajib sama dengan nama buku tabungan / e-wallet"
              leftIcon={<User className="h-4 w-4" />}
              required
            />
          </div>

          {/* Security Privacy Callout */}
          <div className="p-3.5 rounded-lg bg-sky-50/60 border border-sakode-cyan/50 flex items-start gap-3 text-xs">
            <ShieldCheck className="h-5 w-5 text-sakode-cyan shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-700">
              <span className="font-bold text-sakode-text block">
                Jaminan Privasi & Enkripsi Data Perbankan SAKODE
              </span>
              <p className="text-[11px] leading-relaxed text-sakode-text-muted">
                Nomor rekening Anda dienkripsi menggunakan algoritma <strong>AES-256-GCM</strong> sebelum disimpan ke Cloud Firestore. Nomor rekening akan otomatis di-mask (contoh: <code>BCA •••• 5678 a.n J*** D**</code>) dan hanya dapat dibuka oleh Admin berwenang untuk keperluan audit transfer reward.
              </p>
            </div>
          </div>
        </CardContent>

        {/* Footer Actions */}
        <CardFooter className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 bg-sakode-bg/40">
          <div className="text-[11px] text-sakode-text-muted flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Verifikasi profil ditinjau admin dalam 1x24 jam</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" type="button" className="w-full sm:w-auto">
                Batal
              </Button>
            </Link>

            <Button
              variant="primary"
              type="submit"
              isLoading={submitting}
              className="w-full sm:w-auto font-bold gap-1.5"
            >
              <span>Kirim Data & Ajukan Akun</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
      {serverError && (
        <div className="mt-3 p-3.5 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
          <span>{serverError}</span>
        </div>
      )}
    </form>
  );
}

export default function OnboardingPage() {
  const { user, refreshProfile } = useAuth();

  return (
    <div className="min-h-screen bg-sakode-bg py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sakode-logo-official.png"
              alt="SAKODE Academy"
              className="h-10 sm:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xl tracking-tight text-sakode-text">
                SAKODE
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-sakode-cyan/25 text-[#076991] font-extrabold uppercase">
                Work
              </span>
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-sakode-text tracking-tight">
            Lengkapi Profil Member Anda
          </h1>
          <p className="text-xs sm:text-sm text-sakode-text-muted max-w-lg mx-auto">
            Hanya butuh 2 menit. Data kontak dan rekening perbankan diperlukan untuk verifikasi identitas dan pencairan reward task.
          </p>
        </div>

        {/* Rejection notice if revising */}
        {user?.rejectionReason && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-rose-800">
              <AlertCircle className="h-4 w-4 text-rose-600" />
              <span>Catatan Perbaikan dari Admin:</span>
            </div>
            <p className="text-rose-800 pl-5">{user.rejectionReason}</p>
          </div>
        )}

        <OnboardingForm key={user?.id || 'guest'} user={user} refreshProfile={refreshProfile} />
      </div>
    </div>
  );
}
