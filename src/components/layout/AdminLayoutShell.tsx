'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { AdminProfileDropdown } from '@/components/layout/AdminProfileDropdown';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { NotificationBell } from '@/components/notification/NotificationBell';
import {
  Menu,
  ChevronRight,
  Layers,
  Compass,
  ClipboardCheck,
  Wallet,
  AlertTriangle,
  FileText,
  Users,
  Bell,
  Lock,
  User,
  PanelLeftOpen,
} from 'lucide-react';

function getRouteMetadata(pathname: string): { title: string; icon: React.ElementType } {
  if (pathname === '/admin') {
    return { title: 'Ringkasan Operasional', icon: Layers };
  }
  if (pathname === '/admin/profile') {
    return { title: 'Profil Administrator', icon: User };
  }
  if (pathname === '/admin/tasks/create') {
    return { title: 'Terbitkan Task Baru', icon: Compass };
  }
  if (pathname.startsWith('/admin/tasks')) {
    return { title: 'Katalog & Pelamar Task', icon: Compass };
  }
  if (pathname.startsWith('/admin/members')) {
    return { title: 'Manajemen User', icon: Users };
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

// Helpers untuk useSyncExternalStore membaca state collapse
const subscribeToCollapse = (callback: () => void) => {
  window.addEventListener('sakode-sidebar-toggle', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('sakode-sidebar-toggle', callback);
    window.removeEventListener('storage', callback);
  };
};

const getCollapseSnapshot = (): boolean => {
  try {
    return localStorage.getItem('sakode_admin_sidebar_collapsed') === 'true';
  } catch {
    return false;
  }
};

const getCollapseServerSnapshot = (): boolean => false;

export function AdminLayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const routeMeta = getRouteMetadata(pathname);
  const RouteIcon = routeMeta.icon;

  // State sinkron tanpa cascading render via useSyncExternalStore
  const isCollapsed = useSyncExternalStore(
    subscribeToCollapse,
    getCollapseSnapshot,
    getCollapseServerSnapshot
  );

  const handleToggleCollapse = () => {
    const next = !isCollapsed;
    try {
      localStorage.setItem('sakode_admin_sidebar_collapsed', String(next));
      window.dispatchEvent(new Event('sakode-sidebar-toggle'));
    } catch {
      // Abaikan
    }
  };

  // Reset drawer mobile saat pathname berubah (pola React 'Adjusting state during render')
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setIsMobileOpen(false);
  }

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#070A10] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Sidebar Desktop Collapsible & Mobile Off-Canvas Drawer */}
      <AdminSidebar
        isOpenMobile={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Konten Utama Admin Panel */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Sticky Topbar Admin */}
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-[#0A0E17]/80 px-4 sm:px-6 lg:px-8 backdrop-blur-md transition-colors">
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Tombol Hamburger Mobile */}
            <button
              type="button"
              onClick={() => setIsMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Buka navigasi admin"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Tombol Expand Sidebar Desktop di Topbar (Hanya muncul saat Sidebar Collapsed) */}
            {isCollapsed && (
              <button
                type="button"
                onClick={handleToggleCollapse}
                className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors cursor-pointer"
                title="Perluas Sidebar"
                aria-label="Perluas Sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            )}

            {/* Breadcrumb Navigasi Terstruktur & Bersih */}
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <Link
                href="/admin"
                className="font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors flex items-center gap-1.5"
              >
                <span>Dashboard</span>
              </Link>
              {pathname !== '/admin' && (
                <>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600 shrink-0" />
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white truncate max-w-[180px] sm:max-w-none">
                    <RouteIcon className="h-4 w-4 text-cyan-500 shrink-0 hidden sm:inline" />
                    <span>{routeMeta.title}</span>
                  </div>
                </>
              )}
            </nav>
          </div>

          {/* Quick Actions di Sisi Kanan: Lonceng Notifikasi, Theme Toggle, & Profil Dropdown */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Notification Bell */}
            <NotificationBell />

            {/* Theme Toggle (Dark / Light) */}
            <ThemeToggle />

            {/* Pemisah Vertikal Halus */}
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1" />

            {/* Profile Dropdown Mandiri di Ujung Kanan */}
            <AdminProfileDropdown />
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
