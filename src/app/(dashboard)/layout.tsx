import React, { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { MobileNav } from '@/components/layout/MobileNav';
import { PushPermissionBanner } from '@/components/notification/PushPermissionBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors">
      <Suspense fallback={<div className="h-16 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19]" />}>
        <Navbar />
      </Suspense>
      <PushPermissionBanner />
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
      <Suspense fallback={null}>
        <MobileNav />
      </Suspense>
    </div>
  );
}
