import { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { useTransactionStore, type AllTimeTransaction, type MonthlySettlement } from '../../application/stores/transactionStore';
import { LeftNavigationIndex } from '../components/LeftNavigationIndex';
import { ExpenseSummaryPanels } from '../components/analytics/ExpenseSummaryPanels';
import { CategoryTrendChart } from '../components/analytics/CategoryTrendChart';
import { MasterTrendChart } from '../components/analytics/MasterTrendChart';
import { SettlementsChart } from '../components/analytics/SettlementsChart';

type SummaryPeriod =
  | { type: 'month'; monthId: string }
  | { type: 'months'; count: 3 | 6 }
  | { type: 'all' };

const card: React.CSSProperties = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 10,
  padding: 24,
  boxShadow: 'var(--shadow-sm)'
};

export default function AnalyticsPage() {
  const { currentMonth, monthIds, refreshMonthIds, getAnalyticsTransactions, getSettlements } = useTransactionStore();

  const todayMonthId = format(new Date(), 'yyyy-MM');
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>({
    type: 'month',
    monthId: todayMonthId
  });
  const [allTimeTransactions, setAllTimeTransactions] = useState<AllTimeTransaction[]>([]);
  const [settlements, setSettlements] = useState<MonthlySettlement[]>([]);

  useEffect(() => {
    void (async () => {
      await refreshMonthIds();
      setAllTimeTransactions(await getAnalyticsTransactions());
      setSettlements(await getSettlements());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Map current (possibly uncommitted) month into AllTimeTransaction shape
  const currentMonthTransactions = useMemo<AllTimeTransaction[]>(() => {
    if (!currentMonth) return [];
    const mid = currentMonth.id;
    return [
      ...currentMonth.andrewTransactions.map((t) => ({
        id: t.id, monthId: mid, owner: 'andrew' as const,
        date: t.date, refNo: t.refNo ?? '', particulars: t.particulars,
        amount: t.amount, categoryId: t.categoryId
      })),
      ...currentMonth.shammiTransactions.map((t) => ({
        id: t.id, monthId: mid, owner: 'shammi' as const,
        date: t.date, refNo: t.refNo ?? '', particulars: t.particulars,
        amount: t.amount, categoryId: t.categoryId
      }))
    ];
  }, [currentMonth]);

  // Available months for the picker (committed + current if not committed)
  const availableMonths = useMemo(() => {
    const currentId = currentMonth?.id ?? todayMonthId;
    if (!monthIds.includes(currentId)) {
      return [currentId, ...monthIds];
    }
    return monthIds;
  }, [monthIds, currentMonth, todayMonthId]);

  // Transactions filtered to the selected summary period
  const summaryTransactions = useMemo<AllTimeTransaction[]>(() => {
    const { type } = summaryPeriod;
    if (type === 'month') {
      const { monthId } = summaryPeriod;
      // Use in-memory current month data (includes uncommitted)
      if (monthId === currentMonth?.id) return currentMonthTransactions;
      return allTimeTransactions.filter((t) => t.monthId === monthId);
    }
    if (type === 'months') {
      const slice = monthIds.slice(0, summaryPeriod.count);
      return allTimeTransactions.filter((t) => slice.includes(t.monthId));
    }
    return allTimeTransactions;
  }, [summaryPeriod, allTimeTransactions, currentMonthTransactions, monthIds, currentMonth]);

  const summaryNMonths = useMemo(() => {
    const { type } = summaryPeriod;
    if (type === 'month') return 1;
    if (type === 'months') return Math.min(summaryPeriod.count, monthIds.length);
    return monthIds.length || 1;
  }, [summaryPeriod, monthIds]);

  const summaryLabel = useMemo(() => {
    const { type } = summaryPeriod;
    if (type === 'month') {
      const { monthId } = summaryPeriod;
      if (monthId === (currentMonth?.id ?? todayMonthId) && currentMonth?.month) return currentMonth.month;
      try { return format(parseISO(monthId + '-01'), 'MMMM yyyy'); } catch { return monthId; }
    }
    if (type === 'months') return `Last ${summaryPeriod.count} Months`;
    return 'All Time';
  }, [summaryPeriod, currentMonth, todayMonthId]);

  const totalTransactions = allTimeTransactions.length;
  const totalMonths = monthIds.length;

  // ── Period Selector UI helpers ──────────────────────────────
  const isMonthMode = summaryPeriod.type === 'month';
  const activeMonthId = isMonthMode ? summaryPeriod.monthId : '';

  function setMonthPeriod(monthId: string) {
    setSummaryPeriod({ type: 'month', monthId });
  }
  function setRangePeriod(count: 3 | 6 | 'all') {
    if (count === 'all') setSummaryPeriod({ type: 'all' });
    else setSummaryPeriod({ type: 'months', count });
  }

  const pillBase: React.CSSProperties = {
    padding: '5px 13px',
    border: 'none',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)'
  };
  const pillActive: React.CSSProperties = { background: 'var(--color-accent)', color: '#fff' };
  const pillInactive: React.CSSProperties = { background: 'transparent', color: 'var(--color-text-secondary)' };
  const isActive3 = summaryPeriod.type === 'months' && summaryPeriod.count === 3;
  const isActive6 = summaryPeriod.type === 'months' && summaryPeriod.count === 6;
  const isActiveAll = summaryPeriod.type === 'all';

  return (
    <>
      {/* ── Header ── */}
      <header
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, height: 64,
          background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 32px', zIndex: 100, boxShadow: 'var(--shadow-sm)'
        }}
      >
        <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em' }}>Finance Manager V3</span>
      </header>

      <div style={{ display: 'flex', marginTop: 64, minHeight: 'calc(100vh - 64px)' }}>
        <LeftNavigationIndex />

        <main style={{ marginLeft: 240, flex: 1, padding: '32px 48px 64px', maxWidth: 1440 }}>

          {/* Page header */}
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: 'var(--color-text-primary)' }}>
            Analytics
          </h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 28 }}>
            {totalMonths} committed month{totalMonths !== 1 ? 's' : ''} · {totalTransactions} transactions
          </p>

          {/* ── Section: Expense Summary ── */}
          <div style={{ marginBottom: 32 }}>
            {/* Section header with period selector */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 12
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 15, fontWeight: 600 }}>Expense Summary</span>
                <span style={{ fontSize: 12, color: 'var(--color-text-tertiary)' }}>
                  All categories — sorted by household total
                </span>
              </div>

              {/* Period selector */}
              <div
                style={{
                  display: 'flex',
                  gap: 4,
                  padding: 3,
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  background: 'var(--color-bg)',
                  alignItems: 'center'
                }}
              >
                {/* Month picker — styled select */}
                <select
                  value={activeMonthId}
                  onChange={(e) => { if (e.target.value) setMonthPeriod(e.target.value); }}
                  style={{
                    ...pillBase,
                    background: isMonthMode ? 'var(--color-accent)' : 'transparent',
                    color: isMonthMode ? '#fff' : 'var(--color-text-secondary)',
                    outline: 'none',
                    cursor: 'pointer',
                    paddingRight: 8,
                    minWidth: 110,
                    // native select arrow keeps it usable
                  }}
                >
                  {/* Placeholder shown when a range pill is active */}
                  {!isMonthMode && (
                    <option value="" disabled>Month ▾</option>
                  )}
                  {availableMonths.map((mid) => {
                    const isCurrent = mid === (currentMonth?.id ?? todayMonthId);
                    let label: string;
                    try {
                      label = format(parseISO(mid + '-01'), 'MMM yyyy');
                    } catch {
                      label = mid;
                    }
                    return (
                      <option key={mid} value={mid}>
                        {label}{isCurrent && !monthIds.includes(mid) ? ' (current)' : ''}
                      </option>
                    );
                  })}
                </select>

                {/* Range pills */}
                <button type="button" style={{ ...pillBase, ...(isActive3 ? pillActive : pillInactive) }}
                  onClick={() => setRangePeriod(3)}>3 Months</button>
                <button type="button" style={{ ...pillBase, ...(isActive6 ? pillActive : pillInactive) }}
                  onClick={() => setRangePeriod(6)}>6 Months</button>
                <button type="button" style={{ ...pillBase, ...(isActiveAll ? pillActive : pillInactive) }}
                  onClick={() => setRangePeriod('all')}>All Time</button>
              </div>
            </div>

            <ExpenseSummaryPanels
              transactions={summaryTransactions}
              periodLabel={summaryLabel}
              nMonths={summaryNMonths}
            />
          </div>

          {/* ── Section: Category Trend ── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Category Trend</div>
            <div style={card}>
              <CategoryTrendChart allTransactions={allTimeTransactions} monthIds={monthIds} />
            </div>
          </div>

          {/* ── Section: Settlements ── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Settlements</div>
            <div style={card}>
              <SettlementsChart settlements={settlements} />
            </div>
          </div>

          {/* ── Section: Master Trend ── */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Master Spend Trend</div>
            <div style={card}>
              <MasterTrendChart allTransactions={allTimeTransactions} monthIds={monthIds} />
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
