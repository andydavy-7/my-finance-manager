import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';
import { categories } from '../../../data/categories';
import type { AllTimeTransaction } from '../../../application/stores/transactionStore';

interface Props {
  allTransactions: AllTimeTransaction[];
  monthIds: string[]; // committed months, newest first
}

type TrendPeriod = '3m' | '6m' | 'all';

function fmtTick(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k';
  return String(v);
}

export function CategoryTrendChart({ allTransactions, monthIds }: Props) {
  const [selectedCat, setSelectedCat] = useState('groceries');
  const [period, setPeriod] = useState<TrendPeriod>('6m');

  const filteredMonthIds = useMemo(() => {
    const slice = period === '3m' ? monthIds.slice(0, 3) : period === '6m' ? monthIds.slice(0, 6) : monthIds;
    return [...slice].reverse(); // chronological order
  }, [monthIds, period]);

  const chartData = useMemo(() => {
    return filteredMonthIds.map((mid) => {
      const andrew = allTransactions
        .filter((t) => t.monthId === mid && t.owner === 'andrew' && t.categoryId === selectedCat)
        .reduce((s, t) => s + t.amount, 0);
      const shammi = allTransactions
        .filter((t) => t.monthId === mid && t.owner === 'shammi' && t.categoryId === selectedCat)
        .reduce((s, t) => s + t.amount, 0);
      return {
        month: format(parseISO(mid + '-01'), 'MMM yy'),
        andrew,
        shammi
      };
    });
  }, [allTransactions, filteredMonthIds, selectedCat]);

  const hasData = chartData.some((d) => d.andrew > 0 || d.shammi > 0);
  const activeCat = categories.find((c) => c.id === selectedCat);

  const pillStyle = (active: boolean, color?: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 12px',
    borderRadius: 20,
    border: `1px solid ${active && color ? color : 'var(--color-border)'}`,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    background: active && color ? color : 'var(--color-surface)',
    color: active ? '#fff' : 'var(--color-text-secondary)',
    fontFamily: 'var(--font-sans)'
  });

  const toggleStyle = (active: boolean): React.CSSProperties => ({
    padding: '5px 13px',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    background: active ? 'var(--color-accent)' : 'transparent',
    color: active ? '#fff' : 'var(--color-text-secondary)',
    fontFamily: 'var(--font-sans)'
  });

  return (
    <div>
      {/* Controls row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 18,
          flexWrap: 'wrap'
        }}
      >
        {/* Category pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              style={pillStyle(selectedCat === cat.id, cat.color)}
              onClick={() => setSelectedCat(cat.id)}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: selectedCat === cat.id ? '#fff' : cat.color,
                  flexShrink: 0
                }}
              />
              {cat.name}
            </button>
          ))}
        </div>

        {/* Period selector + legend */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8, flexShrink: 0 }}>
          <div
            style={{
              display: 'flex',
              gap: 4,
              padding: 3,
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              background: 'var(--color-bg)'
            }}
          >
            {(['3m', '6m', 'all'] as const).map((p) => (
              <button key={p} type="button" style={toggleStyle(period === p)} onClick={() => setPeriod(p)}>
                {p === '3m' ? '3 Months' : p === '6m' ? '6 Months' : 'All Time'}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              <div style={{ width: 18, height: 3, borderRadius: 2, background: '#1e40af' }} />
              Andrew
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-secondary)' }}>
              <div style={{ width: 18, height: 3, borderRadius: 2, background: '#9f1239' }} />
              Shammi
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {filteredMonthIds.length === 0 || !hasData ? (
        <div
          style={{
            height: 260,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-text-tertiary)',
            fontSize: 14,
            border: '1px dashed var(--color-border)',
            borderRadius: 8
          }}
        >
          No data for {activeCat?.name ?? selectedCat} in this period
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData} margin={{ top: 12, right: 24, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtTick} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip
              formatter={(value: number | undefined, name: string | undefined) => [
                value == null
                  ? '—'
                  : 'LKR ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value),
                name === 'andrew' ? 'Andrew' : 'Shammi'
              ]}
              contentStyle={{
                borderRadius: 8,
                border: '1px solid var(--color-border)',
                fontSize: 12,
                boxShadow: 'var(--shadow)'
              }}
            />
            {/* Zero reference */}
            <ReferenceLine y={0} stroke="var(--color-border)" />
            <Line
              type="monotone"
              dataKey="andrew"
              name="andrew"
              stroke="#1e40af"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#1e40af', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="shammi"
              name="shammi"
              stroke="#9f1239"
              strokeWidth={2.5}
              dot={{ r: 4, fill: '#9f1239', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
