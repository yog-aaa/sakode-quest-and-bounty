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
  Gift,
  CreditCard,
  Handshake,
  AlertTriangle,
  ArrowRight,
  Loader2,
  Inbox,
  Filter,
} from 'lucide-react';

export default function MemberNotificationsPage() {
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
      if (categoryFilter === 'TEAM_GROUP') {
        return n.category === 'TEAM' || n.category === 'CONSENSUS';
      }
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
          icon: <UserCheck className="h-4 w-4 text-emerald-600" />,
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Akun',
        };
      case 'APPLICATION':
        return {
          icon: <FileText className="h-4 w-4 text-sky-600" />,
          badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
          label: 'Permohonan Task',
        };
      case 'TEAM':
        return {
          icon: <Users className="h-4 w-4 text-purple-600" />,
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Tim & Undangan',
        };
      case 'SUBMISSION':
        return {
          icon: <UploadCloud className="h-4 w-4 text-blue-600" />,
          badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
          label: 'Penilaian Deliverable',
        };
      case 'REVISION':
        return {
          icon: <RotateCcw className="h-4 w-4 text-amber-600" />,
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
          label: 'Permintaan Revisi',
        };
      case 'APPEAL':
        return {
          icon: <Scale className="h-4 w-4 text-indigo-600" />,
          badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          label: 'Sanggahan Appeal',
        };
      case 'REWARD':
        return {
          icon: <Gift className="h-4 w-4 text-cyan-600" />,
          badgeClass: 'bg-cyan-50 text-cyan-700 border-cyan-200',
          label: 'Reward Tersedia',
        };
      case 'CLAIM':
        return {
          icon: <CreditCard className="h-4 w-4 text-emerald-600" />,
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          label: 'Pencairan Dana',
        };
      case 'CONSENSUS':
        return {
          icon: <Handshake className="h-4 w-4 text-purple-600" />,
          badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
          label: 'Musyawarah Tim',
        };
      case 'REPORT':
        return {
          icon: <AlertTriangle className="h-4 w-4 text-rose-600" />,
          badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
          label: 'Laporan Sengketa',
        };
      default:
        return {
          icon: <Bell className="h-4 w-4 text-slate-600" />,
          badgeClass: 'bg-slate-50 text-slate-700 border-slate-200',
          label: 'Informasi',
        };
    }
  };

  return (
    <AuthGuard requireApproved>
      <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sakode-border pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-100 text-cyan-800">
                Inbox Waktu Nyata
              </span>
              <span className="text-xs text-sakode-text-muted">SAKODE Academy</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-sakode-text tracking-tight mt-1">
              Pusat Notifikasi
            </h1>
            <p className="text-xs sm:text-sm text-sakode-text-muted mt-1">
              Pemberitahuan aktivitas task, evaluasi review, musyawarah tim, dan pencairan honor Anda.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={isPending}
                className="gap-2 text-xs font-bold border-sakode-border"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-sakode-cyan" />
                ) : (
                  <CheckCheck className="h-4 w-4 text-sakode-cyan" />
                )}
                <span>Tandai Semua Dibaca ({unreadCount})</span>
              </Button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Read / Unread Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterRead('ALL')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                filterRead === 'ALL'
                  ? 'bg-white text-sakode-text shadow-sm'
                  : 'text-sakode-text-muted hover:text-sakode-text'
              }`}
            >
              Semua ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterRead('UNREAD')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                filterRead === 'UNREAD'
                  ? 'bg-white text-sakode-text shadow-sm'
                  : 'text-sakode-text-muted hover:text-sakode-text'
              }`}
            >
              <span>Belum Dibaca</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-sakode-orange text-white font-extrabold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <span className="text-slate-400 flex items-center gap-1 font-semibold pl-1 pr-2">
              <Filter className="h-3 w-3" />
              <span>Kategori:</span>
            </span>
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'APPLICATION', label: 'Task' },
              { id: 'TEAM_GROUP', label: 'Tim' },
              { id: 'REVIEW_GROUP', label: 'Review' },
              { id: 'FINANCE_GROUP', label: 'Keuangan' },
              { id: 'REPORT', label: 'Laporan' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors whitespace-nowrap ${
                  categoryFilter === cat.id
                    ? 'bg-sakode-text text-white'
                    : 'bg-white border border-sakode-border text-sakode-text-muted hover:text-sakode-text hover:bg-slate-50'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        {loading ? (
          <div className="py-20 text-center bg-white rounded-xl border border-sakode-border">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-sakode-cyan" />
            <p className="text-xs text-sakode-text-muted mt-3">Memuat notifikasi Anda...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-xl border border-sakode-border px-4">
            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <Inbox className="h-7 w-7" />
            </div>
            <h3 className="font-bold text-base text-sakode-text">Kotak Masuk Kosong</h3>
            <p className="text-xs text-sakode-text-muted max-w-sm mx-auto mt-1">
              {filterRead === 'UNREAD'
                ? 'Semua notifikasi telah dibaca. Tidak ada pemberitahuan baru yang tertunda.'
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
                  className={`p-4 sm:p-5 transition-all cursor-pointer hover:shadow-md relative border ${
                    !notif.isRead
                      ? 'border-sakode-cyan/50 bg-gradient-to-r from-cyan-50/25 via-white to-white'
                      : 'border-sakode-border bg-white hover:border-slate-300'
                  }`}
                >
                  {/* Indicator Dot for Unread */}
                  {!notif.isRead && (
                    <span className="absolute top-5 left-2 h-2 w-2 rounded-full bg-sakode-cyan" />
                  )}

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pl-2 sm:pl-3">
                    <div className="flex gap-3">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-200">
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
                          <span className="text-xs text-slate-400 font-medium">
                            {formatRelativeTime(notif.createdAt)} • {formatDateWIB(notif.createdAt)}
                          </span>
                        </div>

                        <h3 className="text-sm sm:text-base font-bold text-sakode-text">
                          {notif.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
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
                          className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-sakode-text hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1"
                          title="Tandai telah dibaca"
                        >
                          <Check className="h-3.5 w-3.5 text-slate-500" />
                          <span className="hidden sm:inline">Tandai Dibaca</span>
                        </button>
                      )}

                      {notif.link && (
                        <span className="text-xs font-bold text-sakode-cyan hover:underline flex items-center gap-1">
                          <span>Buka</span>
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
    </AuthGuard>
  );
}
