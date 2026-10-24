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
          <div className="bg-white rounded-2xl shadow-2xl border border-sakode-border w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-sakode-border bg-sakode-bg flex items-start justify-between">
              <div>
                <Badge variant="orange" leftIcon={<ShieldAlert className="h-3 w-3" />}>
                  Laporan Masalah Resmi • SAKODE Academy
                </Badge>
                <h3 className="text-base font-black text-sakode-text mt-1">
                  Laporkan Sengketa {targetLabel}
                </h3>
                <p className="text-xs text-sakode-text-muted truncate max-w-md">
                  Target: <strong>{targetTitle || targetId}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Notice Anti-Konflik */}
              <div className="p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-purple-900 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-purple-700" />
                  <span>Jaminan Anti-Konflik Kepentingan SAKODE:</span>
                </span>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  Jika laporan ini menyangkut keputusan atau pembayaran dari staf Administrator, laporan akan secara otomatis dialihkan ke <strong>Super Administrator</strong>. Admin yang terlibat tidak memiliki akses untuk mengevaluasi atau membatalkan laporan ini.
                </p>
              </div>

              {/* 1. Kategori Sengketa */}
              <div>
                <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1.5">
                  Kategori Masalah:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full p-2.5 text-xs rounded-lg border border-sakode-border bg-white text-sakode-text font-medium focus:outline-none focus:ring-1 focus:ring-sakode-orange"
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
                  <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider">
                    Kronologi Kejadian (Min. 25 Karakter):
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      chronology.trim().length >= 25 ? 'text-emerald-600' : 'text-slate-400'
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
                  className="w-full p-3 text-xs rounded-lg border border-sakode-border bg-white text-sakode-text focus:outline-none focus:ring-1 focus:ring-sakode-orange leading-relaxed"
                />
              </div>

              {/* 3. Dropzone Berkas Bukti */}
              <div>
                <label className="block text-xs font-bold text-sakode-text uppercase tracking-wider mb-1">
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
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  size="sm"
                  disabled={isSubmitting || chronology.trim().length < 25}
                  className="font-bold text-xs gap-1.5 shadow-sm"
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
