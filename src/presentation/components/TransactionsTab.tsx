import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useTransactionStore, type Owner } from '../../application/stores/transactionStore';
import { CategoryBadge, CategorySelector } from './CategoryBadge';
import { getCategoryById } from '../../data/categories';

type FilterOption = 'all' | 'andrew' | 'shammi';
type SortColumn = 'date' | 'transaction' | 'owner' | 'category' | 'amount';
type SortDirection = 'asc' | 'desc';

function fmt(amount: number): string {
  return 'LKR ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

export function TransactionsTab() {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<{ owner: Owner; id: string } | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const { getAllTransactions, updateCategory, currentMonth, isEditing } = useTransactionStore();
  const list = getAllTransactions();

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking the same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to ascending
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const filtered = useMemo(() => {
    let out = list;
    if (filter === 'andrew') out = out.filter((t) => t.owner === 'andrew');
    else if (filter === 'shammi') out = out.filter((t) => t.owner === 'shammi');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((t) => t.particulars.toLowerCase().includes(q));
    }
    return out;
  }, [list, filter, search]);

  const sorted = useMemo(() => {
    const sortedList = [...filtered];
    sortedList.sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'transaction':
          comparison = a.particulars.localeCompare(b.particulars);
          break;
        case 'owner':
          comparison = a.owner.localeCompare(b.owner);
          break;
        case 'category': {
          const categoryA = getCategoryById(a.categoryId)?.name || '';
          const categoryB = getCategoryById(b.categoryId)?.name || '';
          comparison = categoryA.localeCompare(categoryB);
          break;
        }
        case 'amount':
          comparison = a.amount - b.amount;
          break;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sortedList;
  }, [filtered, sortColumn, sortDirection]);

  const handleCategoryChange = (categoryId: string) => {
    if (editingId) {
      updateCategory(editingId.owner, editingId.id, categoryId);
      setEditingId(null);
    }
  };

  const canEdit = currentMonth && (!currentMonth.isCommitted || isEditing);

  if (list.length === 0) {
    return (
      <div style={{ padding: 48, textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
        No transactions. Upload statements in Upload Statements first.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 8, padding: 4, borderRadius: 6, border: '1px solid var(--color-border)', background: 'var(--color-bg)' }}>
          {(['all', 'andrew', 'shammi'] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px',
                border: 'none',
                background: filter === f ? 'var(--color-accent)' : 'transparent',
                color: filter === f ? '#fff' : 'var(--color-text-secondary)',
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
        <input
          type="text"
          placeholder="Search transactions…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 16px',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            background: 'var(--color-surface)'
          }}
        />
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
              <th 
                onClick={() => handleSort('date')}
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: 'var(--color-text-secondary)', 
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  position: 'relative',
                  paddingRight: 32
                }}
              >
                Date
                {sortColumn === 'date' && (
                  <span style={{ marginLeft: 6, color: 'var(--color-accent)' }}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('transaction')}
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: 'var(--color-text-secondary)', 
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  position: 'relative',
                  paddingRight: 32
                }}
              >
                Transaction
                {sortColumn === 'transaction' && (
                  <span style={{ marginLeft: 6, color: 'var(--color-accent)' }}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('owner')}
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: 'var(--color-text-secondary)', 
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  position: 'relative',
                  paddingRight: 32
                }}
              >
                Owner
                {sortColumn === 'owner' && (
                  <span style={{ marginLeft: 6, color: 'var(--color-accent)' }}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('category')}
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'left', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: 'var(--color-text-secondary)', 
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  position: 'relative',
                  paddingRight: 32
                }}
              >
                Category
                {sortColumn === 'category' && (
                  <span style={{ marginLeft: 6, color: 'var(--color-accent)' }}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th 
                onClick={() => handleSort('amount')}
                style={{ 
                  padding: '12px 16px', 
                  textAlign: 'right', 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: 'var(--color-text-secondary)', 
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  userSelect: 'none',
                  position: 'relative',
                  paddingRight: 32
                }}
              >
                Amount
                {sortColumn === 'amount' && (
                  <span style={{ marginLeft: 6, color: 'var(--color-accent)' }}>
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((tx) => (
              <tr key={`${tx.owner}-${tx.id}`} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {format(tx.date, 'dd MMM yyyy')}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 14, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tx.particulars}>
                  {tx.particulars}
                </td>
                <td style={{ padding: '14px 16px' }}>
                  <span
                    style={{
                      padding: '4px 10px',
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      background: tx.owner === 'andrew' ? '#dbeafe' : '#fce7f3',
                      color: tx.owner === 'andrew' ? '#1e40af' : '#9f1239'
                    }}
                  >
                    {tx.owner === 'andrew' ? 'Andrew' : 'Shammi'}
                  </span>
                </td>
                <td style={{ padding: '14px 16px' }}>
                  {canEdit ? (
                    <CategoryBadge categoryId={tx.categoryId} onClick={() => setEditingId({ owner: tx.owner, id: tx.id })} />
                  ) : (
                    <CategoryBadge categoryId={tx.categoryId} />
                  )}
                </td>
                <td style={{ padding: '14px 16px', fontFamily: 'var(--font-mono)', fontWeight: 500, textAlign: 'right' }}>
                  {fmt(tx.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingId && (
        <CategorySelector
          currentCategoryId={
            (editingId.owner === 'andrew'
              ? currentMonth?.andrewTransactions.find((t) => t.id === editingId.id)
              : currentMonth?.shammiTransactions.find((t) => t.id === editingId.id))?.categoryId ?? 'others'
          }
          onSelect={handleCategoryChange}
          onClose={() => setEditingId(null)}
        />
      )}
    </div>
  );
}
