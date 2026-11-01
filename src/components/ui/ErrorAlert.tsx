'use client';

import React, { useState } from 'react';
import { AlertCircle, RotateCw, Copy, Check, X } from 'lucide-react';
import { Button } from './Button';

interface ErrorAlertProps {
  title?: string;
  message: string;
  details?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({
  title = 'Terjadi Kesalahan',
  message,
  details,
  onRetry,
  onDismiss,
  className = '',
}: ErrorAlertProps) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleCopy = () => {
    const text = details ? `${message}\n${details}` : message;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="alert"
      className={`p-4 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-900 dark:text-rose-200 animate-shake space-y-2.5 transition-all ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5 text-left">
            <h4 className="text-xs font-bold text-rose-950 dark:text-rose-200">
              {title}
            </h4>
            <p className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed">
              {message}
            </p>
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Tutup pesan error"
            className="text-rose-400 hover:text-rose-600 dark:hover:text-rose-200 p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/50 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {details && (
        <div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 hover:underline cursor-pointer"
          >
            {showDetails ? 'Sembunyikan detail teknis' : 'Lihat detail teknis'}
          </button>
          {showDetails && (
            <pre className="mt-1.5 p-2 rounded-lg bg-slate-950 text-rose-300 text-[10px] font-mono overflow-x-auto max-h-28 leading-relaxed border border-rose-900/40">
              {details}
            </pre>
          )}
        </div>
      )}

      {(onRetry || details) && (
        <div className="flex items-center gap-2 pt-1">
          {onRetry && (
            <Button
              variant="danger"
              size="sm"
              onClick={onRetry}
              className="text-xs font-bold gap-1.5 h-8 px-3"
            >
              <RotateCw className="h-3 w-3" />
              <span>Coba Lagi</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="text-xs font-medium gap-1 h-8 px-2.5 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/40 hover:bg-rose-100/50 dark:hover:bg-rose-950/50"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-500" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Salin Pesan Error</span>
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
