'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  RotateCw,
  WifiOff,
  Wifi,
} from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title?: string;
  message: string;
  type?: ToastType;
  durationMs?: number;
  details?: string;
  onRetry?: () => void;
}

interface ToastItem extends Omit<ToastOptions, 'type'> {
  id: string;
  type: ToastType;
  createdAt: number;
}

interface ToastContextType {
  toast: (options: ToastOptions | string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => void;
  warning: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [hasNetworkChanged, setHasNetworkChanged] = useState<boolean>(false);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (options: ToastOptions | string) => {
      const opts: ToastOptions =
        typeof options === 'string' ? { message: options, type: 'info' } : options;

      const id = Math.random().toString(36).slice(2, 9);
      const newToast: ToastItem = {
        id,
        title: opts.title,
        message: opts.message,
        type: opts.type || 'info',
        durationMs: opts.durationMs ?? (opts.type === 'error' ? 8000 : 4500),
        details: opts.details,
        onRetry: opts.onRetry,
        createdAt: Date.now(),
      };

      setToasts((prev) => [...prev.slice(-4), newToast]); // Simpan maksimal 5 toast terbaru

      if (newToast.durationMs && newToast.durationMs > 0) {
        setTimeout(() => {
          dismiss(id);
        }, newToast.durationMs);
      }
    },
    [dismiss]
  );

  const success = useCallback(
    (message: string, title: string = 'Berhasil') => {
      toast({ message, title, type: 'success' });
    },
    [toast]
  );

  const error = useCallback(
    (message: string, options?: Omit<ToastOptions, 'message' | 'type'>) => {
      toast({
        message,
        title: options?.title || 'Terjadi Kendala',
        type: 'error',
        details: options?.details,
        onRetry: options?.onRetry,
        durationMs: options?.durationMs ?? 8000,
      });
    },
    [toast]
  );

  const warning = useCallback(
    (message: string, title: string = 'Peringatan') => {
      toast({ message, title, type: 'warning' });
    },
    [toast]
  );

  const info = useCallback(
    (message: string, title: string = 'Informasi') => {
      toast({ message, title, type: 'info' });
    },
    [toast]
  );

  // Network Offline / Online Monitor
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      if (hasNetworkChanged) {
        success('Koneksi internet Anda telah kembali aktif.', 'Online Kembali');
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setHasNetworkChanged(true);
      error('Koneksi internet terputus. Sebagian data mungkin gagal disinkronkan.', {
        title: 'Anda Sedang Offline',
        durationMs: 10000,
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [hasNetworkChanged, error, success]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}

      {/* Floating Toast Container */}
      <div
        aria-live="assertive"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0"
      >
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleCopy = () => {
    const textToCopy = toast.details
      ? `${toast.message}\nDetail: ${toast.details}`
      : toast.message;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeType: ToastType = toast.type || 'info';

  const icons: Record<ToastType, React.ReactNode> = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />,
    error: <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />,
    info: <Info className="h-5 w-5 text-sky-500 shrink-0 mt-0.5" />,
  };

  const borders: Record<ToastType, string> = {
    success: 'border-emerald-200 dark:border-emerald-900/40 bg-white/95 dark:bg-slate-900/95',
    error: 'border-rose-200 dark:border-rose-900/40 bg-white/95 dark:bg-slate-900/95',
    warning: 'border-amber-200 dark:border-amber-900/40 bg-white/95 dark:bg-slate-900/95',
    info: 'border-sky-200 dark:border-sky-900/40 bg-white/95 dark:bg-slate-900/95',
  };

  return (
    <div
      role="alert"
      className={`pointer-events-auto w-full p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-all duration-200 animate-pop-in ${borders[activeType]}`}
    >
      <div className="flex items-start gap-3">
        {icons[activeType]}

        <div className="flex-1 space-y-1 text-left min-w-0">
          {toast.title && (
            <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
              {toast.title}
            </h4>
          )}
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-snug break-words">
            {toast.message}
          </p>

          {/* Error Details Accordion */}
          {toast.details && (
            <div className="pt-1.5">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{showDetails ? 'Sembunyikan rincian' : 'Lihat rincian kendala'}</span>
                {showDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>

              {showDetails && (
                <div className="mt-1.5 p-2 rounded-lg bg-slate-950 text-slate-200 text-[10px] font-mono max-h-28 overflow-y-auto leading-relaxed border border-slate-800">
                  {toast.details}
                </div>
              )}
            </div>
          )}

          {/* Action Row: Retry & Copy */}
          {(toast.onRetry || toast.type === 'error') && (
            <div className="pt-2 flex items-center gap-2">
              {toast.onRetry && (
                <button
                  onClick={() => {
                    toast.onRetry?.();
                    onDismiss();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-600 text-slate-950 transition-all cursor-pointer active:scale-95 shadow-2xs"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Coba Lagi</span>
                </button>
              )}

              {toast.type === 'error' && (
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-500" />
                      <span className="text-emerald-600 dark:text-emerald-400">Tersalin</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Salin Pesan</span>
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={onDismiss}
          aria-label="Tutup notifikasi"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
