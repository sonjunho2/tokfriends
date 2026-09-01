'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { adminReportsApi, adminBlocksApi, type ReportStatus } from '@/lib/api';
import Table, { type Column } from '@/components/Table';
import { useI18n } from '@/i18n';

type ReportRow = {
  id: number | string;
  reporterId?: string | null;
  reportedId?: string | null;
  postId?: string | null;
  reason?: string | null;
  status: ReportStatus;
  createdAt?: string;
};

const STATUSES: ReportStatus[] = ['PENDING', 'REVIEWING'];

export default function ReviewPage() {
  const { t } = useI18n();
  const [status, setStatus] = useState<ReportStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(
    () => (status === 'PENDING' ? t('nav.review') + ' (대기)' : t('nav.review') + ' (검토중)'),
    [status, t]
  );

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminReportsApi.list({
        status,
        search: search || undefined,
        page: 1,
        limit: 50,
      });
      const data = res as any;
      if (data?.ok) {
        const onlyPosts = (data.data as ReportRow[]).filter((r) => !!r.postId);
        setRows(onlyPosts);
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

  const blockReported = async (reportedId?: string | null) => {
    if (!reportedId) return;
    setActing(reportedId);
    setError(null);
    try {
      await adminBlocksApi.create(reportedId, reportedId);
      alert('차단 완료(데모)');
    } catch (e: any) {
      setError(e?.message || '차단 실패');
    } finally {
      setActing(null);
    }
  };

  const columns: Column<ReportRow>[] = [
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
          <button
            onClick={() => changeStatus(r.id, 'RESOLVED')}
            disabled={acting === r.id}
            className="px-2 py-1 rounded bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
          >
            승인
          </button>
          <button
            onClick={() => changeStatus(r.id, 'REJECTED')}
            disabled={acting === r.id}
            className="px-2 py-1 rounded bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
          >
            반려
          </button>
          <button
            onClick={() => blockReported(r.reportedId)}
            disabled={acting === r.reportedId}
            className="px-2 py-1 rounded bg-gray-600 text-white text-sm hover:bg-gray-700 disabled:opacity-50"
          >
            차단
          </button>
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
            <option key={s} value={s}>
              {s}
            </option>
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

      <Table<ReportRow>
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText={t('table.empty')}
        rowKey={(row) => row.id}
      />
    </main>
  );
}
