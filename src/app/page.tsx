'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/Button';
import { cn, formatCurrencyIDR } from '@/lib/utils';
import { TASK_STATUS } from '@/lib/constants';
import {
  Compass,
  ArrowRight,
  ArrowDown,
  Terminal,
  BookOpen,
  Megaphone,
  Users,
  User,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Award,
  ChevronRight,
  ChevronDown,
  Wallet,
  Target,
  FileCheck2,
  Coins,
  Layers,
  FileText,
  Zap,
  Search,
  X,
  Sparkles,
  Lock,
  HelpCircle,
  Check,
} from 'lucide-react';

// =============================================================================
// Mock Data: Tasks Multi-Disiplin SAKODE Work
// =============================================================================
type TaskCategory = 'all' | 'tech' | 'edu' | 'marketing';
type TaskModeFilter = 'all' | 'SOLO' | 'TEAM';

interface FeaturedTask {
  id: string;
  title: string;
  category: 'tech' | 'edu' | 'marketing';
  categoryLabel: string;
  difficulty: 'Beginner • 🟢' | 'Intermediate • 🔵' | 'Advanced • 🟣' | 'Team Project • 👥';
  difficultyVariant: 'beginner' | 'intermediate' | 'advanced' | 'team';
  mode: 'SOLO' | 'TEAM';
  teamSlots?: string;
  reward: number;
  deadlineNotice: string;
  skills: string[];
  description: string;
  status: typeof TASK_STATUS.OPEN | typeof TASK_STATUS.RECRUITING;
}

const FEATURED_TASKS: FeaturedTask[] = [
  {
    id: 'task-tech-01',
    title: 'Implementasi Webhook Notifikasi & Real-time Sync Firestore',
    category: 'tech',
    categoryLabel: 'Teknologi & IT',
    difficulty: 'Advanced • 🟣',
    difficultyVariant: 'advanced',
    mode: 'SOLO',
    reward: 2400000,
    deadlineNotice: 'Sisa 5 Hari • WIB',
    skills: ['Next.js 16', 'TypeScript', 'Firestore', 'Webhooks'],
    description:
      'Membangun worker integrasi Cloud Function untuk sinkronisasi webhook status pembayaran dan dispatch notifikasi instan.',
    status: TASK_STATUS.OPEN,
  },
  {
    id: 'task-tech-02',
    title: 'Revamp Design System & Dark Canvas Dashboard SAKODE',
    category: 'tech',
    categoryLabel: 'Teknologi & IT',
    difficulty: 'Team Project • 👥',
    difficultyVariant: 'team',
    mode: 'TEAM',
    teamSlots: '2 dari 3 Kontributor',
    reward: 4500000,
    deadlineNotice: 'Sisa 8 Hari • WIB',
    skills: ['Tailwind CSS v4', 'React 19', 'Figma', 'Ergonomics'],
    description:
      'Implementasi token desain bertekstur modern, standarisasi komponen aksesibel, dan optimasi micro-interaction responsif.',
    status: TASK_STATUS.RECRUITING,
  },
  {
    id: 'task-tech-03',
    title: 'Refactoring REST API Authentication & Role Guard Middleware',
    category: 'tech',
    categoryLabel: 'Teknologi & IT',
    difficulty: 'Intermediate • 🔵',
    difficultyVariant: 'intermediate',
    mode: 'SOLO',
    reward: 1250000,
    deadlineNotice: 'Sisa 3 Hari • WIB',
    skills: ['Firebase Admin', 'JWT', 'Security Headers', 'Zod'],
    description:
      'Perketat verifikasi claim token Firebase Auth, penanganan multi-role (Admin/Member/SuperAdmin), dan isolasi endpoint audit.',
    status: TASK_STATUS.OPEN,
  },
  {
    id: 'task-edu-01',
    title: 'Penyusunan Silabus & Lab Praktikum Bootcamp Fullstack Web 2026',
    category: 'edu',
    categoryLabel: 'Modul & Edukasi',
    difficulty: 'Advanced • 🟣',
    difficultyVariant: 'advanced',
    mode: 'TEAM',
    teamSlots: '1 dari 2 Instruktur',
    reward: 3800000,
    deadlineNotice: 'Sisa 7 Hari • WIB',
    skills: ['Curriculum Design', 'React & Node.js', 'Labs', 'Markdown'],
    description:
      'Merumuskan 12 modul pembelajaran berbasis proyek industri, panduan mentor, dan repository template praktikum mahasiswa.',
    status: TASK_STATUS.RECRUITING,
  },
  {
    id: 'task-edu-02',
    title: 'Pembuatan Bank Soal Interaktif Algoritma & Struktur Data (50 Soal)',
    category: 'edu',
    categoryLabel: 'Modul & Edukasi',
    difficulty: 'Intermediate • 🔵',
    difficultyVariant: 'intermediate',
    mode: 'SOLO',
    reward: 1000000,
    deadlineNotice: 'Sisa 4 Hari • WIB',
    skills: ['Data Structures', 'Python/TS', 'Pedagogy', 'Quiz Schema'],
    description:
      'Menulis 50 soal pilihan ganda & studi kasus analitis lengkap dengan pembahasan mendalam dan tes kasus kode otomatis.',
    status: TASK_STATUS.OPEN,
  },
  {
    id: 'task-edu-03',
    title: 'Review & Standarisasi Cheat Sheet Git & CI/CD Pipelines',
    category: 'edu',
    categoryLabel: 'Modul & Edukasi',
    difficulty: 'Beginner • 🟢',
    difficultyVariant: 'beginner',
    mode: 'SOLO',
    reward: 500000,
    deadlineNotice: 'Sisa 2 Hari • WIB',
    skills: ['Git', 'GitHub Actions', 'Documentation', 'Technical Writing'],
    description:
      'Memperbarui dokumentasi alur branching Git, aturan pull request tim, dan cheatsheet perintah terminal untuk peserta akademi.',
    status: TASK_STATUS.OPEN,
  },
  {
    id: 'task-mkt-01',
    title: 'Kampanye Komunitas & Manajemen Webinar Tech Talk Bulanan',
    category: 'marketing',
    categoryLabel: 'Marketing & Komunitas',
    difficulty: 'Team Project • 👥',
    difficultyVariant: 'team',
    mode: 'TEAM',
    teamSlots: '2 dari 2 Event Leads',
    reward: 2800000,
    deadlineNotice: 'Sisa 6 Hari • WIB',
    skills: ['Event Management', 'Community Outreach', 'Livestream Ops'],
    description:
      'Koordinasi teknis webinar nasional, manajemen registrasi 500+ peserta, dan pengadaan sertifikat digital otomatis.',
    status: TASK_STATUS.RECRUITING,
  },
  {
    id: 'task-mkt-02',
    title: 'Desain Seri Infografis Edukatif & Carousel Instagram Batch 12',
    category: 'marketing',
    categoryLabel: 'Marketing & Komunitas',
    difficulty: 'Intermediate • 🔵',
    difficultyVariant: 'intermediate',
    mode: 'SOLO',
    reward: 850000,
    deadlineNotice: 'Sisa 3 Hari • WIB',
    skills: ['Figma', 'Visual Hierarchy', 'Brand Guidelines', 'Social Media'],
    description:
      'Merancang 5 set carousel edukasi arsitektur cloud dan tips karier developer sesuai visual guide resmi SAKODE.',
    status: TASK_STATUS.OPEN,
  },
  {
    id: 'task-mkt-03',
    title: 'Copywriting Newsletter Mingguan & Landing Page Promosi Beasiswa',
    category: 'marketing',
    categoryLabel: 'Marketing & Komunitas',
    difficulty: 'Beginner • 🟢',
    difficultyVariant: 'beginner',
    mode: 'SOLO',
    reward: 650000,
    deadlineNotice: 'Sisa 2 Hari • WIB',
    skills: ['Copywriting', 'SEO', 'Email Marketing', 'Storytelling'],
    description:
      'Menulis naskah email pengumuman beasiswa talenta digital dan salinan promosi terkonversi tinggi untuk web pendaftaran.',
    status: TASK_STATUS.OPEN,
  },
];

// =============================================================================
// Hall of Fame: Lencana Kehormatan Tertinggi SAKODE (Pinnacle Badges)
// Catatan: Seluruh 20+ lencana lengkap tersedia di Halaman Achievement Dashboard.
// =============================================================================
interface BadgeItem {
  id: string;
  file: string;
  title: string;
  role: 'Teknologi & IT' | 'Modul & Edukasi' | 'Marketing & Komunitas' | 'Milestone SAKODE';
  roleKey: 'tech' | 'edu' | 'marketing' | 'milestone';
  tier: 'Common • 🟢' | 'Rare • 🔵' | 'Epic • 🟣' | 'Legendary • 🟡';
  tierKey: 'common' | 'rare' | 'epic' | 'legendary';
  desc: string;
  criteria: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PINNACLE_BADGES: BadgeItem[] = [
  {
    id: 'precision-craft',
    file: '/badges/badge-golden-ledger.svg',
    title: 'Presisi Tanpa Revisi',
    role: 'Milestone SAKODE',
    roleKey: 'milestone',
    tier: 'Legendary • 🟡',
    tierKey: 'legendary',
    desc: 'Konsistensi 5 deliverable beruntun dengan nilai sempurna tanpa revisi admin.',
    criteria: 'Pertahankan catatan 5 task berurutan dengan status Langsung Disetujui (Approved) oleh tim QA.',
    icon: CheckCircle2,
  },
  {
    id: 'code-artisan',
    file: '/badges/badge-code-artisan.svg',
    title: 'Arsitek Solusi',
    role: 'Teknologi & IT',
    roleKey: 'tech',
    tier: 'Epic • 🟣',
    tierKey: 'epic',
    desc: 'Penyelesaian arsitektur kode zero-defect berskala produksi tingkat lanjut.',
    criteria: 'Selesaikan minimal 3 task arsitektur backend/frontend skala Advanced dengan akurasi 100%.',
    icon: Terminal,
  },
  {
    id: 'knowledge-mentor',
    file: '/badges/badge-knowledge-mentor.svg',
    title: 'Mentor Teladan',
    role: 'Modul & Edukasi',
    roleKey: 'edu',
    tier: 'Epic • 🟣',
    tierKey: 'epic',
    desc: 'Penyusunan kurikulum industri komprehensif dan bimbingan talent hingga lulus.',
    criteria: 'Menyusun modul kurikulum terverifikasi dan membimbing kontributor baru hingga tuntas.',
    icon: Award,
  },
  {
    id: 'community-champion',
    file: '/badges/badge-community-champion.svg',
    title: 'Katalis Komunitas',
    role: 'Marketing & Komunitas',
    roleKey: 'marketing',
    tier: 'Epic • 🟣',
    tierKey: 'epic',
    desc: 'Manajemen kampanye tech berskala nasional dengan 500+ partisipan aktif.',
    criteria: 'Mengkoordinasikan tech event atau produksi konten edukasi dengan impresi tertinggi.',
    icon: Megaphone,
  },
];

interface ContributorLevel {
  level: string;
  name: string;
  subtitle: string;
  tag: string;
  tagColor: string;
  badgeBg: string;
  borderColor: string;
  badgeFile: string;
  req: string;
  perk: string;
}

const CONTRIBUTOR_LEVELS: ContributorLevel[] = [
  {
    level: 'LVL 1',
    name: 'Onboarded Contributor',
    subtitle: 'Pemula Terverifikasi',
    tag: 'Entry',
    tagColor: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    badgeBg: 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300',
    borderColor: 'border-slate-200 dark:border-slate-800',
    badgeFile: '/badges/badge-level-1.svg',
    req: 'Persetujuan profil & verifikasi akun oleh admin',
    perk: 'Akses penuh ke task kategori Beginner (Reward hingga Rp 750.000)',
  },
  {
    level: 'LVL 2',
    name: 'Active Contributor',
    subtitle: '3+ Task Sukses',
    tag: '3+ Task',
    tagColor: 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300',
    badgeBg: 'bg-sky-100 dark:bg-sky-950 text-[#076991] dark:text-sakode-cyan border border-sky-300 dark:border-sky-800',
    borderColor: 'border-sky-200 dark:border-sky-500/20',
    badgeFile: '/badges/badge-level-2.svg',
    req: 'Menyelesaikan 3 task mandiri dengan penilaian A',
    perk: 'Membuka task Intermediate & hak bergabung dalam Team Party',
  },
  {
    level: 'LVL 3',
    name: 'Senior Specialist',
    subtitle: '8+ Task Selesai',
    tag: 'Advanced',
    tagColor: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-sakode-purple border border-purple-300 dark:border-purple-800',
    borderColor: 'border-purple-200 dark:border-purple-500/20',
    badgeFile: '/badges/badge-level-3.svg',
    req: 'Menyelesaikan 8 task dengan riwayat zero-critical defect',
    perk: 'Akses task Advanced, prioritas review tim QA, & kuota aplikasi prioritas',
  },
  {
    level: 'LVL 4',
    name: 'Lead Fellow',
    subtitle: 'Inisiator Tim & QA',
    tag: 'Fellow',
    tagColor: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800',
    borderColor: 'border-amber-200 dark:border-amber-500/20',
    badgeFile: '/badges/badge-level-4.svg',
    req: '15+ task selesai & memimpin minimal 2 Team Projects',
    perk: 'Memimpin Party Tim multi-disiplin & hak diundang sebagai Co-Reviewer QA',
  },
  {
    level: 'LVL 5',
    name: 'Grandmaster Fellow',
    subtitle: 'Apex Legend Kontributor',
    tag: 'Grandmaster',
    tagColor: 'bg-gradient-to-r from-amber-500/20 to-sky-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50',
    badgeBg: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950 dark:to-amber-900 text-amber-800 dark:text-amber-300 border border-amber-400 dark:border-amber-600 shadow-xs shadow-amber-500/20',
    borderColor: 'border-amber-300/80 dark:border-amber-500/40',
    badgeFile: '/badges/badge-level-5.svg',
    req: '30+ task selesai, rasio revisi < 5%, & kontribusi lintas pilar',
    perk: 'Hak veto arsitektur teknis, profil berlapis emas, & instruktur utama akademi',
  },
];

// =============================================================================
// FAQ Items Data
// =============================================================================
interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Siapa saja yang berhak mengambil task di SAKODE Work?',
    answer:
      'Seluruh mahasiswa, talenta teknologi, instruktur, dan alumni yang telah terdaftar serta profil akunnya telah disetujui (Approved) oleh administrator SAKODE Academy. Akun berstatus pending hanya dapat melihat katalog.',
  },
  {
    question: 'Bagaimana proses pencairan reward dan apakah ada potongan biaya?',
    answer:
      'Pencairan dilakukan 100% penuh dalam nominal Integer Rupiah tanpa potongan biaya administrasi. Setelah hasil kerja dinyatakan lulus review QA, reward masuk ke saldo dan ditransfer langsung ke rekening bank resmi (BCA, Mandiri, BRI, BNI) atau e-wallet (GoPay, OVO, DANA) yang terdaftar.',
  },
  {
    question: 'Mengapa kontributor hanya diperbolehkan mengerjakan 1 Active Task dalam satu waktu?',
    answer:
      'Aturan Strict Invariant "1 Active Task" dirancang untuk melindungi kesehatan beban kerja kontributor, mencegah keterlambatan deliverable, dan menjamin distribusi kesempatan yang adil bagi seluruh anggota komunitas.',
  },
  {
    question: 'Bagaimana mekanisme pembagian reward untuk task beregu (Team Project)?',
    answer:
      'Sebelum pengerjaan dimulai, anggota tim membentuk formasi party dan menetapkan persentase pembagian honor secara transparan. Sistem mewajibkan konsensus 100% dari seluruh anggota tim sebelum mutasi pencairan reward diproses.',
  },
];

// =============================================================================
// SAKODE Brand Ornament Components (Vector Smile Arc & Glyphs)
// =============================================================================
const SakodeSmileArc: React.FC<{ className?: string }> = ({
  className = 'w-9 h-3 text-amber-500',
}) => (
  <svg
    viewBox="0 0 48 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={cn('inline-block shrink-0', className)}
    aria-hidden="true"
  >
    <path
      d="M 6 4 C 14 14, 34 14, 42 4"
      stroke="currentColor"
      strokeWidth="2.8"
      strokeLinecap="round"
    />
    <circle cx="6" cy="4" r="1.5" fill="currentColor" />
    <circle cx="42" cy="4" r="1.5" fill="currentColor" />
  </svg>
);

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('all');
  const [selectedModeFilter, setSelectedModeFilter] = useState<TaskModeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewBadge, setPreviewBadge] = useState<BadgeItem | null>(null);
  const [activeFaqIndex, setActiveFaqIndex] = useState<number | null>(null);

  const handleCategoryChange = (cat: TaskCategory) => {
    setSelectedCategory(cat);
    setIsExpanded(false);
  };

  const scrollToTaskExplorer = (cat?: TaskCategory) => {
    if (cat) setSelectedCategory(cat);
    const el = document.getElementById('task-explorer');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const filteredTasks = FEATURED_TASKS.filter((task) => {
    const matchesCategory = selectedCategory === 'all' || task.category === selectedCategory;
    const matchesMode = selectedModeFilter === 'all' || task.mode === selectedModeFilter;
    const matchesSearch =
      searchQuery.trim() === '' ||
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      task.categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesMode && matchesSearch;
  });

  const INITIAL_VISIBLE_COUNT = 3;
  const visibleTasks = isExpanded ? filteredTasks : filteredTasks.slice(0, INITIAL_VISIBLE_COUNT);
  const remainingCount = Math.max(0, filteredTasks.length - INITIAL_VISIBLE_COUNT);

  const getCategoryTopBorder = (category: 'tech' | 'edu' | 'marketing') => {
    switch (category) {
      case 'tech':
        return 'border-t-4 border-t-sakode-cyan';
      case 'edu':
        return 'border-t-4 border-t-sakode-purple';
      case 'marketing':
        return 'border-t-4 border-t-sakode-orange';
      default:
        return 'border-t-4 border-t-sakode-cyan';
    }
  };

  const getTierStyle = (tierKey: 'common' | 'rare' | 'epic' | 'legendary') => {
    switch (tierKey) {
      case 'legendary':
        return {
          cardHover: 'hover:shadow-amber-500/20 hover:border-amber-400 dark:hover:border-amber-500/60',
          tag: 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800',
          squircleBg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400',
        };
      case 'epic':
        return {
          cardHover: 'hover:shadow-purple-500/20 hover:border-purple-400 dark:hover:border-purple-500/60',
          tag: 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800',
          squircleBg: 'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400',
        };
      case 'rare':
        return {
          cardHover: 'hover:shadow-sky-500/20 hover:border-sky-400 dark:hover:border-sky-500/60',
          tag: 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800',
          squircleBg: 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400',
        };
      case 'common':
      default:
        return {
          cardHover: 'hover:shadow-emerald-500/20 hover:border-emerald-400 dark:hover:border-emerald-500/60',
          tag: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800',
          squircleBg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
        };
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 selection:bg-sakode-cyan/30 transition-colors">
      {/* Top Navbar */}
      <Navbar />

      <main className="flex-1">
        {/* =================================================================== */}
        {/* HERO SECTION DENGAN ORNAMEN LOGO & HURUF-HURUF MELAYANG ACIS */}
        {/* =================================================================== */}
        <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-sky-50/40 via-slate-50 to-slate-50 dark:from-[#0e1424] dark:via-[#0B0F19] dark:to-[#0B0F19] py-16 sm:py-24">
          {/* Ambient Radial Gradient Glow */}
          <div className="absolute -top-36 left-1/2 -translate-x-1/2 w-[850px] h-[550px] bg-gradient-to-b from-sky-400/20 via-purple-400/10 to-transparent dark:from-sky-500/15 dark:via-purple-500/10 blur-3xl rounded-full pointer-events-none select-none z-0" />

          {/* LAYER ORNAMEN BACKGROUND MELAYANG (Watermarks & Floating Letterforms) */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
            {/* Ornamen 1: Logo Emblem SAKODE Work Besar di Sisi Kanan Atas */}
            <div className="absolute top-6 -right-12 sm:right-6 lg:right-12 w-64 sm:w-80 lg:w-[460px] opacity-15 dark:opacity-25 rotate-[-12deg] animate-float-slow filter drop-shadow-[0_0_24px_rgba(113,207,254,0.3)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sakode-work-emblem.svg"
                alt=""
                className="w-full h-auto"
              />
            </div>

            {/* Ornamen 2: Brandmark {k} Maskot di Sisi Kiri Bawah */}
            <div className="absolute -bottom-8 -left-8 sm:left-4 lg:left-10 w-52 sm:w-68 lg:w-80 opacity-15 dark:opacity-25 rotate-[14deg] animate-float-reverse filter drop-shadow-[0_0_24px_rgba(188,113,254,0.3)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/sakode-brandmark.svg"
                alt=""
                className="w-full h-auto"
              />
            </div>

            {/* Ornamen Huruf Melayang 1: 'S' (Cyan) */}
            <div className="absolute top-16 left-[6%] hidden md:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-sky-300 dark:border-sky-500/60 shadow-md backdrop-blur-md text-[#076991] dark:text-sakode-cyan font-black text-2xl rotate-[-12deg] animate-float-slow">
              S
            </div>

            {/* Ornamen Huruf Melayang 2: Kurung Kurawal Kiri '{' (Purple) */}
            <div className="absolute top-28 right-[10%] hidden sm:flex items-center justify-center w-11 h-11 rounded-xl bg-purple-50/90 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-500/60 shadow-md backdrop-blur-md text-purple-600 dark:text-sakode-purple font-mono font-bold text-xl rotate-[16deg] animate-float-reverse">
              &#123;
            </div>

            {/* Ornamen Huruf Melayang 3: 'k' Maskot (Emerald) */}
            <div className="absolute bottom-24 left-[12%] hidden lg:flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/60 shadow-md backdrop-blur-md text-emerald-600 dark:text-emerald-400 font-black text-lg rotate-[8deg] animate-drift-lateral">
              k
            </div>

            {/* Ornamen Huruf Melayang 4: Kurung Kurawal Kanan '}' (Purple) */}
            <div className="absolute bottom-28 right-[8%] hidden md:flex items-center justify-center w-11 h-11 rounded-xl bg-purple-50/90 dark:bg-purple-950/80 border border-purple-300 dark:border-purple-500/60 shadow-md backdrop-blur-md text-purple-600 dark:text-sakode-purple font-mono font-bold text-xl rotate-[-10deg] animate-float-slow">
              &#125;
            </div>

            {/* Ornamen Tag Pengembang: '</>' Code Chip */}
            <div className="absolute top-1/2 -left-2 hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 border border-slate-300 dark:border-slate-700 shadow-md backdrop-blur-md text-slate-700 dark:text-slate-200 font-mono text-xs rotate-[-8deg] animate-float-reverse">
              &lt;/&gt;
              <span className="text-[10px] text-[#076991] dark:text-sakode-cyan font-sans font-bold">Dev</span>
            </div>

            {/* Ornamen Badge Mini: WORK Stamp */}
            <div className="absolute top-24 left-[34%] hidden xl:flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-500/60 text-amber-800 dark:text-amber-300 text-[10px] font-black uppercase tracking-wider rotate-[6deg] animate-drift-lateral shadow-md">
              WORK
            </div>

            {/* Ornamen Huruf Melayang 5: 'O' (Orange) */}
            <div className="absolute bottom-16 right-[30%] hidden xl:flex items-center justify-center w-10 h-10 rounded-xl bg-white/90 dark:bg-slate-900/90 border border-orange-300 dark:border-orange-500/60 text-orange-600 dark:text-sakode-orange font-black text-lg rotate-[12deg] animate-float-slow shadow-md">
              O
            </div>

            {/* Ornamen Koin Integer IDR Mini */}
            <div className="absolute top-40 left-[20%] hidden 2xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/60 text-emerald-800 dark:text-emerald-300 text-xs font-black rotate-[-6deg] animate-float-slow shadow-md">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>Integer IDR</span>
            </div>
          </div>

          {/* HERO CONTENT UTAMA */}
          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              {/* Official Brandmark & Subtitle Lockup */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 px-4 py-1.5 shadow-xs backdrop-blur-sm animate-micro-pulse">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/sakode-brandmark.svg"
                    alt="SAKODE Brandmark"
                    className="h-5 w-5 object-contain"
                  />
                  <div className="h-3.5 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    SAKODE Academy
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-sakode-cyan/20 text-[#076991] dark:text-sakode-cyan font-extrabold tracking-wide">
                    INTERNAL WORKSPACE
                  </span>
                </div>

                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Masa Depan Digital, Dimulai Dari Sini
                </span>
              </div>

              {/* Headline & Subheadline */}
              <div className="space-y-4">
                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 dark:text-white leading-[1.12]">
                  Kerjakan Task, Bangun SAKODE, Raih Reward Anda.
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto font-normal">
                  Platform kolaborasi internal untuk proyek teknologi, modul edukasi, dan marketing dengan reward transparan bagi kontributor, instruktur, dan talenta SAKODE Academy.
                </p>
              </div>

              {/* CTA Buttons dengan Tactile Feedback */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => scrollToTaskExplorer()}
                  className="h-12 px-7 font-black bg-sakode-cyan text-slate-950 hover:bg-[#5dbfe9] rounded-xl shadow-xs text-sm active:scale-[0.98] transition-all duration-200 ease-out group cursor-pointer"
                  rightIcon={
                    <ArrowDown className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5" />
                  }
                >
                  Lihat Task Aktif
                </Button>

                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-7 font-bold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-sm shadow-xs active:scale-[0.98] transition-all duration-200 ease-out"
                  >
                    Masuk ke Dashboard
                  </Button>
                </Link>
              </div>

              {/* Proof Metric Strip (Cards dengan Micro-Icon & Status Pill) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-10 max-w-5xl mx-auto">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs text-left hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out cursor-default group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Bounty Tersalurkan
                    </span>
                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                      <Coins className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {formatCurrencyIDR(24500000)}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>100% Tercairkan Tanpa Potongan</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs text-left hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out cursor-default group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Task Selesai
                    </span>
                    <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    128 Task
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500"></span>
                    <span>Standar Mutu QA Terpenuhi</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs text-left hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out cursor-default group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Kontributor Aktif
                    </span>
                    <div className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    480+ Talenta
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500"></span>
                    <span>Instruktur &amp; Alumni Terverifikasi</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs text-left hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out cursor-default group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Waktu Verifikasi
                    </span>
                    <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-[#076991] dark:text-sakode-cyan">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Zona WIB (UTC+7)
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#076991] dark:text-sakode-cyan mt-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-sakode-cyan animate-pulse"></span>
                    <span>Server-Side Deadline Guards</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* 3 PILARS SECTION (ELEVATED DENGAN SAKODE BRAND ORNAMENTS) */}
        {/* =================================================================== */}
        <section id="pillars" className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19] py-16 scroll-mt-16 relative overflow-hidden">
          {/* Ambient Brandmark Watermark behind Pillars */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.025] dark:opacity-[0.045] select-none text-[260px] font-mono font-black -z-0"
          >
            &#123;k&#125;
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-2xl space-y-2 mb-10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                  Ekosistem Multi-Disiplin
                </span>
                <SakodeSmileArc className="w-8 h-2.5 text-amber-500/80" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                3 Pilar Kontribusi Utama SAKODE
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Pilih bidang kontribusi yang paling sesuai dengan portofolio dan minat Anda. Klik pilar untuk langsung memfilter katalog proyek.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pilar 1: IT */}
              <div
                onClick={() => scrollToTaskExplorer('tech')}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 space-y-4 hover:border-sky-400 dark:hover:border-sky-500/50 hover:shadow-xl hover:shadow-sky-500/10 hover:-translate-y-1.5 transition-all duration-200 ease-out cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-sakode-cyan"></div>
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl p-2.5 border shrink-0 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 w-fit transition-transform duration-200 group-hover:scale-105">
                    <Terminal className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-50 dark:bg-sky-950/80 text-sky-600 dark:text-sakode-cyan border border-sky-200 dark:border-sky-800">
                      &#123;&nbsp;&#125;
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                      {FEATURED_TASKS.filter((t) => t.category === 'tech').length} Task Aktif
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors flex items-center justify-between">
                    <span>Teknologi &amp; IT</span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Pengembangan aplikasi produksi, arsitektur backend, otomasi CI/CD DevOps, integrasi database, dan audit keamanan.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Next.js 16</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">TypeScript</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Firestore</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Security</span>
                </div>
              </div>

              {/* Pilar 2: Education */}
              <div
                onClick={() => scrollToTaskExplorer('edu')}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 space-y-4 hover:border-purple-400 dark:hover:border-purple-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1.5 transition-all duration-200 ease-out cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-sakode-purple"></div>
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl p-2.5 border shrink-0 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 w-fit transition-transform duration-200 group-hover:scale-105">
                    <BookOpen className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-950/80 text-purple-600 dark:text-sakode-purple border border-purple-200 dark:border-purple-800">
                      ¶ Edu
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {FEATURED_TASKS.filter((t) => t.category === 'edu').length} Task Aktif
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex items-center justify-between">
                    <span>Modul &amp; Edukasi</span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Penyusunan kurikulum bootcamp, penulisan modul lab praktikum mahasiswa, perancangan bank kuis, dan review materi mentor.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Silabus</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Bank Soal</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Lab Praktikum</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Pedagogi</span>
                </div>
              </div>

              {/* Pilar 3: Marketing */}
              <div
                onClick={() => scrollToTaskExplorer('marketing')}
                className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 space-y-4 hover:border-orange-400 dark:hover:border-orange-500/50 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1.5 transition-all duration-200 ease-out cursor-pointer relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-sakode-orange"></div>
                <div className="flex items-center justify-between">
                  <div className="rounded-2xl p-2.5 border shrink-0 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 w-fit transition-transform duration-200 group-hover:scale-105">
                    <Megaphone className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      ★ Nexus
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                      {FEATURED_TASKS.filter((t) => t.category === 'marketing').length} Task Aktif
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors flex items-center justify-between">
                    <span>Marketing &amp; Komunitas</span>
                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Produksi infografis visual, penulisan naskah newsletter berkala, publikasi promosi batch pendaftaran, dan operasional tech event.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Visual Carousel</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Copywriting</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Tech Event</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">Livestream</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* TASK EXPLORER SECTION (DENGAN SAKODE BRAND ORNAMENTS) */}
        {/* =================================================================== */}
        <section id="task-explorer" className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-16 scroll-mt-16 relative overflow-hidden">
          {/* Ambient Brand Watermark behind Task Explorer */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-4 bottom-8 opacity-[0.025] dark:opacity-[0.045] select-none text-[140px] font-mono font-black -z-0"
          >
            sa&#123;kode&#125;
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                    Eksplorasi Proyek Aktif
                  </span>
                  <SakodeSmileArc className="w-8 h-2.5 text-amber-500/80" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Multi-Disciplinary Task Explorer
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                  Pilih task internal sesuai bidang keahlian Anda. Reward dicairkan secara penuh dalam integer Rupiah setelah hasil diverifikasi oleh Tim Reviewer.
                </p>
              </div>

              <div className="flex items-center gap-2.5 self-start md:self-end">
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <Coins className="h-3 w-3" />
                  Integer IDR
                </span>

                <Link href="/member/tasks">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold cursor-pointer"
                    rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                  >
                    Buka Katalog Penuh
                  </Button>
                </Link>
              </div>
            </div>

            {/* Quick Search & Filters Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleCategoryChange('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-sakode-cyan text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Semua</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                    selectedCategory === 'all' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {FEATURED_TASKS.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange('tech')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === 'tech'
                      ? 'bg-sakode-cyan text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Teknologi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange('edu')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === 'edu'
                      ? 'bg-sakode-cyan text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Edukasi</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCategoryChange('marketing')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedCategory === 'marketing'
                      ? 'bg-sakode-cyan text-slate-950 shadow-xs font-black'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  <span>Marketing</span>
                </button>
              </div>

              {/* Mode Filter & Search Input */}
              <div className="flex flex-col sm:flex-row items-center gap-2">
                {/* Mode Filter Pills */}
                <div className="flex items-center gap-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-1 w-full sm:w-auto">
                  {(
                    [
                      { key: 'all', label: 'Semua Mode' },
                      { key: 'SOLO', label: 'Solo' },
                      { key: 'TEAM', label: 'Team' },
                    ] as const
                  ).map((m) => (
                    <button
                      key={m.key}
                      type="button"
                      onClick={() => setSelectedModeFilter(m.key)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                        selectedModeFilter === m.key
                          ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-950'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* Search Input Box */}
                <div className="relative w-full sm:w-60">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari task atau skill..."
                    className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-sakode-cyan"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Task Card Grid */}
            {filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-12 text-center space-y-3">
                <div className="inline-flex p-3 rounded-2xl bg-slate-100 dark:bg-slate-850 text-slate-400">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Tidak Ada Task yang Sesuai Filter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Coba sesuaikan kata kunci pencarian atau ubah filter mode/kategori di atas.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSelectedModeFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs font-bold"
                >
                  Reset Seluruh Filter
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleTasks.map((task) => {
                  const isSolo = task.mode === 'SOLO';

                  return (
                    <div
                      key={task.id}
                      className={cn(
                        'group transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-700 cursor-pointer',
                        'flex flex-col justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 space-y-4',
                        getCategoryTopBorder(task.category)
                      )}
                    >
                      <div className="space-y-3.5">
                        {/* Top Badges & Difficulty Indicator */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
                              {task.categoryLabel}
                            </span>

                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700/70 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 flex items-center gap-1">
                              {isSolo ? (
                                <>
                                  <User className="h-3 w-3 text-sky-600 dark:text-sky-400" />
                                  <span>Solo</span>
                                </>
                              ) : (
                                <>
                                  <Users className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                                  <span>Team • {task.teamSlots || 'Slots'}</span>
                                </>
                              )}
                            </span>
                          </div>

                          {/* Difficulty indicator baku */}
                          <div className="text-[11px] font-bold tracking-tight text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            {task.difficulty}
                          </div>
                        </div>

                        {/* Reward Box */}
                        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 group-hover:bg-sky-50/40 dark:group-hover:bg-slate-800/70 transition-colors">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                            <Coins className="h-4 w-4 text-amber-500 shrink-0" />
                            <span>Reward Bersih:</span>
                          </div>
                          <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                            {formatCurrencyIDR(task.reward)}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white hover:text-sakode-cyan transition-colors line-clamp-2">
                            {task.title}
                          </h3>
                          <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Skills Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {task.skills.map((skill) => (
                            <span
                              key={skill}
                              className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/50"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer / Action */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          <span>{task.deadlineNotice}</span>
                        </div>

                        <Link href="/member/tasks">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs font-bold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white shadow-xs group-hover:border-sakode-cyan transition-all"
                            rightIcon={
                              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                            }
                          >
                            Lihat Detail
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Expand / Collapse Decongestion Toggle */}
            {filteredTasks.length > INITIAL_VISIBLE_COUNT && (
              <div className="flex justify-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="default"
                  onClick={() => setIsExpanded((prev) => !prev)}
                  className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {isExpanded
                    ? 'Tampilkan Lebih Sedikit ↑'
                    : `Tampilkan Lebih Banyak Task (${remainingCount}) ↓`}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* =================================================================== */}
        {/* WORKFLOW SECTION (4 LANGKAH DENGAN ORNAMEN SAKODE WORK) */}
        {/* =================================================================== */}
        <section id="workflow" className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] py-16 scroll-mt-16 relative overflow-hidden">
          {/* Ambient Lifecycle Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-6 top-1/2 -translate-y-1/2 opacity-[0.025] dark:opacity-[0.04] select-none text-[160px] font-mono font-black -z-0"
          >
            01&rarr;04
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                  Alur Kerja Produktivitas
                </span>
                <SakodeSmileArc className="w-8 h-2.5 text-amber-500/80" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                4 Langkah Kontribusi Terstruktur SAKODE Work
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Transparansi di setiap tahap pengerjaan menjamin keamanan deliverable dan kepastian pencairan reward bagi setiap kontributor.
              </p>
            </div>

            <div className="relative">
              {/* Dashed line connectors */}
              <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-slate-300 dark:border-slate-700 pointer-events-none z-0" />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                {/* Step 1 */}
                <div className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-[#076991] dark:text-sakode-cyan border border-sky-200 dark:border-sky-800">
                      01
                    </div>
                    <div className="rounded-2xl p-2.5 border shrink-0 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 transition-transform duration-200 group-hover:scale-105">
                      <Compass className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Eksplorasi &amp; Seleksi</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Telusuri task internal yang terbuka, periksa spesifikasi kriteria penerimaan, dan ajukan aplikasi kontribusi.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-sakode-purple border border-purple-200 dark:border-purple-800">
                      02
                    </div>
                    <div className="rounded-2xl p-2.5 border shrink-0 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 transition-transform duration-200 group-hover:scale-105">
                      <Target className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pengerjaan Terstruktur</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Selesaikan deliverable secara mandiri atau koordinasikan tim party dengan konsensus pembagian honor di muka.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      03
                    </div>
                    <div className="rounded-2xl p-2.5 border shrink-0 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 group-hover:scale-105">
                      <FileCheck2 className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Review &amp; Verifikasi Mutu</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Hasil kerja diperiksa secara obyektif oleh Reviewer &amp; QA Academy dengan catatan evaluasi yang konstruktif.
                  </p>
                </div>

                {/* Step 4 */}
                <div className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-black px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      04
                    </div>
                    <div className="rounded-2xl p-2.5 border shrink-0 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:scale-105">
                      <Wallet className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">Pencairan Reward Instan</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Reward integer Rupiah tercatat langsung di buku besar saldo dan ditransfer ke rekening bank resmi tanpa potongan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* REPUTATION & GAMIFIED ACHIEVEMENTS SECTION (DEDICATED) */}
        {/* =================================================================== */}
        <section
          id="reputation"
          className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-16 scroll-mt-16 relative overflow-hidden"
        >
          {/* Ambient Brandmark Watermark */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 opacity-[0.025] dark:opacity-[0.045] select-none text-[260px] font-mono font-black -z-0"
          >
            &#123;k&#125;
          </div>

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10 relative z-10">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="flex items-center justify-center gap-2">
                <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                  Gamifikasi &amp; Reputasi
                </span>
                <SakodeSmileArc className="w-8 h-2.5 text-amber-500/80" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Jenjang Level &amp; Lencana Kehormatan SAKODE
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Tingkatkan kredibilitas profesional Anda. Setiap deliverable berkualitas membuka akses perk eksklusif dan lencana medali terverifikasi.
              </p>
            </div>

            {/* Part 2: Gamified Progression & Pinnacle Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
              {/* Contributor Level Ladder */}
              <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 flex flex-col justify-between shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="h-5 w-5 text-[#076991] dark:text-sakode-cyan" />
                      <span>Jenjang Level Kontributor</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Tingkatkan level dengan menyelesaikan task nyata untuk membuka hak istimewa baru.
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-sky-100 dark:bg-sky-950 text-[#076991] dark:text-sakode-cyan border border-sky-200 dark:border-sky-800 shrink-0">
                    5 Jenjang
                  </span>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-3 pt-4">
                  {CONTRIBUTOR_LEVELS.map((lvl) => (
                    <div
                      key={lvl.level}
                      className={cn(
                        'group flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border p-3 sm:p-3.5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xs',
                        lvl.borderColor,
                        'bg-slate-50/70 dark:bg-slate-950/40'
                      )}
                    >
                      <div className="flex items-center gap-3.5">
                        {/* Custom Level Medallion SVG */}
                        <div className="relative shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={lvl.badgeFile}
                            alt={lvl.name}
                            className="h-10 w-10 sm:h-11 sm:w-11 object-contain drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
                          />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5 flex-wrap">
                            <span
                              className={cn(
                                'text-[10px] font-black px-2 py-0.5 rounded shrink-0',
                                lvl.badgeBg
                              )}
                            >
                              {lvl.level}
                            </span>
                            <span>{lvl.name}</span>
                            <span className="text-[10px] text-slate-400 font-normal">• {lvl.subtitle}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <span className="font-semibold text-slate-700 dark:text-slate-300">Syarat:</span>
                            <span>{lvl.req}</span>
                          </div>
                          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                            <Check className="h-3 w-3 shrink-0" />
                            <span>{lvl.perk}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shrink-0 self-start sm:self-center uppercase tracking-wider',
                          lvl.tagColor
                        )}
                      >
                        {lvl.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hall of Fame: Lencana Kehormatan Tertinggi (Pinnacle Badges) */}
              <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 flex flex-col justify-between shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500 animate-micro-pulse" />
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        Lencana Kehormatan Tertinggi
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      4 lencana apex paling bergengsi yang dapat diraih oleh talenta SAKODE.
                    </p>
                  </div>
                  <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 self-start sm:self-auto shrink-0">
                    Hall of Fame
                  </span>
                </div>

                {/* 2x2 Grid of Pinnacle Badges */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 flex-1 pt-4">
                  {PINNACLE_BADGES.map((badge) => {
                    const tierStyle = getTierStyle(badge.tierKey);
                    const IconComponent = badge.icon;

                    return (
                      <div
                        key={badge.id}
                        onClick={() => setPreviewBadge(badge)}
                        className={cn(
                          'group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/50 p-4 flex flex-col justify-between space-y-3 transition-all duration-200 ease-out cursor-pointer active:scale-[0.98] hover:-translate-y-1 hover:shadow-md',
                          tierStyle.cardHover
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div
                            className={cn(
                              'relative rounded-2xl p-2.5 border shrink-0 transition-transform duration-200 group-hover:scale-105 flex items-center justify-center h-12 w-12',
                              tierStyle.squircleBg
                            )}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={badge.file}
                              alt={badge.title}
                              className="h-8 w-8 object-contain transition-opacity duration-200"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                                const fallback = e.currentTarget.parentElement?.querySelector(
                                  '.badge-fallback-icon'
                                ) as HTMLElement | null;
                                if (fallback) fallback.style.display = 'block';
                              }}
                            />
                            <div className="badge-fallback-icon hidden">
                              <IconComponent className="h-6 w-6" />
                            </div>
                          </div>
                          <span
                            className={cn(
                              'text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0',
                              tierStyle.tag
                            )}
                          >
                            {badge.tier}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white leading-tight group-hover:text-sakode-cyan transition-colors">
                            {badge.title}
                          </h4>
                          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                            {badge.role}
                          </p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                            {badge.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dashboard Teaser Box */}
                <div className="mt-4 rounded-xl border border-dashed border-sky-300 dark:border-sky-500/50 bg-sky-50/70 dark:bg-sky-950/40 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center sm:justify-start gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                      <span>20+ Lencana Lengkap di Dashboard</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Lacak progres XP, unlock milestone baru, dan klaim reward achievement di akun Anda.
                    </p>
                  </div>
                  <Link href="/login" className="shrink-0 w-full sm:w-auto">
                    <Button
                      size="sm"
                      className="w-full sm:w-auto text-xs font-black text-white bg-sky-600 hover:bg-sky-700 dark:bg-sakode-cyan dark:text-slate-950 dark:hover:bg-sky-300 shadow-md shadow-sky-500/20 dark:shadow-sky-400/20 border-0 transition-all active:scale-95 cursor-pointer"
                      rightIcon={<ChevronRight className="h-3.5 w-3.5 stroke-[2.5]" />}
                    >
                      Buka Dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* NEW SECTION: TRANSPARANSI & JAMINAN KONTRIBUSI SAKODE */}
        {/* =================================================================== */}
        <section id="guarantee" className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-16 scroll-mt-16 relative overflow-hidden">
          {/* Background Brand Watermark & Ambient Accents */}
          <div className="absolute -left-12 -bottom-16 select-none pointer-events-none opacity-[0.03] dark:opacity-[0.05] text-[180px] font-black font-mono leading-none tracking-tighter text-slate-900 dark:text-white">
            {'{k}'}
          </div>
          <div className="absolute right-6 top-8 select-none pointer-events-none opacity-[0.04] dark:opacity-[0.07] text-[120px] font-black font-mono leading-none tracking-tighter text-sky-500">
            [SAFE]
          </div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-sky-400/5 via-purple-400/5 to-amber-400/5 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-2">
              <div className="inline-flex items-center gap-2">
                <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                  Integritas &amp; Keamanan
                </span>
                <SakodeSmileArc className="w-8 h-2.5 text-amber-500/80" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                4 Prinsip Proteksi Kontributor SAKODE
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Setiap baris kode dan alur transaksi dibangun dengan aturan hukum yang tidak bisa dilanggar (*Strict Invariants*) demi keadilan bersama.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Integer Rupiah */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-6 space-y-3.5 hover:border-amber-300/80 dark:hover:border-amber-500/40 hover:shadow-md transition-all duration-200 group">
                <div className="absolute -right-2 -bottom-2 text-4xl font-mono font-black text-slate-200/50 dark:text-slate-800/40 select-none pointer-events-none group-hover:text-amber-500/10 transition-colors">
                  Rp
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 w-fit group-hover:scale-105 transition-transform duration-200">
                  <Coins className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  100% Integer Rupiah
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Tidak ada potongan biaya admin atau biaya perantara. Nominal reward yang tertera pada task adalah nilai bersih yang masuk ke rekening Anda.
                </p>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>Zero Deduction Policy</span>
                </div>
              </div>

              {/* Card 2: Fokus 1 Task */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-6 space-y-3.5 hover:border-sky-300/80 dark:hover:border-sky-500/40 hover:shadow-md transition-all duration-200 group">
                <div className="absolute -right-2 -bottom-2 text-4xl font-mono font-black text-slate-200/50 dark:text-slate-800/40 select-none pointer-events-none group-hover:text-sky-500/10 transition-colors">
                  1:1
                </div>
                <div className="p-3 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 w-fit group-hover:scale-105 transition-transform duration-200">
                  <Target className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                  Fokus 1 Active Task
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Setiap member fokus menyelesaikan 1 task aktif sebelum mengambil task berikutnya. Mencegah overload dan menjamin mutu deliverable prima.
                </p>
                <div className="text-[11px] font-semibold text-sky-600 dark:text-sky-400 flex items-center gap-1 pt-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>Workload Balance Protection</span>
                </div>
              </div>

              {/* Card 3: QA Review */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-6 space-y-3.5 hover:border-purple-300/80 dark:hover:border-purple-500/40 hover:shadow-md transition-all duration-200 group">
                <div className="absolute -right-2 -bottom-2 text-4xl font-mono font-black text-slate-200/50 dark:text-slate-800/40 select-none pointer-events-none group-hover:text-purple-500/10 transition-colors">
                  QA
                </div>
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 w-fit group-hover:scale-105 transition-transform duration-200">
                  <FileCheck2 className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Review QA Obyektif
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Evaluasi didasarkan pada acceptance criteria yang disepakati bersama. Jika ada revisi, catatan teknis disampaikan secara jelas dan konstruktif.
                </p>
                <div className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1 pt-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>Constructive Feedback</span>
                </div>
              </div>

              {/* Card 4: Data Rekening */}
              <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-6 space-y-3.5 hover:border-emerald-300/80 dark:hover:border-emerald-500/40 hover:shadow-md transition-all duration-200 group">
                <div className="absolute -right-2 -bottom-2 text-4xl font-mono font-black text-slate-200/50 dark:text-slate-800/40 select-none pointer-events-none group-hover:text-emerald-500/10 transition-colors">
                  ••••
                </div>
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 w-fit group-hover:scale-105 transition-transform duration-200">
                  <Lock className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  Privasi Rekening Bank
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Data nomor rekening dienkripsi sebelum disimpan ke database dan ditampilkan dalam format masked (*BCA ****1234*) di antarmuka publik.
                </p>
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 pt-1">
                  <Check className="h-3.5 w-3.5" />
                  <span>Encrypted &amp; Masked Data</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* NEW SECTION: PERTANYAAN UMUM (FAQ ACCORDION) */}
        {/* =================================================================== */}
        <section id="faq" className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19] py-16 scroll-mt-16 relative overflow-hidden">
          {/* Subtle Background Monograms */}
          <div className="absolute right-4 top-6 select-none pointer-events-none opacity-[0.04] dark:opacity-[0.06] text-[160px] font-black font-mono leading-none tracking-tighter text-sky-500">
            {'{?}'}
          </div>
          <div className="absolute left-6 bottom-4 select-none pointer-events-none opacity-[0.03] dark:opacity-[0.05] text-[120px] font-black font-mono leading-none tracking-tighter text-amber-500">
            sa{'{kode}'}
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2">
                <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                  Bantuan &amp; Panduan
                </span>
                <SakodeSmileArc className="w-8 h-2.5 text-amber-500/80" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Pertanyaan yang Sering Diajukan
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Informasi seputar cara kerja platform, verifikasi akun, dan alur pencairan honor.
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, index) => {
                const isOpen = activeFaqIndex === index;

                return (
                  <div
                    key={index}
                    className={cn(
                      'rounded-2xl border bg-white dark:bg-slate-900/90 overflow-hidden shadow-xs transition-all duration-200',
                      isOpen
                        ? 'border-sky-400/80 dark:border-sky-500/60 shadow-md ring-1 ring-sky-400/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFaqIndex(isOpen ? null : index)}
                      className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-slate-900 dark:text-white cursor-pointer hover:text-sakode-cyan transition-colors"
                    >
                      <span className="flex items-center gap-3">
                        <div className={cn(
                          'p-1.5 rounded-lg shrink-0 transition-colors',
                          isOpen
                            ? 'bg-sky-500/10 text-sky-600 dark:text-sakode-cyan'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        )}>
                          <HelpCircle className="h-4 w-4" />
                        </div>
                        <span>{faq.question}</span>
                      </span>
                      <ChevronDown
                        className={`h-4 w-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                          isOpen ? 'rotate-180 text-sakode-cyan' : ''
                        }`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 animate-fade-in-up">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* =================================================================== */}
        {/* INSTITUTIONAL CALLOUT BANNER DENGAN FLOATING BRAND EMBLEM */}
        {/* =================================================================== */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19] relative overflow-hidden">
          {/* Subtle floating letter glyphs across the banner canvas */}
          <span className="absolute left-[8%] top-[18%] text-xs font-mono font-bold text-sky-500/20 select-none pointer-events-none animate-pulse">
            {'<sakode />'}
          </span>
          <span className="absolute right-[12%] bottom-[20%] text-xs font-mono font-bold text-amber-500/20 select-none pointer-events-none">
            {'{work: integer_idr}'}
          </span>

          <div className="mx-auto max-w-5xl">
            <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-sky-50/30 to-purple-50/30 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 p-8 sm:p-12 text-center space-y-6 shadow-sm animate-ambient-sheen">
              {/* Background watermark logo */}
              <div className="absolute -right-16 -bottom-16 w-64 h-64 opacity-5 pointer-events-none select-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/sakode-brandmark.svg" alt="" className="w-full h-full object-contain" />
              </div>

              {/* Floating Badge Ornament Showcase Left (Desktop) */}
              <div className="hidden lg:flex absolute left-6 top-1/2 -translate-y-1/2 flex-col items-center gap-1 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xs shadow-md -rotate-6 pointer-events-none select-none animate-bounce-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/badges/badge-level-5.svg"
                  alt="Level 5"
                  className="h-10 w-10 object-contain drop-shadow"
                />
                <span className="text-[9px] font-extrabold uppercase text-purple-600 dark:text-purple-400">
                  Level 5
                </span>
                <span className="text-[8px] font-semibold text-slate-400">Architect</span>
              </div>

              {/* Floating Badge Ornament Showcase Right (Desktop) */}
              <div className="hidden lg:flex absolute right-6 top-1/2 -translate-y-1/2 flex-col items-center gap-1 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/60 backdrop-blur-xs shadow-md rotate-6 pointer-events-none select-none animate-bounce-subtle">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/badges/badge-golden-ledger.svg"
                  alt="Golden Ledger"
                  className="h-10 w-10 object-contain drop-shadow"
                />
                <span className="text-[9px] font-extrabold uppercase text-amber-600 dark:text-amber-400">
                  Mythic
                </span>
                <span className="text-[8px] font-semibold text-slate-400">Golden Ledger</span>
              </div>

              <div className="relative z-10 space-y-3 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-800/90 px-3.5 py-1 text-xs font-bold text-[#076991] dark:text-sakode-cyan shadow-2xs">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                  <span className="uppercase tracking-wider">Internal Workspace SAKODE</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Bukan Freelance Terbuka</span>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <SakodeSmileArc className="w-9 h-3 text-amber-500" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Siap Berkontribusi Nyata untuk Ekosistem SAKODE?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Daftar akun kontributor Anda atau masuk ke dashboard untuk melihat task yang terbuka hari ini. Seluruh deliverable diverifikasi dengan standar mutu resmi SAKODE Academy.
                </p>
              </div>

              <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pt-2">
                <Link href="/register">
                  <Button
                    variant="primary"
                    size="lg"
                    className="h-12 px-7 font-black bg-sakode-cyan text-slate-950 hover:bg-[#5dbfe9] rounded-xl shadow-xs text-xs active:scale-[0.98] transition-all duration-200 ease-out group"
                    rightIcon={
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    }
                  >
                    Daftar Kontributor
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-7 font-bold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 text-xs rounded-xl shadow-xs active:scale-[0.98] transition-all duration-200 ease-out"
                  >
                    Masuk ke Dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* =================================================================== */}
      {/* INTERACTIVE BADGE DETAIL PREVIEW MODAL */}
      {/* =================================================================== */}
      {previewBadge && (
        <div
          onClick={() => setPreviewBadge(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-fade-in-up"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-2xl space-y-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl p-2.5 bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewBadge.file}
                    alt={previewBadge.title}
                    className="h-10 w-10 object-contain"
                  />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 dark:text-white">
                    {previewBadge.title}
                  </h3>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {previewBadge.role}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewBadge(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Tingkat Kelangkaan:</span>
                <span className="font-extrabold uppercase">{previewBadge.tier}</span>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Deskripsi Lencana:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200/70 dark:border-slate-800">
                  {previewBadge.desc}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Kriteria Membuka Lencana:
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed bg-sky-50/50 dark:bg-slate-950/60 p-3 rounded-xl border border-sky-200/50 dark:border-sky-900/30">
                  {previewBadge.criteria}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewBadge(null)}
                className="text-xs font-bold"
              >
                Tutup Pratinjau
              </Button>
              <Link href="/member/tasks">
                <Button
                  variant="primary"
                  size="sm"
                  className="text-xs font-black bg-sakode-cyan text-slate-950 hover:bg-[#5dbfe9]"
                >
                  Cari Task Relevan
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070A10] py-12 text-slate-600 dark:text-slate-400 text-xs transition-colors">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sakode-work-logo.svg"
                  alt="SAKODE Work"
                  className="h-8 w-auto object-contain"
                />
              </div>
              <p className="text-xs font-semibold text-[#076991] dark:text-sakode-cyan">
                Masa Depan Digital, Dimulai Dari Sini
              </p>
              <p className="text-[11px] text-slate-500 max-w-md">
                Platform manajemen tugas dan kolaborasi internal ekosistem SAKODE Academy.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 dark:text-slate-400">
              <Link href="/member/tasks" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Katalog Task
              </Link>
              <Link href="/login" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                Dashboard Kontributor
              </Link>
              <a
                href="https://sakode.com"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                SAKODE Academy ↗
              </a>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px] inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                Waktu Server: WIB (UTC+7)
              </span>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
            <div>&copy; 2026 SAKODE Academy. Seluruh Hak Cipta Dilindungi.</div>
            <div className="flex items-center gap-4">
              <span>Privacy Policy</span>
              <span>•</span>
              <span>Terms of Contribution</span>
              <span>•</span>
              <span>Code of Conduct</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />
    </div>
  );
}
