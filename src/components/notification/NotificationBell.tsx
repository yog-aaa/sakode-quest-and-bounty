'use client';

import React, { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getClientFirestore } from '@/lib/firebase/client';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import {
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/server/actions/notification.actions';
import { formatRelativeTime } from '@/lib/utils';
import type { NotificationDocument, NotificationCategory } from '@/types/database';
import {
  Bell,
  CheckCheck,
  UserCheck,
  FileText,
  Users,
  UploadCloud,
  RotateCcw,
  Scale,
  Gift,
  CreditCard,
  Handshake,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Inbox,
} from 'lucide-react';

export function NotificationBell() {
  const { user, isMockSession } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPending, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const userId = user?.id;
  const isAdmin = user?.isAdmin || user?.isSuperAdmin;
  const allNotificationsUrl = isAdmin
    ? '/admin/notifications'
    : '/member/notifications';

  // 1. Realtime Firestore Listener untuk Notifikasi Pengguna
  useEffect(() => {
    // Lewati realtime listener jika user belum login atau sedang dalam sesi mock QA
    if (!userId || isMockSession) {
      return;
    }

    try {
      const db = getClientFirestore();
      const notifsRef = collection(db, 'notifications');
      const q = query(
        notifsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const docs = snapshot.docs.map((docSnap) => ({
            ...(docSnap.data() as NotificationDocument),
            id: docSnap.id,
          }));
          setNotifications(docs);
          const unread = docs.filter((n) => !n.isRead).length;
          setUnreadCount(unread);
        },
        (error) => {
          // Tangani permission-denied secara graceful tanpa mengganggu log browser
          if (error.code !== 'permission-denied') {
            console.warn('[NotificationBell] onSnapshot listener error:', error);
          }
        }
      );

      return () => unsubscribe();
    } catch (err) {
      console.warn('[NotificationBell] Setup listener error:', err);
    }
  }, [userId, isMockSession]);

  // 2. Click Outside & Escape Handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
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

  // 3. Mark Single as Read
  const handleItemClick = (notif: NotificationDocument) => {
    if (!userId) return;

    if (!notif.isRead) {
      startTransition(async () => {
        await markNotificationReadAction(userId, notif.id);
      });
    }

    setIsOpen(false);

    if (notif.link) {
      router.push(notif.link);
    }
  };

  // 4. Mark All as Read
  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId || unreadCount === 0) return;

    startTransition(async () => {
      await markAllNotificationsReadAction(userId);
    });
  };

  // 5. Helper Icon & Color berdasarkan Kategori SAKODE
  const getCategoryMeta = (cat: NotificationCategory | string) => {
    switch (cat) {
      case 'ACCOUNT':
        return {
          icon: <UserCheck className="h-4 w-4 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Akun',
        };
      case 'APPLICATION':
        return {
          icon: <FileText className="h-4 w-4 text-sky-600" />,
          bg: 'bg-sky-50 text-sky-700 border-sky-200',
          label: 'Task',
        };
      case 'TEAM':
        return {
          icon: <Users className="h-4 w-4 text-purple-600" />,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Tim',
        };
      case 'SUBMISSION':
        return {
          icon: <UploadCloud className="h-4 w-4 text-blue-600" />,
          bg: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Review',
        };
      case 'REVISION':
        return {
          icon: <RotateCcw className="h-4 w-4 text-amber-600" />,
          bg: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Revisi',
        };
      case 'APPEAL':
        return {
          icon: <Scale className="h-4 w-4 text-indigo-600" />,
          bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          label: 'Banding',
        };
      case 'REWARD':
        return {
          icon: <Gift className="h-4 w-4 text-cyan-600" />,
          bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          label: 'Reward',
        };
      case 'CLAIM':
        return {
          icon: <CreditCard className="h-4 w-4 text-emerald-600" />,
          bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Pencairan',
        };
      case 'CONSENSUS':
        return {
          icon: <Handshake className="h-4 w-4 text-purple-600" />,
          bg: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Musyawarah',
        };
      case 'REPORT':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
          bg: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Laporan',
        };
      default:
        return {
          icon: <Bell className="h-4 w-4 text-slate-600" />,
          bg: 'bg-slate-50 text-slate-700 border-slate-200',
          label: 'Info',
        };
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Tombol Lonceng Navigasi */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Pusat Notifikasi"
        aria-expanded={isOpen}
        className="relative p-2 rounded-lg text-slate-600 hover:text-sakode-text hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-sakode-cyan"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-sakode-orange px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Notifikasi */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white shadow-xl border border-sakode-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Bar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sakode-border bg-slate-50/80">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-sakode-text">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[11px] font-bold rounded-full bg-cyan-100 text-cyan-800">
                  {unreadCount} baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="flex items-center gap-1 text-xs text-sakode-text-muted hover:text-sakode-text font-semibold transition-colors disabled:opacity-50"
                title="Tandai semua notifikasi telah dibaca"
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5 text-sakode-cyan" />
                )}
                <span>Tandai Semua</span>
              </button>
            )}
          </div>

          {/* List Notifikasi */}
          <div className="max-h-80 overflow-y-auto divide-y divide-sakode-border/50">
            {notifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2 text-slate-400">
                  <Inbox className="h-5 w-5" />
                </div>
                <p className="text-xs text-sakode-text-muted">Belum ada notifikasi saat ini.</p>
              </div>
            ) : (
              notifications.map((notif) => {
                const meta = getCategoryMeta(notif.category);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleItemClick(notif)}
                    className={`px-4 py-3 hover:bg-slate-50/80 transition-colors cursor-pointer flex gap-3 relative ${
                      !notif.isRead ? 'bg-cyan-50/30' : ''
                    }`}
                  >
                    {/* Unread Dot */}
                    {!notif.isRead && (
                      <span className="absolute top-4 left-1.5 h-1.5 w-1.5 rounded-full bg-sakode-cyan" />
                    )}

                    {/* Category Icon */}
                    <div className="flex-shrink-0 mt-0.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200">
                        {meta.icon}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.2 rounded border ${meta.bg}`}
                        >
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-sakode-text-muted whitespace-nowrap">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-sakode-text truncate">
                        {notif.title}
                      </h4>
                      <p className="text-xs text-sakode-text-muted line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Bar */}
          <div className="p-2 border-t border-sakode-border bg-slate-50 text-center">
            <Link
              href={allNotificationsUrl}
              onClick={() => setIsOpen(false)}
              className="inline-flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-bold text-sakode-text hover:text-sky-600 transition-colors rounded-lg hover:bg-white"
            >
              <span>Lihat Semua Notifikasi</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
