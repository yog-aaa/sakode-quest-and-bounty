import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant =
  | 'default'
  | 'cyan'
  | 'purple'
  | 'orange'
  | 'outline'
  | 'success'
  | 'secondary'
  | 'dark';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  leftIcon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  leftIcon,
  children,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    default:
      'bg-sakode-cyan/15 dark:bg-sakode-cyan/20 text-[#0c6b94] dark:text-sakode-cyan border-sakode-cyan/30 dark:border-sakode-cyan/40',
    cyan:
      'bg-sakode-cyan/15 dark:bg-sakode-cyan/20 text-[#0c6b94] dark:text-sakode-cyan border-sakode-cyan/30 dark:border-sakode-cyan/40',
    purple:
      'bg-sakode-purple/15 dark:bg-sakode-purple/20 text-[#7329be] dark:text-purple-300 border-sakode-purple/30 dark:border-purple-500/30',
    orange:
      'bg-sakode-orange/15 dark:bg-sakode-orange/20 text-[#b93f0b] dark:text-amber-300 border-sakode-orange/30 dark:border-amber-500/30',
    outline:
      'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800',
    success:
      'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    secondary:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    dark:
      'bg-slate-900 dark:bg-slate-800 text-white border-slate-900 dark:border-slate-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {leftIcon}
      {children}
    </span>
  );
};
