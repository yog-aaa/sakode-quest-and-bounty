'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const SakodeSmileArc: React.FC<{ className?: string }> = ({
  className = 'w-8 h-2.5 text-amber-500',
}) => (
  <svg
    viewBox="0 0 48 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M4 4C14 14 34 14 44 4"
      stroke="currentColor"
      strokeWidth="3.2"
      strokeLinecap="round"
    />
  </svg>
);

interface SakodeAmbientOrnamentsProps {
  /** Tampilkan aksen sticker brandmark mengambang */
  showSticker?: boolean;
  /** @deprecated Tidak lagi digunakan untuk menjaga kebersihan visual halaman */
  showForegroundBadges?: boolean;
  className?: string;
}

export const SakodeAmbientOrnaments: React.FC<SakodeAmbientOrnamentsProps> = ({
  showSticker = true,
  showForegroundBadges,
  className,
}) => {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'pointer-events-none select-none absolute inset-0 overflow-hidden z-0',
        className
      )}
    >
      {/* =================================================================== */}
      {/* 1. SOFT AMBIENT LIGHTING (Pendaran Gradien Lembut & Tenang) */}
      {/* =================================================================== */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-gradient-to-tr from-sky-400/10 via-purple-400/5 to-amber-400/5 dark:from-sakode-cyan/12 dark:via-sakode-purple/10 dark:to-amber-400/5 rounded-full blur-3xl opacity-70" />

      {/* =================================================================== */}
      {/* 2. OFFICIAL SAKODE BRAND WATERMARKS (Tenang, Proporsional & Elegan) */}
      {/* =================================================================== */}
      {/* Sudut Kanan Atas: SAKODE Work Emblem */}
      <div className="hidden sm:block absolute -right-10 top-12 w-64 md:w-80 lg:w-96 opacity-[0.07] dark:opacity-[0.12] rotate-6 filter dark:drop-shadow-[0_0_24px_rgba(113,207,254,0.25)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sakode-work-emblem.png"
          alt=""
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Sudut Kiri Bawah: SAKODE Brandmark Vector */}
      <div className="hidden sm:block absolute -left-10 -bottom-10 w-56 md:w-72 lg:w-84 opacity-[0.06] dark:opacity-[0.10] -rotate-12 filter dark:drop-shadow-[0_0_24px_rgba(188,113,254,0.25)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sakode-brandmark.svg"
          alt=""
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Monogram Monospaced Subtil di Latar */}
      <div className="hidden lg:block absolute left-[10%] top-[14%] text-[100px] font-mono font-black text-slate-400/10 dark:text-sky-400/10 select-none leading-none -rotate-6">
        &#123;k&#125;
      </div>

      {/* =================================================================== */}
      {/* 3. SUBTLE FLOATING STICKER ACCENT (Aksen Brand Resmi Ringan) */}
      {/* =================================================================== */}
      {showSticker && (
        <>
          {/* Brandmark Sticker di Kiri (Desktop) */}
          <div className="hidden xl:flex absolute left-8 top-1/2 -translate-y-1/2 flex-col items-center gap-1 p-2 rounded-2xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/80 shadow-md backdrop-blur-xs -rotate-6 opacity-75 dark:opacity-85">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/sakode-brandmark-sticker.svg"
              alt=""
              className="h-10 w-10 object-contain drop-shadow-xs"
            />
            <span className="text-[8px] font-mono font-black uppercase tracking-wider text-[#076991] dark:text-sakode-cyan">
              SAKODE Work
            </span>
          </div>

          {/* Kurva Senyum Emas Signature di Kanan Bawah */}
          <div className="hidden md:block absolute right-16 bottom-12 opacity-50 dark:opacity-75 rotate-6">
            <SakodeSmileArc className="w-10 h-3 text-amber-500" />
          </div>
        </>
      )}
    </div>
  );
};
