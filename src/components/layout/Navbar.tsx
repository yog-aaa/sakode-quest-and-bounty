'use client';

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
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
  ChevronDown,
  User,
  Bell,
  Sparkles,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isLanding = pathname === '/';

  // User Dropdown State
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  // Close dropdown on route change
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsUserMenuOpen(false);
    }, 0);
    return () => clearTimeout(timer);
  }, [pathname]);

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
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

      if (scrollY < 200) {
        current = '';
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLanding]);

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

  // Halaman admin memiliki layout AdminSidebar tersendiri dan tidak menggunakan top navbar publik
  if (pathname.startsWith('/admin')) {
    return null;
  }

  // Generate User Initials for Avatar
  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return name.slice(0, 2).toUpperCase();
    }
    if (email) return email.slice(0, 2).toUpperCase();
    return 'ME';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-[#070A10]/80 backdrop-blur-xl transition-all shadow-2xs">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Left Section */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group py-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sakode-work-logo.svg"
              alt="SAKODE Work"
              className="h-8 sm:h-9 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
            <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/60">
              Work
            </span>
          </Link>

          {/* Center/Left Desktop Nav: Segmented Floating Pill Island */}
          {!isLanding && (
            <nav className="hidden md:flex items-center p-1 rounded-full bg-slate-100/90 dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-800/80 backdrop-blur-sm gap-0.5">
              {dashboardLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                const isRestricted = !user && link.href !== '/member/tasks';

                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap',
                      isActive
                        ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40'
                    )}
                  >
                    <Icon className={cn('h-3.5 w-3.5', isActive ? 'text-sky-500' : 'text-slate-400')} />
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

        {/* Center: Anchor Links on Landing Page */}
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
                    'px-3.5 py-1.5 rounded-full text-xs transition-all whitespace-nowrap cursor-pointer',
                    isActive
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold shadow-xs'
                      : 'font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>
        )}

        {/* Right Section: Theme Toggle, Notifications, Consolidated User Menu */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Logged In Actions */}
          {mounted && user ? (
            <div className="flex items-center gap-2">
              <NotificationBell />

              {isLanding ? (
                <Link href={user.isAdmin || user.isSuperAdmin ? '/admin' : '/member'}>
                  <button className="h-9 px-4 rounded-full text-xs font-bold text-white bg-slate-950 dark:bg-white dark:text-slate-950 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer">
                    <span>Dashboard Saya</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </Link>
              ) : (
                /* CONSOLIDATED USER PROFILE PILL & DROPDOWN */
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-expanded={isUserMenuOpen}
                    className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs transition-all cursor-pointer group"
                  >
                    {/* User Initials Avatar with Status Dot */}
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shadow-2xs">
                        {getInitials(user.displayName, user.email)}
                      </div>
                      <span
                        className={cn(
                          'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900',
                          user.approvalStatus === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'
                        )}
                        title={`Status Akun: ${user.approvalStatus}`}
                      />
                    </div>

                    {/* Compact Name */}
                    <div className="hidden sm:flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[110px] truncate leading-tight">
                        {user.displayName || user.email.split('@')[0]}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium leading-none">
                        {user.isSuperAdmin ? 'Super Admin' : user.isAdmin ? 'Admin' : 'Member'}
                      </span>
                    </div>

                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-transform duration-200',
                        isUserMenuOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {/* FLOATING LUXURY DROPDOWN MENU */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
                      {/* Dropdown Header */}
                      <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs shrink-0">
                            {getInitials(user.displayName, user.email)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {user.displayName || 'Member SAKODE'}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {user.email}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                            Status Akun:
                          </span>
                          <StatusPill status={user.approvalStatus} size="sm" />
                        </div>
                      </div>

                      {/* Navigation Shortcut Links */}
                      <div className="p-2 space-y-0.5 text-xs font-medium">
                        <Link
                          href="/member"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white transition-colors"
                        >
                          <Layers className="h-4 w-4 text-sky-500" />
                          <span>Dashboard Saya</span>
                        </Link>

                        <Link
                          href="/member/tasks"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white transition-colors"
                        >
                          <Compass className="h-4 w-4 text-sky-500" />
                          <span>Eksplor Task Tersedia</span>
                        </Link>

                        <Link
                          href="/member/rewards"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white transition-colors"
                        >
                          <Coins className="h-4 w-4 text-amber-500" />
                          <span>Dompet & Saldo Reward</span>
                        </Link>

                        <Link
                          href="/member/notifications"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-950 dark:hover:text-white transition-colors"
                        >
                          <Bell className="h-4 w-4 text-purple-500" />
                          <span>Pusat Notifikasi</span>
                        </Link>
                      </div>

                      {/* Dropdown Footer: Logout */}
                      <div className="p-2 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/20">
                        <button
                          type="button"
                          onClick={async () => {
                            setIsUserMenuOpen(false);
                            await logout();
                            window.location.href = '/login';
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Keluar dari Akun</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Visitor Not Logged In Actions */
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Link href="/register" className="hidden sm:inline-block">
                <button className="h-9 px-4 rounded-full text-xs font-semibold border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer">
                  Daftar
                </button>
              </Link>

              <Link href="/login">
                <button className="h-9 px-4 rounded-full text-xs font-bold text-white bg-slate-950 dark:bg-white dark:text-slate-950 shadow-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer">
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Masuk</span>
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
