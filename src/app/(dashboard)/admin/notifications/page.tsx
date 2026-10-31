'use client';

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  getUserNotificationsAction,
  markNotificationReadAction,
  markAllNotificationsReadAction,
} from '@/server/actions/notification.actions';
import { formatDateWIB, formatRelativeTime } from '@/lib/utils';
import type { NotificationDocument, NotificationCategory } from '@/types/database';
import {
  Bell,
  CheckCheck,
  Check,
  UserCheck,
  FileText,
  Users,
  UploadCloud,
  RotateCcw,
  Scale,
  CreditCard,
  Handshake,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Inbox,
  Filter,
} from 'lucide-react';

export default function AdminNotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const userId = user?.id;

  const [notifications, setNotifications] = useState<NotificationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRead, setFilterRead] = useState<'ALL' | 'UNREAD'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isPending, startTransition] = useTransition();

  const fetchNotifications = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const res = await getUserNotificationsAction(userId, 50);
      if (res.success && res.notifications) {
        setNotifications(res.notifications);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchNotifications();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchNotifications]);

  const handleMarkAsRead = (notifId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!userId) return;

    startTransition(async () => {
      await markNotificationReadAction(userId, notifId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    });
  };

  const handleMarkAllAsRead = () => {
    if (!userId || unreadCount === 0) return;

    startTransition(async () => {
      await markAllNotificationsReadAction(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    });
  };

  const handleOpenLink = (notif: NotificationDocument) => {
    if (!notif.isRead) {
      handleMarkAsRead(notif.id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Filtered Notifications
  const filteredNotifications = notifications.filter((n) => {
    if (filterRead === 'UNREAD' && n.isRead) return false;
    if (categoryFilter !== 'ALL') {
      if (categoryFilter === 'REVIEW_GROUP') {
        return (
          n.category === 'SUBMISSION' ||
          n.category === 'REVISION' ||
          n.category === 'APPEAL'
        );
      }
      if (categoryFilter === 'FINANCE_GROUP') {
        return n.category === 'REWARD' || n.category === 'CLAIM';
      }
      return n.category === categoryFilter;
    }
    return true;
  });

  const getCategoryMeta = (cat: NotificationCategory | string) => {
    switch (cat) {
      case 'ACCOUNT':
        return {
          icon: <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          label: 'Pendaftaran Member',
        };
      case 'APPLICATION':
        return {
          icon: <FileText className="h-4 w-4 text-sky-600 dark:text-sky-400" />,
          badgeClass: 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
          label: 'Aplikasi Task',
        };
      case 'TEAM':
        return {
          icon: <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
          badgeClass: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          label: 'Tim & Roster',
        };
      case 'SUBMISSION':
        return {
          icon: <UploadCloud className="h-4 w-4 text-blue-600 dark:text-blue-400" />,
          badgeClass: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          label: 'Submission Masuk',
        };
      case 'REVISION':
        return {
          icon: <RotateCcw className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
          badgeClass: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          label: 'Revisi Terkirim',
        };
      case 'APPEAL':
        return {
          icon: <Scale className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />,
          badgeClass: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          label: 'Sanggahan Appeal',
        };
      case 'REWARD':
      case 'CLAIM':
        return {
          icon: <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
          badgeClass: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          label: 'Permintaan Klaim Dana',
        };
      case 'CONSENSUS':
        return {
          icon: <Handshake className="h-4 w-4 text-purple-600 dark:text-purple-400" />,
          badgeClass: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          label: 'Konsensus Tim',
        };
      case 'REPORT':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400" />,
          badgeClass: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          label: 'Laporan Sengketa',
        };
      default:
        return {
          icon: <Bell className="h-4 w-4 text-slate-600 dark:text-slate-400" />,
          badgeClass: 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          label: 'Sistem Admin',
        };
    }
  };

  return (
    <AuthGuard requireAdmin>
      <div className="min-h-screen bg-slate-50 dark:bg-[#070C14] text-slate-900 dark:text-slate-100 py-8 px-4 sm:px-6 lg:px-8 transition-colors">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                  <Bell className="h-3 w-3" />
                  <span>Pusat Notifikasi Administrator</span>
                </span>
                <span className="text-slate-400 dark:text-slate-600">•</span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Real-Time Staff Inbound
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                Notifikasi Staf Admin
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                Pemberitahuan masuk: submission deliverable baru, sanggahan appeal, antrean klaim honor, dan laporan sengketa.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  disabled={isPending}
                  className="gap-2 text-xs font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />
                  ) : (
                    <CheckCheck className="h-4 w-4 text-cyan-500" />
                  )}
                  <span>Tandai Semua Dibaca ({unreadCount})</span>
                </Button>
              )}
            </div>
          </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Read / Unread Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setFilterRead('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterRead === 'ALL'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRead('UNREAD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterRead === 'UNREAD'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Belum Dibaca</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-extrabold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1 font-semibold pl-1 pr-2">
              <Filter className="h-3 w-3" />
              <span>Filter:</span>
            </span>
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'SUBMISSION', label: 'Submission' },
              { id: 'APPEAL', label: 'Appeal' },
              { id: 'CLAIM', label: 'Klaim Honor' },
              { id: 'REPORT', label: 'Laporan' },
              { id: 'ACCOUNT', label: 'Pendaftaran' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer text-xs ${
                  categoryFilter === cat.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 shadow-2xs'
                    : 'bg-white dark:bg-slate-900/80 border border-slate-200/90 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/90 dark:border-slate-800">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">Memuat notifikasi admin...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center bg-white dark:bg-slate-900/80 rounded-2xl border border-slate-200/90 dark:border-slate-800 px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400 dark:text-slate-500">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Tidak Ada Notifikasi Tertunda</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
              {filterRead === 'UNREAD'
                ? 'Semua notifikasi staf telah ditinjau.'
                : 'Belum ada notifikasi pada kategori yang Anda pilih.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notif) => {
              const meta = getCategoryMeta(notif.category);
              return (
                <Card
                  key={notif.id}
                  onClick={() => handleOpenLink(notif)}
                  className={`p-4 sm:p-5 transition-all cursor-pointer hover:shadow-md relative rounded-2xl border ${
                    !notif.isRead
                      ? 'border-sky-400 dark:border-sky-500/50 bg-gradient-to-r from-sky-50/50 via-white to-white dark:from-sky-950/20 dark:via-slate-900 dark:to-slate-900'
                      : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {/* Indicator Dot for Unread */}
                  {!notif.isRead && (
                    <span className="absolute top-5 left-3 h-2 w-2 rounded-full bg-amber-500" />
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pl-3 sm:pl-4">
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                          {meta.icon}
                        </div>
                      </div>

                      {/* Text Details */}
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            {formatRelativeTime(notif.createdAt)} • {formatDateWIB(notif.createdAt)}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                          {notif.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                          {notif.message}
                        </p>
                      </div>
                    </div>

                    {/* Actions on Card */}
                    <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0 pt-2 sm:pt-0">
                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(notif.id, e)}
                          disabled={isPending}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Tandai telah dibaca"
                        >
                          <Check className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                          <span className="hidden sm:inline">Tandai Dibaca</span>
                        </button>
                      )}

                      {notif.link && (
                        <span className="text-xs font-bold text-sky-600 dark:text-cyan-400 hover:underline flex items-center gap-1">
                          <span>Buka Antrean</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </AuthGuard>
  );
}
