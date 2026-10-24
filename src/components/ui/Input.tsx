import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      id,
      disabled,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-bold text-sakode-text tracking-wide"
          >
            {label}
            {props.required && <span className="text-sakode-orange ml-1">*</span>}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-sakode-text-muted">
              {leftIcon}
            </div>
          )}

          <input
            id={inputId}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              'flex h-11 w-full rounded-lg border bg-sakode-card px-3.5 text-sm text-sakode-text transition-colors',
              'placeholder:text-sakode-text-muted/60',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error
                ? 'border-sakode-orange focus-visible:ring-sakode-orange'
                : 'border-sakode-border focus-visible:border-sakode-cyan focus-visible:ring-sakode-cyan',
              disabled && 'cursor-not-allowed opacity-50 bg-slate-50',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3.5 flex items-center text-sakode-text-muted">
              {rightIcon}
            </div>
          )}
        </div>

        {error && (
          <p id={`${inputId}-error`} className="text-xs font-semibold text-sakode-orange">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p className="text-[11px] text-sakode-text-muted leading-tight">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
