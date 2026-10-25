'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { loginSchema, registerSchema } from '@/lib/validations/auth';
import { USER_ROLES, USER_APPROVAL_STATUS } from '@/lib/constants';
import {
  LogIn,
  UserPlus,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  UserCheck,
  Clock,
  LogOut,
  Loader2,
} from 'lucide-react';

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryTab = searchParams.get('tab');

  const {
    user,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    error: authError,
    emailVerificationSent,
    setMockSession,
    isMockSession,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>(
    queryTab === 'register' ? 'register' : 'login'
  );

  // Perbarui activeTab jika query param URL berubah
  useEffect(() => {
    if (queryTab === 'register') {
      setActiveTab('register');
    } else if (queryTab === 'login') {
      setActiveTab('login');
    }
  }, [queryTab]);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});

    if (activeTab === 'login') {
      const result = loginSchema.safeParse({ email, password });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setValidationErrors(errors);
        return;
      }

      setFormSubmitting(true);
      const ok = await signInWithEmail(email, password);
      setFormSubmitting(false);

      if (ok) {
        router.push('/');
      }
    } else {
      const result = registerSchema.safeParse({ email, password, confirmPassword });
      if (!result.success) {
        const errors: Record<string, string> = {};
        result.error.issues.forEach((issue) => {
          if (issue.path[0]) {
            errors[issue.path[0].toString()] = issue.message;
          }
        });
        setValidationErrors(errors);
        return;
      }

      setFormSubmitting(true);
      const ok = await signUpWithEmail(email, password);
      setFormSubmitting(false);

      if (ok) {
        router.push('/onboarding');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const ok = await signInWithGoogle();
      if (ok) {
        router.push('/onboarding');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-sakode-bg py-10 px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center">
      {/* Brand Header */}
      <div className="text-center mb-8 space-y-2">
        <Link href="/" className="inline-flex items-center gap-2 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sakode-cyan text-sakode-text font-black text-xl shadow-sm transition-transform group-hover:scale-105">
            S
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-sakode-text">
            SAKODE Academy
          </span>
        </Link>
        <p className="text-xs text-sakode-text-muted">
          Platform Kolaborasi Pengerjaan Task & Pencairan Bounty Reward
        </p>
      </div>

      {/* Main Auth Card */}
      <Card className="max-w-md w-full shadow-md border-sakode-border">
        <CardHeader className="text-center pb-2">
          {/* Tab Selector */}
          <div className="grid grid-cols-2 p-1 bg-sakode-bg rounded-lg border border-sakode-border mb-4">
            <button
              type="button"
              onClick={() => {
                setActiveTab('login');
                setValidationErrors({});
              }}
              className={`py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'login'
                  ? 'bg-sakode-card text-sakode-text shadow-xs border border-sakode-border/50'
                  : 'text-sakode-text-muted hover:text-sakode-text'
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Masuk Akun</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setValidationErrors({});
              }}
              className={`py-2 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'register'
                  ? 'bg-sakode-card text-sakode-text shadow-xs border border-sakode-border/50'
                  : 'text-sakode-text-muted hover:text-sakode-text'
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>Daftar Member</span>
            </button>
          </div>

          <CardTitle className="text-xl">
            {activeTab === 'login' ? 'Selamat Datang Kembali!' : 'Bergabung dengan SAKODE'}
          </CardTitle>
          <CardDescription>
            {activeTab === 'login'
              ? 'Masuk ke dashboard task dan pantau status klaim reward Anda.'
              : 'Daftar sebagai member dan mulai kerjakan task dengan bounty reward.'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 pt-2">
          {/* Email Verification Banner */}
          {emailVerificationSent && (
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Email Verifikasi Telah Dikirim!</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Silakan periksa kotak masuk email Anda dan klik tautan verifikasi sebelum mengerjakan task.
              </p>
            </div>
          )}

          {/* Error Message */}
          {authError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11 border-sakode-border hover:bg-slate-50 gap-2.5 font-semibold text-xs cursor-pointer"
            onClick={handleGoogleSignIn}
            disabled={formSubmitting || isGoogleLoading}
            isLoading={isGoogleLoading}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Lanjutkan dengan Google</span>
          </Button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-2">
            <div className="border-t border-sakode-border w-full"></div>
            <span className="bg-sakode-card px-3 text-[11px] font-semibold text-sakode-text-muted uppercase tracking-wider">
              atau via email
            </span>
            <div className="border-t border-sakode-border w-full"></div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <Input
              label="Alamat Email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={validationErrors.email}
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={validationErrors.password}
              leftIcon={<Lock className="h-4 w-4" />}
              autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
              required
            />

            {activeTab === 'register' && (
              <Input
                label="Konfirmasi Password"
                type="password"
                placeholder="Ulangi password di atas"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={validationErrors.confirmPassword}
                leftIcon={<Lock className="h-4 w-4" />}
                autoComplete="new-password"
                required
              />
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full font-bold mt-2 h-11 cursor-pointer"
              isLoading={formSubmitting}
            >
              {activeTab === 'login' ? 'Masuk ke Platform' : 'Daftar & Lengkapi Profil'}
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          {/* Switcher Text Link */}
          <div className="text-center pt-2">
            {activeTab === 'login' ? (
              <p className="text-xs text-sakode-text-muted">
                Belum punya akun SAKODE?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('register');
                    setValidationErrors({});
                  }}
                  className="font-bold text-[#09668d] hover:underline cursor-pointer"
                >
                  Daftar Member Baru
                </button>
              </p>
            ) : (
              <p className="text-xs text-sakode-text-muted">
                Sudah memiliki akun?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('login');
                    setValidationErrors({});
                  }}
                  className="font-bold text-[#09668d] hover:underline cursor-pointer"
                >
                  Masuk ke Akun
                </button>
              </p>
            )}
          </div>

          {/* Current Logged In State Notification */}
          {user && (
            <div className="mt-4 p-3 rounded-lg bg-sakode-cyan/15 border border-sakode-cyan/50 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sakode-text flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-sakode-cyan" />
                  Sesi Aktif: {user.displayName || user.email}
                </span>
                <Badge variant="cyan">{user.role}</Badge>
              </div>
              <div className="flex gap-2 pt-1">
                <Button
                  size="sm"
                  variant="primary"
                  className="flex-1 text-xs"
                  onClick={() => router.push(user.isAdmin ? '/admin' : '/onboarding')}
                >
                  {user.isAdmin ? 'Dashboard Admin' : 'Lengkapi / Cek Profil'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1"
                  onClick={logout}
                  title="Keluar dari akun ini"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Keluar</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* QA Simulator & Evaluation Mode */}
      <div className="max-w-md w-full mt-8 p-4 rounded-lg border border-sakode-border bg-white text-xs space-y-3">
        <div className="flex items-center justify-between border-b border-sakode-border/70 pb-2">
          <div className="flex items-center gap-1.5 font-bold text-sakode-text">
            <Sparkles className="h-4 w-4 text-sakode-purple" />
            <span>QA Testing Simulator (Sprint 1)</span>
          </div>
          {isMockSession && (
            <Badge variant="purple" className="text-[10px]">
              Mock Session Aktif
            </Badge>
          )}
        </div>
        <p className="text-[11px] text-sakode-text-muted leading-relaxed">
          Gunakan tombol di bawah untuk menyimulasikan berbagai status pengguna SAKODE secara instan untuk verifikasi antrean dan route guard:
        </p>

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-[11px] h-9"
            onClick={() => {
              setMockSession(USER_ROLES.MEMBER, USER_APPROVAL_STATUS.PENDING);
              router.push('/pending-approval');
            }}
          >
            <Clock className="h-3.5 w-3.5 text-amber-600 mr-1" />
            Member PENDING
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-[11px] h-9"
            onClick={() => {
              setMockSession(USER_ROLES.MEMBER, USER_APPROVAL_STATUS.APPROVED);
              router.push('/member');
            }}
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mr-1" />
            Member APPROVED
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-[11px] h-9"
            onClick={() => {
              setMockSession(USER_ROLES.MEMBER, USER_APPROVAL_STATUS.REJECTED);
              router.push('/rejected');
            }}
          >
            <AlertCircle className="h-3.5 w-3.5 text-rose-600 mr-1" />
            Member REJECTED
          </Button>

          <Button
            size="sm"
            variant="team"
            className="text-[11px] h-9 font-bold"
            onClick={() => {
              setMockSession(USER_ROLES.ADMIN, USER_APPROVAL_STATUS.APPROVED);
              router.push('/admin/members');
            }}
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />
            Role ADMIN SAKODE
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-sakode-bg flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-sakode-cyan" />
        </div>
      }
    >
      <AuthPageContent />
    </Suspense>
  );
}
