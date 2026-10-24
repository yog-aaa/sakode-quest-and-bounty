'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  Image as ImageIcon,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { EvidenceFile } from '@/types/database';
import {
  ALLOWED_EVIDENCE_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_EVIDENCE_FILES,
} from '@/lib/validations/submission';

interface FileUploadDropzoneProps {
  taskId: string;
  files: EvidenceFile[];
  onFilesChange: (files: EvidenceFile[]) => void;
  disabled?: boolean;
}

export function FileUploadDropzone({
  taskId,
  files,
  onFilesChange,
  disabled = false,
}: FileUploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleValidateAndUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const availableSlots = MAX_EVIDENCE_FILES - files.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Maksimal ${MAX_EVIDENCE_FILES} file bukti telah tercapai.`);
      return;
    }

    const filesToProcess = Array.from(fileList).slice(0, availableSlots);

    for (const file of filesToProcess) {
      const lowerName = file.name.toLowerCase();
      const lowerType = file.type.toLowerCase();

      // STRICT INVARIANT: Reject video files immediately
      if (
        lowerType.startsWith('video/') ||
        lowerName.endsWith('.mp4') ||
        lowerName.endsWith('.mov') ||
        lowerName.endsWith('.webm') ||
        lowerName.endsWith('.avi') ||
        lowerName.endsWith('.mkv')
      ) {
        setErrorMessage(
          `Berkas "${file.name}" ditolak. Format video dilarang untuk bukti pekerjaan MVP. Gunakan tangkapan layar (JPG/PNG/WebP) atau PDF.`
        );
        return;
      }

      // Check allowed extensions
      const hasAllowedExtension = ALLOWED_EVIDENCE_EXTENSIONS.some((ext) =>
        lowerName.endsWith(ext)
      );

      if (!hasAllowedExtension && !lowerType.startsWith('image/')) {
        setErrorMessage(
          `Berkas "${file.name}" tidak didukung. Hanya JPG, PNG, WebP, dan PDF yang diperbolehkan.`
        );
        return;
      }

      // Check file size limit (10MB)
      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          `Ukuran berkas "${file.name}" (${formatBytes(file.size)}) melebihi batas maksimal 10 MB.`
        );
        return;
      }
    }

    // Begin uploading files
    setIsUploading(true);
    setUploadProgress(10);

    const uploadedNewFiles: EvidenceFile[] = [];

    try {
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        setUploadProgress(Math.round(((i + 0.3) / filesToProcess.length) * 100));

        // 1. Get Signed Upload parameters from server
        const signRes = await fetch('/api/upload/sign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            taskId,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
          }),
        });

        const signData = await signRes.json();
        if (!signRes.ok || !signData.success) {
          throw new Error(signData.error || 'Gagal memperoleh izin upload.');
        }

        // 2. Perform upload (Cloudinary real or Mock mode)
        if (signData.isMock) {
          // Local evaluation / mock mode fallback
          const mockPublicId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          const mockUrl = URL.createObjectURL(file);

          uploadedNewFiles.push({
            url: mockUrl,
            publicId: mockPublicId,
            fileName: file.name,
            fileType: file.type || 'image/jpeg',
            fileSize: file.size,
          });
        } else {
          // Real Cloudinary Signed Upload
          const formData = new FormData();
          formData.append('file', file);
          formData.append('api_key', signData.apiKey);
          formData.append('timestamp', String(signData.timestamp));
          formData.append('signature', signData.signature);
          formData.append('folder', signData.folder);

          const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
          const resourceType = isPdf ? 'auto' : 'image';
          const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudName}/${resourceType}/upload`;

          const uploadRes = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: formData,
          });

          const uploadData = await uploadRes.json();
          if (!uploadRes.ok || uploadData.error) {
            throw new Error(uploadData.error?.message || 'Gagal mengunggah berkas ke Cloudinary.');
          }

          uploadedNewFiles.push({
            url: uploadData.secure_url || uploadData.url,
            publicId: uploadData.public_id,
            fileName: file.name,
            fileType: file.type || uploadData.format,
            fileSize: file.size,
          });
        }

        setUploadProgress(Math.round(((i + 1) / filesToProcess.length) * 100));
      }

      onFilesChange([...files, ...uploadedNewFiles]);
    } catch (err: unknown) {
      console.error('Upload error:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'Terjadi kegagalan saat mengunggah berkas.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = (publicId: string) => {
    if (disabled) return;
    onFilesChange(files.filter((f) => f.publicId !== publicId));
  };

  return (
    <div className="space-y-3">
      {/* Hidden native input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".jpg,.jpeg,.png,.webp,.pdf"
        className="hidden"
        disabled={disabled || isUploading || files.length >= MAX_EVIDENCE_FILES}
        onChange={(e) => handleValidateAndUpload(e.target.files)}
      />

      {/* Dropzone Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled && !isUploading) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (!disabled && !isUploading) {
            handleValidateAndUpload(e.dataTransfer.files);
          }
        }}
        onClick={() => {
          if (!disabled && !isUploading && files.length < MAX_EVIDENCE_FILES) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-sakode-cyan bg-sky-50/60 ring-2 ring-sakode-cyan/30'
            : disabled || files.length >= MAX_EVIDENCE_FILES
            ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-75'
            : 'border-sakode-border bg-white hover:border-slate-400 hover:bg-slate-50/50'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDragging ? 'bg-sky-100 text-sky-600' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-sakode-cyan" />
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-bold text-sakode-text">
              {isUploading
                ? 'Sedang mengunggah berkas...'
                : files.length >= MAX_EVIDENCE_FILES
                ? 'Batas maksimal 5 berkas telah tercapai'
                : 'Tarik & lepas berkas ke sini, atau klik untuk memilih'}
            </p>
            <p className="text-[11px] text-sakode-text-muted">
              Mendukung: <strong>JPG, PNG, WebP, PDF</strong> (Maks. 10 MB per file, maks. 5 berkas)
            </p>
            <p className="text-[10px] text-amber-600 font-semibold">
              ⚠️ Strict Invariant: Berkas video DITOLAK untuk evaluasi MVP.
            </p>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && uploadProgress !== null && (
            <div className="w-full max-w-xs mt-2 space-y-1">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sakode-cyan h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Mengunggah... {uploadProgress}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Uploaded Files Preview List */}
      {files.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-sakode-text-muted">
            <span>Berkas Bukti Terunggah ({files.length}/{MAX_EVIDENCE_FILES})</span>
            <span className="text-emerald-600 text-[11px] flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Siap Diserahkan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {files.map((file) => {
              const isPdf =
                file.fileName.toLowerCase().endsWith('.pdf') ||
                file.fileType.toLowerCase().includes('pdf');

              return (
                <div
                  key={file.publicId}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-sakode-border bg-white hover:border-slate-300 transition-colors gap-2"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="w-9 h-9 rounded bg-slate-100 shrink-0 flex items-center justify-center overflow-hidden border border-slate-200">
                      {isPdf ? (
                        <FileText className="h-5 w-5 text-rose-500" />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-sky-500" />
                      )}
                    </div>
                    <div className="overflow-hidden text-left">
                      <p className="text-xs font-bold text-sakode-text truncate" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className="text-[10px] text-sakode-text-muted">
                        {formatBytes(file.fileSize)} • {isPdf ? 'PDF Dokumen' : 'Gambar'}
                      </p>
                    </div>
                  </div>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.publicId)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Hapus berkas"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
