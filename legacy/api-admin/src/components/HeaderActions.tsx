'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n';
import DarkModeToggle from '@/components/DarkModeToggle';

const ADMIN_JWT_STORAGE_KEY = 'tokfriends.admin.jwt';

export default function HeaderActions() {
  const router = useRouter();
  const { locale, setLocale } = useI18n();

  const onLogout = () => {
    localStorage.removeItem(ADMIN_JWT_STORAGE_KEY);
    router.replace('/login');
  };

  return (
    <div className="flex items-center gap-2">
      <DarkModeToggle />
      <div className="flex gap-2 text-sm">
        <button
          onClick={() => setLocale('ko')}
          className={`px-2 py-1 rounded ${locale === 'ko' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700 dark:text-slate-100'}`}
        >
          한국어
        </button>
        <button
          onClick={() => setLocale('en')}
          className={`px-2 py-1 rounded ${locale === 'en' ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-slate-700 dark:text-slate-100'}`}
        >
          English
        </button>
      </div>
      <button
        onClick={onLogout}
        className="ml-3 px-3 py-1.5 rounded bg-red-600 text-white text-sm hover:bg-red-700"
        title="Logout"
      >
        로그아웃
      </button>
    </div>
  );
}
