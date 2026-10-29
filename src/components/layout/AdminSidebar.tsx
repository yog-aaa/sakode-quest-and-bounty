'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  Users,
  ClipboardCheck,
  Wallet,
  AlertTriangle,
  FileText,
  Bell,
  ShieldAlert,
  LogOut,
  X,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  superAdminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  isOpenMobile,
  onCloseMobile,
}) => {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navSections: NavSection[] = [
    {
      title: 'UTAMA',
      items: [
        {
          href: '/admin',
          label: 'Ringkasan Operasional',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: 'MANAJEMEN BOUNTY & TASK',
      items: [
        {
          href: '/admin/tasks',
          label: 'Katalog & Pelamar',
          icon: Compass,
        },
        {
          href: '/admin/tasks/create',
          label: 'Terbitkan Task Baru',
          icon: PlusCircle,
        },
      ],
    },
    {
      title: 'KURASI & EVALUASI KERJA',
      items: [
        {
          href: '/admin/members',
          label: 'Verifikasi Member',
          icon: Users,
        },
        {
          href: '/admin/submissions',
          label: 'Review Submission',
          icon: ClipboardCheck,
        },
        {
          href: '/admin/claims',
          label: 'Pencairan Hadiah',
          icon: Wallet,
        },
      ],
    },
    {
      title: 'PENGAWASAN & KEPATUHAN',
      items: [
        {
          href: '/admin/reports',
          label: 'Laporan Sengketa',
          icon: AlertTriangle,
        },
        {
          href: '/admin/audit',
          label: 'Audit Trail Forensik',
          icon: FileText,
        },
        {
          href: '/admin/notifications',
          label: 'Notifikasi Staf',
          icon: Bell,
        },
        {
          href: '/admin/roles',
          label: 'Delegasi Role Staf',
          icon: ShieldAlert,
          superAdminOnly: true,
        },
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-[#070C14] border-r border-slate-200/80 dark:border-slate-800/80 text-slate-800 dark:text-slate-200">
      {/* 1. Header & Brand */}
      <div className="h-16 px-5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between shrink-0">
        <Link href="/admin" className="flex items-center gap-2.5 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sakode-work-logo.svg"
            alt="SAKODE Work Admin"
            className="h-8 w-auto object-contain transition-transform group-hover:scale-[1.02]"
          />
          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            ADMIN
          </span>
        </Link>

        {/* Mobile close button */}
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Tutup Menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* 2. Navigation Sections (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none [&::-webkit-scrollbar]:hidden">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.superAdminOnly || user?.isSuperAdmin
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <span className="px-3 text-[10px] font-mono font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase block">
                {section.title}
              </span>

              <div className="space-y-0.5 pt-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === '/admin'
                      ? pathname === '/admin'
                      : pathname.startsWith(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onCloseMobile}
                      className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all group relative',
                        isActive
                          ? 'bg-sky-50 dark:bg-sky-950/60 text-[#076991] dark:text-sakode-cyan font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-sakode-cyan" />
                      )}
                      <Icon
                        className={cn(
                          'h-4 w-4 shrink-0 transition-colors',
                          isActive
                            ? 'text-sky-600 dark:text-sakode-cyan'
                            : 'text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200'
                        )}
                      />
                      <span className="truncate">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Footer: Portal Switcher & Admin User Profile */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3 bg-slate-50/60 dark:bg-slate-950/40 shrink-0">
        <Link
          href="/"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 transition-colors shadow-2xs"
        >
          <span className="flex items-center gap-1.5">
            <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            <span>Lihat Portal Publik</span>
          </span>
          <span className="text-[10px] text-slate-400">↗</span>
        </Link>

        {/* User Profile Card */}
        <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-400 to-purple-500 text-white flex items-center justify-center text-xs font-black shrink-0 shadow-2xs">
              {(user?.displayName || user?.email || 'A')[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.displayName || user?.email?.split('@')[0]}
              </p>
              <div className="flex items-center gap-1">
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                  {user?.isSuperAdmin ? 'Super Admin' : 'Admin'}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
            title="Keluar dari Akun Admin"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-40">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer Canvas */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
