import { useState, useEffect, useRef, useMemo } from 'react';
import { useTransactionStore } from '../../application/stores/transactionStore';
import { format, parseISO, getYear, getMonth } from 'date-fns';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * MonthYearPicker Component
 *
 * Calendar picker with separate month and year dropdowns.
 * Allows navigation to any month/year (past or future).
 * Defaults to current month/year on load or from URL.
 *
 * @example
 * <MonthYearPicker />
 */
export function MonthYearPicker() {
  const { currentMonth, setSelectedMonth } = useTransactionStore();
  
  // Get current year and month from selected month or current date
  const currentValues = useMemo(() => {
    const monthId = currentMonth?.id;
    if (monthId) {
      const date = parseISO(monthId + '-01');
      return { year: getYear(date), month: getMonth(date) };
    }
    const now = new Date();
    return { year: getYear(now), month: getMonth(now) };
  }, [currentMonth?.id]);

  const [selectedYear, setSelectedYear] = useState(currentValues.year);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(currentValues.month);
  const isInternalChange = useRef(false);

  // Sync with currentMonth when it changes (from URL or other navigation)
  // Use setTimeout to avoid synchronous setState in effect
  useEffect(() => {
    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }
    // Use setTimeout to defer state updates
    setTimeout(() => {
      setSelectedYear(currentValues.year);
      setSelectedMonthIndex(currentValues.month);
    }, 0);
  }, [currentValues.year, currentValues.month]);

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const handleMonthChange = (monthIndex: number) => {
    isInternalChange.current = true;
    setSelectedMonthIndex(monthIndex);
    const monthId = format(new Date(selectedYear, monthIndex, 1), 'yyyy-MM');
    setSelectedMonth(monthId);
  };

  const handleYearChange = (year: number) => {
    isInternalChange.current = true;
    setSelectedYear(year);
    const monthId = format(new Date(year, selectedMonthIndex, 1), 'yyyy-MM');
    setSelectedMonth(monthId);
  };

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ position: 'relative' }}>
        <select
          value={selectedMonthIndex}
          onChange={(e) => handleMonthChange(Number(e.target.value))}
          style={{
            appearance: 'none',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            padding: '8px 32px 8px 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            minWidth: 140
          }}
        >
          {MONTHS.map((month, index) => (
            <option key={index} value={index}>
              {month}
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
      
      <div style={{ position: 'relative' }}>
        <select
          value={selectedYear}
          onChange={(e) => handleYearChange(Number(e.target.value))}
          style={{
            appearance: 'none',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            padding: '8px 32px 8px 12px',
            fontFamily: 'var(--font-sans)',
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            minWidth: 100
          }}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
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
    </div>
  );
}
