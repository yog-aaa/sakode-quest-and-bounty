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
      // Primary: Warna identitas SAKODE Cyan (#71CFFE), Teks gelap kontras tinggi
      primary:
        'bg-sakode-cyan text-sakode-text dark:text-slate-950 font-bold hover:bg-[#5dbfe8] dark:hover:bg-sky-400 active:bg-[#4cb3de] shadow-xs focus-visible:ring-sakode-cyan',
      // Team: Aksen kolaborasi & tim SAKODE Purple (#BC71FE), Teks putih
      team:
        'bg-sakode-purple text-white font-semibold hover:bg-[#a85be8] active:bg-[#9746dc] shadow-xs focus-visible:ring-sakode-purple dark:bg-sakode-purple dark:hover:bg-purple-500',
      // Danger: Batas waktu, aksi kritis, peringatan SAKODE Orange (#F9723B), Teks putih
      danger:
        'bg-sakode-orange text-white font-semibold hover:bg-[#e65f27] active:bg-[#d04e18] shadow-xs focus-visible:ring-sakode-orange dark:bg-sakode-orange dark:hover:bg-orange-600',
      // Outline: Garis tepi halus, latar adaptif, teks adaptif kontras tinggi di Dark Mode
      outline:
        'border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 dark:hover:text-white active:bg-slate-100 dark:active:bg-slate-700 focus-visible:ring-sakode-cyan shadow-2xs',
      // Secondary: Abu-abu halus adaptif
      secondary:
        'bg-[#EEF4F8] dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium hover:bg-[#E0EBF2] dark:hover:bg-slate-700 active:bg-[#D5E3EC] dark:active:bg-slate-600 focus-visible:ring-sakode-cyan',
      // Ghost: Transparan adaptif
      ghost:
        'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/80 dark:hover:text-white active:bg-slate-200 dark:active:bg-slate-700 focus-visible:ring-sakode-cyan',
    };

    const sizeStyles: Record<ButtonSize, string> = {
      // Touch target min 44px sesuai standar mobile-first WCAG
      default: 'h-11 px-5 text-sm',
      sm: 'h-9 px-3 text-xs',
      lg: 'h-12 px-7 text-base font-bold',
      icon: 'h-11 w-11 p-0 justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
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
