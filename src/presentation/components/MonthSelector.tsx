import { useEffect } from 'react';
import { useTransactionStore } from '../../application/stores/transactionStore';

export function MonthSelector() {
  const { selectedMonthId, monthIds, setSelectedMonth, refreshMonthIds, getMonthLabel, isEditing, draftMonth } =
    useTransactionStore();

  useEffect(() => {
    refreshMonthIds();
  }, [refreshMonthIds]);

  const options: { value: string; label: string }[] = [];
  
  // Always show "Current Month (Draft)" option if we have a draft month
  if (draftMonth) {
    const draftLabel = draftMonth.isCommitted 
      ? draftMonth.month 
      : `Current Month (Draft) — ${draftMonth.month}`;
    options.push({ value: 'draft', label: draftLabel });
  }
  
  // Add all committed months
  monthIds.forEach((id) => {
    const label = getMonthLabel(id);
    // If we're editing this month, show it with "(Editing)" indicator
    if (isEditing && selectedMonthId === id) {
      options.push({ value: id, label: `${label} (Editing)` });
    } else {
      options.push({ value: id, label });
    }
  });

  return (
    <div style={{ position: 'relative' }}>
      <select
        value={selectedMonthId}
        onChange={(e) => {
          const newMonthId = e.target.value as 'draft' | string;
          if (newMonthId !== selectedMonthId) {
            setSelectedMonth(newMonthId);
          }
        }}
        style={{
          appearance: 'none',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          padding: '8px 36px 8px 12px',
          fontFamily: 'var(--font-sans)',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--color-text-primary)',
          cursor: 'pointer',
          minWidth: 200
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          pointerEvents: 'none',
          borderLeft: '4px solid transparent',
          borderRight: '4px solid transparent',
          borderTop: '5px solid var(--color-text-secondary)'
        }}
      />
    </div>
  );
}
