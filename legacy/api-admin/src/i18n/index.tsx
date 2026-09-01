'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Locale = 'ko' | 'en';

type Dict = Record<string, string>;
type Dictionaries = Record<Locale, Dict>;

const DICT: Dictionaries = {
  ko: {
    'dashboard.title': 'TokFriends Admin',
    'dashboard.subtitle': '관리자 대시보드. API 서버와 연동된 관리 기능에 접근하세요.',
    'nav.metrics': '메트릭스',
    'nav.announcements': '공지사항 관리',
    'nav.reports': '신고 관리',
    'nav.users': '유저 관리',
    'nav.review': '콘텐츠 검수',
    'common.refresh': '새로고침',
    'table.empty': '데이터가 없습니다.',
  },
  en: {
    'dashboard.title': 'TokFriends Admin',
    'dashboard.subtitle': 'Admin dashboard. Access API-integrated management features.',
    'nav.metrics': 'Metrics',
    'nav.announcements': 'Announcements',
    'nav.reports': 'Reports',
    'nav.users': 'Users',
    'nav.review': 'Content Review',
    'common.refresh': 'Refresh',
    'table.empty': 'No data.',
  },
};

const STORAGE_KEY = 'tokfriends.admin.locale';

function getInitialLocale(): Locale {
  if (typeof window !== 'undefined') {
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === 'ko' || saved === 'en') return saved;
    const lang = navigator.language?.toLowerCase() || 'ko';
    return lang.startsWith('ko') ? 'ko' : 'en';
  }
  return 'ko';
}

type I18nValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale());

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, l);
    }
  };

  useEffect(() => {
    // SSR → CSR 전환 시 저장된 값으로 동기화
    const saved = typeof window !== 'undefined'
      ? (window.localStorage.getItem(STORAGE_KEY) as Locale | null)
      : null;
    if (saved && saved !== locale) setLocaleState(saved);
  }, []);

  const t = useMemo(() => {
    const dict = DICT[locale] || {};
    return (key: string, vars?: Record<string, string | number>) => {
      let str = dict[key] ?? key;
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          str = str.replace(new RegExp(`{${k}}`, 'g'), String(v));
        });
      }
      return str;
    };
  }, [locale]);

  const value: I18nValue = { locale, setLocale, t };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
