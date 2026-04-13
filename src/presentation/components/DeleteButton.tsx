import { useState } from 'react';
import { useTransactionStore } from '../../application/stores/transactionStore';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

/**
 * DeleteButton Component
 *
 * Provides a two-step confirmation flow for deleting all data for a month.
 * Only appears when editing a committed month.
 *
 * @example
 * <DeleteButton />
 */
export function DeleteButton() {
  const { currentMonth, isEditing, deleteCurrentMonth } = useTransactionStore();
  const navigate = useNavigate();
  const [confirmationStep, setConfirmationStep] = useState<'none' | 'first' | 'second'>('none');

  // Only show when editing a committed month
  if (!isEditing || !currentMonth?.isCommitted) {
    return null;
  }

  const handleDelete = () => {
    if (confirmationStep === 'none') {
      setConfirmationStep('first');
    } else if (confirmationStep === 'first') {
      setConfirmationStep('second');
    } else {
      // Final confirmation - delete the month
      deleteCurrentMonth();
      setConfirmationStep('none');
      
      // Navigate to current month after deletion
      const currentMonthId = format(new Date(), 'yyyy-MM');
      navigate(currentMonthId === currentMonth.id ? '/' : `/month/${currentMonthId}`);
    }
  };

  const handleCancel = () => {
    setConfirmationStep('none');
  };

  return (
    <div
      style={{
        marginTop: 64,
        paddingTop: 32,
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16
      }}
    >
      {confirmationStep === 'none' && (
        <button
          type="button"
          onClick={handleDelete}
          style={{
            background: 'transparent',
            color: 'var(--color-error)',
            border: '1px solid var(--color-error)',
            borderRadius: 6,
            padding: '10px 20px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--color-error)';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--color-error)';
          }}
        >
          Delete Month Data
        </button>
      )}

      {confirmationStep === 'first' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <p style={{ 
            margin: 0, 
            color: 'var(--color-error)', 
            fontWeight: 500,
            fontSize: 14
          }}>
            Are you sure you want to delete all data for {currentMonth.month}?
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '8px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                background: 'var(--color-error)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Yes, Delete
            </button>
          </div>
        </div>
      )}

      {confirmationStep === 'second' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <p style={{ 
            margin: 0, 
            color: 'var(--color-error)', 
            fontWeight: 600,
            fontSize: 15
          }}>
            This action cannot be undone. All transactions, splits, and reconciliation data will be permanently deleted.
          </p>
          <p style={{ 
            margin: 0, 
            color: 'var(--color-text-secondary)', 
            fontSize: 13
          }}>
            Click "Confirm Delete" to permanently remove all data for {currentMonth.month}.
          </p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={handleCancel}
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 6,
                padding: '8px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              style={{
                background: 'var(--color-error)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '8px 16px',
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
