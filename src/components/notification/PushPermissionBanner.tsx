'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { requestNotificationPermissionAndToken } from '@/lib/firebase/messaging';
import { registerFCMTokenAction } from '@/server/actions/notification.actions';
import { BellRing, X, Loader2, CheckCircle2 } from 'lucide-react';

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
      const timer = setTimeout(() => setIsVisible(true), 500);
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
    <aside aria-label="Izin Notifikasi Web Push" className="bg-gradient-to-r from-sky-50 via-cyan-50 to-indigo-50 border-b border-cyan-200 px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700 text-center sm:text-left">
          <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 text-cyan-800">
            {isSuccess ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <BellRing className="h-4 w-4" />
            )}
          </div>
          <div>
            {isSuccess ? (
              <span className="font-bold text-emerald-800">
                Notifikasi push browser berhasil diaktifkan! Anda akan menerima pembaruan secara instan.
              </span>
            ) : (
              <span>
                <strong className="font-bold text-sakode-text">Aktifkan Notifikasi Web Push:</strong>{' '}
                Dapatkan kabar instan saat task Anda disetujui, revisi diminta, atau honor reward siap ditransfer.
              </span>
            )}
          </div>
        </div>

        {!isSuccess && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={handleEnablePush}
              disabled={isLoading}
              className="px-3 py-1.5 rounded-lg bg-sakode-cyan text-sakode-text font-bold text-xs hover:bg-sky-300 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
              <span>{isLoading ? 'Mengaktifkan...' : 'Aktifkan Sekarang'}</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
              title="Tutup pemberitahuan"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
