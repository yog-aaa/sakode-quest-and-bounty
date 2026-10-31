'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FileUploadDropzone } from '@/components/submission/FileUploadDropzone';
import { createReportAction } from '@/server/actions/report.actions';
import { REPORT_CATEGORIES } from '@/lib/constants';
import type { ReportTargetType, EvidenceFile } from '@/types/database';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Send,
  ShieldAlert,
} from 'lucide-react';

interface CreateReportModalProps {
  targetType: ReportTargetType;
  targetId: string;
  targetTitle: string;
  triggerButton?: React.ReactNode;
  onReportSubmitted?: () => void;
}

export function CreateReportModal({
  targetType,
  targetId,
  targetTitle,
  triggerButton,
  onReportSubmitted,
}: CreateReportModalProps) {
  const { user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<string>(REPORT_CATEGORIES[0]);
  const [chronology, setChronology] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const resetForm = () => {
    setCategory(REPORT_CATEGORIES[0]);
    setChronology('');
    setEvidenceFiles([]);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleOpen = () => {
    resetForm();
    setIsOpen(true);
  };

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    setIsOpen(false);
    resetForm();
  }, [isSubmitting]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, handleClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (chronology.trim().length < 25) {
      setErrorMsg('Kronologi masalah wajib dijelaskan secara rinci minimal 25 karakter.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await createReportAction(user.id, {
        targetType,
        targetId,
        targetTitle,
        category,
        chronology: chronology.trim(),
        evidenceFiles,
      });

      if (res.success && res.report) {
        setSuccessMsg(
          res.report.escalatedToSuperAdmin
            ? 'Laporan berhasil dibuat! Karena sengketa mencatut keterlibatan staf Admin, kasus dialihkan secara eksklusif ke Super Administrator (Anti-Konflik Kepentingan).'
            : 'Laporan sengketa berhasil dikirimkan ke Antrean Investigasi Tim SAKODE.'
        );
        setTimeout(() => {
          handleClose();
          if (onReportSubmitted) onReportSubmitted();
        }, 2000);
      } else {
        setErrorMsg(res.error || 'Gagal mengirimkan laporan sengketa.');
      }
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Terjadi kesalahan jaringan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const targetLabel =
    targetType === 'TASK'
      ? 'Task'
      : targetType === 'SUBMISSION'
      ? 'Deliverable Submission'
      : targetType === 'CLAIM'
      ? 'Klaim Reward'
      : 'Distribusi Tim';

  return (
    <>
      {triggerButton ? (
        <span onClick={handleOpen}>{triggerButton}</span>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={handleOpen}
          className="text-xs font-bold gap-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
        >
          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
          <span>Laporkan Sengketa</span>
        </Button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200/80 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-start justify-between">
              <div>
                <Badge variant="orange" leftIcon={<ShieldAlert className="h-3 w-3" />}>
                  Laporan Masalah Resmi • SAKODE Academy
                </Badge>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  Laporkan Sengketa {targetLabel}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                  Target: <strong>{targetTitle || targetId}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Notice Anti-Konflik */}
              <div className="p-3 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-900 dark:text-purple-200 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-purple-700 dark:text-purple-400" />
                  <span>Jaminan Anti-Konflik Kepentingan SAKODE:</span>
                </span>
                <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                  Jika laporan ini menyangkut keputusan atau pembayaran dari staf Administrator, laporan akan secara otomatis dialihkan ke <strong>Super Administrator</strong>. Admin yang terlibat tidak memiliki akses untuk mengevaluasi atau membatalkan laporan ini.
                </p>
              </div>

              {/* 1. Kategori Sengketa */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Kategori Masalah:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                >
                  {REPORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Kronologi Kejadian */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Kronologi Kejadian (Min. 25 Karakter):
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      chronology.trim().length >= 25 ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {chronology.trim().length}/25
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={chronology}
                  onChange={(e) => setChronology(e.target.value)}
                  disabled={isSubmitting}
                  placeholder="Jelaskan secara runtut fakta kejadian, pihak yang terlibat, dan kerugian atau ketidaksesuaian yang Anda alami..."
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              {/* 3. Dropzone Berkas Bukti */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Berkas Bukti Pendukung (Maks. 5 File, Gambar / PDF, No Video):
                </label>
                <FileUploadDropzone
                  taskId={`report_${targetId}`}
                  files={evidenceFiles}
                  onFilesChange={setEvidenceFiles}
                  disabled={isSubmitting}
                />
              </div>

              {/* Footer Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-xs cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={isSubmitting || chronology.trim().length < 25}
                  className="font-bold text-xs gap-1.5 shadow-sm cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Kirim Laporan Resmi</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
