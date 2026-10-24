'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Compass, Layers, ShieldAlert, ClipboardCheck, Coins } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/member/tasks', label: 'Eksplor', icon: Compass },
    { href: '/member', label: 'Task Saya', icon: Layers },
    { href: '/member/rewards', label: 'Reward', icon: Coins },
    { href: '/admin/submissions', label: 'Review', icon: ClipboardCheck },
    { href: '/admin/tasks', label: 'Admin', icon: ShieldAlert },
  ];

  return (
    <nav
      aria-label="Navigasi Seluler"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-sakode-border bg-sakode-card/95 backdrop-blur-md pb-safe"
    >
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center h-full min-h-[44px] gap-1 text-[11px] font-semibold transition-colors',
                isActive
                  ? 'text-sakode-text font-bold'
                  : 'text-sakode-text-muted hover:text-sakode-text'
              )}
            >
              <div
                className={cn(
                  'p-1 rounded-md transition-colors',
                  isActive
                    ? 'bg-sakode-cyan text-sakode-text shadow-sm'
                    : 'text-sakode-text-muted'
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
