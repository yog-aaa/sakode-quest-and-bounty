'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  ChevronDown,
  LogOut,
  ExternalLink,
  Compass,
  ShieldCheck,
  User,
} from 'lucide-react';

export const AdminProfileDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      setIsOpen(false);
      await logout();
      router.push('/login');
    } catch (err) {
      console.error('Gagal keluar:', err);
    }
  };

  const initial = (user?.displayName || user?.email || 'A')[0].toUpperCase();
  const roleName = user?.isSuperAdmin ? 'Super Admin' : 'Admin';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Menu Profil Admin"
      >
        <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-sky-400 via-cyan-500 to-purple-500 text-white flex items-center justify-center text-xs font-black shadow-xs ring-2 ring-white dark:ring-slate-900 shrink-0">
          {initial}
        </div>
        <div className="hidden sm:flex flex-col text-left">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 max-w-[110px] truncate leading-tight">
            {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
          </span>
          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 leading-tight">
            {roleName}
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white dark:bg-[#0D121F] border border-slate-200/90 dark:border-slate-800 shadow-xl shadow-slate-900/10 dark:shadow-black/40 py-2 z-50 animate-in fade-in zoom-in-95 duration-150 focus:outline-none"
        >
          {/* Header Profil */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-sky-400 via-cyan-500 to-purple-500 text-white flex items-center justify-center text-sm font-black shadow-sm shrink-0">
                {initial}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user?.displayName || 'Administrator'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {user?.email}
                </p>
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200/60 dark:border-purple-800/60 text-[10px] font-bold text-purple-700 dark:text-purple-300">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{roleName}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigasi Tautan */}
          <div className="py-1 px-1.5 space-y-0.5">
            {/* Menu Lihat & Edit Profil Admin */}
            <Link
              href="/admin/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
            >
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-cyan-500 group-hover:scale-110 transition-transform" />
                <span>Lihat & Edit Profil Saya</span>
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200/60 dark:border-cyan-800/60">
                Kelola
              </span>
            </Link>

            <Link
              href="/member/tasks"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
            >
              <span className="flex items-center gap-2">
                <Compass className="h-4 w-4 text-purple-500 group-hover:scale-110 transition-transform" />
                <span>Eksplor Task Kontributor</span>
              </span>
            </Link>

            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4 text-emerald-500 group-hover:scale-110 transition-transform" />
                <span>Lihat Portal Publik</span>
              </span>
              <span className="text-[10px] text-slate-400">Tab Baru ↗</span>
            </Link>
          </div>

          {/* Pemisah */}
          <div className="my-1 border-t border-slate-100 dark:border-slate-800/80" />

          {/* Logout Action */}
          <div className="px-1.5 pt-0.5 pb-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer text-left"
            >
              <LogOut className="h-4 w-4" />
              <span>Keluar dari Akun Admin</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
