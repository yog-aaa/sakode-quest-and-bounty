'use client';

import React, { useState, useEffect } from 'react';
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
  LogIn,
  Award,
  Sparkles,
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

  const landingNavLinks = [
    { href: '#pillars', label: 'Pilar Kontribusi' },
    { href: '#task-explorer', label: 'Task Explorer' },
    { href: '#workflow', label: 'Alur Kerja' },
    { href: '#reputation', label: 'Lencana & Level' },
    { href: '#guarantee', label: 'Jaminan' },
    { href: '#faq', label: 'FAQ' },
  ];

  // Dynamic Active Section Tracking on Scroll
  const [activeSection, setActiveSection] = useState<string>('');

  useEffect(() => {
    if (!isLanding) return;

    const sectionIds = ['pillars', 'task-explorer', 'workflow', 'reputation', 'guarantee', 'faq'];

    const handleScroll = () => {
      const scrollY = window.scrollY;
      const offset = 160;

      let current = '';
      for (let i = 0; i < sectionIds.length; i++) {
        const id = sectionIds[i];
        const el = document.getElementById(id);
        if (el) {
          const top = el.offsetTop - offset;
          const bottom = top + el.offsetHeight;
          if (scrollY >= top && scrollY < bottom) {
            current = id;
            break;
          }
        }
      }

      // If scrolled to top, deactivate section
      if (scrollY < 200) {
        current = '';
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLanding]);

  // Smooth Scroller Handler with Sticky Navbar Offset
  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        const top = el.offsetTop - 76;
        window.scrollTo({
          top: Math.max(0, top),
          behavior: 'smooth',
        });
        window.history.pushState(null, '', href);
        setActiveSection(targetId);
      }
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-[#070C14]/90 backdrop-blur-xl transition-colors text-slate-800 dark:text-slate-100 shadow-xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sakode-work-logo.svg"
              alt="SAKODE Work - Platform Task & Bounty Reward"
              className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          {/* Desktop Nav Links: Rendered on Dashboard pages */}
          {!isLanding && (
            <nav className="hidden lg:flex items-center gap-1.5 pl-4 border-l border-slate-200 dark:border-slate-800 overflow-x-auto">
              {dashboardLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                const isRestricted = !user && link.href !== '/member/tasks';

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
                      isActive
                        ? 'bg-sakode-cyan/15 text-[#076991] dark:text-sakode-cyan border border-sakode-cyan/40 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{link.label}</span>
                    {isRestricted && (
                      <Lock className="h-2.5 w-2.5 text-slate-400 dark:text-slate-500 ml-0.5" />
                    )}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Center: Anchor Links on Landing Page with Dynamic Active Highlight & Smooth Scroll */}
        {isLanding && (
          <nav className="hidden md:flex items-center gap-1 text-xs font-bold text-slate-600 dark:text-slate-300">
            {landingNavLinks.map((item) => {
              const sectionId = item.href.replace('#', '');
              const isActive = activeSection === sectionId;

              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleSmoothScroll(e, item.href)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-sky-100 dark:bg-sky-950 text-[#076991] dark:text-sakode-cyan font-black border border-sky-300 dark:border-sky-700 shadow-xs scale-[1.02]'
                      : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        )}

        {/* Right Action Items */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Toggle (Light / Dark) */}
          <ThemeToggle />

          {/* User Logged In Actions */}
          {user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />

              {isLanding ? (
                <Link href={user.isAdmin || user.isSuperAdmin ? '/admin' : '/member'}>
                  <Button
                    variant="primary"
                    size="sm"
                    className="h-9 text-xs px-3.5 font-black gap-1.5 bg-gradient-to-r from-sky-500 to-[#076991] hover:from-sky-600 hover:to-[#055374] dark:from-sakode-cyan dark:to-sky-400 dark:text-slate-950 dark:hover:from-sky-300 dark:hover:to-cyan-300 shadow-sm shadow-sky-500/20 border-0"
                  >
                    <span>Dashboard Saya</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              ) : (
                <>
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
                </>
              )}

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
            /* Visitor Not Logged In Actions (Both Landing & Dashboard Stopper) */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/register" className="hidden sm:inline-block">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 text-xs px-3 font-bold border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 cursor-pointer"
                >
                  Daftar
                </Button>
              </Link>

              <Link href="/login">
                <Button
                  size="sm"
                  className="h-9 text-xs px-3.5 sm:px-4 font-black text-white bg-gradient-to-r from-sky-500 to-[#076991] hover:from-sky-600 hover:to-[#055374] dark:from-sakode-cyan dark:to-sky-400 dark:text-slate-950 dark:hover:from-sky-300 dark:hover:to-cyan-300 shadow-md shadow-sky-500/20 border-0 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Masuk</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
