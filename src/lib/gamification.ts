/**
 * SAKODE Task & Reward Platform - Gamification, Levels & Achievements System
 * Menghitung level, XP, dan progres lencana pencapaian (achievements) member secara dinamis.
 */

import type { UserDocument } from '@/types/database';

export interface LevelTier {
  level: number;
  title: string;
  minXp: number;
  maxXp: number;
  badgeName: string;
  color: string;
  borderClass: string;
  bgGradient: string;
  description: string;
}

export const LEVEL_TIERS: LevelTier[] = [
  {
    level: 1,
    title: 'Novice Hunter',
    minXp: 0,
    maxXp: 99,
    badgeName: 'Pemula',
    color: 'text-slate-500 dark:text-slate-400',
    borderClass: 'border-slate-300 dark:border-slate-700',
    bgGradient: 'from-slate-500 to-slate-700',
    description: 'Langkah pertama menjelajahi ekosistem quest & bounty SAKODE.',
  },
  {
    level: 2,
    title: 'Task Runner',
    minXp: 100,
    maxXp: 299,
    badgeName: 'Pelari Cepat',
    color: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-300 dark:border-emerald-700',
    bgGradient: 'from-emerald-500 to-teal-600',
    description: 'Mulai konsisten mengeksekusi tugas operasional platform secara tangkas.',
  },
  {
    level: 3,
    title: 'Quest Specialist',
    minXp: 300,
    maxXp: 599,
    badgeName: 'Spesialis',
    color: 'text-sky-600 dark:text-sky-400',
    borderClass: 'border-sky-300 dark:border-sky-700',
    bgGradient: 'from-sky-500 to-blue-600',
    description: 'Spesialis andal dengan keahlian teknis teruji dan deliverable berkualitas.',
  },
  {
    level: 4,
    title: 'Bounty Master',
    minXp: 600,
    maxXp: 999,
    badgeName: 'Master Bounty',
    color: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-300 dark:border-amber-700',
    bgGradient: 'from-amber-500 to-orange-600',
    description: 'Eksekutor senior dengan rekam jejak penyelesaian tugas bernilai tinggi.',
  },
  {
    level: 5,
    title: 'SAKODE Champion',
    minXp: 1000,
    maxXp: Infinity,
    badgeName: 'Legenda / Juara',
    color: 'text-purple-600 dark:text-purple-400',
    borderClass: 'border-purple-300 dark:border-purple-700',
    bgGradient: 'from-purple-500 to-pink-600',
    description: 'Peringkat kehormatan tertinggi bagi kontributor teladan di SAKODE Academy.',
  },
];

export interface UserLevelProgress {
  totalXp: number;
  currentTier: LevelTier;
  nextTier: LevelTier | null;
  progressPercent: number;
  xpInCurrentTier: number;
  xpNeededForNext: number;
}

/**
 * Menghitung akumulasi XP dan status level pengguna berdasarkan data aktivitas
 */
export function calculateUserLevel(user: UserDocument, totalBountyEarned: number = 0): UserLevelProgress {
  const stats = user.stats || { completedTasks: 0, onTimeTasks: 0, failedTasks: 0, provenReports: 0 };
  
  // XP Formula:
  // - 50 XP per completed task
  // - 25 XP bonus per on-time task
  // - 30 XP per proven report
  // - 10 XP per Rp 100.000 total bounty yang diterima
  const taskXp = (stats.completedTasks || 0) * 50;
  const onTimeXp = (stats.onTimeTasks || 0) * 25;
  const reportXp = (stats.provenReports || 0) * 30;
  const bountyXp = Math.floor((totalBountyEarned || 0) / 100000) * 10;

  const totalXp = taskXp + onTimeXp + reportXp + bountyXp;

  let currentTier = LEVEL_TIERS[0];
  let nextTier: LevelTier | null = LEVEL_TIERS[1];

  for (let i = 0; i < LEVEL_TIERS.length; i++) {
    const tier = LEVEL_TIERS[i];
    if (totalXp >= tier.minXp) {
      currentTier = tier;
      nextTier = i < LEVEL_TIERS.length - 1 ? LEVEL_TIERS[i + 1] : null;
    }
  }

  let progressPercent = 100;
  let xpInCurrentTier = totalXp - currentTier.minXp;
  let xpNeededForNext = 0;

  if (nextTier) {
    const tierRange = nextTier.minXp - currentTier.minXp;
    xpNeededForNext = nextTier.minXp - totalXp;
    progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentTier / tierRange) * 100)));
  }

  return {
    totalXp,
    currentTier,
    nextTier,
    progressPercent,
    xpInCurrentTier,
    xpNeededForNext,
  };
}

export type AchievementCategory = 'TASK' | 'PERFORMANCE' | 'TEAM' | 'FINANCIAL' | 'COMMUNITY';
export type AchievementRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  iconName: string;
  xpBonus: number;
  unlocked: boolean;
  currentProgress: number;
  targetProgress: number;
  progressPercent: number;
  progressLabel: string;
}

export const ACHIEVEMENTS_DEFINITIONS: Array<{
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  iconName: string;
  xpBonus: number;
  evaluate: (user: UserDocument, extra: { totalBountyEarned?: number; teamTasksCount?: number }) => {
    unlocked: boolean;
    current: number;
    target: number;
    label: string;
  };
}> = [
  {
    id: 'first_task',
    title: 'Langkah Pertama',
    description: 'Selesaikan dan serahkan task solo pertamamu di platform SAKODE.',
    category: 'TASK',
    rarity: 'COMMON',
    iconName: 'Target',
    xpBonus: 50,
    evaluate: (user) => {
      const completed = user.stats?.completedTasks || 0;
      return {
        unlocked: completed >= 1,
        current: Math.min(completed, 1),
        target: 1,
        label: `${Math.min(completed, 1)} / 1 Task`,
      };
    },
  },
  {
    id: 'speed_demon',
    title: 'Kilat & Tepat Waktu',
    description: 'Kumpulkan tugas dengan status on-time sebelum batas deadline berakhir.',
    category: 'PERFORMANCE',
    rarity: 'COMMON',
    iconName: 'Zap',
    xpBonus: 75,
    evaluate: (user) => {
      const onTime = user.stats?.onTimeTasks || 0;
      return {
        unlocked: onTime >= 1,
        current: Math.min(onTime, 1),
        target: 1,
        label: `${Math.min(onTime, 1)} / 1 Task Tepat Waktu`,
      };
    },
  },
  {
    id: 'task_veteran_5',
    title: 'Mesin Produktivitas',
    description: 'Selesaikan 5 tugas proyek dengan hasil deliverable yang disetujui staf admin.',
    category: 'TASK',
    rarity: 'RARE',
    iconName: 'Award',
    xpBonus: 150,
    evaluate: (user) => {
      const completed = user.stats?.completedTasks || 0;
      return {
        unlocked: completed >= 5,
        current: Math.min(completed, 5),
        target: 5,
        label: `${completed} / 5 Task`,
      };
    },
  },
  {
    id: 'task_master_10',
    title: 'Legenda Bounty',
    description: 'Capai pencapaian elit dengan menyelesaikan 10 tugas proyek.',
    category: 'TASK',
    rarity: 'EPIC',
    iconName: 'Flame',
    xpBonus: 300,
    evaluate: (user) => {
      const completed = user.stats?.completedTasks || 0;
      return {
        unlocked: completed >= 10,
        current: Math.min(completed, 10),
        target: 10,
        label: `${completed} / 10 Task`,
      };
    },
  },
  {
    id: 'punctual_pro',
    title: 'Disiplin Emas',
    description: 'Pertahankan rasio on-time 100% dengan minimal 3 tugas terselesaikan.',
    category: 'PERFORMANCE',
    rarity: 'RARE',
    iconName: 'Clock',
    xpBonus: 120,
    evaluate: (user) => {
      const completed = user.stats?.completedTasks || 0;
      const onTime = user.stats?.onTimeTasks || 0;
      const unlocked = completed >= 3 && onTime >= completed;
      return {
        unlocked,
        current: Math.min(completed, 3),
        target: 3,
        label: unlocked ? '100% On-Time' : `${onTime} / 3 On-Time`,
      };
    },
  },
  {
    id: 'team_player',
    title: 'Kekuatan Squad',
    description: 'Selesaikan tugas dalam mode Squad / Tim bersama rekan sesama member.',
    category: 'TEAM',
    rarity: 'RARE',
    iconName: 'Users',
    xpBonus: 100,
    evaluate: (user, extra) => {
      const teamTasks = extra.teamTasksCount || 0;
      return {
        unlocked: teamTasks >= 1,
        current: Math.min(teamTasks, 1),
        target: 1,
        label: `${Math.min(teamTasks, 1)} / 1 Task Tim`,
      };
    },
  },
  {
    id: 'bounty_first_100k',
    title: 'Pundi Pertama',
    description: 'Kumpulkan akumulasi reward bounty minimal Rp 100.000.',
    category: 'FINANCIAL',
    rarity: 'COMMON',
    iconName: 'Coins',
    xpBonus: 50,
    evaluate: (_, extra) => {
      const bounty = extra.totalBountyEarned || 0;
      return {
        unlocked: bounty >= 100000,
        current: Math.min(bounty, 100000),
        target: 100000,
        label: `Rp ${bounty.toLocaleString('id-ID')} / Rp 100.000`,
      };
    },
  },
  {
    id: 'bounty_millionaire',
    title: 'Jutawan Bounty',
    description: 'Kumpulkan akumulasi reward bounty mencapai Rp 1.000.000 atau lebih.',
    category: 'FINANCIAL',
    rarity: 'EPIC',
    iconName: 'Gem',
    xpBonus: 250,
    evaluate: (_, extra) => {
      const bounty = extra.totalBountyEarned || 0;
      return {
        unlocked: bounty >= 1000000,
        current: Math.min(bounty, 1000000),
        target: 1000000,
        label: `Rp ${bounty.toLocaleString('id-ID')} / Rp 1.000.000`,
      };
    },
  },
  {
    id: 'bounty_tycoon',
    title: 'Sultan SAKODE',
    description: 'Capai level finansial tertinggi dengan akumulasi reward Rp 5.000.000+.',
    category: 'FINANCIAL',
    rarity: 'LEGENDARY',
    iconName: 'Crown',
    xpBonus: 500,
    evaluate: (_, extra) => {
      const bounty = extra.totalBountyEarned || 0;
      return {
        unlocked: bounty >= 5000000,
        current: Math.min(bounty, 5000000),
        target: 5000000,
        label: `Rp ${bounty.toLocaleString('id-ID')} / Rp 5.000.000`,
      };
    },
  },
  {
    id: 'clean_record',
    title: 'Tanpa Cacat',
    description: 'Selesaikan minimal 3 task dengan 0 failed task (rekam jejak 100% sukses).',
    category: 'PERFORMANCE',
    rarity: 'RARE',
    iconName: 'ShieldCheck',
    xpBonus: 100,
    evaluate: (user) => {
      const completed = user.stats?.completedTasks || 0;
      const failed = user.stats?.failedTasks || 0;
      const unlocked = completed >= 3 && failed === 0;
      return {
        unlocked,
        current: unlocked ? 3 : Math.min(completed, 3),
        target: 3,
        label: unlocked ? 'Bebas Gagal (0 Fail)' : `${completed} / 3 Selesai (Fail: ${failed})`,
      };
    },
  },
  {
    id: 'integrity_guardian',
    title: 'Penjaga Integritas',
    description: 'Ajukan laporan sengketa yang telah diverifikasi dan disetujui staf admin.',
    category: 'COMMUNITY',
    rarity: 'EPIC',
    iconName: 'Scale',
    xpBonus: 150,
    evaluate: (user) => {
      const proven = user.stats?.provenReports || 0;
      return {
        unlocked: proven >= 1,
        current: Math.min(proven, 1),
        target: 1,
        label: `${Math.min(proven, 1)} / 1 Laporan Terbukti`,
      };
    },
  },
  {
    id: 'verified_alumni',
    title: 'Member Terverifikasi',
    description: 'Menyelesaikan proses onboarding dan disetujui sebagai member resmi SAKODE.',
    category: 'COMMUNITY',
    rarity: 'COMMON',
    iconName: 'Sparkles',
    xpBonus: 50,
    evaluate: (user) => {
      const isApproved = user.approvalStatus === 'APPROVED';
      return {
        unlocked: isApproved,
        current: isApproved ? 1 : 0,
        target: 1,
        label: isApproved ? 'Terverifikasi' : 'Pending Kurasi',
      };
    },
  },
];

/**
 * Menguji seluruh pencapaian (achievements) untuk seorang member
 */
export function evaluateUserAchievements(
  user: UserDocument,
  extra: { totalBountyEarned?: number; teamTasksCount?: number } = {}
): AchievementItem[] {
  return ACHIEVEMENTS_DEFINITIONS.map((def) => {
    const res = def.evaluate(user, extra);
    const progressPercent = res.target > 0
      ? Math.min(100, Math.max(0, Math.round((res.current / res.target) * 100)))
      : (res.unlocked ? 100 : 0);

    return {
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      rarity: def.rarity,
      iconName: def.iconName,
      xpBonus: def.xpBonus,
      unlocked: res.unlocked,
      currentProgress: res.current,
      targetProgress: res.target,
      progressPercent,
      progressLabel: res.label,
    };
  });
}
