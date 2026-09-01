'use client';

import React, { useMemo, useState } from 'react';

export type Column<T extends Record<string, any>> = {
  key: keyof T | string;
  header: string;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
};

export type TableProps<T extends Record<string, any>> = {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  emptyText?: string;
  rowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
};

type SortState = { key: string | null; dir: 'asc' | 'desc' };

export default function Table<T extends Record<string, any>>({
  columns,
  rows,
  loading,
  emptyText = '데이터가 없습니다.',
  rowKey,
  onRowClick,
}: TableProps<T>) {
  const [sort, setSort] = useState<SortState>({ key: null, dir: 'asc' });

  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = (a as any)[sort.key!];
      const bv = (b as any)[sort.key!];
      const an = typeof av === 'number' ? av : Number(av);
      const bn = typeof bv === 'number' ? bv : Number(bv);
      const isNum = !Number.isNaN(an) && !Number.isNaN(bn);
      let comp = 0;
      if (isNum) comp = an - bn;
      else comp = String(av ?? '').localeCompare(String(bv ?? ''));
      return sort.dir === 'asc' ? comp : -comp;
    });
    return copy;
  }, [rows, sort]);

  const onHeaderClick = (c: Column<T>) => {
    if (!c.sortable) return;
    const key = String(c.key);
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' },
    );
  };

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow">
      <table className="min-w-full border-collapse">
        <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0 z-10">
          <tr>
            {columns.map((c) => {
              const active = sort.key === String(c.key);
              return (
                <th
                  key={String(c.key)}
                  onClick={() => onHeaderClick(c)}
                  className={`px-4 py-3 text-left text-sm font-semibold ${
                    c.sortable ? 'cursor-pointer select-none' : ''
                  } text-slate-700 dark:text-slate-100 ${c.className ?? ''}`}
                  title={c.sortable ? '정렬' : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {c.header}
                    {c.sortable && active && (sort.dir === 'asc' ? '▲' : '▼')}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-slate-500">
                불러오는 중...
              </td>
            </tr>
          ) : sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6 text-center text-sm text-slate-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            sorted.map((row, i) => {
              const key = rowKey ? rowKey(row, i) : i;
              return (
                <tr
                  key={key}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50' : ''
                  }`}
                  onClick={() => onRowClick?.(row, i)}
                >
                  {columns.map((c) => (
                    <td
                      key={String(c.key)}
                      className={`px-4 py-3 text-sm text-slate-800 dark:text-slate-100 ${c.className ?? ''}`}
                    >
                      {c.render ? c.render(row, i) : String((row as any)[c.key as string] ?? '')}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
