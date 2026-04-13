import { useState, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ReferenceLine, ResponsiveContainer
} from 'recharts';
import type { MonthlySettlement } from '../../../application/stores/transactionStore';

interface Props {
  settlements: MonthlySettlement[];
}

type Period =
  | { type: 'range'; range: '3m' | '6m' | 'all' }
  | { type: 'month'; monthId: string };

function fmtTick(v: number): string {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return (v / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000) return (v / 1_000).toFixed(0) + 'k';
  return String(v);
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.abs(n));
}

function toSignedAmount(s: MonthlySettlement): number {
  if (!s.payer || s.amount === 0) return 0;
  return s.payer === 'andrew' ? s.amount : -s.amount;
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

export function SettlementsChart({ settlements }: Props) {
  const [period, setPeriod] = useState<Period>({ type: 'range', range: 'all' });

  const isMonthMode = period.type === 'month';
  const activeMonthId = isMonthMode ? period.monthId : '';

  const filtered = useMemo(() => {
    if (period.type === 'month') return settlements.filter((s) => s.monthId === period.monthId);
    if (period.range === 'all') return settlements;
    const n = period.range === '3m' ? 3 : 6;
    return settlements.slice(-n);
  }, [settlements, period]);

  const chartData = useMemo(() => {
    return filtered.map((s) => ({
      month: format(parseISO(s.monthId + '-01'), 'MMM yy'),
      value: toSignedAmount(s),
      payer: s.payer,
      amount: s.amount
    }));
  }, [filtered]);

  const summary = useMemo(() => {
    let andrewPaidCount = 0, shammiPaidCount = 0;
    let andrewPaidTotal = 0, shammiPaidTotal = 0, nilCount = 0;
    for (const s of filtered) {
      if (!s.payer || s.amount === 0) { nilCount++; continue; }
      if (s.payer === 'andrew') { andrewPaidCount++; andrewPaidTotal += s.amount; }
      else { shammiPaidCount++; shammiPaidTotal += s.amount; }
    }
    return { andrewPaidCount, shammiPaidCount, andrewPaidTotal, shammiPaidTotal, nilCount };
  }, [filtered]);

  if (settlements.length === 0) {
    return (
      <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>
        No reconciled months yet
      </div>
    );
  }

  const maxAbs = Math.max(...chartData.map((d) => Math.abs(d.value)), 1);
  const isActive3 = period.type === 'range' && period.range === '3m';
  const isActive6 = period.type === 'range' && period.range === '6m';
  const isActiveAll = period.type === 'range' && period.range === 'all';

  return (
    <div>
      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Summary pills */}
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <SummaryPill label="Andrew paid Shammi" count={summary.andrewPaidCount} total={summary.andrewPaidTotal} color="#1e40af" bg="#eff6ff" />
          <SummaryPill label="Shammi paid Andrew" count={summary.shammiPaidCount} total={summary.shammiPaidTotal} color="#9f1239" bg="#fff0f6" />
          {summary.nilCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13 }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>
                {summary.nilCount} month{summary.nilCount !== 1 ? 's' : ''} settled evenly
              </span>
            </div>
          )}
        </div>

        {/* Period selector */}
        <div style={{ display: 'flex', gap: 4, padding: 3, border: '1px solid var(--color-border)', borderRadius: 8, background: 'var(--color-bg)', flexShrink: 0, alignItems: 'center' }}>
          <select
            value={activeMonthId}
            onChange={(e) => { if (e.target.value) setPeriod({ type: 'month', monthId: e.target.value }); }}
            style={{
              ...pillBase,
              background: isMonthMode ? 'var(--color-accent)' : 'transparent',
              color: isMonthMode ? '#fff' : 'var(--color-text-secondary)',
              outline: 'none',
              paddingRight: 8,
              minWidth: 110
            }}
          >
            {!isMonthMode && <option value="" disabled>Month ▾</option>}
            {settlements.map((s) => {
              let label: string;
              try { label = format(parseISO(s.monthId + '-01'), 'MMM yyyy'); } catch { label = s.monthId; }
              return <option key={s.monthId} value={s.monthId}>{label}</option>;
            })}
          </select>
          <button type="button" style={{ ...pillBase, ...(isActive3 ? { background: 'var(--color-accent)', color: '#fff' } : { background: 'transparent', color: 'var(--color-text-secondary)' }) }}
            onClick={() => setPeriod({ type: 'range', range: '3m' })}>3 Months</button>
          <button type="button" style={{ ...pillBase, ...(isActive6 ? { background: 'var(--color-accent)', color: '#fff' } : { background: 'transparent', color: 'var(--color-text-secondary)' }) }}
            onClick={() => setPeriod({ type: 'range', range: '6m' })}>6 Months</button>
          <button type="button" style={{ ...pillBase, ...(isActiveAll ? { background: 'var(--color-accent)', color: '#fff' } : { background: 'transparent', color: 'var(--color-text-secondary)' }) }}
            onClick={() => setPeriod({ type: 'range', range: 'all' })}>All Time</button>
        </div>
      </div>

      {/* Single-month detail view */}
      {isMonthMode ? (
        <MonthDetail settlement={filtered[0] ?? null} monthId={activeMonthId} />
      ) : (
        <>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            {[{ color: '#1e40af', label: 'Andrew → Shammi' }, { color: '#9f1239', label: 'Shammi → Andrew' }].map(({ color, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
                {label}
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 8, right: 24, left: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tickFormatter={fmtTick} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={52} domain={[-maxAbs * 1.1, maxAbs * 1.1]} />
              <ReferenceLine y={0} stroke="var(--color-border)" strokeWidth={1.5} />
              <Tooltip
                formatter={(value: number | undefined) => [
                  value == null ? '—' : 'LKR ' + fmtNum(value),
                  (value ?? 0) >= 0 ? 'Andrew → Shammi' : 'Shammi → Andrew'
                ]}
                labelStyle={{ fontSize: 12, fontWeight: 600 }}
                contentStyle={{ borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 12, boxShadow: 'var(--shadow)' }}
                cursor={{ fill: 'var(--color-border-subtle)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
                {chartData.map((d, i) => (
                  <Cell key={i} fill={d.value >= 0 ? '#1e40af' : '#9f1239'} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}

function MonthDetail({ settlement, monthId }: { settlement: MonthlySettlement | null; monthId: string }) {
  let monthLabel = monthId;
  try { monthLabel = format(parseISO(monthId + '-01'), 'MMMM yyyy'); } catch { /* keep raw */ }

  if (!settlement) {
    return (
      <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-tertiary)', fontSize: 14 }}>
        No data for {monthLabel}
      </div>
    );
  }

  const { andrewTotal, shammiTotal, payer, amount } = settlement;
  const andrewColor = '#1e40af';
  const shammiColor = '#9f1239';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Spend row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {[
          { label: 'Andrew spent', value: andrewTotal, color: andrewColor, bg: '#eff6ff' },
          { label: 'Shammi spent', value: shammiTotal, color: shammiColor, bg: '#fff0f6' }
        ].map(({ label, value, color, bg }) => (
          <div key={label} style={{ padding: '14px 18px', borderRadius: 10, background: bg, border: `1px solid ${color}22` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color }}>
              {new Intl.NumberFormat('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)}
            </div>
          </div>
        ))}
      </div>

      {/* Settlement result */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16,
        padding: '18px 24px', borderRadius: 10,
        background: payer ? (payer === 'andrew' ? '#eff6ff' : '#fff0f6') : 'var(--color-surface)',
        border: `1px solid ${payer === 'andrew' ? '#1e40af33' : payer === 'shammi' ? '#9f123933' : 'var(--color-border)'}`
      }}>
        {payer && amount > 0 ? (
          <>
            <span style={{ fontSize: 15, fontWeight: 700, color: payer === 'andrew' ? andrewColor : shammiColor }}>
              {payer === 'andrew' ? 'Andrew' : 'Shammi'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>paid</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: payer === 'andrew' ? shammiColor : andrewColor }}>
              {payer === 'andrew' ? 'Shammi' : 'Andrew'}
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-text-tertiary)', margin: '0 4px' }}>·</span>
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: payer === 'andrew' ? andrewColor : shammiColor }}>
              LKR {new Intl.NumberFormat('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            No payment needed — settled evenly
          </span>
        )}
      </div>
    </div>
  );
}

function SummaryPill({ label, count, total, color, bg }: {
  label: string; count: number; total: number; color: string; bg: string;
}) {
  if (count === 0) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '10px 16px', borderRadius: 10, border: `1px solid ${color}22`, background: bg, minWidth: 160 }}>
      <span style={{ fontSize: 11, fontWeight: 600, color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</span>
      <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color, lineHeight: 1.2 }}>
        {new Intl.NumberFormat('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(total)}
      </span>
      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
        across {count} month{count !== 1 ? 's' : ''}{' · '}avg {new Intl.NumberFormat('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(total / count))}
      </span>
    </div>
  );
}
