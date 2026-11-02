'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { getClientFirestore } from '@/lib/firebase/client';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { updateSelfProfileAction } from '@/server/actions/user.actions';
import {
  calculateUserLevel,
  evaluateUserAchievements,
  LEVEL_TIERS,
  type AchievementItem,
  type AchievementCategory,
  type UserLevelProgress,
} from '@/lib/gamification';
import { formatCurrencyIDR, formatDateWIB, toDateSafe } from '@/lib/utils';
import type { UserDocument } from '@/types/database';
import type { AdminProfileUpdateInput, SupportedPaymentProvider } from '@/lib/validations/auth';
import {
  User,
  Camera,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trophy,
  Shield,
  Zap,
  Target,
  Flame,
  ShieldCheck,
  Award,
  Crown,
  Users,
  Flag,
  HeartHandshake,
  DollarSign,
  Wallet,
  Star,
  Lock,
  Sparkles,
  ExternalLink,
  Plus,
  X,
  CreditCard,
  Building,
  Save,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

const COMMON_SKILLS = [
  'Frontend',
  'Backend',
  'Next.js',
  'React',
  'TypeScript',
  'Tailwind CSS',
  'Node.js',
  'Python',
  'UI/UX Design',
  'Figma',
  'DevOps',
  'Docker',
  'QA & Testing',
  'API Integration',
  'Mobile Flutter',
  'Mobile React Native',
];

const BANK_PROVIDERS: { value: SupportedPaymentProvider; label: string; type: 'BANK' | 'E-WALLET' }[] = [
  { value: 'BCA', label: 'Bank Central Asia (BCA)', type: 'BANK' },
  { value: 'Mandiri', label: 'Bank Mandiri', type: 'BANK' },
  { value: 'BNI', label: 'Bank Negara Indonesia (BNI)', type: 'BANK' },
  { value: 'BRI', label: 'Bank Rakyat Indonesia (BRI)', type: 'BANK' },
  { value: 'BSI', label: 'Bank Syariah Indonesia (BSI)', type: 'BANK' },
  { value: 'Bank Jago', label: 'Bank Jago', type: 'BANK' },
  { value: 'SeaBank', label: 'SeaBank', type: 'BANK' },
  { value: 'GoPay', label: 'GoPay (Nomor HP)', type: 'E-WALLET' },
  { value: 'OVO', label: 'OVO (Nomor HP)', type: 'E-WALLET' },
  { value: 'DANA', label: 'DANA (Nomor HP)', type: 'E-WALLET' },
];

function AchievementIcon({ name, className }: { name: string; className?: string }) {
  switch (name) {
    case 'Target':
      return <Target className={className} />;
    case 'Zap':
      return <Zap className={className} />;
    case 'Flame':
      return <Flame className={className} />;
    case 'ShieldCheck':
      return <ShieldCheck className={className} />;
    case 'Award':
      return <Award className={className} />;
    case 'Crown':
      return <Crown className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Flag':
      return <Flag className={className} />;
    case 'HeartHandshake':
      return <HeartHandshake className={className} />;
    case 'DollarSign':
      return <DollarSign className={className} />;
    case 'Wallet':
      return <Wallet className={className} />;
    case 'Star':
      return <Star className={className} />;
    default:
      return <Trophy className={className} />;
  }
}

function MemberProfileInner() {
  const { user: authUser, refreshProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // User Document State
  const [profile, setProfile] = useState<UserDocument | null>(null);
  const [totalBountyEarned, setTotalBountyEarned] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Active Tab: 'gamification' | 'personal' | 'payout' | 'reputation'
  const [activeTab, setActiveTab] = useState<'gamification' | 'personal' | 'payout' | 'reputation'>('gamification');

  // Form Edit State
  const [displayName, setDisplayName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [bio, setBio] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  // Avatar Upload State
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Bank Form State
  const [bankName, setBankName] = useState<SupportedPaymentProvider | ''>('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [isUpdatingBank, setIsUpdatingBank] = useState(false);

  // Action State
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Achievement Filter
  const [achievementFilter, setAchievementFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | AchievementCategory>('ALL');

  // Load Profile and Bounty Data
  const loadProfileData = useCallback(async () => {
    if (!authUser) return;
    setIsLoading(true);
    setErrorMessage(null);

    try {
      let currentDoc: UserDocument | null = null;
      let bountySum = 0;

      // 1. Ambil dokumen user langsung dari Client Firestore
      try {
        const db = getClientFirestore();
        const userSnap = await getDoc(doc(db, 'users', authUser.id));
        if (userSnap.exists()) {
          currentDoc = { ...(userSnap.data() as UserDocument), id: userSnap.id };
        }

        // 2. Hitung total bounty yang sudah cair (PAID)
        const ledgersRef = collection(db, 'rewardLedgers');
        const qLedgers = query(
          ledgersRef,
          where('userId', '==', authUser.id),
          where('status', '==', 'PAID')
        );
        const ledgerSnaps = await getDocs(qLedgers);
        ledgerSnaps.forEach((docSnap) => {
          const lData = docSnap.data();
          if (lData.amount && typeof lData.amount === 'number') {
            bountySum += lData.amount;
          }
        });
      } catch (clientErr) {
        console.warn('Client load user profile fallback to auth context:', clientErr);
      }

      const activeProfile = currentDoc || (authUser as UserDocument);
      setProfile(activeProfile);
      setTotalBountyEarned(bountySum);

      // Populate Form
      setDisplayName(activeProfile.displayName || '');
      setContactNumber(activeProfile.contactNumber || '');
      setBio(activeProfile.bio || '');
      setPortfolioUrl(activeProfile.portfolioUrl || '');
      setSkills(Array.isArray(activeProfile.skills) ? activeProfile.skills : []);
      setAvatarPreview(activeProfile.photoURL || null);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Terjadi kendala saat memuat data profil.');
    } finally {
      setIsLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    loadProfileData();
  }, [loadProfileData]);

  // Handle Avatar Selection & Upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !authUser) return;

    // Validate size (max 3MB)
    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Ukuran foto profil maksimal 3 MB.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Format berkas harus berupa JPG, PNG, WEBP, atau GIF.');
      return;
    }

    setIsUploadingAvatar(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // Instant local preview
    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    try {
      // 1. Minta Cloudinary Signature
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: 'profile',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      const signData = await signRes.json();
      if (!signRes.ok || !signData.success) {
        throw new Error(signData.error || 'Gagal memperoleh izin upload avatar.');
      }

      let finalPhotoUrl = localUrl;

      if (!signData.isMock) {
        // Upload ke Cloudinary
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signData.apiKey);
        formData.append('timestamp', String(signData.timestamp));
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || uploadData.error) {
          throw new Error(uploadData.error?.message || 'Gagal mengunggah foto ke server.');
        }

        finalPhotoUrl = uploadData.secure_url || uploadData.url;
      }

      // 2. Simpan URL foto langsung ke profil
      const updateRes = await updateSelfProfileAction(authUser.id, {
        displayName: displayName.trim() || authUser.displayName,
        contactNumber: contactNumber.trim() || authUser.contactNumber,
        photoURL: finalPhotoUrl,
      });

      if (!updateRes.success) {
        throw new Error(updateRes.error || 'Gagal menyimpan tautan foto profil.');
      }

      setAvatarPreview(finalPhotoUrl);
      if (profile) {
        setProfile({ ...profile, photoURL: finalPhotoUrl });
      }
      setSuccessMessage('Foto profil berhasil diperbarui!');
      await refreshProfile();
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memperbarui foto profil.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Add / Remove Skills
  const handleAddSkill = (skillToAdd: string) => {
    const clean = skillToAdd.trim();
    if (!clean) return;
    if (skills.includes(clean)) return;
    if (skills.length >= 15) {
      setErrorMessage('Maksimal 15 keahlian yang dapat ditambahkan.');
      return;
    }
    setSkills([...skills, clean]);
    setNewSkillInput('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Save Profile Form
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;

    if (!displayName.trim()) {
      setErrorMessage('Nama lengkap tidak boleh kosong.');
      return;
    }

    if (!contactNumber.trim()) {
      setErrorMessage('Nomor kontak WhatsApp wajib diisi.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload: AdminProfileUpdateInput = {
        displayName: displayName.trim(),
        contactNumber: contactNumber.trim(),
        skills,
        bio: bio.trim(),
        portfolioUrl: portfolioUrl.trim(),
        photoURL: avatarPreview || undefined,
      };

      if (isUpdatingBank && bankName && accountNumber && accountHolderName) {
        payload.bankName = bankName as SupportedPaymentProvider;
        payload.accountNumber = accountNumber.trim();
        payload.accountHolderName = accountHolderName.trim();
      }

      const res = await updateSelfProfileAction(authUser.id, payload);

      if (res.success && res.user) {
        setProfile(res.user);
        setSuccessMessage('Data profil berhasil disimpan.');
        setIsUpdatingBank(false);
        await refreshProfile();
      } else {
        setErrorMessage(res.error || 'Gagal menyimpan perubahan profil.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage('Terjadi kesalahan saat menyimpan profil.');
    } finally {
      setIsSaving(false);
    }
  };

  // Compute Gamification Level & Achievements
  const activeUser = profile || authUser;
  const levelProgress: UserLevelProgress = activeUser
    ? calculateUserLevel(activeUser, totalBountyEarned)
    : {
        totalXp: 0,
        currentTier: LEVEL_TIERS[0],
        nextTier: LEVEL_TIERS[1],
        progressPercent: 0,
        xpInCurrentTier: 0,
        xpNeededForNext: 100,
      };

  const allAchievements: AchievementItem[] = activeUser
    ? evaluateUserAchievements(activeUser, { totalBountyEarned })
    : [];

  const unlockedCount = allAchievements.filter((a) => a.unlocked).length;
  const lockedCount = allAchievements.length - unlockedCount;

  // Filtered Achievements
  const filteredAchievements = allAchievements.filter((item) => {
    if (achievementFilter === 'UNLOCKED' && !item.unlocked) return false;
    if (achievementFilter === 'LOCKED' && item.unlocked) return false;
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="py-24 text-center min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="h-9 w-9 animate-spin text-sky-500 mb-3" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          Memuat data profil & pencapaian member...
        </p>
      </div>
    );
  }

  const initials = (profile?.displayName || authUser?.displayName || authUser?.email || 'M')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 pb-16 max-w-6xl mx-auto">
      {/* Alert Banners */}
      {successMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-2 shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span className="font-semibold">{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900 dark:hover:text-rose-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Hero Profile Card */}
      <Card className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-br from-white via-slate-50 to-sky-50/30 dark:from-slate-900 dark:via-[#0F1626] dark:to-slate-900/80 border-slate-200/80 dark:border-slate-800 shadow-md">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-sky-500/10 dark:bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 text-center sm:text-left">
            {/* Avatar with Upload Button */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl overflow-hidden bg-gradient-to-tr from-sky-500 via-indigo-500 to-purple-600 p-0.5 shadow-xl transition-transform group-hover:scale-[1.02]">
                <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-900 flex items-center justify-center">
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt={profile?.displayName || 'Avatar'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-2xl font-black tracking-wider">
                      {initials}
                    </span>
                  )}
                </div>
              </div>

              {/* Upload Overlay Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingAvatar}
                aria-label="Ubah Foto Profil"
                className="absolute inset-0 rounded-3xl bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer backdrop-blur-2xs"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                ) : (
                  <>
                    <Camera className="h-6 w-6 mb-1" />
                    <span className="text-[10px] font-bold">Ganti Foto</span>
                  </>
                )}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Verified Badge Icon */}
              {profile?.approvalStatus === 'APPROVED' && (
                <div
                  title="Member Terverifikasi"
                  className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1.5 rounded-full ring-4 ring-white dark:ring-slate-900 shadow-md"
                >
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  {profile?.displayName || authUser?.displayName || 'Member SAKODE'}
                </h1>
                <Badge
                  variant="outline"
                  className="border-sky-300 dark:border-sky-800 bg-sky-50/80 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-bold text-[11px]"
                >
                  Level {levelProgress.currentTier.level}: {levelProgress.currentTier.title}
                </Badge>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {profile?.email || authUser?.email}
              </p>

              {profile?.bio && (
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed pt-1">
                  &ldquo;{profile.bio}&rdquo;
                </p>
              )}

              {/* Status and Action Buttons */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                <StatusPill status={profile?.approvalStatus || 'PENDING'} size="sm" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline cursor-pointer"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isUploadingAvatar ? 'Mengunggah...' : 'Unggah Foto Baru'}</span>
                </button>
                {profile?.portfolioUrl && (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Portofolio</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick XP Summary Widget */}
          <div className="w-full md:w-auto shrink-0 p-4 rounded-2xl bg-white/80 dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 backdrop-blur-sm text-center md:text-right shadow-xs">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Pengalaman (XP)
            </div>
            <div className="text-2xl font-black text-sky-600 dark:text-sky-400 flex items-center justify-center md:justify-end gap-1.5 mt-0.5">
              <Zap className="h-5 w-5 fill-current" />
              <span>{levelProgress.totalXp.toLocaleString('id-ID')} XP</span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {levelProgress.nextTier ? (
                <>
                  Kurang{' '}
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {levelProgress.xpNeededForNext} XP
                  </span>{' '}
                  menuju Level {levelProgress.nextTier.level}
                </>
              ) : (
                <span className="font-bold text-purple-500">Tier Puncak Tercapai 🏆</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
        <button
          type="button"
          onClick={() => setActiveTab('gamification')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'gamification'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Trophy className="h-4 w-4" />
          <span>Level & Pencapaian</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
            {unlockedCount}/{allAchievements.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'personal'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <User className="h-4 w-4" />
          <span>Data Pribadi & Keahlian</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payout')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'payout'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Rekening & Pencairan</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reputation')}
          className={`pb-3 px-3.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'reputation'
              ? 'border-sky-500 text-sky-600 dark:text-sky-400'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Shield className="h-4 w-4" />
          <span>Statistik Reputasi</span>
        </button>
      </div>

      {/* TAB 1: GAMIFICATION (LEVEL & ACHIEVEMENTS) */}
      {activeTab === 'gamification' && (
        <div className="space-y-6">
          {/* Level Progress Hero Card */}
          <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white border-slate-800 shadow-xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    Tier Sekarang: Level {levelProgress.currentTier.level}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {levelProgress.currentTier.title}
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {levelProgress.currentTier.badgeName}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {levelProgress.currentTier.description}
                </p>
              </div>

              {/* Progression Bar */}
              <div className="w-full lg:w-96 space-y-2.5 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300">Progres Level</span>
                  <span className="text-sky-400">{levelProgress.progressPercent}%</span>
                </div>

                {/* Progress Bar Container */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div
                    className="h-full bg-gradient-to-r from-sky-500 to-emerald-400 rounded-full transition-all duration-500 shadow-xs"
                    style={{ width: `${levelProgress.progressPercent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>{levelProgress.totalXp} XP</span>
                  {levelProgress.nextTier ? (
                    <span>Target: {levelProgress.nextTier.minXp} XP (Level {levelProgress.nextTier.level})</span>
                  ) : (
                    <span>Maksimal</span>
                  )}
                </div>
              </div>
            </div>

            {/* Level Tier Roadmap Strip */}
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {LEVEL_TIERS.map((tier) => {
                const isCurrent = tier.level === levelProgress.currentTier.level;
                const isPassed = tier.level < levelProgress.currentTier.level;
                return (
                  <div
                    key={tier.level}
                    className={`p-3 rounded-xl border transition-all text-center ${
                      isCurrent
                        ? 'border-sky-500 bg-sky-500/10 ring-2 ring-sky-500/30'
                        : isPassed
                        ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300'
                        : 'border-slate-800 bg-slate-900/60 opacity-60'
                    }`}
                  >
                    <div className="text-[10px] font-bold text-slate-400">LVL {tier.level}</div>
                    <div className="text-xs font-black truncate mt-0.5 text-white">{tier.title}</div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      {tier.minXp} {tier.maxXp === Infinity ? '+ XP' : `-${tier.maxXp} XP`}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Achievement Filter & Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Koleksi Lencana & Pencapaian (Badges)</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Dapatkan lencana eksklusif dan bonus XP dengan menyelesaikan quest dan misi operasional.
              </p>
            </div>

            {/* Status Filter Toggle */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <button
                type="button"
                onClick={() => setAchievementFilter('ALL')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  achievementFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Semua ({allAchievements.length})
              </button>
              <button
                type="button"
                onClick={() => setAchievementFilter('UNLOCKED')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  achievementFilter === 'UNLOCKED'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Terbuka ({unlockedCount})
              </button>
              <button
                type="button"
                onClick={() => setAchievementFilter('LOCKED')}
                className={`px-3 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                  achievementFilter === 'LOCKED'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Belum ({lockedCount})
              </button>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {(
              [
                { id: 'ALL', label: 'Semua Kategori' },
                { id: 'TASK', label: 'Task Solo' },
                { id: 'PERFORMANCE', label: 'Performa & Kecepatan' },
                { id: 'TEAM', label: 'Kolaborasi Tim' },
                { id: 'FINANCIAL', label: 'Bounty & Reward' },
                { id: 'COMMUNITY', label: 'Integritas & Komunitas' },
              ] as const
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 font-bold shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Achievement Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAchievements.map((item) => {
              const isUnlocked = item.unlocked;

              // Rarity color accents
              const rarityBadge =
                item.rarity === 'LEGENDARY'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                  : item.rarity === 'EPIC'
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-300 dark:border-purple-800'
                  : item.rarity === 'RARE'
                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';

              return (
                <Card
                  key={item.id}
                  className={`p-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                    isUnlocked
                      ? 'border-emerald-300/80 dark:border-emerald-800/80 bg-gradient-to-b from-white to-emerald-50/20 dark:from-slate-900 dark:to-emerald-950/20 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 opacity-80'
                  }`}
                >
                  <div>
                    {/* Card Header with Icon & Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs transition-transform ${
                          isUnlocked
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isUnlocked ? (
                          <AchievementIcon name={item.iconName} className="h-6 w-6" />
                        ) : (
                          <Lock className="h-5 w-5" />
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${rarityBadge}`}
                        >
                          {item.rarity}
                        </span>
                        <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 flex items-center gap-0.5">
                          <Zap className="h-3 w-3 fill-current" />
                          +{item.xpBonus} XP
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="mt-3.5 space-y-1">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{item.title}</span>
                        {isUnlocked && (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        )}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Progress / Status Footer */}
                  <div className="mt-4 pt-3.5 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center justify-between text-[11px] mb-1.5 font-semibold">
                      <span className="text-slate-500 dark:text-slate-400">
                        {isUnlocked ? 'Status Pencapaian' : 'Progres Target'}
                      </span>
                      <span
                        className={
                          isUnlocked
                            ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'text-slate-700 dark:text-slate-300'
                        }
                      >
                        {item.progressLabel}
                      </span>
                    </div>

                    {/* Mini Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isUnlocked
                            ? 'bg-emerald-500'
                            : 'bg-sky-500'
                        }`}
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DATA PRIBADI & KEAHLIAN */}
      {activeTab === 'personal' && (
        <Card className="p-6 sm:p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Informasi Biodata & Keahlian Member
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Pastikan data yang Anda masukkan akurat untuk memudahkan kurasi task dan evaluasi hasil pengerjaan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Display Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Contoh: Yoga Agustiansyah"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Email (Readonly) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Email Akun
                </label>
                <input
                  type="email"
                  value={profile?.email || authUser?.email || ''}
                  disabled
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs text-slate-400 dark:text-slate-500 cursor-not-allowed"
                />
              </div>

              {/* Contact Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Nomor WhatsApp / Kontak <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  required
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <p className="text-[11px] text-slate-400">Digunakan untuk koordinasi pengerjaan task dan verifikasi.</p>
              </div>

              {/* Portfolio URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Tautan Portofolio / GitHub / LinkedIn
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/username atau https://myportfolio.com"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Bio Singkat
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ceritakan latar belakang teknis, fokus minat pemrograman, atau pengalaman Anda..."
                maxLength={300}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Maksimal 300 karakter</span>
                <span>{bio.length}/300</span>
              </div>
            </div>

            {/* Skills Tag Input */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Daftar Keahlian Teknis (Skills)
                </label>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Tambahkan keahlian spesifik Anda untuk memudahkan kurasi task yang sesuai kriteria.
                </p>
              </div>

              {/* Active Skills Badges */}
              <div className="flex flex-wrap items-center gap-2 min-h-8">
                {skills.length > 0 ? (
                  skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80"
                    >
                      <span>{skill}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-sky-500 hover:text-sky-800 dark:hover:text-sky-100"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada keahlian ditambahkan.</p>
                )}
              </div>

              {/* Custom Tag Input */}
              <div className="flex items-center gap-2 max-w-md">
                <input
                  type="text"
                  value={newSkillInput}
                  onChange={(e) => setNewSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkill(newSkillInput);
                    }
                  }}
                  placeholder="Ketik keahlian lalu tekan Enter..."
                  className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSkill(newSkillInput)}
                  className="h-9 px-3"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Tambah
                </Button>
              </div>

              {/* Suggested Skills */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] font-semibold text-slate-400">Rekomendasi Cepat:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.filter((s) => !skills.includes(s)).map((rec) => (
                    <button
                      key={rec}
                      type="button"
                      onClick={() => handleAddSkill(rec)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                    >
                      + {rec}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={isSaving} className="min-w-36">
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-1.5" />
                    Simpan Profil
                  </>
                )}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 3: REKENING & PENCAIRAN DANA */}
      {activeTab === 'payout' && (
        <Card className="p-6 sm:p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              <span>Informasi Rekening Pencairan Reward</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rekening ini digunakan admin untuk mencairkan saldo bounty Anda langsung ke rekening bank atau dompet digital.
            </p>
          </div>

          {/* Current Encrypted Account Info */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Building className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Rekening Terdaftar
                </span>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {profile?.paymentAccountMasked || 'Belum didaftarkan'}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsUpdatingBank(!isUpdatingBank)}
            >
              {isUpdatingBank ? 'Tutup Form' : 'Perbarui Rekening'}
            </Button>
          </div>

          {/* Security notice */}
          <div className="p-3.5 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800/60 text-sky-800 dark:text-sky-300 text-xs flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
            <span className="leading-relaxed">
              Nomor rekening Anda dienkripsi menggunakan standar keamanan militer <strong>AES-256-GCM</strong>. Data asli hanya dapat dibuka oleh Super Admin yang berwenang saat memproses transfer pencairan dana.
            </span>
          </div>

          {/* Update Bank Form */}
          {isUpdatingBank && (
            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Formulir Rekening Baru
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Bank / Dompet Digital <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value as SupportedPaymentProvider)}
                    required
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">Pilih Bank / E-Wallet</option>
                    {BANK_PROVIDERS.map((bp) => (
                      <option key={bp.value} value={bp.value}>
                        {bp.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nomor Rekening / HP <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="Contoh: 1234567890"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Nama Pemilik Rekening <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    placeholder="Sesuai buku tabungan / KTP"
                    required
                    className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsUpdatingBank(false)}
                >
                  Batal
                </Button>
                <Button type="submit" size="sm" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1.5" />
                      Simpan Rekening Baru
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      {/* TAB 4: STATISTIK REPUTASI */}
      {activeTab === 'reputation' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Task Diselesaikan</span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {profile?.stats?.completedTasks || 0}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Deliverable disetujui admin
              </p>
            </Card>

            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Tepat Waktu (On-Time)</span>
                <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400">
                  <Zap className="h-4 w-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">
                {profile?.stats?.onTimeTasks || 0}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Diserahkan sebelum deadline
              </p>
            </Card>

            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Total Bounty Cair</span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                  <CoinsIcon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-2 truncate">
                {formatCurrencyIDR(totalBountyEarned)}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Reward resmi ditransfer
              </p>
            </Card>

            <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400">Status Keanggotaan</span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
              </div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {profile?.approvalStatus === 'APPROVED' ? 'TERVERIFIKASI' : 'PENDING'}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Bergabung sejak {formatDateWIB(profile?.createdAt || new Date())}
              </p>
            </Card>
          </div>

          <Card className="p-6 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-sky-500" />
              <span>Pedoman Reputasi & Integritas SAKODE</span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Tingkat reputasi dan lencana keahlian Anda mempengaruhi prioritas pemilihan saat mendaftar pada task bernilai bounty tinggi dan task kolaborasi tim. Pertahankan rekor penyelesaian tepat waktu dan hindari pelanggaran hak cipta pada berkas deliverable.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

function CoinsIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="8" cy="8" r="6" />
      <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
      <path d="M7 6h1v4" />
      <path d="m16.71 13.88.7.71-2.82 2.82" />
    </svg>
  );
}

export default function MemberProfilePage() {
  return (
    <AuthGuard requireApproved>
      <MemberProfileInner />
    </AuthGuard>
  );
}
