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
    <Card hoverable className="flex flex-col justify-between shadow-xs border-sakode-border">
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
          <div className="p-3 rounded-lg bg-sakode-bg border border-sakode-border flex items-baseline justify-between">
            <span className="text-[11px] font-bold text-sakode-text-muted uppercase tracking-wider">
              Bounty Reward:
            </span>
            <div className="text-xl sm:text-2xl font-black text-sakode-text tracking-tight">
              {formatCurrencyIDR(task.totalReward)}
            </div>
          </div>

          {/* Title & Description */}
          <Link href={`/member/tasks/${task.id}`} className="group">
            <CardTitle className="text-lg group-hover:text-sakode-cyan transition-colors line-clamp-2">
              {task.title}
            </CardTitle>
          </Link>

          <CardDescription className="line-clamp-2 text-xs">
            {task.description}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          {/* Skill Tags */}
          <div className="flex flex-wrap gap-1">
            {task.requiredSkills.map((skill) => (
              <span
                key={skill}
                className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Deadline or Duration Hint */}
          <div className="pt-2 border-t border-sakode-border/50 text-xs flex items-center justify-between">
            <span className="text-sakode-text-muted text-[11px]">Batas Waktu:</span>
            {task.deadlineAt ? (
              <CountdownTimer deadline={task.deadlineAt} />
            ) : task.durationMinutes ? (
              <span className="font-semibold text-sakode-text flex items-center gap-1 text-xs">
                <Clock className="h-3.5 w-3.5 text-sakode-cyan" />
                <span>{Math.round(task.durationMinutes / 60)} Jam ({task.durationMinutes} Menit)</span>
              </span>
            ) : task.fixedDeadlineAt ? (
              <span className="font-semibold text-sakode-text text-xs">
                {formatDateWIB(task.fixedDeadlineAt)}
              </span>
            ) : (
              <span className="text-sakode-text-muted text-xs">Fleksibel</span>
            )}
          </div>
        </CardContent>
      </div>

      <CardFooter className="pt-3 border-t border-sakode-border/50 flex flex-col gap-2">
        {/* Disabled Warning Tooltip */}
        {isActionDisabled && task.status === TASK_STATUS.OPEN && (
          <div className="w-full text-center py-1 px-2 rounded bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800 flex items-center justify-center gap-1">
            <ShieldAlert className="h-3 w-3 text-amber-600 shrink-0" />
            <span>{disabledReason}</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 w-full">
          <Link href={`/member/tasks/${task.id}`} className="w-1/2">
            <Button variant="outline" size="sm" className="w-full text-xs">
              Detail Task
            </Button>
          </Link>

          {isInstantTake ? (
            <Button
              variant="primary"
              size="sm"
              disabled={isActionDisabled || task.status !== TASK_STATUS.OPEN}
              onClick={() => onInstantTake && onInstantTake(task)}
              className="w-1/2 text-xs font-bold gap-1"
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
              className="w-1/2 text-xs font-bold gap-1"
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
