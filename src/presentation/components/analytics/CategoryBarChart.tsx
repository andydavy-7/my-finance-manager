import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { getCategoryById } from '../../../data/categories';
import type { AllTimeTransaction } from '../../../application/stores/transactionStore';

interface Props {
  transactions: AllTimeTransaction[];
  ownerFilter: 'all' | 'andrew' | 'shammi';
  mode: 'grouped' | 'stacked';
}

const ANDREW_COLOR = '#1e40af';
const SHAMMI_COLOR = '#9f1239';

function fmtTick(v: number): string {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M';
  if (v >= 1000) return (v / 1000).toFixed(0) + 'k';
  return String(v);
}

export function CategoryBarChart({ transactions, ownerFilter, mode }: Props) {
  const data = useMemo(() => {
    const map = new Map<string, { andrew: number; shammi: number }>();
    for (const t of transactions) {
      const entry = map.get(t.categoryId) ?? { andrew: 0, shammi: 0 };
      if (t.owner === 'andrew') entry.andrew += t.amount;
      else entry.shammi += t.amount;
      map.set(t.categoryId, entry);
    }

    return Array.from(map.entries())
      .map(([categoryId, vals]) => {
        const cat = getCategoryById(categoryId);
        const total = vals.andrew + vals.shammi;
        return { name: cat?.name ?? categoryId, andrew: vals.andrew, shammi: vals.shammi, total };
      })
      .filter((d) => d.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  if (data.length === 0) {
    return (
      <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>
        No data for this period
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 48 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11 }}
          angle={-35}
          textAnchor="end"
          interval={0}
        />
        <YAxis tickFormatter={fmtTick} tick={{ fontSize: 11 }} />
        <Tooltip
          formatter={(value: number | undefined) =>
            value == null ? '' : 'LKR ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
          }
        />
        <Legend verticalAlign="top" />
        {(ownerFilter === 'all' || ownerFilter === 'andrew') && (
          <Bar dataKey="andrew" name="Andrew" fill={ANDREW_COLOR} stackId={mode === 'stacked' ? 'a' : undefined} radius={mode === 'grouped' ? [3, 3, 0, 0] : undefined} />
        )}
        {(ownerFilter === 'all' || ownerFilter === 'shammi') && (
          <Bar dataKey="shammi" name="Shammi" fill={SHAMMI_COLOR} stackId={mode === 'stacked' ? 'a' : undefined} radius={mode === 'stacked' ? [3, 3, 0, 0] : [3, 3, 0, 0]} />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}
