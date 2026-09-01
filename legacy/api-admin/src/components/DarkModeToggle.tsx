'use client';

import React from 'react';
import { useDarkMode } from '@/theme/DarkMode';

export default function DarkModeToggle() {
  const { dark, toggle } = useDarkMode();
  return (
    <button
      onClick={toggle}
      className="px-3 py-1.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 text-sm"
      title="Dark Mode"
    >
      {dark ? '라이트' : '다크'}
    </button>
  );
}
