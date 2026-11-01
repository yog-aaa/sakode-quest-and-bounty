import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'team'
  | 'danger'
  | 'outline'
  | 'secondary'
  | 'ghost';

export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'default',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const variantStyles: Record<ButtonVariant, string> = {
      // Primary: Warna identitas SAKODE Cyan (#0EA5E9), Teks gelap kontras tinggi, subtle hover lift
      primary:
        'bg-sakode-cyan text-slate-950 font-bold hover:bg-sky-400 dark:hover:bg-sky-300 active:bg-sky-500 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-sakode-cyan',
      // Team: Aksen kolaborasi & tim SAKODE Purple, Teks putih, subtle hover lift
      team:
        'bg-sakode-purple text-white font-bold hover:bg-purple-600 active:bg-purple-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-sakode-purple dark:bg-purple-600 dark:hover:bg-purple-500',
      // Danger: Batas waktu, aksi kritis, peringatan SAKODE Orange, Teks putih
      danger:
        'bg-sakode-orange text-white font-bold hover:bg-orange-600 active:bg-orange-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 focus-visible:ring-sakode-orange dark:bg-orange-600 dark:hover:bg-orange-500',
      // Outline: Garis tepi halus, latar adaptif, teks adaptif kontras tinggi di Dark Mode
      outline:
        'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-semibold hover:bg-slate-50 dark:hover:bg-slate-800/80 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-0.5 focus-visible:ring-sakode-cyan shadow-2xs hover:shadow-xs',
      // Secondary: Abu-abu halus adaptif
      secondary:
        'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 dark:active:bg-slate-600 focus-visible:ring-sakode-cyan',
      // Ghost: Transparan adaptif
      ghost:
        'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 dark:hover:text-white active:bg-slate-200 dark:active:bg-slate-700 focus-visible:ring-sakode-cyan',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      // Touch target min 44px sesuai standar mobile-first WCAG
      default: 'h-11 px-5 text-sm',
      sm: 'h-9 px-3.5 text-xs',
      lg: 'h-12 px-7 text-base font-bold',
      icon: 'h-11 w-11 p-0 justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-150 ease-out active:scale-[0.97] active:duration-75',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950',
          'disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-current" />
        ) : (
          leftIcon
        )}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
