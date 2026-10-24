'use client';

import React from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShieldAlert,
  Users,
  Compass,
  CreditCard,
  FileCheck2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const urgencyQueues = [
    {
      title: '1. Pendaftaran Member Baru (Sprint 1)',
      desc: 'Verifikasi identitas pendaftar, data rekening perbankan, dan kelayakan akun.',
      href: '/admin/members',
      badge: 'Aktif & Siap Diuji',
      icon: Users,
      color: 'bg-sakode-cyan/20 text-[#076991]',
    },
    {
      title: '2. Seleksi Application Task & Manajemen Bounty (Sprint 2)',
      desc: 'Buat task baru, terbitkan draf, dan pilih applicant terbaik untuk task Application.',
      href: '/admin/tasks',
      badge: 'Aktif & Siap Diuji',
      icon: Compass,
      color: 'bg-purple-100 text-purple-800',
    },
    {
      title: '3. Submission Masuk & Review Lock (Sprint 4)',
      desc: 'Evaluasi hasil pekerjaan, minta revisi, atau setujui bounty reward.',
      href: '#',
      badge: 'Sprint 4',
      icon: FileCheck2,
      color: 'bg-emerald-100 text-emerald-800',
    },
    {
      title: '4. Permohonan Klaim Reward (Sprint 6)',
      desc: 'Antrean pencairan dana, upload bukti transfer bank, dan distribusi tim.',
      href: '#',
      badge: 'Sprint 6',
      icon: CreditCard,
      color: 'bg-amber-100 text-amber-800',
    },
  ];

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-sakode-bg py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sakode-border pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="cyan" leftIcon={<ShieldAlert className="h-3 w-3" />}>
                  Admin Panel
                </Badge>
                <span className="text-xs text-sakode-text-muted">Urgency Queue System</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-sakode-text tracking-tight">
                Dashboard Operasional Admin SAKODE
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <Link href="/admin/tasks">
                <Button variant="primary" className="font-bold gap-2">
                  <Compass className="h-4 w-4" />
                  <span>Manajemen Task</span>
                </Button>
              </Link>
              <Link href="/admin/members">
                <Button variant="outline" className="font-bold gap-2">
                  <Users className="h-4 w-4" />
                  <span>Antrean Member</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Urgency Queues Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgencyQueues.map((queue) => {
              const Icon = queue.icon;
              return (
                <Card key={queue.title} hoverable className="flex flex-col justify-between">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`p-2.5 rounded-lg ${queue.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline">{queue.badge}</Badge>
                    </div>
                    <CardTitle className="text-lg">{queue.title}</CardTitle>
                    <CardDescription>{queue.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <Link href={queue.href}>
                      <Button variant="outline" className="w-full text-xs gap-1.5 h-10 font-bold">
                        <span>Kelola Antrean</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Strict Invariant Callout */}
          <Card className="border-sakode-border bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2 text-sakode-text font-bold text-sm">
                <AlertTriangle className="h-4 w-4 text-sakode-orange" />
                <span>Protokol Keamanan & Anti-Konflik Kepentingan (AGENTS.md)</span>
              </div>
            </CardHeader>
            <CardContent className="text-xs text-sakode-text-muted space-y-1 leading-relaxed">
              <p>
                • Seluruh aksi persetujuan, penolakan, dan pembukaan nomor rekening diaudit secara otomatis di koleksi <code>auditEvents</code> (append-only).
              </p>
              <p>
                • Admin yang membuat task atau terlibat dalam submission dilarang menilai laporannya sendiri (Conflict of Interest Invariant).
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
