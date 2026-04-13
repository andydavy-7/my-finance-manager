import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import type { AllTimeTransaction } from '../../../application/stores/transactionStore';

interface Props {
  allTransactions: AllTimeTransaction[];
  monthIds: string[]; // committed, newest first
}

function fmtTick(v: number): string {
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (v >= 1_000) return (v / 1_000).toFixed(0) + 'k';
  return String(v);
}

export function MasterTrendChart({ allTransactions, monthIds }: Props) {
  const chartData = useMemo(() => {
    const chronoIds = [...monthIds].reverse();
    return chronoIds.map((mid) => {
      const andrew = allTransactions
        .filter((t) => t.monthId === mid && t.owner === 'andrew')
        .reduce((s, t) => s + t.amount, 0);
      const shammi = allTransactions
        .filter((t) => t.monthId === mid && t.owner === 'shammi')
        .reduce((s, t) => s + t.amount, 0);
      return {
        month: format(parseISO(mid + '-01'), 'MMM yy'),
        andrew,
        shammi,
        combined: andrew + shammi
      };
    });
  }, [allTransactions, monthIds]);

  if (chartData.length === 0) {
    return (
      <div
        style={{
          height: 280,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-text-tertiary)',
          fontSize: 14
        }}
      >
        No committed months yet
      </div>
    );
  }

  const fmtTooltip = (value: number | undefined) =>
    value == null
      ? '—'
      : 'LKR ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);

  return (
    <div>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
        {[
          { color: '#1e40af', label: 'Andrew total' },
          { color: '#9f1239', label: 'Shammi total' },
          { color: '#94a3b8', label: 'Combined', dashed: true }
        ].map(({ color, label, dashed }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            {dashed ? (
              <svg width="20" height="3">
                <line x1="0" y1="1.5" x2="20" y2="1.5" stroke={color} strokeWidth="2" strokeDasharray="5,3" />
              </svg>
            ) : (
              <div style={{ width: 18, height: 3, borderRadius: 2, background: color }} />
            )}
            {label}
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={chartData} margin={{ top: 12, right: 24, left: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="shammiGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#9f1239" stopOpacity={0.1} />
              <stop offset="95%" stopColor="#9f1239" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmtTick} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [
              fmtTooltip(value),
              name === 'andrew' ? 'Andrew' : name === 'shammi' ? 'Shammi' : 'Combined'
            ]}
            contentStyle={{
              borderRadius: 8,
              border: '1px solid var(--color-border)',
              fontSize: 12,
              boxShadow: 'var(--shadow)'
            }}
          />
          {/* Combined dashed */}
          <Line
            type="monotone"
            dataKey="combined"
            name="combined"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
          />
          {/* Andrew */}
          <Line
            type="monotone"
            dataKey="andrew"
            name="andrew"
            stroke="#1e40af"
            strokeWidth={2.5}
            dot={{ r: 4, fill: '#1e40af', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 6 }}
          />
          {/* Shammi */}
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
    </div>
  );
}
