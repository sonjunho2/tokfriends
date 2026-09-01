import './globals.css';
import React from 'react';
import { I18nProvider } from '@/i18n';
import HeaderActions from '@/components/HeaderActions';
import { DarkModeProvider } from '@/theme/DarkMode';
import { redirect } from 'next/navigation';

const ADMIN_JWT_STORAGE_KEY = 'tokfriends.admin.jwt';

function AuthGuard({ children }: { children: React.ReactNode }) {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem(ADMIN_JWT_STORAGE_KEY);
    const path = window.location.pathname;
    if (!token && path !== '/login') {
      redirect('/login');
    }
  }
  return <>{children}</>;
}

export const metadata = { title: 'TokFriends Admin' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        <I18nProvider>
          <DarkModeProvider>
            <AuthGuard>
              <div className="mx-auto max-w-6xl p-6 space-y-4">
                <header className="flex justify-between items-center">
                  <h1 className="text-lg font-bold">TokFriends Admin</h1>
                  <HeaderActions />
                </header>
                {children}
              </div>
            </AuthGuard>
          </DarkModeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
