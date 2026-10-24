'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TransferProofUploaderProps {
  claimIdOrContext: string;
  onUploaded: (url: string, publicId?: string) => void;
  existingUrl?: string | null;
  disabled?: boolean;
}

export function TransferProofUploader({
  claimIdOrContext,
  onUploaded,
  existingUrl,
  disabled = false,
}: TransferProofUploaderProps) {
  const [currentUrl, setCurrentUrl] = useState<string | null>(existingUrl || null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);

    // Validate file type (Images and PDF only)
    const lowerType = file.type.toLowerCase();
    const lowerName = file.name.toLowerCase();
    const isValidType =
      lowerType.startsWith('image/') ||
      lowerType === 'application/pdf' ||
      lowerName.endsWith('.pdf') ||
      lowerName.endsWith('.jpg') ||
      lowerName.endsWith('.jpeg') ||
      lowerName.endsWith('.png') ||
      lowerName.endsWith('.webp');

    if (!isValidType) {
      setErrorMessage('Format berkas tidak didukung. Harap unggah berkas gambar (JPG, PNG, WebP) atau PDF.');
      return;
    }

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran berkas melebihi batas maksimal 10 MB.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Dapatkan tanda tangan Cloudinary
      const signRes = await fetch('/api/upload/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: claimIdOrContext || 'transfers',
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      const signData = await signRes.json();
      if (!signRes.ok || !signData.success) {
        throw new Error(signData.error || 'Gagal memperoleh otorisasi upload.');
      }

      // 2. Upload file
      if (signData.isMock) {
        const mockUrl = URL.createObjectURL(file);
        const mockPublicId = `mock_proof_${Date.now()}`;
        setCurrentUrl(mockUrl);
        onUploaded(mockUrl, mockPublicId);
      } else {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', signData.apiKey);
        formData.append('timestamp', String(signData.timestamp));
        formData.append('signature', signData.signature);
        formData.append('folder', signData.folder);

        const isPdf = lowerType === 'application/pdf' || lowerName.endsWith('.pdf');
        const endpoint = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${isPdf ? 'raw' : 'image'}/upload`;

        const uploadRes = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.secure_url) {
          throw new Error(uploadData.error?.message || 'Gagal mengunggah berkas ke server penyimpanan.');
        }

        setCurrentUrl(uploadData.secure_url);
        onUploaded(uploadData.secure_url, uploadData.public_id);
      }
    } catch (err: unknown) {
      console.error('Upload proof error:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Gagal mengunggah bukti transfer.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClear = () => {
    setCurrentUrl(null);
    onUploaded('', '');
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      {currentUrl ? (
        <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div className="text-xs truncate">
              <span className="font-bold text-emerald-900 block truncate">
                Bukti transfer berhasil dipilih
              </span>
              <a
                href={currentUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sakode-cyan underline hover:text-[#076991] font-medium"
              >
                Lihat Berkas Terunggah
              </a>
            </div>
          </div>

          {!disabled && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-100/50 h-8 px-2"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <div
          onClick={() => {
            if (!disabled && !isUploading) {
              fileInputRef.current?.click();
            }
          }}
          className={`border-2 border-dashed rounded-lg p-5 text-center cursor-pointer transition-all ${
            disabled
              ? 'bg-slate-50 border-slate-200 cursor-not-allowed opacity-60'
              : 'border-slate-300 hover:border-sakode-cyan bg-slate-50/50 hover:bg-sakode-bg'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-2 py-2">
              <Loader2 className="h-6 w-6 text-sakode-cyan animate-spin" />
              <p className="text-xs text-slate-600 font-medium">Mengunggah bukti transfer...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1.5">
              <UploadCloud className="h-7 w-7 text-slate-400" />
              <p className="text-xs font-semibold text-slate-700">
                Klik untuk unggah struk/bukti transfer bank
              </p>
              <p className="text-[11px] text-slate-500">
                Format: JPG, PNG, WebP, atau PDF (Maks. 10 MB)
              </p>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
