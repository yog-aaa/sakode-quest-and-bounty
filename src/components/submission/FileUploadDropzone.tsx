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
  maxFiles?: number;
  title?: string;
  description?: string;
}

export function FileUploadDropzone({
  taskId,
  files,
  onFilesChange,
  disabled = false,
  maxFiles = MAX_EVIDENCE_FILES,
  title,
  description,
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

  const getFileTypeInfo = (fileName: string, fileType: string) => {
    const lowerName = fileName.toLowerCase();
    const lowerType = fileType.toLowerCase();

    if (lowerName.endsWith('.pdf') || lowerType.includes('pdf')) {
      return { label: 'PDF Dokumen', color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900/50', icon: 'pdf' };
    }
    if (lowerName.endsWith('.doc') || lowerName.endsWith('.docx') || lowerType.includes('word')) {
      return { label: 'Word Dokumen', color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-900/50', icon: 'doc' };
    }
    if (lowerName.endsWith('.ppt') || lowerName.endsWith('.pptx') || lowerType.includes('presentation') || lowerType.includes('powerpoint')) {
      return { label: 'PowerPoint Slide', color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900/50', icon: 'ppt' };
    }
    return { label: 'Gambar', color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-900/50', icon: 'image' };
  };

  const handleValidateAndUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMessage(null);

    const availableSlots = maxFiles - files.length;
    if (availableSlots <= 0) {
      setErrorMessage(`Maksimal ${maxFiles} berkas telah tercapai.`);
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
          `Berkas "${file.name}" ditolak. Format video dilarang untuk lampiran tugas SAKODE. Gunakan tangkapan layar (JPG/PNG/WebP), PDF, Word, atau PPT.`
        );
        return;
      }

      // Check allowed extensions
      const hasAllowedExtension = ALLOWED_EVIDENCE_EXTENSIONS.some((ext) =>
        lowerName.endsWith(ext)
      );

      if (!hasAllowedExtension && !lowerType.startsWith('image/')) {
        setErrorMessage(
          `Berkas "${file.name}" tidak didukung. Format yang diizinkan: JPG, PNG, WebP, PDF, DOC/DOCX, dan PPT/PPTX.`
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

          const isDocument =
            file.name.toLowerCase().endsWith('.pdf') ||
            file.name.toLowerCase().endsWith('.doc') ||
            file.name.toLowerCase().endsWith('.docx') ||
            file.name.toLowerCase().endsWith('.ppt') ||
            file.name.toLowerCase().endsWith('.pptx') ||
            file.type === 'application/pdf';

          const resourceType = isDocument ? 'auto' : 'image';
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
        accept=".jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.ppt,.pptx"
        className="hidden"
        disabled={disabled || isUploading || files.length >= maxFiles}
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
          if (!disabled && !isUploading && files.length < maxFiles) {
            fileInputRef.current?.click();
          }
        }}
        className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 ring-2 ring-sky-500/20'
            : disabled || files.length >= maxFiles
            ? 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 cursor-not-allowed opacity-75'
            : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-slate-100/60 dark:hover:bg-slate-900/60'
        }`}
      >
        <div className="flex flex-col items-center justify-center space-y-2">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform ${
              isDragging
                ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-600 dark:text-sky-400 scale-110'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
            ) : (
              <UploadCloud className="h-6 w-6" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
              {isUploading
                ? 'Sedang mengunggah berkas...'
                : files.length >= maxFiles
                ? `Batas maksimal ${maxFiles} berkas telah tercapai`
                : title || 'Tarik & lepas berkas ke sini, atau klik untuk memilih'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {description || (
                <>
                  Format: <strong>PDF, DOC/DOCX, PPT/PPTX, Gambar (JPG/PNG/WebP)</strong> • Maks. 10 MB per file, maks. {maxFiles} berkas
                </>
              )}
            </p>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && uploadProgress !== null && (
            <div className="w-full max-w-xs mt-2 space-y-1">
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-sky-500 h-2 rounded-full transition-all duration-300"
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
        <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex items-center justify-between gap-2 animate-shake">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-600 hover:text-rose-900 dark:hover:text-rose-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Uploaded Files Preview List */}
      {files.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
            <span>Berkas Terlampir ({files.length}/{maxFiles})</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center gap-1 font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Siap Diserahkan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {files.map((file) => {
              const typeInfo = getFileTypeInfo(file.fileName, file.fileType);

              return (
                <div
                  key={file.publicId}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors gap-2.5 shadow-2xs"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className={`w-9 h-9 rounded-lg shrink-0 flex items-center justify-center overflow-hidden border ${typeInfo.color}`}>
                      {typeInfo.icon === 'image' ? (
                        <ImageIcon className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </div>
                    <div className="overflow-hidden text-left">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate" title={file.fileName}>
                        {file.fileName}
                      </p>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {formatBytes(file.fileSize)} • {typeInfo.label}
                      </p>
                    </div>
                  </div>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(file.publicId)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer shrink-0"
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
