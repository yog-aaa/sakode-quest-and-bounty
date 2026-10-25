'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { formatCurrencyIDR, formatDateWIB, maskAccountNumber } from '@/lib/utils';
import { TASK_STATUS, CLAIM_STATUS } from '@/lib/constants';
import {
  Users,
  Flame,
  Clock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Layers,
  Coins,
  Check,
  Compass,
} from 'lucide-react';

export default function HomePage() {
  const [selectedTab, setSelectedTab] = useState<'tokens' | 'components' | 'scenarios'>('tokens');
  const [buttonLoading, setButtonLoading] = useState(false);

  // Demo data waktu WIB (Deterministic untuk static prerendering)
  const demoDeadline = '2026-10-24T17:00:00.000Z';
  const demoSubmissionDate = '2026-10-22T09:00:00.000Z';

  return (
    <div className="min-h-screen flex flex-col bg-sakode-bg text-sakode-text pb-20 md:pb-12">
      {/* Top Navbar */}
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-sakode-border bg-gradient-to-b from-white to-sakode-bg pt-10 pb-12 sm:pt-16 sm:pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
              <div className="max-w-2xl space-y-5">
                {/* Official Brand Badge */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex items-center gap-2.5 rounded-full border border-sakode-border bg-white px-3.5 py-1.5 shadow-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/sakode-logo-sticker-blue.png"
                      alt="Logo Resmi SAKODE"
                      className="h-6 sm:h-7 w-auto object-contain"
                    />
                    <div className="h-4 w-px bg-sakode-border"></div>
                    <span className="text-xs font-black tracking-tight text-sakode-text flex items-center gap-1.5">
                      SAKODE WORK
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-sakode-cyan/25 text-[#076991] font-extrabold uppercase">
                        Official Platform
                      </span>
                    </span>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Sprint 2: Task Management Aktif</span>
                  </div>
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-sakode-text leading-[1.15]">
                  SAKODE Task &amp; Reward Platform
                </h1>

                <p className="text-base sm:text-lg text-sakode-text-muted leading-relaxed">
                  Platform pengerjaan task IT profesional, kolaborasi tim transparan, dan pencairan bounty instan.
                  Dibangun dengan ketegasan arsitektur Firestore atomik, zona waktu WIB, dan identitas visual resmi SAKODE Academy.
                </p>

                {/* Quick Metric Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-lg border border-sakode-border bg-sakode-card p-3 shadow-sm">
                    <div className="text-[11px] font-semibold text-sakode-text-muted uppercase tracking-wider">
                      Bounty Tersalurkan
                    </div>
                    <div className="mt-1 text-lg sm:text-xl font-extrabold text-sakode-text">
                      {formatCurrencyIDR(24500000)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-sakode-border bg-sakode-card p-3 shadow-sm">
                    <div className="text-[11px] font-semibold text-sakode-text-muted uppercase tracking-wider">
                      Task Selesai
                    </div>
                    <div className="mt-1 text-lg sm:text-xl font-extrabold text-sakode-text flex items-center gap-1.5">
                      128 <span className="text-xs font-semibold text-emerald-600">100% WIB</span>
                    </div>
                  </div>

                  <div className="rounded-lg border border-sakode-border bg-sakode-card p-3 shadow-sm">
                    <div className="text-[11px] font-semibold text-sakode-text-muted uppercase tracking-wider">
                      Member Terdaftar
                    </div>
                    <div className="mt-1 text-lg sm:text-xl font-extrabold text-sakode-text">
                      480+
                    </div>
                  </div>

                  <div className="rounded-lg border border-sakode-border bg-sakode-card p-3 shadow-sm">
                    <div className="text-[11px] font-semibold text-sakode-text-muted uppercase tracking-wider">
                      Aturan Invariant
                    </div>
                    <div className="mt-1 text-lg sm:text-xl font-extrabold text-sakode-text flex items-center gap-1">
                      <Check className="h-4 w-4 text-emerald-600" />
                      <span>8 Strict Rules</span>
                    </div>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <Link href="/member/tasks">
                    <Button
                      variant="primary"
                      size="lg"
                      leftIcon={<Compass className="h-4 w-4" />}
                      rightIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Eksplor Papan Task
                    </Button>
                  </Link>

                  <Link href="/login">
                    <Button
                      variant="outline"
                      size="lg"
                    >
                      Masuk Akun
                    </Button>
                  </Link>

                  <Link href="/admin/tasks">
                    <Button
                      variant="team"
                      size="lg"
                      leftIcon={<Layers className="h-4 w-4" />}
                    >
                      Manajemen Task Admin
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Hero Graphic / Mascot Showcase */}
              <div className="hidden lg:flex flex-col items-center justify-center shrink-0">
                <div className="relative p-6 rounded-3xl bg-gradient-to-br from-sakode-cyan/15 via-white to-sky-50 border border-sakode-cyan/30 shadow-lg shadow-sky-100/50 flex flex-col items-center text-center max-w-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/sakode-logo-official.png"
                    alt="SAKODE Work Official Mascot"
                    className="h-40 w-auto object-contain drop-shadow-md transition-transform hover:scale-105 duration-300"
                  />
                  <div className="mt-4 pt-3 border-t border-sakode-border/70 w-full">
                    <div className="text-sm font-black text-sakode-text">SAKODE Work Academy</div>
                    <div className="text-[11px] text-sakode-text-muted mt-0.5">Komunitas Developer &amp; Bounty Hunter IT</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive Tabs Header */}
        <section className="border-b border-sakode-border bg-sakode-card sticky top-16 z-30 shadow-xs">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
              <button
                onClick={() => setSelectedTab('tokens')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  selectedTab === 'tokens'
                    ? 'bg-sakode-cyan text-sakode-text shadow-sm'
                    : 'text-sakode-text-muted hover:text-sakode-text hover:bg-sakode-bg'
                }`}
              >
                <Sparkles className="h-4 w-4" />
                1. Token Warna & Sistem Tipografi
              </button>

              <button
                onClick={() => setSelectedTab('components')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  selectedTab === 'components'
                    ? 'bg-sakode-cyan text-sakode-text shadow-sm'
                    : 'text-sakode-text-muted hover:text-sakode-text hover:bg-sakode-bg'
                }`}
              >
                <Layers className="h-4 w-4" />
                2. Komponen Primitif & Status Pill
              </button>

              <button
                onClick={() => setSelectedTab('scenarios')}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  selectedTab === 'scenarios'
                    ? 'bg-sakode-cyan text-sakode-text shadow-sm'
                    : 'text-sakode-text-muted hover:text-sakode-text hover:bg-sakode-bg'
                }`}
              >
                <Coins className="h-4 w-4" />
                3. Kartu Task, Klaim & Invariant
              </button>
            </div>
          </div>
        </section>

        {/* TAB 1: DESIGN TOKENS & TYPOGRAPHY */}
        {selectedTab === 'tokens' && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            <div>
              <h2 className="text-2xl font-black text-sakode-text">Palet Warna Resmi SAKODE</h2>
              <p className="text-sm text-sakode-text-muted mt-1">
                Sesuai dokumen <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">DESIGN.md</code> dan konfigurasi Tailwind CSS v4.
              </p>
            </div>

            {/* Color Swatch Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Cyan */}
              <Card>
                <div className="h-24 w-full rounded-t-lg bg-sakode-cyan p-3 flex items-end justify-between font-bold text-sakode-text">
                  <span className="text-xs uppercase tracking-wider">Identitas Primer</span>
                  <span className="text-xs font-mono">#71CFFE</span>
                </div>
                <CardContent className="pt-4 space-y-1">
                  <div className="font-bold text-sm text-sakode-text">sakode-cyan</div>
                  <div className="text-xs text-sakode-text-muted">
                    CTA utama, status Open, link aktif, progress bar quest utama.
                  </div>
                </CardContent>
              </Card>

              {/* Purple */}
              <Card>
                <div className="h-24 w-full rounded-t-lg bg-sakode-purple p-3 flex items-end justify-between font-bold text-white">
                  <span className="text-xs uppercase tracking-wider">Aksen Tim</span>
                  <span className="text-xs font-mono">#BC71FE</span>
                </div>
                <CardContent className="pt-4 space-y-1">
                  <div className="font-bold text-sm text-sakode-text">sakode-purple</div>
                  <div className="text-xs text-sakode-text-muted">
                    Aksen kolaborasi, status Recruiting, badge party tim, konsensus reward.
                  </div>
                </CardContent>
              </Card>

              {/* Orange */}
              <Card>
                <div className="h-24 w-full rounded-t-lg bg-sakode-orange p-3 flex items-end justify-between font-bold text-white">
                  <span className="text-xs uppercase tracking-wider">Aksen Kritis</span>
                  <span className="text-xs font-mono">#F9723B</span>
                </div>
                <CardContent className="pt-4 space-y-1">
                  <div className="font-bold text-sm text-sakode-text">sakode-orange</div>
                  <div className="text-xs text-sakode-text-muted">
                    Peringatan deadline &lt; 24 jam, status Revisi, pesan penalti, aksi bahaya.
                  </div>
                </CardContent>
              </Card>

              {/* Text */}
              <Card>
                <div className="h-24 w-full rounded-t-lg bg-sakode-text p-3 flex items-end justify-between font-bold text-white">
                  <span className="text-xs uppercase tracking-wider">Teks Utama</span>
                  <span className="text-xs font-mono">#172033</span>
                </div>
                <CardContent className="pt-4 space-y-1">
                  <div className="font-bold text-sm text-sakode-text">sakode-text</div>
                  <div className="text-xs text-sakode-text-muted">
                    Teks judul, label formulir utama, dan konten teks tingkat kontras tinggi.
                  </div>
                </CardContent>
              </Card>

              {/* Text Muted */}
              <Card>
                <div className="h-24 w-full rounded-t-lg bg-sakode-text-muted p-3 flex items-end justify-between font-bold text-white">
                  <span className="text-xs uppercase tracking-wider">Teks Sekunder</span>
                  <span className="text-xs font-mono">#64748B</span>
                </div>
                <CardContent className="pt-4 space-y-1">
                  <div className="font-bold text-sm text-sakode-text">sakode-text-muted</div>
                  <div className="text-xs text-sakode-text-muted">
                    Metadata tanggal WIB, teks bantuan (helper text), caption pendukung.
                  </div>
                </CardContent>
              </Card>

              {/* Border */}
              <Card>
                <div className="h-24 w-full rounded-t-lg bg-sakode-border p-3 flex items-end justify-between font-bold text-sakode-text">
                  <span className="text-xs uppercase tracking-wider">Border Halus</span>
                  <span className="text-xs font-mono">#DBE8F0</span>
                </div>
                <CardContent className="pt-4 space-y-1">
                  <div className="font-bold text-sm text-sakode-text">sakode-border</div>
                  <div className="text-xs text-sakode-text-muted">
                    Garis tepi card, tabel, divider section, dan outline button.
                  </div>
                </CardContent>
              </Card>

              {/* Background */}
              <Card>
                <div className="h-24 w-full rounded-t-lg bg-sakode-bg p-3 flex items-end justify-between font-bold text-sakode-text border-b border-sakode-border">
                  <span className="text-xs uppercase tracking-wider">Kanvas Canvas</span>
                  <span className="text-xs font-mono">#F7FBFE</span>
                </div>
                <CardContent className="pt-4 space-y-1">
                  <div className="font-bold text-sm text-sakode-text">sakode-bg</div>
                  <div className="text-xs text-sakode-text-muted">
                    Latar belakang default seluruh halaman web (light theme).
                  </div>
                </CardContent>
              </Card>

              {/* Card */}
              <Card>
                <div className="h-24 w-full rounded-t-lg bg-sakode-card p-3 flex items-end justify-between font-bold text-sakode-text border-b border-sakode-border">
                  <span className="text-xs uppercase tracking-wider">Permukaan Card</span>
                  <span className="text-xs font-mono">#FFFFFF</span>
                </div>
                <CardContent className="pt-4 space-y-1">
                  <div className="font-bold text-sm text-sakode-text">sakode-card</div>
                  <div className="text-xs text-sakode-text-muted">
                    Permukaan kartu, panel modal, dropdown, dan sheet popover.
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Typography Hierarchy */}
            <Card>
              <CardHeader>
                <CardTitle>Spesifikasi Tipografi: Google Font Nunito</CardTitle>
                <CardDescription>
                  Font modern berkarakter ramah namun tegas untuk ekosistem pembelajaran dan reward.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-sakode-bg border border-sakode-border space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-sakode-border/60 pb-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-sakode-text">
                      ExtraBold (800) - Judul Hero & Statistik Utama
                    </span>
                    <span className="text-xs font-mono text-sakode-text-muted">font-extrabold</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-sakode-border/60 pb-2">
                    <span className="text-xl sm:text-2xl font-bold text-sakode-text">
                      Bold (700) - Nilai Bounty Reward {formatCurrencyIDR(750000)} & Heading H2
                    </span>
                    <span className="text-xs font-mono text-sakode-text-muted">font-bold</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-sakode-border/60 pb-2">
                    <span className="text-base sm:text-lg font-semibold text-sakode-text">
                      SemiBold (600) - Label Form, Nama Member, Subjudul Task
                    </span>
                    <span className="text-xs font-mono text-sakode-text-muted">font-semibold</span>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between">
                    <span className="text-sm font-normal text-sakode-text leading-relaxed">
                      Regular (400) - Teks paragraf, deskripsi deliverable, kriteria penerimaan, dan catatan hasil evaluasi admin.
                    </span>
                    <span className="text-xs font-mono text-sakode-text-muted">font-normal</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* TAB 2: UI PRIMITIVES & STATUS PILLS */}
        {selectedTab === 'components' && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            <div>
              <h2 className="text-2xl font-black text-sakode-text">Komponen UI Primitif</h2>
              <p className="text-sm text-sakode-text-muted mt-1">
                Tombol, Card, dan Badge yang mematuhi standar aksesibilitas WCAG AA (touch target min 44px).
              </p>
            </div>

            {/* Button Showcase */}
            <Card>
              <CardHeader>
                <CardTitle>Varian Tombol (Button Variants)</CardTitle>
                <CardDescription>
                  Semua tombol memiliki tinggi 44px (touch target standar mobile) dan transisi fokus ring yang jelas.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Variant List */}
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary (Cyan)</Button>
                  <Button variant="team">Team (Purple)</Button>
                  <Button variant="danger">Danger (Orange)</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                </div>

                {/* Sizes and States */}
                <div className="pt-4 border-t border-sakode-border flex flex-wrap items-center gap-3">
                  <Button size="sm" variant="primary">Ukuran Small</Button>
                  <Button size="default" variant="primary">Ukuran Default (44px)</Button>
                  <Button size="lg" variant="primary">Ukuran Large (48px)</Button>
                  <Button
                    variant="primary"
                    isLoading={buttonLoading}
                    onClick={() => {
                      setButtonLoading(true);
                      setTimeout(() => setButtonLoading(false), 2000);
                    }}
                  >
                    {buttonLoading ? 'Menyimpan...' : 'Klik Demo Loading'}
                  </Button>
                  <Button variant="primary" disabled>
                    Disabled State
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Complete Status Indicator Grid (WCAG AA) */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle>Sistem Status & Indikator Visual (StatusPill)</CardTitle>
                    <CardDescription>
                      Aturan Aksesibilitas WCAG AA: Status TIDAK BOLEH hanya mengandalkan warna. Setiap status memiliki ikon visual dan teks Bahasa Indonesia resmi.
                    </CardDescription>
                  </div>
                  <Badge variant="cyan" leftIcon={<Sparkles className="h-3 w-3" />}>
                    13 Status Task
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.keys(TASK_STATUS).map((statusKey) => (
                    <div
                      key={statusKey}
                      className="p-3 rounded-lg border border-sakode-border bg-sakode-bg/60 flex items-center justify-between"
                    >
                      <StatusPill status={statusKey} />
                      <span className="text-[10px] font-mono text-sakode-text-muted">
                        {statusKey}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Claim Statuses */}
                <div className="mt-6 pt-6 border-t border-sakode-border">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sakode-text-muted mb-3">
                    Status Alur Finansial & Klaim Reward
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.keys(CLAIM_STATUS).map((claimKey) => (
                      <div
                        key={claimKey}
                        className="p-3 rounded-lg border border-sakode-border bg-sakode-bg/60 flex items-center justify-between"
                      >
                        <StatusPill status={claimKey} />
                        <span className="text-[10px] font-mono text-sakode-text-muted">
                          {claimKey}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* TAB 3: REALISTIC CARDS & INVARIANTS */}
        {selectedTab === 'scenarios' && (
          <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
            <div>
              <h2 className="text-2xl font-black text-sakode-text">Demo Komposisi Antarmuka Nyata</h2>
              <p className="text-sm text-sakode-text-muted mt-1">
                Implementasi kartu task, modul aktif member, dan widget klaim reward sesuai skenario operasional.
              </p>
            </div>

            {/* Task Card Demo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Solo Instant Take */}
              <Card hoverable className="flex flex-col justify-between">
                <div>
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="cyan">Solo Task</Badge>
                        <Badge variant="outline">Instant Take</Badge>
                      </div>
                      <StatusPill status="OPEN" />
                    </div>

                    <CardTitle className="text-xl">
                      Integrasi Otentikasi Firebase Auth & Google Login
                    </CardTitle>

                    <CardDescription>
                      Mengimplementasikan flow login Google, email verification, dan integrasi session cookies Next.js App Router.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Bounty & Deadline Highlight */}
                    <div className="p-3 rounded-lg bg-sakode-bg border border-sakode-border flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-sakode-text-muted uppercase font-semibold">
                          Bounty Reward
                        </span>
                        <div className="text-xl font-extrabold text-sakode-text">
                          {formatCurrencyIDR(450000)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-sakode-text-muted uppercase font-semibold">
                          Batas Waktu (WIB)
                        </span>
                        <div className="text-xs font-bold text-sakode-text flex items-center gap-1 justify-end">
                          <Clock className="h-3.5 w-3.5 text-sakode-cyan" />
                          <span>{formatDateWIB(demoDeadline)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                        Next.js
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                        Firebase Auth
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                        TypeScript
                      </span>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="flex items-center justify-between pt-4">
                  <span className="text-xs text-sakode-text-muted">
                    Batas: 1 Active Task
                  </span>
                  <Button variant="primary" size="default">
                    Ambil Task Sekarang
                  </Button>
                </CardFooter>
              </Card>

              {/* Card 2: Team Task Application */}
              <Card hoverable className="flex flex-col justify-between">
                <div>
                  <CardHeader className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="purple" leftIcon={<Users className="h-3 w-3" />}>
                          Team Task (3 Orang)
                        </Badge>
                        <Badge variant="outline">Application</Badge>
                      </div>
                      <StatusPill status="RECRUITING" />
                    </div>

                    <CardTitle className="text-xl">
                      Pengembangan Modul Financial Ledger & Batch Claim
                    </CardTitle>

                    <CardDescription>
                      Membangun alur konsensus tim 100%, pembagian reward otomatis, dan upload bukti transfer lead.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Bounty & Deadline Highlight */}
                    <div className="p-3 rounded-lg bg-sakode-bg border border-sakode-border flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-sakode-text-muted uppercase font-semibold">
                          Total Bounty Tim
                        </span>
                        <div className="text-xl font-extrabold text-sakode-text">
                          {formatCurrencyIDR(1800000)}
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-sakode-text-muted uppercase font-semibold">
                          Prinsip Bagi Hasil
                        </span>
                        <div className="text-xs font-bold text-sakode-purple">
                          Konsensus 100%
                        </div>
                      </div>
                    </div>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-medium">
                        Tailwind CSS
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-medium">
                        Cloud Firestore
                      </span>
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 text-xs font-medium">
                        Atomic Tx
                      </span>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="flex items-center justify-between pt-4">
                  <span className="text-xs text-sakode-text-muted">
                    Kuota 1/3 Anggota
                  </span>
                  <Button variant="team" size="default">
                    Daftar Sebagai Anggota
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Active Task & Claim Widget Demo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Member Active Task Hero (2 cols) */}
              <Card className="lg:col-span-2 border-2 border-sakode-cyan/50 bg-gradient-to-br from-white via-white to-sky-50/40">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="cyan" leftIcon={<Flame className="h-3.5 w-3.5 text-orange-500" />}>
                      Task Aktif Anda
                    </Badge>
                    <StatusPill status="ACTIVE" />
                  </div>
                  <CardTitle className="text-2xl mt-2">
                    Pembuatan Sistem Desain & Primitif SAKODE
                  </CardTitle>
                  <CardDescription>
                    Tugas ini harus diselesaikan sebelum deadline untuk menghindari penalti penurunan reputasi akun.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white border border-sakode-border shadow-xs">
                      <div className="text-[11px] text-sakode-text-muted uppercase font-bold">
                        Bounty Diterima
                      </div>
                      <div className="text-lg font-black text-sakode-text mt-0.5">
                        {formatCurrencyIDR(600000)}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-sakode-border shadow-xs">
                      <div className="text-[11px] text-sakode-text-muted uppercase font-bold">
                        Sisa Waktu
                      </div>
                      <div className="text-lg font-black text-emerald-600 mt-0.5">
                        28 Jam 40 Menit
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-white border border-sakode-border shadow-xs">
                      <div className="text-[11px] text-sakode-text-muted uppercase font-bold">
                        Zona Waktu Server
                      </div>
                      <div className="text-sm font-bold text-sakode-text mt-1">
                        Asia/Jakarta (WIB)
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-sakode-border text-xs space-y-1.5">
                    <div className="font-bold text-sakode-text">Kriteria Penerimaan Kunci:</div>
                    <ul className="list-disc list-inside text-sakode-text-muted space-y-1">
                      <li>Mengikuti palet resmi 8 token warna SAKODE (#71CFFE, dll).</li>
                      <li>Semua nominal uang integer rupiah (contoh: 600000).</li>
                      <li>Responsif penuh pada perangkat mobile dan desktop.</li>
                    </ul>
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap items-center justify-between gap-3 pt-4">
                  <span className="text-xs text-sakode-text-muted">
                    Dimulai: {formatDateWIB(demoSubmissionDate)}
                  </span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      Lihat Ruang Kerja
                    </Button>
                    <Button variant="primary" size="default">
                      Kirim Hasil Pekerjaan
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Claim Reward Widget (1 col) */}
              <Card className="flex flex-col justify-between">
                <div>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Coins className="h-5 w-5 text-sakode-cyan" />
                        <span>Klaim Reward</span>
                      </CardTitle>
                      <Badge variant="success">Siap Cair</Badge>
                    </div>
                    <CardDescription>
                      Saldo bounty yang telah disetujui admin dan siap ditransfer.
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="p-4 rounded-lg bg-sakode-bg border border-sakode-border text-center">
                      <span className="text-xs text-sakode-text-muted font-semibold uppercase">
                        Total Saldo Siap Klaim
                      </span>
                      <div className="text-2xl font-black text-sakode-text mt-1">
                        {formatCurrencyIDR(1250000)}
                      </div>
                      <span className="text-[11px] text-sakode-text-muted mt-1 block">
                        3 item reward disetujui
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-sakode-border/60">
                        <span className="text-sakode-text-muted">Rekening Tujuan:</span>
                        <span className="font-bold text-sakode-text">
                          BCA {maskAccountNumber('1234567890')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-sakode-border/60">
                        <span className="text-sakode-text-muted">Atas Nama:</span>
                        <span className="font-bold text-sakode-text">YOGA PRADANA</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-sakode-text-muted">Biaya Transfer:</span>
                        <span className="font-bold text-emerald-600">Gratis (Ditanggung)</span>
                      </div>
                    </div>
                  </CardContent>
                </div>

                <CardFooter className="pt-4">
                  <Button variant="primary" className="w-full font-bold">
                    Cairkan Semua (Claim All)
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* 8 Strict Invariants Banner */}
            <Card className="border-sakode-cyan/40 bg-gradient-to-r from-sky-50/50 via-white to-purple-50/30">
              <CardHeader>
                <div className="flex items-center gap-2 text-sakode-text">
                  <ShieldAlert className="h-5 w-5 text-sakode-cyan" />
                  <CardTitle className="text-lg">
                    8 Strict Invariants SAKODE Platform (Pedoman Mutlak AGENTS.md)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-white border border-sakode-border">
                    <span className="font-bold text-sakode-text block mb-1">1. Integer Rupiah</span>
                    Semua nominal uang disimpan sebagai integer tanpa koma/desimal (contoh: 250000).
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-sakode-border">
                    <span className="font-bold text-sakode-text block mb-1">2. UTC Firestore &gt; WIB</span>
                    Disimpan dalam UTC Timestamp dan diformat mutlak ke Asia/Jakarta (WIB) di UI.
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-sakode-border">
                    <span className="font-bold text-sakode-text block mb-1">3. Zero Cron Rule</span>
                    Pengecekan batas waktu deadline diverifikasi server timestamp saat transaksi diproses.
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-sakode-border">
                    <span className="font-bold text-sakode-text block mb-1">4. 1 Task & 3 Application</span>
                    Maksimal 1 task aktif dan maksimal 3 permohonan pending per member.
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-sakode-border">
                    <span className="font-bold text-sakode-text block mb-1">5. Transaksi Atomik</span>
                    Mutasi assignment, klaim, dan review wajib memakai runTransaction Firestore.
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-sakode-border">
                    <span className="font-bold text-sakode-text block mb-1">6. Perlindungan Rekening</span>
                    Dienkripsi AES-256 saat disimpan dan di-mask (BCA •••• 1234) di tampilan umum.
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-sakode-border">
                    <span className="font-bold text-sakode-text block mb-1">7. Append-Only Audit</span>
                    Koleksi auditEvents mutlak append-only, dilarang edit maupun delete.
                  </div>

                  <div className="p-3 rounded-lg bg-white border border-sakode-border">
                    <span className="font-bold text-sakode-text block mb-1">8. Bahasa Indonesia</span>
                    Seluruh teks tombol, badge status, modal, dan pesan error menggunakan Bahasa Indonesia baku.
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-sakode-border bg-sakode-card py-8 mt-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sakode-text-muted">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sakode-text text-sm">SAKODE Academy</span>
            <span>—</span>
            <span>Task & Reward Platform Foundation</span>
          </div>
          <div>
            Sprint 0 Selesai • Next.js App Router • Tailwind CSS v4 • TypeScript
          </div>
        </div>
      </footer>

      {/* Mobile Navigation Bar (Bottom) */}
      <MobileNav />
    </div>
  );
}
