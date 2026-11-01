'use client';

import React from 'react';
import { LayoutGrid, List, Table } from 'lucide-react';

export type ViewMode = 'grid' | 'list' | 'table';

export interface ViewModeToggleProps {
  value?: ViewMode;
  currentMode?: ViewMode;
  onChange: (mode: ViewMode) => void;
  className?: string;
  storageKey?: string;
}

export function ViewModeToggle({
  value,
  currentMode,
  onChange,
  className = '',
  storageKey,
}: ViewModeToggleProps) {
  const activeMode = currentMode ?? value ?? 'list';

  const handleSelect = (mode: ViewMode) => {
    onChange(mode);
    if (storageKey && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, mode);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div
      className={`flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shrink-0 ${className}`}
      role="group"
      aria-label="Pilih format tampilan"
    >
      <button
        type="button"
        onClick={() => handleSelect('grid')}
        title="Tampilan Card Besar"
        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          activeMode === 'grid'
            ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-cyan-400 shadow-2xs'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden xl:inline text-[11px]">Card</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('list')}
        title="Tampilan Memanjang (List)"
        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          activeMode === 'list'
            ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-cyan-400 shadow-2xs'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <List className="h-4 w-4" />
        <span className="hidden xl:inline text-[11px]">List</span>
      </button>

      <button
        type="button"
        onClick={() => handleSelect('table')}
        title="Tampilan Format Tabel"
        className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
          activeMode === 'table'
            ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-cyan-400 shadow-2xs'
            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
        }`}
      >
        <Table className="h-4 w-4" />
        <span className="hidden xl:inline text-[11px]">Tabel</span>
      </button>
    </div>
  );
}
