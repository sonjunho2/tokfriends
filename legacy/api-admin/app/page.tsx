'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n';

export default function Page() {
  const { t } = useI18n();

  return (
    <main>
      <h1 className="text-2xl font-semibold mb-2">{t('dashboard.title')}</h1>
      <p className="text-sm text-slate-600 mb-6">{t('dashboard.subtitle')}</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/metrics" className="rounded-2xl p-4 shadow bg-white block hover:bg-slate-50">
          <h2 className="font-medium">{t('nav.metrics')}</h2>
        </Link>
        <Link href="/announcements" className="rounded-2xl p-4 shadow bg-white block hover:bg-slate-50">
          <h2 className="font-medium">{t('nav.announcements')}</h2>
        </Link>
        <Link href="/reports" className="rounded-2xl p-4 shadow bg-white block hover:bg-slate-50">
          <h2 className="font-medium">{t('nav.reports')}</h2>
        </Link>
        <Link href="/users" className="rounded-2xl p-4 shadow bg-white block hover:bg-slate-50">
          <h2 className="font-medium">{t('nav.users')}</h2>
        </Link>
        <Link href="/review" className="rounded-2xl p-4 shadow bg-white block hover:bg-slate-50">
          <h2 className="font-medium">{t('nav.review')}</h2>
        </Link>
      </div>
    </main>
  );
}
