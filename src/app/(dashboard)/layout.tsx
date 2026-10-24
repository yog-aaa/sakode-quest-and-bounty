import React, { Suspense } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { PushPermissionBanner } from '@/components/notification/PushPermissionBanner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-sakode-bg">
      <Suspense fallback={<div className="h-16 w-full border-b border-sakode-border bg-white" />}>
        <Navbar />
      </Suspense>
      <PushPermissionBanner />
      <div className="flex-1">{children}</div>
    </div>
  );
}
