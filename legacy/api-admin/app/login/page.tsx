'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE = (process.env.NEXT_PUBLIC_TOK_API_BASE || '').replace(/\/+$/, '');
const ADMIN_JWT_STORAGE_KEY = 'tokfriends.admin.jwt';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!API_BASE) {
      setErr('환경변수 NEXT_PUBLIC_TOK_API_BASE 가 설정되지 않았습니다.');
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const res = await fetch(`${API_BASE}/auth/login/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.token) {
        throw new Error(data?.message || data?.error || `로그인 실패 (HTTP ${res.status})`);
      }
      // 관리자 JWT 저장
      localStorage.setItem(ADMIN_JWT_STORAGE_KEY, data.token as string);
      // 홈으로 이동
      router.replace('/');
    } catch (e: any) {
      setErr(e?.message || '로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[60vh] flex items-center justify-center">
      <form
        onSubmit={onSubmit}
        className="bg-white rounded-2xl shadow p-6 w-full max-w-sm space-y-4"
      >
        <h1 className="text-xl font-bold text-center">Admin 로그인</h1>
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        <input
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded px-3 py-2"
          required
        />
        {err && <p className="text-red-600 text-sm">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded py-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '로그인 중…' : '로그인'}
        </button>
      </form>
    </main>
  );
}
