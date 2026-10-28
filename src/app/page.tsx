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
  Wallet,
  Target,
  FileCheck2,
  Coins,
} from 'lucide-react';

// =============================================================================
// Mock Data: Tasks Multi-Disiplin SAKODE Work
// =============================================================================
type TaskCategory = 'all' | 'tech' | 'edu' | 'marketing';

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

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory>('all');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleCategoryChange = (cat: TaskCategory) => {
    setSelectedCategory(cat);
    setIsExpanded(false);
  };

  const filteredTasks = FEATURED_TASKS.filter((task) => {
    if (selectedCategory === 'all') return true;
    return task.category === selectedCategory;
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 selection:bg-sakode-cyan/30 transition-colors">
      {/* Top Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800 bg-gradient-to-b from-sky-50/40 via-slate-50 to-slate-50 dark:from-[#0e1424] dark:via-[#0B0F19] dark:to-[#0B0F19] py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto space-y-6">
              {/* Official Brandmark & Subtitle Lockup */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/80 px-4 py-1.5 shadow-xs backdrop-blur-sm">
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

              {/* Rampingkan CTA: 2 Tombol Saja dengan Tactile Feedback */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
                <a href="#task-explorer">
                  <Button
                    variant="primary"
                    size="lg"
                    className="h-12 px-7 font-black bg-sakode-cyan text-slate-950 hover:bg-[#5dbfe9] rounded-xl shadow-xs text-sm active:scale-[0.98] transition-all duration-200 ease-out group"
                    rightIcon={
                      <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                    }
                  >
                    Lihat Task Aktif ↓
                  </Button>
                </a>

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

              {/* Proof Metric Strip (Clean White Cards dengan Tactile Hover) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-10 max-w-5xl mx-auto">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs text-left hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out cursor-default">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Bounty Tersalurkan
                  </div>
                  <div className="mt-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    {formatCurrencyIDR(24500000)}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-semibold">
                    100% Tercairkan
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs text-left hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out cursor-default">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Task Selesai
                  </div>
                  <div className="mt-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    128 Task
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                    Standar Mutu QA
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs text-left hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out cursor-default">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Kontributor Aktif
                  </div>
                  <div className="mt-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    480+ Talenta
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-semibold">
                    Instruktur &amp; Alumni
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs text-left hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out cursor-default">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Waktu Verifikasi
                  </div>
                  <div className="mt-1 text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                    Zona WIB
                  </div>
                  <div className="text-[10px] text-[#076991] dark:text-sakode-cyan mt-0.5 font-semibold">
                    Jadwal Presisi
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3 Pillars Ecosystem Highlight Section */}
        <section id="pillars" className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19] py-16 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl space-y-2 mb-10">
              <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                Ekosistem Multi-Disiplin
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                3 Pilar Kontribusi Utama SAKODE
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                Setiap proyek dikurasi dengan kriteria penilaian yang objektif, pembagian peran transparan, dan kompensasi reward integer yang pasti.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pilar 1: IT */}
              <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 space-y-4 hover:border-sky-500/40 hover:shadow-lg hover:shadow-sky-500/10 hover:-translate-y-1.5 transition-all duration-200 ease-out cursor-pointer">
                <div className="rounded-2xl p-2.5 border shrink-0 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 w-fit transition-transform duration-200 group-hover:scale-105">
                  <Terminal className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                    Teknologi &amp; IT
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Pengembangan aplikasi produksi, arsitektur backend, otomasi CI/CD DevOps, integrasi database, dan audit keamanan.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-default">Next.js</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-default">Node/FastAPI</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-default">Firebase</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-default">DevOps</span>
                </div>
              </div>

              {/* Pilar 2: Education */}
              <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 space-y-4 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1.5 transition-all duration-200 ease-out cursor-pointer">
                <div className="rounded-2xl p-2.5 border shrink-0 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 w-fit transition-transform duration-200 group-hover:scale-105">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Modul &amp; Edukasi
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Penyusunan kurikulum bootcamp, penulisan modul lab praktikum mahasiswa, perancangan bank kuis, dan review materi mentor.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-default">Silabus Kurikulum</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-default">Bank Soal</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-default">Lab Praktikum</span>
                </div>
              </div>

              {/* Pilar 3: Marketing */}
              <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-6 space-y-4 hover:border-orange-500/40 hover:shadow-lg hover:shadow-orange-500/10 hover:-translate-y-1.5 transition-all duration-200 ease-out cursor-pointer">
                <div className="rounded-2xl p-2.5 border shrink-0 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 w-fit transition-transform duration-200 group-hover:scale-105">
                  <Megaphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    Marketing &amp; Komunitas
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    Produksi infografis visual, penulisan naskah newsletter berkala, publikasi promosi batch pendaftaran, dan operasional tech event.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-default">Visual Carousel</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-default">Copywriting</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-200 dark:hover:bg-slate-700 cursor-default">Tech Event</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Task Explorer Section */}
        <section id="task-explorer" className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/60 py-16 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                  Eksplorasi Proyek Aktif
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Multi-Disciplinary Task Explorer
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                  Pilih task internal sesuai bidang keahlian Anda. Reward dicairkan secara penuh setelah hasil diverifikasi oleh Tim Reviewer.
                </p>
              </div>

              <Link href="/member/tasks">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                  rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                >
                  Buka Katalog Task Penuh
                </Button>
              </Link>
            </div>

            {/* Interactive Filter Tabs (4 Kategori) */}
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
              <button
                type="button"
                onClick={() => handleCategoryChange('all')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedCategory === 'all'
                    ? 'bg-sakode-cyan text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <span>Semua Task</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  selectedCategory === 'all' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {FEATURED_TASKS.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('tech')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedCategory === 'tech'
                    ? 'bg-sakode-cyan text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>Teknologi &amp; IT</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  selectedCategory === 'tech' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {FEATURED_TASKS.filter((t) => t.category === 'tech').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('edu')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedCategory === 'edu'
                    ? 'bg-sakode-cyan text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Modul &amp; Edukasi</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  selectedCategory === 'edu' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {FEATURED_TASKS.filter((t) => t.category === 'edu').length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleCategoryChange('marketing')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  selectedCategory === 'marketing'
                    ? 'bg-sakode-cyan text-slate-950 shadow-xs font-black'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900'
                }`}
              >
                <Megaphone className="h-3.5 w-3.5" />
                <span>Marketing &amp; Komunitas</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded ${
                  selectedCategory === 'marketing' ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}>
                  {FEATURED_TASKS.filter((t) => t.category === 'marketing').length}
                </span>
              </button>
            </div>

            {/* Task Card Grid (Generous Whitespace gap-6 & Playful Aesthetics) */}
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
                                <span>Team</span>
                              </>
                            )}
                          </span>
                        </div>

                        {/* Difficulty indicator baku */}
                        <div className="text-[11px] font-bold tracking-tight text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          {task.difficulty}
                        </div>
                      </div>

                      {/* Streamlined Integrated Reward Pill with Coins icon */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60">
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

                      <Link href={`/member/tasks`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs font-bold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-white shadow-xs"
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

        {/* Productivity & Gamification Showcase Section */}
        <section id="workflow" className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F19] py-16 scroll-mt-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-14">
            {/* Part 1: Contributor 4-Step Workflow dengan Connected Steps & Tactile Feedback */}
            <div className="space-y-8">
              <div className="text-center max-w-2xl mx-auto space-y-2">
                <span className="text-xs font-bold text-[#076991] dark:text-sakode-cyan uppercase tracking-wider">
                  Alur Kerja Produktivitas
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  4 Langkah Kontribusi Terstruktur SAKODE Work
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Transparansi di setiap tahap pengerjaan menjamin keamanan deliverable dan kepastian pencairan reward bagi setiap kontributor.
                </p>
              </div>

              <div className="relative">
                {/* Dashed line connectors between steps on lg screens */}
                <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-0.5 border-t-2 border-dashed border-slate-300 dark:border-slate-700 pointer-events-none z-0" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                  {/* Step 1 */}
                  <div className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-[#076991] dark:text-sakode-cyan">01</div>
                      <div className="rounded-2xl p-2.5 border shrink-0 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 transition-transform duration-200 group-hover:scale-105">
                        <Compass className="h-5 w-5" />
                      </div>
                    </div>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">Eksplorasi &amp; Seleksi</h3>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Telusuri task internal yang sesuai dengan spesialisasi keahlian di bidang IT, modul kurikulum, atau materi promosi.
                    </p>
                  </div>

                  {/* Step 2 */}
                  <div className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-purple-600 dark:text-sakode-purple">02</div>
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
                  <div className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">03</div>
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
                  <div className="group relative rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 p-5 space-y-3 shadow-xs hover:-translate-y-1 hover:shadow-md transition-all duration-200 ease-out active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-black text-amber-600 dark:text-amber-400">04</div>
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

            {/* Part 2: Gamified Progression & Achievements */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-6 border-t border-slate-200 dark:border-slate-800/80">
              {/* Contributor Level Ladder dengan Refined Progression */}
              <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Jenjang Level Kontributor</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Kenaikan level berbasis track record penyelesaian task nyata.</p>
                  </div>
                  <Award className="h-5 w-5 text-sky-600 dark:text-sakode-cyan" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 ease-out">
                    <div className="flex items-start gap-3">
                      <div className="text-xs font-black px-2.5 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                        LVL 1
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Onboarded Contributor</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">• Pemula Terverifikasi</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Tahap awal setelah persetujuan profil; memiliki akses ke task kategori Beginner.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      Entry
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3.5 rounded-xl border border-sky-200 dark:border-sky-500/20 bg-sky-50/60 dark:bg-slate-950/50 p-3.5 hover:border-sky-300 dark:hover:border-sky-500/40 hover:shadow-xs transition-all duration-200 ease-out">
                    <div className="flex items-start gap-3">
                      <div className="text-xs font-black px-2.5 py-1 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 border border-sky-300 dark:border-sky-500/20 shrink-0">
                        LVL 2
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Active Contributor</span>
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-normal">• 3+ Task Sukses</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Menyelesaikan task mandiri dengan penilaian A; membuka kuota task tingkat Intermediate.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 shrink-0">
                      3+ Task
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3.5 rounded-xl border border-purple-200 dark:border-purple-500/20 bg-purple-50/60 dark:bg-slate-950/50 p-3.5 hover:border-purple-300 dark:hover:border-purple-500/40 hover:shadow-xs transition-all duration-200 ease-out">
                    <div className="flex items-start gap-3">
                      <div className="text-xs font-black px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-300 dark:border-purple-500/20 shrink-0">
                        LVL 3
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Senior Specialist</span>
                          <span className="text-[10px] text-purple-600 dark:text-purple-400 font-normal">• Arsitektur &amp; Kurikulum</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Dipercaya menangani task kompleks Advanced dan berkontribusi sebagai co-reviewer teknis.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
                      Advanced
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3.5 rounded-xl border border-amber-200 dark:border-amber-500/20 bg-amber-50/60 dark:bg-slate-950/50 p-3.5 hover:border-amber-300 dark:hover:border-amber-500/40 hover:shadow-xs transition-all duration-200 ease-out">
                    <div className="flex items-start gap-3">
                      <div className="text-xs font-black px-2.5 py-1 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20 shrink-0">
                        LVL 4
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>Lead Fellow</span>
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 font-normal">• Pemimpin Inisiatif Tim</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Memimpin pembentukan Team Project multi-disiplin dan merumuskan inisiatif baru SAKODE Academy.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 shrink-0">
                      Fellow
                    </span>
                  </div>
                </div>
              </div>

              {/* Badges of Excellence Showcase dengan Nested Icons & Clean Status */}
              <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-6 sm:p-7 space-y-5 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">Lencana Kehormatan (Badges)</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Pengakuan resmi atas konsistensi dan kualitas deliverable.</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 text-purple-600 dark:text-sakode-purple" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 space-y-2 hover:-translate-y-1 hover:shadow-xs transition-all duration-200 ease-out cursor-pointer active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl p-2.5 border shrink-0 bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/20 text-sky-600 dark:text-sky-400 transition-transform duration-200 group-hover:scale-105">
                        <Terminal className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        Mastery
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Arsitek Solusi</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-1">
                        Berhasil menyelesaikan modul arsitektur skala produksi berstandar zero defect.
                      </p>
                    </div>
                  </div>

                  <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 space-y-2 hover:-translate-y-1 hover:shadow-xs transition-all duration-200 ease-out cursor-pointer active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl p-2.5 border shrink-0 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 group-hover:scale-105">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        Curriculum
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Penyusun Kurikulum</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-1">
                        Menyusun 5+ silabus dan materi hands-on yang diadopsi aktif di bootcamp.
                      </p>
                    </div>
                  </div>

                  <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 space-y-2 hover:-translate-y-1 hover:shadow-xs transition-all duration-200 ease-out cursor-pointer active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl p-2.5 border shrink-0 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400 transition-transform duration-200 group-hover:scale-105">
                        <Megaphone className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        Impact
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Katalis Komunitas</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-1">
                        Menginisiasi kampanye event dengan konversi pendaftaran peserta di atas rata-rata.
                      </p>
                    </div>
                  </div>

                  <div className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-3.5 space-y-2 hover:-translate-y-1 hover:shadow-xs transition-all duration-200 ease-out cursor-pointer active:scale-[0.98]">
                    <div className="flex items-center justify-between">
                      <div className="rounded-2xl p-2.5 border shrink-0 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20 text-purple-600 dark:text-purple-400 transition-transform duration-200 group-hover:scale-105">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        Precision
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Presisi Tinggi (Zero Revision)</span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-1">
                        5 task berturut-turut disetujui reviewer pada penyerahan pertama tanpa catatan revisi.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Institutional Callout Banner (Refined Curved Container & Dual CTA) */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0B0F19]">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-white via-sky-50/20 to-purple-50/20 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 p-8 sm:p-12 text-center space-y-6 shadow-sm">
              <div className="space-y-3 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-800/80 px-3.5 py-1 text-xs font-bold text-[#076991] dark:text-sakode-cyan shadow-2xs">
                  <span className="uppercase tracking-wider">Bukan Freelance Publik</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Internal Workspace</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Siap Berkontribusi Nyata untuk Ekosistem SAKODE?
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Daftar akun kontributor Anda atau masuk ke dashboard untuk melihat task yang terbuka hari ini. Seluruh deliverable diverifikasi dengan standar mutu resmi SAKODE Academy.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
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
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
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
