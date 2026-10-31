'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatusPill } from '@/components/ui/StatusPill';
import { CountdownTimer } from '@/components/ui/CountdownTimer';
import { formatCurrencyIDR, formatDateWIB } from '@/lib/utils';
import type { TaskDocument } from '@/types/database';
import { TASK_MODES, TASK_ASSIGNMENT_TYPES, TASK_STATUS } from '@/lib/constants';
import {
  Users,
  User,
  Zap,
  Send,
  ArrowRight,
  ShieldAlert,
  Clock,
} from 'lucide-react';

interface BountyCardProps {
  task: TaskDocument;
  userActiveTaskId?: string | null;
  userPendingAppCount?: number;
  userIsApproved?: boolean;
  onInstantTake?: (task: TaskDocument) => void;
  onApply?: (task: TaskDocument) => void;
}

export const BountyCard: React.FC<BountyCardProps> = ({
  task,
  userActiveTaskId,
  userPendingAppCount = 0,
  userIsApproved = false,
  onInstantTake,
  onApply,
}) => {
  const isSolo = task.mode === TASK_MODES.SOLO;
  const isInstantTake = task.assignmentType === TASK_ASSIGNMENT_TYPES.INSTANT_TAKE;
  const isHasActiveTask = !!userActiveTaskId;
  const isMaxApplications = userPendingAppCount >= 3;

  // Cek apakah tombol aksi disabled
  let disabledReason = '';
  if (!userIsApproved) {
    disabledReason = 'Akun belum disetujui (APPROVED)';
  } else if (isHasActiveTask) {
    disabledReason = 'Anda sedang memiliki 1 Active Task';
  } else if (!isInstantTake && isMaxApplications) {
    disabledReason = 'Batas kuota 3 aplikasi pending tercapai';
  }

  const isActionDisabled = !userIsApproved || isHasActiveTask || (!isInstantTake && isMaxApplications);

  return (
    <Card hoverable className="flex flex-col justify-between shadow-2xs border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900/80 transition-all hover:border-slate-300 dark:hover:border-slate-700">
      <div>
        <CardHeader className="space-y-3 pb-3">
          {/* Top Badges & Status */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge
                variant={isSolo ? 'cyan' : 'purple'}
                leftIcon={isSolo ? <User className="h-3 w-3" /> : <Users className="h-3 w-3" />}
              >
                {isSolo ? 'Solo Task' : 'Team Task'}
              </Badge>

              <Badge
                variant="outline"
                leftIcon={isInstantTake ? <Zap className="h-3 w-3 text-amber-500" /> : <Send className="h-3 w-3 text-sky-500" />}
              >
                {isInstantTake ? 'Instant Take' : 'Application'}
              </Badge>
            </div>

            <StatusPill status={task.status} size="sm" />
          </div>

          {/* Bounty Reward Big Display */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 flex items-baseline justify-between transition-colors">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Bounty Reward:
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
              {formatCurrencyIDR(task.totalReward)}
            </div>
          </div>

          {/* Title & Description */}
          <Link href={`/member/tasks/${task.id}`} className="group">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors line-clamp-2 leading-snug">
              {task.title}
            </CardTitle>
          </Link>

          <CardDescription className="line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
            {task.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Skill Tags */}
          <div className="flex flex-wrap gap-1.5">
            {task.requiredSkills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/60"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Deadline or Duration Hint */}
          <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800/80 text-xs flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Batas Waktu:</span>
            {task.deadlineAt ? (
              <CountdownTimer deadline={task.deadlineAt} />
            ) : task.durationMinutes ? (
              <span className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1 text-xs">
                <Clock className="h-3.5 w-3.5 text-cyan-500" />
                <span>{Math.round(task.durationMinutes / 60)} Jam ({task.durationMinutes} Menit)</span>
              </span>
            ) : task.fixedDeadlineAt ? (
              <span className="font-semibold text-slate-900 dark:text-slate-200 text-xs">
                {formatDateWIB(task.fixedDeadlineAt)}
              </span>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-xs">Fleksibel</span>
            )}
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2">
        {/* Disabled Warning Tooltip */}
        {isActionDisabled && task.status === TASK_STATUS.OPEN && (
          <div className="w-full text-center py-1.5 px-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-[11px] font-semibold text-amber-800 dark:text-amber-300 flex items-center justify-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{disabledReason}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 w-full">
          <Link href={`/member/tasks/${task.id}`} className="w-1/2">
            <Button variant="outline" size="sm" className="w-full text-xs font-semibold">
              Detail Task
            </Button>
          </Link>

          {isInstantTake ? (
            <Button
              variant="primary"
              size="sm"
              disabled={isActionDisabled || task.status !== TASK_STATUS.OPEN}
              onClick={() => onInstantTake && onInstantTake(task)}
              className="w-1/2 text-xs font-bold gap-1 cursor-pointer"
            >
              <span>Ambil Task</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <Button
              variant="team"
              size="sm"
              disabled={isActionDisabled || task.status !== TASK_STATUS.OPEN}
              onClick={() => onApply && onApply(task)}
              className="w-1/2 text-xs font-bold gap-1 cursor-pointer"
            >
              <span>Ajukan Aplikasi</span>
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
