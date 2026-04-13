import { useMemo } from 'react';
import { getCategoryById } from '../../../data/categories';
import type { AllTimeTransaction } from '../../../application/stores/transactionStore';

interface Props {
  transactions: AllTimeTransaction[];
}

function fmt(n: number): string {
  return 'LKR ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const cardStyle = {
  background: 'var(--color-border-subtle)',
  border: '1px solid var(--color-border)',
  borderRadius: 8,
  padding: 20,
  boxShadow: 'var(--shadow-sm)'
} as const;

export function AnalyticsSummaryCards({ transactions }: Props) {
  const stats = useMemo(() => {
    const total = transactions.reduce((s, t) => s + t.amount, 0);
    const andrew = transactions.filter((t) => t.owner === 'andrew').reduce((s, t) => s + t.amount, 0);
    const shammi = transactions.filter((t) => t.owner === 'shammi').reduce((s, t) => s + t.amount, 0);
    const count = transactions.length;

    const categoryTotals = new Map<string, number>();
    for (const t of transactions) {
      categoryTotals.set(t.categoryId, (categoryTotals.get(t.categoryId) ?? 0) + t.amount);
    }
    let topCategoryId = '';
    let topAmount = 0;
    categoryTotals.forEach((amount, id) => {
      if (amount > topAmount) { topAmount = amount; topCategoryId = id; }
    });
    const topCategory = topCategoryId ? getCategoryById(topCategoryId) : null;

    return { total, andrew, shammi, count, topCategory };
  }, [transactions]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Total Spend</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{fmt(stats.total)}</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#1e40af', textTransform: 'uppercase', marginBottom: 8 }}>Andrew</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{fmt(stats.andrew)}</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#9f1239', textTransform: 'uppercase', marginBottom: 8 }}>Shammi</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{fmt(stats.shammi)}</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Transactions</div>
        <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-text-primary)' }}>{stats.count}</div>
      </div>
      <div style={cardStyle}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Top Category</div>
        {stats.topCategory ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: stats.topCategory.color, flexShrink: 0 }} />
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}>{stats.topCategory.name}</span>
          </div>
        ) : (
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-tertiary)' }}>—</div>
        )}
      </div>
    </div>
  );
}
