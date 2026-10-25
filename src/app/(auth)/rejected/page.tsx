'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  AlertCircle,
  Edit3,
  Home,
  MessageCircle,
} from 'lucide-react';

export default function RejectedPage() {
  const { user } = useAuth();

  const rejectionNotes =
    user?.rejectionReason ||
    user?.revisionNotes ||
    'Informasi data rekening atau identitas Anda belum memenuhi ketentuan verifikasi SAKODE. Silakan periksa kembali nomor rekening dan nama pemilik.';

  return (
    <div className="min-h-screen bg-sakode-bg py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      <div className="max-w-xl w-full space-y-6">
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
        </div>

        {/* Status Card */}
        <Card className="shadow-md border-sakode-orange/60 text-center overflow-hidden">
          <div className="h-2 w-full bg-rose-500"></div>
          <CardHeader className="pt-8 pb-4">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <AlertCircle className="h-8 w-8 stroke-[2.2]" />
            </div>

            <div className="flex justify-center mb-2">
              <StatusPill status="REJECTED" size="lg" />
            </div>

            <CardTitle className="text-2xl font-black text-sakode-text">
              Pendaftaran Memerlukan Perbaikan
            </CardTitle>
            <CardDescription className="max-w-md mx-auto text-xs sm:text-sm">
              Admin SAKODE telah meninjau pengajuan profil Anda dan menemukan beberapa data yang perlu disesuaikan sebelum akun dapat diaktifkan.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 text-left">
            {/* Catatan Alasan dari Admin */}
            <div className="p-4 rounded-lg bg-rose-50/70 border border-rose-300 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-rose-600" />
                <span>Catatan Hasil Evaluasi Admin:</span>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed font-medium bg-white p-3 rounded border border-rose-200">
                &ldquo;{rejectionNotes}&rdquo;
              </p>
            </div>

            <p className="text-xs text-sakode-text-muted leading-relaxed">
              Anda tidak perlu mendaftar ulang dengan email baru. Cukup perbaiki informasi nama atau nomor rekening yang dimaksud melalui formulir onboarding di bawah.
            </p>
          </CardContent>

          <CardFooter className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-sakode-bg/40">
            <Link href="/" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto gap-1.5 text-xs">
                <Home className="h-3.5 w-3.5" />
                <span>Beranda</span>
              </Button>
            </Link>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                className="w-full sm:w-auto gap-1.5 text-xs"
                onClick={() => window.open('https://wa.me/6281234567890', '_blank')}
              >
                <MessageCircle className="h-3.5 w-3.5 text-emerald-600" />
                <span>Tanya Admin</span>
              </Button>

              <Link href="/onboarding" className="w-full sm:w-auto">
                <Button variant="danger" className="w-full sm:w-auto font-bold gap-1.5 text-xs">
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Perbaiki Data Profil</span>
                </Button>
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
