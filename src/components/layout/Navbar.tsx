'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { NotificationBell } from '@/components/notification/NotificationBell';
import {
  Compass,
  ShieldAlert,
  Sparkles,
  Layers,
  LogOut,
  UserCheck,
  ClipboardCheck,
  Coins,
  Wallet,
  AlertTriangle,
  FileText,
  Lock,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { href: '/member/tasks', label: 'Eksplor Task', icon: Compass },
    { href: '/member', label: 'Dashboard Saya', icon: Layers },
    { href: '/member/rewards', label: 'Klaim Reward', icon: Coins },
    ...(user?.isAdmin
      ? [
          { href: '/admin/tasks', label: 'Kelola Task', icon: Compass },
          { href: '/admin/submissions', label: 'Review', icon: ClipboardCheck },
          { href: '/admin/claims', label: 'Pencairan', icon: Wallet },
          { href: '/admin/reports', label: 'Laporan', icon: AlertTriangle },
          { href: '/admin/audit', label: 'Audit Log', icon: FileText },
          { href: '/admin/members', label: 'Member', icon: ShieldAlert },
          ...(user?.isSuperAdmin
            ? [{ href: '/admin/roles', label: 'Kelola Admin', icon: Lock }]
            : []),
        ]
      : []),
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-sakode-border bg-sakode-card/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center group py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sakode-work-logo.png"
              alt="SAKODE Work - Platform Task & Bounty Reward"
              className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 pl-4 border-l border-sakode-border">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors',
                    isActive
                      ? 'bg-sakode-cyan/15 text-sakode-text border border-sakode-cyan/40 font-bold'
                      : 'text-sakode-text-muted hover:text-sakode-text hover:bg-sakode-bg'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2.5">
          <Badge variant="cyan" className="hidden sm:inline-flex" leftIcon={<Sparkles className="h-3 w-3" />}>
            Platform Quest & Bounty
          </Badge>

          {user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />

              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-bold text-sakode-text flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5 text-sakode-cyan" />
                  {user.displayName || user.email.split('@')[0]}
                </span>
                <span className="text-[10px] text-sakode-text-muted">
                  {user.role} • {user.approvalStatus}
                </span>
              </div>

              <StatusPill status={user.approvalStatus} size="sm" className="hidden md:inline-flex" />

              <Button
                variant="outline"
                size="sm"
                className="h-9 text-xs px-2.5 gap-1 text-slate-700 cursor-pointer"
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
              <Button variant="primary" size="sm" className="h-9 text-xs px-3.5 font-bold">
                Masuk / Daftar
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
