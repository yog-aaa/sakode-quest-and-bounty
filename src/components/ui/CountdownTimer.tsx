'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { FirestoreDate } from '@/types/database';
import { Clock, AlertTriangle } from 'lucide-react';

interface CountdownTimerProps {
  deadline: FirestoreDate | null | undefined;
  className?: string;
  showIcon?: boolean;
}

function parseTargetTimestamp(d: FirestoreDate | null | undefined): number | null {
  if (!d) return null;
  if (typeof d === 'number') return d;
  if (typeof d === 'string') return new Date(d).getTime();
  if (d instanceof Date) return d.getTime();
  if (typeof d === 'object') {
    if ('toDate' in d && typeof d.toDate === 'function') {
      return d.toDate().getTime();
    }
    if ('seconds' in d && typeof d.seconds === 'number') {
      return d.seconds * 1000;
    }
  }
  return new Date(d as unknown as string).getTime();
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  deadline,
  className,
  showIcon = true,
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    totalMs: number;
    hours: number;
    minutes: number;
    seconds: number;
    isOverdue: boolean;
    isCritical: boolean; // < 24 jam
  }>({
    totalMs: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOverdue: false,
    isCritical: false,
  });

  const isMounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  useEffect(() => {
    if (!deadline) return;

    const targetDate = parseTargetTimestamp(deadline);
    if (!targetDate || isNaN(targetDate)) return;

    const calculate = () => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) {
        setTimeLeft({
          totalMs: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isOverdue: true,
          isCritical: true,
        });
        return;
      }

      const totalHours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        totalMs: diff,
        hours: totalHours,
        minutes,
        seconds,
        isOverdue: false,
        isCritical: totalHours < 24,
      });
    };

    const timer = setTimeout(calculate, 0);
    const interval = setInterval(calculate, 1000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [deadline]);

  if (!deadline) {
    return <span className="text-xs text-sakode-text-muted">Batas waktu belum aktif</span>;
  }

  if (!isMounted) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-mono font-bold', className)}>
        {showIcon && <Clock className="h-3.5 w-3.5 text-sakode-cyan" />}
        <span>--:--:--</span>
      </span>
    );
  }

  if (timeLeft.isOverdue) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200',
          className
        )}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Waktu Habis (Overdue)</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold tracking-tight transition-colors',
        timeLeft.isCritical
          ? 'bg-orange-50 text-[#b93f0b] border border-sakode-orange/50 animate-pulse'
          : 'bg-sakode-bg text-sakode-text border border-sakode-border',
        className
      )}
    >
      {showIcon && (
        <Clock
          className={cn(
            'h-3.5 w-3.5',
            timeLeft.isCritical ? 'text-sakode-orange' : 'text-sakode-cyan'
          )}
        />
      )}
      <span>
        {timeLeft.hours}j {timeLeft.minutes.toString().padStart(2, '0')}m {timeLeft.seconds.toString().padStart(2, '0')}d
      </span>
      {timeLeft.isCritical && (
        <span className="text-[10px] font-sans font-bold bg-sakode-orange text-white px-1 py-0.2 rounded ml-0.5">
          &lt;24 Jam
        </span>
      )}
    </span>
  );
};
