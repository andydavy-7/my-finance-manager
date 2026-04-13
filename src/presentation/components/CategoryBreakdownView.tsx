import { useTransactionStore } from '../../application/stores/transactionStore';
import { getCategoryById, categories } from '../../data/categories';

/**
 * Formats a number as currency with LKR formatting
 */
function fmt(n: number): string {
  return new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/**
 * CategoryBreakdownView Component
 *
 * Displays aggregated statistics and per-category breakdown of expenses.
 * Shows empty state when no transactions or reconciliation data exists.
 *
 * @example
 * <CategoryBreakdownView />
 */
export function CategoryBreakdownView() {
  const { currentMonth, calculateReconciliation: runCalc } = useTransactionStore();
  const m = currentMonth;

  if (!m) return null;

  const rec = m.reconciliation;
  const breakdowns = rec?.categoryBreakdowns ?? [];

  // Separate breakdowns into shared and individual categories
  const sharedBreakdowns = breakdowns.filter(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    return cat?.splitType === 'shared';
  });
  const individualBreakdowns = breakdowns.filter(b => {
    const cat = categories.find(c => c.id === b.categoryId);
    return cat?.splitType === 'individual';
  });

  const totalSpent = rec
    ? rec.andrewTotal + rec.shammiTotal
    : m.andrewTransactions.reduce((s, t) => s + t.amount, 0) + m.shammiTransactions.reduce((s, t) => s + t.amount, 0);
  const sharedAmount = sharedBreakdowns.reduce((s, x) => s + x.totalAmount, 0);
  const totalCategories = sharedBreakdowns.length;
  const hasTx = m.andrewTransactions.length > 0 || m.shammiTransactions.length > 0;

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: 'var(--color-border-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Shared Categories</div>
          <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{totalCategories}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>requiring reconciliation</div>
        </div>
        <div style={{ background: 'var(--color-border-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Total Spent</div>
          <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmt(totalSpent)}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>LKR this month</div>
        </div>
        <div style={{ background: 'var(--color-border-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 20 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 8 }}>Shared Expenses</div>
          <div style={{ fontSize: 28, fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{fmt(sharedAmount)}</div>
          <div style={{ fontSize: 13, color: 'var(--color-text-tertiary)', marginTop: 4 }}>
            {totalSpent > 0 ? Math.round((sharedAmount / totalSpent) * 100) : 0}% of total
          </div>
        </div>
      </div>

      {breakdowns.length === 0 && hasTx && (
        <div style={{ marginBottom: 16 }}>
          <button
            type="button"
            onClick={() => runCalc()}
            style={{
              padding: '10px 20px',
              background: 'var(--color-accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Calculate Reconciliation
          </button>
        </div>
      )}

      {sharedBreakdowns.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)' }}>
            Shared Expenses
          </h3>
          <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 32 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-border-subtle)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Total</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Andrew Should Pay</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Andrew Paid</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)', borderLeft: '2px solid var(--color-border)' }}>Shammi Should Pay</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', color: 'var(--color-text-secondary)' }}>Shammi Paid</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Split</th>
                </tr>
              </thead>
              <tbody>
                {sharedBreakdowns.map((b) => {
                  const cat = getCategoryById(b.categoryId);
                  const andrewDiff = b.andrewPaid - b.andrewShouldPay;
                  const shammiDiff = b.shammiPaid - b.shammiShouldPay;

                  return (
                    <tr key={b.categoryId} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontSize: 12,
                            background: (cat as { backgroundColor?: string })?.backgroundColor ?? (cat?.color ? cat.color + '20' : '#f3f4f6'),
                            color: cat?.color ?? '#374151'
                          }}
                        >
                          {cat?.name ?? b.categoryId}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmt(b.totalAmount)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmt(b.andrewShouldPay)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmt(b.andrewPaid)}</span>
                          {Math.abs(andrewDiff) > 0.01 && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: andrewDiff > 0 ? '#10B981' : '#EF4444',
                                padding: '2px 6px',
                                borderRadius: 3,
                                background: andrewDiff > 0 ? '#ECFDF5' : '#FEF2F2'
                              }}
                            >
                              {andrewDiff > 0 ? '+' : ''}{fmt(andrewDiff)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13, borderLeft: '2px solid var(--color-border)' }}>{fmt(b.shammiShouldPay)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmt(b.shammiPaid)}</span>
                          {Math.abs(shammiDiff) > 0.01 && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: shammiDiff > 0 ? '#10B981' : '#EF4444',
                                padding: '2px 6px',
                                borderRadius: 3,
                                background: shammiDiff > 0 ? '#ECFDF5' : '#FEF2F2'
                              }}
                            >
                              {shammiDiff > 0 ? '+' : ''}{fmt(shammiDiff)}
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--color-text-tertiary)' }}>
                        {b.splitPercentages.shammi}/{b.splitPercentages.andrew}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {individualBreakdowns.length > 0 && (
        <>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: 'var(--color-text-primary)' }}>
            Individual Expenses
          </h3>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 12 }}>
            Each person bears their own expenses in these categories (no reconciliation needed)
          </p>
          <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-border-subtle)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Total</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Andrew Paid</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Shammi Paid</th>
                </tr>
              </thead>
              <tbody>
                {individualBreakdowns.map((b) => {
                  const cat = getCategoryById(b.categoryId);
                  return (
                    <tr key={b.categoryId} style={{ borderBottom: '1px solid var(--color-border-subtle)' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontSize: 12,
                            background: (cat as { backgroundColor?: string })?.backgroundColor ?? (cat?.color ? cat.color + '20' : '#f3f4f6'),
                            color: cat?.color ?? '#374151'
                          }}
                        >
                          {cat?.name ?? b.categoryId}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmt(b.totalAmount)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmt(b.andrewPaid)}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{fmt(b.shammiPaid)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!hasTx && (
        <div
          style={{
            color: 'var(--color-text-tertiary)',
            padding: 48,
            textAlign: 'center',
            background: 'var(--color-border-subtle)',
            borderRadius: 8,
            border: '1px dashed var(--color-border)'
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            No transactions yet
          </div>
          <div style={{ fontSize: 14 }}>
            Upload statements to see category breakdown and reconciliation data.
          </div>
        </div>
      )}

      {hasTx && breakdowns.length === 0 && rec && (
        <div
          style={{
            color: 'var(--color-text-tertiary)',
            padding: 48,
            textAlign: 'center',
            background: 'var(--color-border-subtle)',
            borderRadius: 8,
            border: '1px dashed var(--color-border)'
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
            No category breakdown available
          </div>
          <div style={{ fontSize: 14 }}>
            Transactions exist but no category breakdown was calculated.
          </div>
        </div>
      )}
    </div>
  );
}
