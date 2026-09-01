'use client';

import React, { useEffect, useState } from 'react';
import { metricsApi } from '@/lib/api';
import Table, { type Column } from '@/components/Table';
import { useI18n } from '@/i18n';

type MetricRow = {
  key: string;
  value: number;
};

export default function MetricsPage() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await metricsApi.summary();
      if (res?.ok) {
        const data = res.data as Record<string, number>;
        setRows(Object.entries(data).map(([k, v]) => ({ key: k, value: v })));
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
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns: Column<MetricRow>[] = [
    { key: 'key', header: t('nav.metrics') },
    { key: 'value', header: t('common.refresh') /* 표 헤더 예시로 임시 사용 */ },
  ];

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.metrics')}</h1>
      {error && <p className="text-red-600">{error}</p>}
      <Table<MetricRow>
        columns={columns}
        rows={rows}
        loading={loading}
        emptyText={t('table.empty')}
        rowKey={(r) => r.key}
      />
      <button
        onClick={fetchData}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {t('common.refresh')}
      </button>
    </main>
  );
}
