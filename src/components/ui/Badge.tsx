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
      'bg-sakode-cyan/20 text-[#0c6b94] border-sakode-cyan/40',
    cyan:
      'bg-sakode-cyan/20 text-[#0c6b94] border-sakode-cyan/40',
    purple:
      'bg-sakode-purple/15 text-[#7329be] border-sakode-purple/30',
    orange:
      'bg-sakode-orange/15 text-[#b93f0b] border-sakode-orange/30',
    outline:
      'bg-sakode-card text-sakode-text border-sakode-border',
    success:
      'bg-emerald-50 text-emerald-800 border-emerald-200',
    secondary:
      'bg-slate-100 text-slate-700 border-slate-200',
    dark:
      'bg-sakode-text text-white border-sakode-text',
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
