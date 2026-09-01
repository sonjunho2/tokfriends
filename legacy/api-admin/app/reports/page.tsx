'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { adminReportsApi, type ReportStatus } from '@/lib/api';
import Table, { type Column } from '@/components/Table';
import { useI18n } from '@/i18n';

type Row = {
  id: number | string;
  reporterId?: string | null;
  reportedId?: string | null;
  postId?: string | null;
  reason?: string | null;
  status: ReportStatus;
  createdAt?: string;
};

const STATUSES: ReportStatus[] = ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'];

export default function ReportsPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<ReportStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    switch (status) {
      case 'PENDING': return t('nav.reports') + ' (대기)';
      case 'REVIEWING': return t('nav.reports') + ' (검토중)';
      case 'RESOLVED': return t('nav.reports') + ' (완료)';
      case 'REJECTED': return t('nav.reports') + ' (반려)';
      default: return t('nav.reports');
    }
  }, [status, t]);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminReportsApi.list({
        status,
        search: search || undefined,
        page: 1,
        limit: 20,
      });
      const data = res as any;
      if (data?.ok) {
        setRows(data.data as Row[]);
      } else {
        setError(t('table.empty'));
      }
    } catch (e: any) {
      setError(e?.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const changeStatus = async (id: string | number, next: ReportStatus) => {
    setActing(id);
    setError(null);
    try {
      await adminReportsApi.updateStatus(String(id), next);
      await load();
    } catch (e: any) {
      setError(e?.message || '상태 변경 실패');
    } finally {
      setActing(null);
    }
  };

  const columns: Column<Row>[] = [
    { key: 'id', header: 'ID' },
    { key: 'reporterId', header: '신고자' },
    { key: 'reportedId', header: '피신고자' },
    { key: 'postId', header: '포스트' },
    { key: 'reason', header: '사유' },
    { key: 'status', header: '상태' },
    {
      key: 'actions',
      header: '액션',
      render: (r) => (
        <div className="flex flex-wrap gap-2">
          {r.status !== 'REVIEWING' && (
            <button
              onClick={() => changeStatus(r.id, 'REVIEWING')}
              disabled={acting === r.id}
              className="px-2 py-1 rounded bg-amber-600 text-white text-sm hover:bg-amber-700 disabled:opacity-50"
            >
              검토중
            </button>
          )}
          {r.status !== 'RESOLVED' && (
            <button
              onClick={() => changeStatus(r.id, 'RESOLVED')}
              disabled={acting === r.id}
              className="px-2 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
            >
              완료
            </button>
          )}
          {r.status !== 'REJECTED' && (
            <button
              onClick={() => changeStatus(r.id, 'REJECTED')}
              disabled={acting === r.id}
              className="px-2 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
            >
              반려
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">{title}</h1>

      <section className="bg-white rounded-2xl shadow p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <select
          className="border rounded px-3 py-2"
          value={status}
          onChange={(e) => setStatus(e.target.value as ReportStatus)}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          className="border rounded px-3 py-2 md:col-span-2"
          placeholder="검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
          onClick={load}
          disabled={loading}
        >
          {t('common.refresh')}
        </button>
      </section>

      {error && <div className="text-red-600">{error}</div>}

      <Table<Row>
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText={t('table.empty')}
        rowKey={(row) => row.id}
      />
    </main>
  );
}
