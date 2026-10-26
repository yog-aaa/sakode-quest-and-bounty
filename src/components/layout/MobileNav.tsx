'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Compass, Layers, ClipboardCheck, Coins, Target, LogIn } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();
  const isLanding = pathname === '/';

  const landingItems = [
    { href: '#task-explorer', label: 'Eksplor', icon: Compass },
    { href: '#pillars', label: 'Pilar', icon: Layers },
    { href: '#workflow', label: 'Alur', icon: Target },
    {
      href: user ? (user.isAdmin || user.isSuperAdmin ? '/admin' : '/member') : '/login',
      label: user ? 'Dashboard' : 'Masuk',
      icon: LogIn,
    },
  ];

  const dashboardItems = [
    { href: '/member/tasks', label: 'Eksplor', icon: Compass },
    { href: '/member', label: 'Task Saya', icon: Layers },
    { href: '/member/rewards', label: 'Reward', icon: Coins },
    ...(user?.isAdmin
      ? [{ href: '/admin/submissions', label: 'Review', icon: ClipboardCheck }]
      : []),
  ];

  const items = isLanding ? landingItems : dashboardItems;
  const gridColsClass = items.length === 4 ? 'grid-cols-4' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-5';

  return (
    <nav
      aria-label="Navigasi Seluler"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0B0F19]/95 backdrop-blur-md pb-safe transition-colors"
    >
      <div className={cn('grid h-16 items-center px-1', gridColsClass)}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center h-full min-h-[44px] gap-1 text-[11px] font-semibold transition-colors',
                isActive
                  ? 'text-slate-900 dark:text-white font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-md transition-colors',
                  isActive
                    ? 'bg-sakode-cyan text-slate-950 shadow-xs'
                    : 'text-slate-500 dark:text-slate-400'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
