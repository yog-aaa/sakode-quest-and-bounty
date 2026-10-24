import React from 'react';
import { cn } from '@/lib/utils';
import type { TaskStatus, ClaimStatus, UserApprovalStatus, TeamStatus } from '@/lib/constants';
import {
  FileEdit,
  Compass,
  Users,
  UserCheck,
  PlayCircle,
  Send,
  Search,
  AlertCircle,
  Scale,
  CheckCircle2,
  PieChart,
  XCircle,
  Lock,
  Clock,
  RefreshCw,
  CreditCard,
  CheckCheck,
  UserX,
  type LucideIcon,
} from 'lucide-react';

export type StatusPillStatus =
  | TaskStatus
  | ClaimStatus
  | UserApprovalStatus
  | TeamStatus;

export type StatusPillSize = 'sm' | 'default' | 'lg';

interface StatusConfig {
  label: string;
  icon: LucideIcon;
  pillClasses: string;
  iconClasses: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  // --- Task Statuses (Tabel DESIGN.md) ---
  DRAFT: {
    label: 'Draf Penyusunan',
    icon: FileEdit,
    pillClasses: 'bg-slate-100 text-slate-700 border-slate-300',
    iconClasses: 'text-slate-500',
  },
  OPEN: {
    label: 'Terbuka untuk Diambil',
    icon: Compass,
    pillClasses: 'bg-sky-50 text-[#09668d] border-sakode-cyan/60 font-semibold',
    iconClasses: 'text-sky-600',
  },
  RECRUITING: {
    label: 'Perekrutan Tim',
    icon: Users,
    pillClasses: 'bg-purple-50 text-[#6921b0] border-sakode-purple/50 font-semibold',
    iconClasses: 'text-sakode-purple',
  },
  READY: {
    label: 'Tim Siap Dimulai',
    icon: UserCheck,
    pillClasses: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    iconClasses: 'text-indigo-600',
  },
  ACTIVE: {
    label: 'Sedang Dikerjakan',
    icon: PlayCircle,
    pillClasses: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
    iconClasses: 'text-emerald-600',
  },
  SUBMITTED: {
    label: 'Menunggu Antrean Review',
    icon: Send,
    pillClasses: 'bg-sky-50 text-sky-800 border-sky-300',
    iconClasses: 'text-sky-600',
  },
  IN_REVIEW: {
    label: 'Sedang Ditinjau Admin',
    icon: Search,
    pillClasses: 'bg-cyan-50 text-cyan-900 border-cyan-300 font-semibold',
    iconClasses: 'text-cyan-700',
  },
  REVISION: {
    label: 'Perlu Perbaikan Hasil',
    icon: AlertCircle,
    pillClasses: 'bg-orange-50 text-[#b93f0b] border-sakode-orange/60 font-semibold',
    iconClasses: 'text-sakode-orange',
  },
  APPEALED: {
    label: 'Dalam Proses Sanggahan',
    icon: Scale,
    pillClasses: 'bg-violet-50 text-violet-800 border-violet-300 font-semibold',
    iconClasses: 'text-violet-600',
  },
  APPROVED: {
    label: 'Diterima (Reward Siap)',
    icon: CheckCircle2,
    pillClasses: 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold',
    iconClasses: 'text-emerald-600',
  },
  PARTIAL: {
    label: 'Selesai Sebagian',
    icon: PieChart,
    pillClasses: 'bg-blue-50 text-blue-800 border-blue-300 font-semibold',
    iconClasses: 'text-blue-600',
  },
  FAILED: {
    label: 'Ditolak / Melewati Waktu',
    icon: XCircle,
    pillClasses: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
    iconClasses: 'text-rose-600',
  },
  CLOSED: {
    label: 'Arsip Ditutup Selesai',
    icon: Lock,
    pillClasses: 'bg-slate-100 text-slate-700 border-slate-300',
    iconClasses: 'text-slate-600',
  },

  // --- Claim Statuses ---
  CLAIMED: {
    label: 'Menunggu Transfer',
    icon: Clock,
    pillClasses: 'bg-amber-50 text-amber-800 border-amber-300',
    iconClasses: 'text-amber-600',
  },
  PROCESSING: {
    label: 'Sedang Diproses',
    icon: RefreshCw,
    pillClasses: 'bg-sky-50 text-sky-800 border-sky-300',
    iconClasses: 'text-sky-600',
  },
  PAID: {
    label: 'Telah Ditransfer',
    icon: CreditCard,
    pillClasses: 'bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold',
    iconClasses: 'text-indigo-600',
  },
  CONFIRMED: {
    label: 'Dikonfirmasi Diterima',
    icon: CheckCheck,
    pillClasses: 'bg-emerald-50 text-emerald-900 border-emerald-400 font-bold',
    iconClasses: 'text-emerald-600',
  },

  // --- User Approval Statuses ---
  PENDING: {
    label: 'Menunggu Verifikasi',
    icon: Clock,
    pillClasses: 'bg-amber-50 text-amber-800 border-amber-300',
    iconClasses: 'text-amber-600',
  },
  REJECTED: {
    label: 'Pendaftaran Ditolak',
    icon: UserX,
    pillClasses: 'bg-rose-50 text-rose-800 border-rose-300',
    iconClasses: 'text-rose-600',
  },
};

export interface StatusPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: StatusPillStatus | string;
  customLabel?: string;
  size?: StatusPillSize;
  showIcon?: boolean;
}

/**
 * StatusPill SAKODE
 * Memenuhi WCAG AA: Warna tidak berdiri sendiri, selalu didampingi ikon visual
 * dan label eksplisit Bahasa Indonesia baku.
 */
export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  customLabel,
  size = 'default',
  showIcon = true,
  className,
  ...props
}) => {
  const config = STATUS_CONFIG[status] || {
    label: customLabel || status,
    icon: AlertCircle,
    pillClasses: 'bg-slate-100 text-slate-800 border-slate-300',
    iconClasses: 'text-slate-600',
  };

  const Icon = config.icon;

  const sizeStyles: Record<StatusPillSize, { pill: string; icon: string }> = {
    sm: {
      pill: 'px-2 py-0.5 text-[11px] gap-1',
      icon: 'h-3 w-3',
    },
    default: {
      pill: 'px-2.5 py-1 text-xs gap-1.5',
      icon: 'h-3.5 w-3.5',
    },
    lg: {
      pill: 'px-3.5 py-1.5 text-sm gap-2',
      icon: 'h-4 w-4',
    },
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border leading-none tracking-tight transition-colors',
        sizeStyles[size].pill,
        config.pillClasses,
        className
      )}
      {...props}
    >
      {showIcon && (
        <Icon
          className={cn('shrink-0 stroke-[2.2]', sizeStyles[size].icon, config.iconClasses)}
          aria-hidden="true"
        />
      )}
      <span>{customLabel || config.label}</span>
    </span>
  );
};
