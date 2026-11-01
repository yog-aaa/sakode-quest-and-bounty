'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check initial theme from localStorage or document class
    const savedTheme = localStorage.getItem('sakode-theme');
    const isDark =
      savedTheme === 'dark' ||
      (!savedTheme && document.documentElement.classList.contains('dark'));

    if (isDark) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    localStorage.setItem('sakode-theme', nextTheme);

    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Ganti mode tampilan"
        className={cn(
          'inline-flex items-center justify-center h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 text-slate-500 opacity-60 transition-colors',
          className
        )}
      >
        <Sun className="h-4 w-4" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Ganti mode tampilan"
      title={theme === 'light' ? 'Beralih ke Mode Gelap' : 'Beralih ke Mode Terang'}
      className={cn(
        'inline-flex items-center justify-center h-9 w-9 rounded-lg border transition-all cursor-pointer',
        'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs',
        'dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        className
      )}
    >
      {theme === 'light' ? (
        <Moon className="h-4 w-4 text-slate-700 transition-transform hover:-rotate-12" />
      ) : (
        <Sun className="h-4 w-4 text-amber-400 transition-transform hover:rotate-45" />
      )}
    </button>
  );
};
