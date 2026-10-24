'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, ArrowLeft, LogIn, Clock, AlertCircle, Loader2 } from 'lucide-react';
import { USER_APPROVAL_STATUS } from '@/lib/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireApproved?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAdmin = false,
  requireApproved = false,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 space-y-3">
        <Loader2 className="h-8 w-8 animate-spin text-sakode-cyan" />
        <span className="text-xs font-semibold text-sakode-text-muted">
          Memverifikasi status akses akun SAKODE...
        </span>
      </div>
    );
  }

  // 1. Jika belum login sama sekali
  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sakode-cyan/20 text-[#09668d]">
              <LogIn className="h-6 w-6" />
            </div>
            <CardTitle>Silakan Masuk Terlebih Dahulu</CardTitle>
            <CardDescription>
              Anda perlu masuk dengan akun SAKODE Academy untuk mengakses halaman ini.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/login" className="inline-block w-full">
              <Button variant="primary" className="w-full">
                Masuk ke Akun
              </Button>
            </Link>
            <Link href="/" className="inline-block w-full">
              <Button variant="outline" className="w-full">
                Kembali ke Beranda
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 2. Proteksi Rute Admin (RBAC: Hanya ADMIN & SUPER_ADMIN)
  if (requireAdmin && !user.isAdmin) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-sakode-orange/40 bg-gradient-to-b from-white to-orange-50/20">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-sakode-orange/15 text-sakode-orange">
              <ShieldAlert className="h-7 w-7" />
            </div>
            <CardTitle className="text-xl">403 - Akses Ditolak</CardTitle>
            <CardDescription className="text-xs leading-relaxed">
              Halaman ini dibatasi secara ketat dan hanya dapat diakses oleh Administrator resmi SAKODE Academy. Akun Anda saat ini memiliki peran <strong className="font-bold text-sakode-text">{user.role}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/" className="inline-block w-full">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="h-4 w-4" />
                Kembali ke Halaman Utama
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. Proteksi Member Belum Disetujui (PENDING)
  if (requireApproved && user.approvalStatus === USER_APPROVAL_STATUS.PENDING) {
    // Jika belum mengisi data rekening sama sekali
    if (!user.paymentAccountEncrypted) {
      return (
        <div className="min-h-[70vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center">
            <CardHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sakode-cyan/20 text-[#09668d]">
                <Clock className="h-6 w-6" />
              </div>
              <CardTitle>Lengkapi Profil Anda</CardTitle>
              <CardDescription>
                Anda belum melengkapi nomor kontak dan data rekening tujuan reward.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/onboarding" className="inline-block w-full">
                <Button variant="primary" className="w-full">
                  Lengkapi Profil Sekarang
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Clock className="h-6 w-6" />
            </div>
            <CardTitle>Pendaftaran Sedang Ditinjau</CardTitle>
            <CardDescription>
              Akun Anda sedang dalam antrean verifikasi Admin SAKODE. Fitur pengerjaan task akan aktif setelah disetujui.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/pending-approval" className="inline-block w-full">
              <Button variant="outline" className="w-full">
                Lihat Detail Status Peninjauan
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. Proteksi Member Ditolak (REJECTED)
  if (requireApproved && user.approvalStatus === USER_APPROVAL_STATUS.REJECTED) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center border-sakode-orange/50">
          <CardHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700">
              <AlertCircle className="h-6 w-6" />
            </div>
            <CardTitle>Pendaftaran Perlu Perbaikan</CardTitle>
            <CardDescription>
              Admin telah meninjau pendaftaran Anda dan meminta perbaikan data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/rejected" className="inline-block w-full">
              <Button variant="danger" className="w-full">
                Periksa Catatan & Perbaiki Data
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
