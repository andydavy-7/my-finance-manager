import { useMemo } from 'react';
import { Transaction } from '../../domain/entities/Transaction';
import { categories, getCategoryById } from '../../data/categories';

interface SummaryCardProps {
  transactions: Transaction[];
}

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  } as React.CSSProperties,
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  } as React.CSSProperties,
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1e293b'
  } as React.CSSProperties,
  total: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#ef4444'
  } as React.CSSProperties,
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
    gap: '12px'
  } as React.CSSProperties,
  categoryCard: {
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#f8fafc'
  } as React.CSSProperties,
  categoryName: {
    fontSize: '12px',
    fontWeight: 500,
    marginBottom: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  } as React.CSSProperties,
  categoryAmount: {
    fontSize: '16px',
    fontWeight: 600,
    color: '#1e293b'
  } as React.CSSProperties,
  categoryCount: {
    fontSize: '11px',
    color: '#94a3b8'
  } as React.CSSProperties,
  colorDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block'
  } as React.CSSProperties
};

/**
 * Formats a number as currency (LKR)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

/**
 * Summary card showing totals by category
 */
export function SummaryCard({ transactions }: SummaryCardProps) {
  const categoryStats = useMemo(() => {
    const stats = new Map<string, { total: number; count: number }>();

    // Initialize all categories with zero
    categories.forEach(cat => {
      stats.set(cat.id, { total: 0, count: 0 });
    });

    // Calculate totals
    transactions.forEach(tx => {
      const current = stats.get(tx.categoryId) || { total: 0, count: 0 };
      stats.set(tx.categoryId, {
        total: current.total + tx.amount,
        count: current.count + 1
      });
    });

    // Convert to array and filter out zero totals
    return Array.from(stats.entries())
      .map(([categoryId, data]) => ({
        category: getCategoryById(categoryId)!,
        ...data
      }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const grandTotal = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Expense Summary</span>
        <span style={styles.total}>LKR {formatCurrency(grandTotal)}</span>
      </div>
      <div style={styles.grid}>
        {categoryStats.map(({ category, total, count }) => (
          <div key={category.id} style={styles.categoryCard}>
            <div style={styles.categoryName}>
              <span
                style={{
                  ...styles.colorDot,
                  backgroundColor: category.color
                }}
              />
              {category.name}
            </div>
            <div style={styles.categoryAmount}>
              {formatCurrency(total)}
            </div>
            <div style={styles.categoryCount}>
              {count} transaction{count !== 1 ? 's' : ''}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
