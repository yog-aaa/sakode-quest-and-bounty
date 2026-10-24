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
      // Primary: Warna identitas SAKODE Cyan (#71CFFE), Teks #172033 tebal
      primary:
        'bg-sakode-cyan text-sakode-text font-bold hover:bg-[#5dbfe8] active:bg-[#4cb3de] shadow-sm focus-visible:ring-sakode-cyan',
      // Team: Aksen kolaborasi & tim SAKODE Purple (#BC71FE), Teks putih
      team:
        'bg-sakode-purple text-white font-semibold hover:bg-[#a85be8] active:bg-[#9746dc] shadow-sm focus-visible:ring-sakode-purple',
      // Danger: Batas waktu, aksi kritis, peringatan SAKODE Orange (#F9723B), Teks putih
      danger:
        'bg-sakode-orange text-white font-semibold hover:bg-[#e65f27] active:bg-[#d04e18] shadow-sm focus-visible:ring-sakode-orange',
      // Outline: Garis tepi halus #DBE8F0, latar putih, teks #172033
      outline:
        'border border-sakode-border bg-sakode-card text-sakode-text font-medium hover:bg-sakode-bg active:bg-[#eef5fa] focus-visible:ring-sakode-cyan',
      // Secondary: Abu-abu halus
      secondary:
        'bg-[#EEF4F8] text-sakode-text font-medium hover:bg-[#E0EBF2] active:bg-[#D5E3EC] focus-visible:ring-sakode-cyan',
      // Ghost: Transparan
      ghost:
        'text-sakode-text hover:bg-sakode-border/40 active:bg-sakode-border/70 focus-visible:ring-sakode-cyan',
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
