import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { useTransactionStore, type Owner } from '../../application/stores/transactionStore';
import { CategoryBadge, CategorySelector } from './CategoryBadge';
import { getCategoryById } from '../../data/categories';
import { ColumnFilter, FilterIcon, type FilterOptionItem } from './ColumnFilter';

type FilterOption = 'all' | 'andrew' | 'shammi';
type SortColumn = 'date' | 'transaction' | 'owner' | 'category' | 'amount';
type SortDirection = 'asc' | 'desc';
type FilterableColumn = 'date' | 'transaction' | 'category' | 'amount';

function fmt(amount: number): string {
  return 'LKR ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
}

const emptyFilters = (): Record<FilterableColumn, Set<string>> => ({
  date: new Set(),
  transaction: new Set(),
  category: new Set(),
  amount: new Set(),
});

export function TransactionsTab() {
  const [filter, setFilter] = useState<FilterOption>('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<{ owner: Owner; id: string } | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [colFilters, setColFilters] = useState<Record<FilterableColumn, Set<string>>>(emptyFilters);
  const [openFilter, setOpenFilter] = useState<FilterableColumn | null>(null);

  const { getAllTransactions, updateCategory, currentMonth, isEditing } = useTransactionStore();
  const list = getAllTransactions();

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Row → key for each filterable column (must match how options are keyed below)
  const colKey = (t: (typeof list)[number], col: FilterableColumn): string => {
    switch (col) {
      case 'date': return format(t.date, 'yyyy-MM-dd');
      case 'transaction': return t.particulars;
      case 'category': return t.categoryId;
      case 'amount': return String(t.amount);
    }
  };

  // Distinct value lists per column, appropriately sorted, for the popovers
  const options = useMemo(() => {
    const dateMap = new Map<string, string>();
    const txnSet = new Set<string>();
    const catSet = new Set<string>();
    const amtSet = new Set<number>();
    for (const t of list) {
      dateMap.set(format(t.date, 'yyyy-MM-dd'), format(t.date, 'dd MMM yyyy'));
      txnSet.add(t.particulars);
      catSet.add(t.categoryId);
      amtSet.add(t.amount);
    }
    const date: FilterOptionItem[] = [...dateMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([key, label]) => ({ key, label }));
    const transaction: FilterOptionItem[] = [...txnSet]
      .sort((a, b) => a.localeCompare(b))
      .map((p) => ({ key: p, label: p }));
    const category: FilterOptionItem[] = [...catSet]
      .map((id) => ({ key: id, label: getCategoryById(id)?.name ?? id }))
      .sort((a, b) => a.label.localeCompare(b.label));
    const amount: FilterOptionItem[] = [...amtSet]
      .sort((a, b) => a - b)
      .map((n) => ({ key: String(n), label: fmt(n) }));
    return { date, transaction, category, amount };
  }, [list]);

  const filtered = useMemo(() => {
    let out = list;
    if (filter === 'andrew') out = out.filter((t) => t.owner === 'andrew');
    else if (filter === 'shammi') out = out.filter((t) => t.owner === 'shammi');
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((t) => t.particulars.toLowerCase().includes(q));
    }
    (['date', 'transaction', 'category', 'amount'] as FilterableColumn[]).forEach((col) => {
      const sel = colFilters[col];
      if (sel.size > 0) out = out.filter((t) => sel.has(colKey(t, col)));
    });
    return out;
  }, [list, filter, search, colFilters]);

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

  // Footer summary reflects the filtered set (independent of sorting)
  const summary = useMemo(() => {
    let total = 0, andrew = 0, shammi = 0;
    for (const t of filtered) {
      total += t.amount;
      if (t.owner === 'andrew') andrew += t.amount;
      else shammi += t.amount;
    }
    return { total, andrew, shammi, count: filtered.length };
  }, [filtered]);

  const anyColFilterActive = (['date', 'transaction', 'category', 'amount'] as FilterableColumn[])
    .some((c) => colFilters[c].size > 0);

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

  const thBase: React.CSSProperties = {
    padding: '12px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--color-text-secondary)',
    textTransform: 'uppercase',
    userSelect: 'none',
  };

  const renderHeader = (col: SortColumn, label: string, align: 'left' | 'right') => {
    const filterable = col !== 'owner';
    const fcol = col as FilterableColumn;
    return (
      <th key={col} style={{ ...thBase, textAlign: align }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            justifyContent: align === 'right' ? 'flex-end' : 'flex-start',
            position: 'relative',
          }}
        >
          <span
            onClick={() => handleSort(col)}
            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            {label}
            {sortColumn === col && (
              <span style={{ color: 'var(--color-accent)' }}>{sortDirection === 'asc' ? '↑' : '↓'}</span>
            )}
          </span>
          {filterable && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setOpenFilter(openFilter === fcol ? null : fcol);
              }}
              title={`Filter ${label}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: 2,
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: 'var(--color-text-tertiary)',
              }}
            >
              <FilterIcon active={colFilters[fcol].size > 0} />
            </button>
          )}
          {filterable && openFilter === fcol && (
            <ColumnFilter
              title={label}
              options={options[fcol]}
              selected={colFilters[fcol]}
              searchable={fcol === 'transaction' || fcol === 'category' || fcol === 'amount'}
              align={align}
              onApply={(next) => setColFilters((prev) => ({ ...prev, [fcol]: next }))}
              onClose={() => setOpenFilter(null)}
            />
          )}
        </div>
      </th>
    );
  };

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
        {anyColFilterActive && (
          <button
            type="button"
            onClick={() => setColFilters(emptyFilters())}
            style={{
              padding: '8px 14px',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              background: 'var(--color-surface)',
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-surface)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
              {renderHeader('date', 'Date', 'left')}
              {renderHeader('transaction', 'Transaction', 'left')}
              {renderHeader('owner', 'Owner', 'left')}
              {renderHeader('category', 'Category', 'left')}
              {renderHeader('amount', 'Amount', 'right')}
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
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: 32, textAlign: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>
                  No transactions match the current filters.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--color-bg)', borderTop: '2px solid var(--color-border)' }}>
              <td colSpan={4} style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-secondary)' }}>
                <span style={{ fontWeight: 600 }}>{summary.count}</span> transaction{summary.count !== 1 ? 's' : ''}
                <span style={{ color: 'var(--color-text-tertiary)', marginLeft: 12 }}>
                  Andrew {fmt(summary.andrew)} · Shammi {fmt(summary.shammi)}
                </span>
              </td>
              <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14 }}>
                {fmt(summary.total)}
              </td>
            </tr>
          </tfoot>
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
