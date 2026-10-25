'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { Badge } from '@/components/ui/Badge';
import { USER_APPROVAL_STATUS } from '@/lib/constants';
import {
  Clock,
  CheckCircle2,
  RefreshCw,
  Home,
  MessageCircle,
  ShieldCheck,
  Edit3,
} from 'lucide-react';

export default function PendingApprovalPage() {
  const router = useRouter();
  const { user, refreshProfile, isLoading } = useAuth();
  const [checking, setChecking] = useState(false);

  // Auto-redirect jika pengguna sudah disetujui atau merupakan Admin/Super Admin
  useEffect(() => {
    if (!isLoading && user) {
      const isApproved =
        user.approvalStatus === USER_APPROVAL_STATUS.APPROVED ||
        String(user.approvalStatus).toUpperCase() === USER_APPROVAL_STATUS.APPROVED;

      if (user.isAdmin || user.isSuperAdmin) {
        router.replace('/admin');
      } else if (isApproved) {
        router.replace('/member');
      }
    }
  }, [user, isLoading, router]);

  const handleRefresh = async () => {
    setChecking(true);
    await refreshProfile();
    setChecking(false);
  };

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
        <Card className="shadow-md border-sakode-border text-center overflow-hidden">
          <div className="h-2 w-full bg-amber-400"></div>
          <CardHeader className="pt-8 pb-4">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <Clock className="h-8 w-8 stroke-[2.2]" />
            </div>

            <div className="flex justify-center mb-2">
              <StatusPill status="PENDING" size="lg" />
            </div>

            <CardTitle className="text-2xl font-black text-sakode-text">
              Akun Anda Sedang Ditinjau Admin
            </CardTitle>
            <CardDescription className="max-w-md mx-auto text-xs sm:text-sm">
              Terima kasih telah melengkapi profil Anda. Tim Admin SAKODE Academy sedang memverifikasi identitas dan rekening reward Anda.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 text-left">
            {/* Verification Timeline */}
            <div className="p-4 rounded-lg bg-sakode-bg border border-sakode-border space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-sakode-text-muted">
                Tahapan Aktivasi Akun:
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>1. Registrasi Akun Berhasil</span>
                </div>
                <div className="flex items-center gap-2.5 text-emerald-700 font-semibold">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>2. Kelengkapan Profil & Rekening Terenkripsi Selesai</span>
                </div>
                <div className="flex items-center gap-2.5 text-amber-800 font-bold bg-amber-50 p-2 rounded border border-amber-200">
                  <Clock className="h-4 w-4 shrink-0 text-amber-600 animate-pulse" />
                  <span>3. Verifikasi Data oleh Admin SAKODE (Estimasi 1x24 Jam)</span>
                </div>
                <div className="flex items-center gap-2.5 text-sakode-text-muted">
                  <div className="h-4 w-4 rounded-full border border-slate-300 shrink-0"></div>
                  <span>4. Akses Penuh ke Task Bounty & Pembentukan Tim</span>
                </div>
              </div>
            </div>

            {/* Profile Snapshot */}
            {user && (
              <div className="p-4 rounded-lg bg-white border border-sakode-border space-y-2 text-xs">
                <div className="font-bold text-sakode-text flex items-center justify-between">
                  <span>Ringkasan Pengajuan:</span>
                  <Link href="/onboarding" className="text-sakode-cyan hover:underline flex items-center gap-1 font-semibold">
                    <Edit3 className="h-3 w-3" />
                    <span>Ubah Data</span>
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sakode-text-muted pt-1">
                  <div>Nama: <span className="font-semibold text-sakode-text block">{user.displayName || '-'}</span></div>
                  <div>Kontak: <span className="font-semibold text-sakode-text block">{user.contactNumber || '-'}</span></div>
                  <div className="col-span-2">
                    Rekening Reward:
                    <span className="font-semibold text-sakode-text block">{user.paymentAccountMasked || 'Belum diisi'}</span>
                  </div>
                </div>

                {user.skills && user.skills.length > 0 && (
                  <div className="pt-2">
                    <span className="text-sakode-text-muted block mb-1">Tag Skill:</span>
                    <div className="flex flex-wrap gap-1">
                      {user.skills.map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px]">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
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
                <span>Bantuan Admin</span>
              </Button>

              <Button
                variant="primary"
                onClick={handleRefresh}
                isLoading={checking || isLoading}
                className="w-full sm:w-auto font-bold gap-1.5 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Cek Ulang Status</span>
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-sakode-text-muted">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Data rekening dan identitas Anda diamankan dengan protokol enkripsi AES-256</span>
        </div>
      </div>
    </div>
  );
}
