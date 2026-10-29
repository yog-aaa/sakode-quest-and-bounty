'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationBell } from '@/components/notification/NotificationBell';
import { useAuth } from '@/context/AuthContext';
import {
  Menu,
  ChevronRight,
  ShieldCheck,
  ExternalLink,
  Layers,
  Compass,
  ClipboardCheck,
  Wallet,
  AlertTriangle,
  FileText,
  Users,
  Bell,
  Lock,
} from 'lucide-react';

function getRouteMetadata(pathname: string): { title: string; icon: React.ElementType } {
  if (pathname === '/admin') {
    return { title: 'Ringkasan Operasional', icon: Layers };
  }
  if (pathname === '/admin/tasks/create') {
    return { title: 'Terbitkan Task Baru', icon: Compass };
  }
  if (pathname.startsWith('/admin/tasks')) {
    return { title: 'Katalog & Pelamar Task', icon: Compass };
  }
  if (pathname.startsWith('/admin/members')) {
    return { title: 'Verifikasi Member', icon: Users };
  }
  if (pathname.startsWith('/admin/submissions')) {
    return { title: 'Review & Penilaian Submission', icon: ClipboardCheck };
  }
  if (pathname.startsWith('/admin/claims')) {
    return { title: 'Pencairan Hadiah (Disbursement)', icon: Wallet };
  }
  if (pathname.startsWith('/admin/reports')) {
    return { title: 'Laporan Sengketa & Resolusi', icon: AlertTriangle };
  }
  if (pathname.startsWith('/admin/audit')) {
    return { title: 'Audit Trail Forensik', icon: FileText };
  }
  if (pathname.startsWith('/admin/notifications')) {
    return { title: 'Pusat Notifikasi & Broadcast', icon: Bell };
  }
  if (pathname.startsWith('/admin/roles')) {
    return { title: 'Delegasi Hak Akses Role Staf', icon: Lock };
  }
  return { title: 'Admin Console', icon: Layers };
}

export function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const routeMeta = getRouteMetadata(pathname);
  const RouteIcon = routeMeta.icon;

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar Desktop & Mobile Off-Canvas Drawer */}
      <AdminSidebar
        isOpenMobile={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Konten Utama Admin Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Topbar Admin */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0B0F19]/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-colors">
          <div className="flex items-center gap-3">
            {/* Tombol Hamburger Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Buka navigasi admin"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Breadcrumb Terstruktur */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link
                href="/admin"
                className="font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5"
              >
                <span className="hidden sm:inline">Admin</span>
                <span className="sm:hidden">HQ</span>
              </Link>
              {pathname !== '/admin' && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[180px] sm:max-w-none">
                    <RouteIcon className="h-4 w-4 text-cyan-500 shrink-0 hidden sm:inline" />
                    <span>{routeMeta.title}</span>
                  </div>
                </>
              )}
            </nav>
          </div>

          {/* Quick Actions di Sisi Kanan */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Indikator Status Sistem */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sistem Operasional</span>
            </div>

            {/* Role Badge */}
            <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 border border-purple-200/60 dark:border-purple-800/60 text-[11px] font-medium text-purple-700 dark:text-purple-300">
              <ShieldCheck className="h-3 w-3" />
              <span>{user?.isSuperAdmin ? 'Super Admin' : 'Admin'}</span>
            </div>

            {/* Pemisah Vertikal */}
            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-0.5 hidden sm:block" />

            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Tombol Lihat Portal Publik */}
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Buka portal publik di tab baru"
            >
              <span>Portal Publik</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* Konten Halaman Admin */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
