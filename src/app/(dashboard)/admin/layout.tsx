import React, { Suspense } from 'react';
import { AdminLayoutShell } from '@/components/layout/AdminLayoutShell';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex bg-slate-50 dark:bg-[#070A10]">
          <aside className="hidden lg:block w-64 h-screen border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19]" />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0F19]" />
            <main className="flex-1 p-6">{children}</main>
          </div>
        </div>
      }
    >
      <AdminLayoutShell>{children}</AdminLayoutShell>
    </Suspense>
  );
}
