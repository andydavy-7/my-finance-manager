import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { categories } from '../../../data/categories';
import { CategoryBadge } from '../CategoryBadge';
import type { AllTimeTransaction } from '../../../application/stores/transactionStore';

interface Props {
  transactions: AllTimeTransaction[];
  showMonthColumn: boolean;
}

type SortColumn = 'date' | 'month' | 'particulars' | 'owner' | 'category' | 'amount';
type SortDir = 'asc' | 'desc';

function fmt(n: number): string {
  return 'LKR ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

const thStyle = {
  padding: '12px 16px',
  textAlign: 'left' as const,
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--color-text-secondary)',
  textTransform: 'uppercase' as const,
  cursor: 'pointer',
  userSelect: 'none' as const
};

export function AnalyticsTransactionTable({ transactions, showMonthColumn }: Props) {
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'andrew' | 'shammi'>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<SortColumn>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (col: SortColumn) => {
    if (sortCol === col) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sortIndicator = (col: SortColumn) =>
    sortCol === col ? <span style={{ marginLeft: 4, color: 'var(--color-accent)' }}>{sortDir === 'asc' ? '↑' : '↓'}</span> : null;

  const processed = useMemo(() => {
    let out = transactions;
    if (ownerFilter !== 'all') out = out.filter((t) => t.owner === ownerFilter);
    if (categoryFilter !== 'all') out = out.filter((t) => t.categoryId === categoryFilter);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((t) => t.particulars.toLowerCase().includes(q));
    }

    return [...out].sort((a, b) => {
      let cmp = 0;
      switch (sortCol) {
        case 'date': cmp = a.date.getTime() - b.date.getTime(); break;
        case 'month': cmp = a.monthId.localeCompare(b.monthId); break;
        case 'particulars': cmp = a.particulars.localeCompare(b.particulars); break;
        case 'owner': cmp = a.owner.localeCompare(b.owner); break;
        case 'category': cmp = a.categoryId.localeCompare(b.categoryId); break;
        case 'amount': cmp = a.amount - b.amount; break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [transactions, ownerFilter, categoryFilter, search, sortCol, sortDir]);

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 8, padding: 4, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
          {(['all', 'andrew', 'shammi'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setOwnerFilter(f)}
              style={{
                padding: '6px 16px',
                border: 'none',
                background: ownerFilter === f ? 'var(--color-accent)' : 'transparent',
                color: ownerFilter === f ? '#fff' : 'var(--color-text-secondary)',
                fontSize: 13,
                fontWeight: 500,
                borderRadius: 4,
                cursor: 'pointer'
              }}
            >
              {f === 'all' ? 'All' : f === 'andrew' ? 'Andrew' : 'Shammi'}
            </button>
          ))}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            padding: '8px 12px',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            fontFamily: 'var(--font-sans)',
            fontSize: 13,
            background: 'var(--color-surface)',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            minWidth: 180,
            padding: '8px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            background: 'var(--color-surface)'
          }}
        />

        <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', whiteSpace: 'nowrap' }}>
          {processed.length} transaction{processed.length !== 1 ? 's' : ''}
        </span>
      </div>

      {processed.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>
          No transactions match the current filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                <th style={thStyle} onClick={() => handleSort('date')}>Date{sortIndicator('date')}</th>
                {showMonthColumn && <th style={thStyle} onClick={() => handleSort('month')}>Month{sortIndicator('month')}</th>}
                <th style={thStyle} onClick={() => handleSort('particulars')}>Particulars{sortIndicator('particulars')}</th>
                <th style={thStyle} onClick={() => handleSort('owner')}>Owner{sortIndicator('owner')}</th>
                <th style={thStyle} onClick={() => handleSort('category')}>Category{sortIndicator('category')}</th>
                <th style={{ ...thStyle, textAlign: 'right' }} onClick={() => handleSort('amount')}>Amount{sortIndicator('amount')}</th>
              </tr>
            </thead>
            <tbody>
              {processed.map((tx) => (
                <tr key={`${tx.owner}-${tx.id}`} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                    {format(tx.date, 'dd MMM yyyy')}
                  </td>
                  {showMonthColumn && (
                    <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                      {tx.monthId}
                    </td>
                  )}
                  <td style={{ padding: '12px 16px', fontSize: 14, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.particulars}>
                    {tx.particulars}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      background: tx.owner === 'andrew' ? '#dbeafe' : '#fce7f3',
                      color: tx.owner === 'andrew' ? '#1e40af' : '#9f1239'
                    }}>
                      {tx.owner === 'andrew' ? 'Andrew' : 'Shammi'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <CategoryBadge categoryId={tx.categoryId} />
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontWeight: 500, textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {fmt(tx.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
