import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import type { AllTimeTransaction } from '../../../application/stores/transactionStore';

interface Props {
  transactions: AllTimeTransaction[];
  ownerFilter: 'all' | 'andrew' | 'shammi';
}

const ANDREW_COLOR = '#1e40af';
const SHAMMI_COLOR = '#9f1239';
const TOTAL_COLOR = '#64748b';

function fmtTick(v: number): string {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
  return String(v);
}

export function MonthlyTrendChart({ transactions, ownerFilter }: Props) {
  const data = useMemo(() => {
    const map = new Map<string, { andrew: number; shammi: number }>();
    for (const t of transactions) {
      const entry = map.get(t.monthId) ?? { andrew: 0, shammi: 0 };
      if (t.owner === 'andrew') entry.andrew += t.amount;
      else entry.shammi += t.amount;
      map.set(t.monthId, entry);
    }

    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthId, vals]) => ({
        label: format(parseISO(monthId + '-01'), 'MMM yy'),
        andrew: vals.andrew,
        shammi: vals.shammi,
        total: vals.andrew + vals.shammi
      }));
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div style={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={fmtTick} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: number | undefined) =>
            value == null ? '' : 'LKR ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
          }
        />
        <Legend verticalAlign="top" />
        {(ownerFilter === 'all' || ownerFilter === 'andrew') && (
          <Line type="monotone" dataKey="andrew" name="Andrew" stroke={ANDREW_COLOR} strokeWidth={2} dot={{ r: 3 }} />
        )}
        {(ownerFilter === 'all' || ownerFilter === 'shammi') && (
          <Line type="monotone" dataKey="shammi" name="Shammi" stroke={SHAMMI_COLOR} strokeWidth={2} dot={{ r: 3 }} />
        )}
        {ownerFilter === 'all' && (
          <Line type="monotone" dataKey="total" name="Total" stroke={TOTAL_COLOR} strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3 }} />
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
