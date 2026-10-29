'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  Lock,
  X,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';

interface AdminSidebarProps {
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
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
  isCollapsed,
  onToggleCollapse,
}) => {
  const pathname = usePathname();

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
          icon: Lock,
          superAdminOnly: true,
        },
      ],
    },
  ];

  // Helper untuk menentukan apakah link rute sedang aktif
  const isItemActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  // Konten navigasi untuk Desktop dan Mobile Drawer
  const renderSidebarContent = (isDrawerMobile: boolean = false) => {
    const collapsed = !isDrawerMobile && isCollapsed;

    return (
      <div
        className={cn(
          'flex flex-col h-full bg-white dark:bg-[#0A0E17] border-r border-slate-200/80 dark:border-slate-800/80 select-none transition-colors',
          collapsed ? 'overflow-visible' : ''
        )}
      >
        {/* ============================================================= */}
        {/* HEADER SIDEBAR: LOGO (FULL / BRANDMARK) & TOGGLE */}
        {/* ============================================================= */}
        <div
          className={cn(
            'h-16 flex items-center border-b border-slate-200/80 dark:border-slate-800/80 px-4 transition-all duration-300',
            collapsed ? 'justify-center px-2' : 'justify-between'
          )}
        >
          {/* Brand Logo with Smooth Transition */}
          <Link
            href="/admin"
            className="flex items-center gap-2 group py-1 overflow-hidden"
            title="SAKODE Work HQ"
          >
            {collapsed ? (
              // Mode Tersembunyi (Collapsed): Icon Brandmark Beranimasi
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src="/sakode-brandmark.svg"
                alt="SAKODE"
                className="h-8 w-8 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-xs"
              />
            ) : (
              // Mode Tampil (Expanded): Logo Full SAKODE Work
              <div className="flex items-center gap-2 transition-opacity duration-300">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/sakode-work-logo.svg"
                  alt="SAKODE Work"
                  className="h-7 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
                />
              </div>
            )}
          </Link>

          {/* Toggle Button Desktop */}
          {!isDrawerMobile && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={cn(
                'p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-all cursor-pointer',
                collapsed && 'hidden'
              )}
              title="Kecilkan Sidebar"
              aria-label="Kecilkan Sidebar"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          )}

          {/* Close Button Mobile Drawer */}
          {isDrawerMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Tutup menu navigasi"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* ============================================================= */}
        {/* NAV SECTION LIST */}
        {/* ============================================================= */}
        <div
          className={cn(
            'flex-1 px-3 py-4 space-y-6 scrollbar-none',
            collapsed ? 'overflow-visible' : 'overflow-y-auto'
          )}
        >
          {navSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="space-y-1">
              {/* Judul Bagian */}
              {!collapsed ? (
                <div className="px-3 pb-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {section.title}
                </div>
              ) : (
                sIdx > 0 && (
                  <div className="my-2 border-t border-slate-200/60 dark:border-slate-800/60 mx-1" />
                )
              )}

              {/* Items */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const active = isItemActive(item.href);

                  return (
                    <div key={item.href} className="relative group">
                      <Link
                        href={item.href}
                        onClick={() => {
                          if (isDrawerMobile) onCloseMobile();
                        }}
                        className={cn(
                          'relative flex items-center rounded-xl text-xs font-semibold transition-all duration-200',
                          collapsed
                            ? 'justify-center p-2.5'
                            : 'gap-3 px-3 py-2.5',
                          active
                            ? 'bg-gradient-to-r from-sky-500/10 to-cyan-500/10 text-sky-700 dark:text-sakode-cyan font-bold shadow-2xs border border-sky-500/20 dark:border-cyan-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                        )}
                      >
                        {/* Aksen Strip Aktif (Expanded Only) */}
                        {active && !collapsed && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-gradient-to-b from-sky-500 to-cyan-400" />
                        )}

                        {/* Icon dengan Animasi Gamified */}
                        <Icon
                          className={cn(
                            'shrink-0 transition-transform duration-200 group-hover:scale-110',
                            collapsed ? 'h-5 w-5' : 'h-4 w-4',
                            active
                              ? 'text-sky-600 dark:text-sakode-cyan'
                              : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                          )}
                        />

                        {/* Label Teks (Expanded Only) */}
                        {!collapsed && (
                          <span className="truncate flex-1">{item.label}</span>
                        )}

                        {/* Badge Tambahan jika ada */}
                        {!collapsed && item.badge && (
                          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.badge}
                          </span>
                        )}
                      </Link>

                      {/* Tooltip Khusus Mode Collapsed */}
                      {collapsed && (
                        <div
                          role="tooltip"
                          className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-1.5 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-[100] flex items-center"
                        >
                          <span>{item.label}</span>
                          <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900 dark:border-r-slate-800" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================= */}
        {/* FOOTER SIDEBAR (TOGGLE SAAT COLLAPSED & VERSI) */}
        {/* ============================================================= */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 transition-all duration-300 overflow-visible">
          {collapsed ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group relative"
              title="Perluas Sidebar"
              aria-label="Perluas Sidebar"
            >
              <PanelLeftOpen className="h-5 w-5 group-hover:scale-110 transition-transform" />
              <div
                role="tooltip"
                className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3.5 px-3 py-1.5 bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 text-xs font-bold rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-1 group-hover:translate-x-0 z-[100] flex items-center"
              >
                <span>Perluas Sidebar</span>
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-slate-900 dark:border-r-slate-800" />
              </div>
            </button>
          ) : (
            <div className="flex items-center justify-between px-2 py-1 text-[11px] text-slate-400 dark:text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                <span>SAKODE HQ</span>
              </span>
              <span className="text-[10px] font-mono">v1.2</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Desktop Persistent Sidebar with Width Transition */}
      <aside
        className={cn(
          'hidden lg:block shrink-0 h-screen sticky top-0 z-40 transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-20 overflow-visible' : 'w-64'
        )}
      >
        {renderSidebarContent(false)}
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
          <div className="relative flex-1 flex flex-col max-w-xs w-full animate-in slide-in-from-left duration-200">
            {renderSidebarContent(true)}
          </div>
        </div>
      )}
    </>
  );
};
