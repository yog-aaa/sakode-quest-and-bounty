'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { StatusPill } from '@/components/ui/StatusPill';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationBell } from '@/components/notification/NotificationBell';
import {
  Compass,
  ShieldAlert,
  Layers,
  LogOut,
  UserCheck,
  ClipboardCheck,
  Coins,
  Wallet,
  AlertTriangle,
  FileText,
  Lock,
  ArrowRight,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isLanding = pathname === '/';

  const adminLinks = [
    { href: '/admin', label: 'Ringkasan', icon: Layers },
    { href: '/admin/tasks', label: 'Kelola Task', icon: Compass },
    { href: '/admin/submissions', label: 'Review', icon: ClipboardCheck },
    { href: '/admin/claims', label: 'Pencairan', icon: Wallet },
    { href: '/admin/reports', label: 'Laporan', icon: AlertTriangle },
    { href: '/admin/audit', label: 'Audit Log', icon: FileText },
    { href: '/admin/members', label: 'Member', icon: ShieldAlert },
    ...(user?.isSuperAdmin
      ? [{ href: '/admin/roles', label: 'Kelola Admin', icon: Lock }]
      : []),
  ];

  const memberLinks = [
    { href: '/member/tasks', label: 'Eksplor Task', icon: Compass },
    { href: '/member', label: 'Dashboard Saya', icon: Layers },
    { href: '/member/rewards', label: 'Klaim Reward', icon: Coins },
  ];

  const dashboardLinks = user?.isAdmin ? adminLinks : memberLinks;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md transition-colors text-slate-800 dark:text-slate-100">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center group py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sakode-work-logo.svg"
              alt="SAKODE Work - Platform Task & Bounty Reward"
              className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop Nav Links: Only rendered on Dashboard pages (not Landing) */}
          {!isLanding && (
            <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-slate-200 dark:border-slate-800 overflow-x-auto">
              {dashboardLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap',
                      isActive
                        ? 'bg-sakode-cyan/15 text-[#076991] dark:text-sakode-cyan border border-sakode-cyan/40 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Center: 3 Anchor Links on Landing Page Only */}
        {isLanding && (
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 dark:text-slate-300">
            <a
              href="#task-explorer"
              className="hover:text-sakode-cyan dark:hover:text-sakode-cyan transition-colors"
            >
              Task Explorer
            </a>
            <a
              href="#pillars"
              className="hover:text-sakode-cyan dark:hover:text-sakode-cyan transition-colors"
            >
              Pilar Kontribusi
            </a>
            <a
              href="#workflow"
              className="hover:text-sakode-cyan dark:hover:text-sakode-cyan transition-colors"
            >
              Alur Kerja
            </a>
          </nav>
        )}

        {/* Right Action Items */}
        <div className="flex items-center gap-2.5">
          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {isLanding ? (
            /* Landing Page Actions */
            user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />

                <Link href={user.isAdmin || user.isSuperAdmin ? '/admin' : '/member'}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-9 text-xs px-3.5 font-bold gap-1.5"
                  >
                    <span>Masuk ke Dashboard</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs px-2.5 gap-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={async () => {
                    await logout();
                    window.location.href = '/login';
                  }}
                  title="Keluar dari akun"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm" className="h-9 text-xs px-4 font-bold">
                  Masuk ke Dashboard
                </Button>
              </Link>
            )
          ) : (
            /* Dashboard Pages Actions */
            user ? (
              <div className="flex items-center gap-2">
                <NotificationBell />

                <div className="hidden sm:flex flex-col items-end text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <UserCheck className="h-3.5 w-3.5 text-sakode-cyan" />
                    {user.displayName || user.email.split('@')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    {user.role} • {user.approvalStatus}
                  </span>
                </div>

                <StatusPill status={user.approvalStatus} size="sm" className="hidden md:inline-flex" />

                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs px-2.5 gap-1 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  onClick={async () => {
                    await logout();
                    window.location.href = '/login';
                  }}
                  title="Keluar dari akun"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </Button>
              </div>
            ) : (
              <Link href="/login">
                <Button variant="primary" size="sm" className="h-9 text-xs px-4 font-bold">
                  Masuk / Daftar
                </Button>
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
};
