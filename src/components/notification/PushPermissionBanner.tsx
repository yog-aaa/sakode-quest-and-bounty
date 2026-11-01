'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { requestNotificationPermissionAndToken } from '@/lib/firebase/messaging';
import { registerFCMTokenAction } from '@/server/actions/notification.actions';
import { BellRing, X, Loader2, CheckCircle2, Sparkles } from 'lucide-react';

export function PushPermissionBanner() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (typeof window === 'undefined') return;

    // Periksa apakah browser mendukung Notifikasi
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      return;
    }

    // Hanya tampilkan jika izin masih berstatus 'default' (belum pernah ditolak/diterima)
    // dan pengguna belum pernah menolak banner lokal ini
    const isDismissed = localStorage.getItem('sakode_push_dismissed');
    if (Notification.permission === 'default' && !isDismissed) {
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleEnablePush = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const token = await requestNotificationPermissionAndToken();
      if (token) {
        await registerFCMTokenAction(user.id, token);
        setIsSuccess(true);
        setTimeout(() => {
          setIsVisible(false);
        }, 3000);
      } else {
        setIsVisible(false);
      }
    } catch (err) {
      console.warn('[PushPermissionBanner] Gagal mengaktifkan push:', err);
      setIsVisible(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sakode_push_dismissed', 'true');
    }
    setIsVisible(false);
  };

  if (!isVisible || !user) return null;

  return (
    <aside
      aria-label="Izin Notifikasi Web Push"
      className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800 shadow-xl p-4 transition-all duration-300 animate-in slide-in-from-bottom-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0 border border-sky-100 dark:border-sky-900/60">
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <BellRing className="h-4 w-4" />
          )}
        </div>

        <div className="space-y-1 flex-1 pr-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-sky-500" />
              <span>Notifikasi Real-time</span>
            </span>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 -mr-1 -mt-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {isSuccess
              ? 'Notifikasi berhasil diaktifkan! Anda akan menerima update task instan.'
              : 'Aktifkan notifikasi web push untuk info instan saat task disetujui atau reward cair.'}
          </p>

          {!isSuccess && (
            <div className="pt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={handleEnablePush}
                disabled={isLoading}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-[11px] shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>{isLoading ? 'Mengaktifkan...' : 'Aktifkan Sekarang'}</span>
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="px-2.5 py-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
              >
                Nanti
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
