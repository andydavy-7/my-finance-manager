import { useState } from 'react';
import { format } from 'date-fns';
import { Transaction } from '../../domain/entities/Transaction';
import { CategoryBadge, CategorySelector } from './CategoryBadge';

interface TransactionTableProps {
  transactions: Transaction[];
  onCategoryChange: (transactionId: string, categoryId: string) => void;
}

const styles = {
  container: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  } as React.CSSProperties,
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  } as React.CSSProperties,
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1e293b'
  } as React.CSSProperties,
  count: {
    fontSize: '14px',
    color: '#64748b'
  } as React.CSSProperties,
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  } as React.CSSProperties,
  th: {
    textAlign: 'left',
    padding: '12px 20px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0'
  } as React.CSSProperties,
  td: {
    padding: '14px 20px',
    fontSize: '14px',
    color: '#1e293b',
    borderBottom: '1px solid #f1f5f9'
  } as React.CSSProperties,
  dateCell: {
    fontWeight: 500,
    color: '#475569',
    whiteSpace: 'nowrap'
  } as React.CSSProperties,
  particularsCell: {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  } as React.CSSProperties,
  amountCell: {
    fontWeight: 600,
    color: '#ef4444',
    textAlign: 'right',
    whiteSpace: 'nowrap'
  } as React.CSSProperties,
  emptyState: {
    padding: '60px 20px',
    textAlign: 'center',
    color: '#94a3b8'
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
 * Table displaying parsed transactions with editable categories
 */
export function TransactionTable({ transactions, onCategoryChange }: TransactionTableProps) {
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  if (transactions.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.emptyState}>
          No transactions to display. Upload a statement to get started.
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Transactions</span>
        <span style={styles.count}>{transactions.length} items</span>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Transaction</th>
            <th style={styles.th}>Category</th>
            <th style={{ ...styles.th, textAlign: 'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(tx => (
            <tr key={tx.id}>
              <td style={{ ...styles.td, ...styles.dateCell }}>
                {format(tx.date, 'dd MMM yyyy')}
              </td>
              <td style={{ ...styles.td, ...styles.particularsCell }} title={tx.particulars}>
                {tx.particulars}
              </td>
              <td style={styles.td}>
                <CategoryBadge
                  categoryId={tx.categoryId}
                  onClick={() => setEditingTransaction(tx)}
                />
              </td>
              <td style={{ ...styles.td, ...styles.amountCell }}>
                {formatCurrency(tx.amount)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingTransaction && (
        <CategorySelector
          currentCategoryId={editingTransaction.categoryId}
          onSelect={(categoryId) => onCategoryChange(editingTransaction.id, categoryId)}
          onClose={() => setEditingTransaction(null)}
        />
      )}
    </div>
  );
}
