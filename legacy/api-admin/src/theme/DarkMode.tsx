'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Ctx = { dark: boolean; toggle: () => void };
const DarkCtx = createContext<Ctx | null>(null);
const STORAGE_KEY = 'tokfriends.admin.dark';

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === '1') return true;
    if (saved === '0') return false;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (dark) root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem(STORAGE_KEY, dark ? '1' : '0');
  }, [dark]);

  return (
    <DarkCtx.Provider value={{ dark, toggle: () => setDark(v => !v) }}>
      {children}
    </DarkCtx.Provider>
  );
}

export function useDarkMode() {
  const ctx = useContext(DarkCtx);
  if (!ctx) throw new Error('useDarkMode must be used within DarkModeProvider');
  return ctx;
}
