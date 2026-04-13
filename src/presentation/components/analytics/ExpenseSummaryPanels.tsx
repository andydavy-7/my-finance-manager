import { useMemo } from 'react';
import { categories } from '../../../data/categories';
import type { AllTimeTransaction } from '../../../application/stores/transactionStore';

interface Props {
  transactions: AllTimeTransaction[];
  periodLabel: string;
  nMonths: number;
}

function fmtNum(n: number): string {
  return new Intl.NumberFormat('en-LK', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);
}

function fmtK(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(n % 1_000 === 0 ? 0 : 1) + 'k';
  return String(n);
}

export function ExpenseSummaryPanels({ transactions, periodLabel, nMonths }: Props) {
  // Per-category totals for each owner, sorted by combined household total desc
  const catData = useMemo(() => {
    return categories
      .map((cat) => {
        const andrew = transactions
          .filter((t) => t.owner === 'andrew' && t.categoryId === cat.id)
          .reduce((s, t) => s + t.amount, 0);
        const shammi = transactions
          .filter((t) => t.owner === 'shammi' && t.categoryId === cat.id)
          .reduce((s, t) => s + t.amount, 0);
        return { ...cat, andrew, shammi, total: andrew + shammi };
      })
      .sort((a, b) => b.total - a.total);
  }, [transactions]);

  const andrewTotal = useMemo(() => catData.reduce((s, c) => s + c.andrew, 0), [catData]);
  const shammiTotal = useMemo(() => catData.reduce((s, c) => s + c.shammi, 0), [catData]);
  const andrewMax = Math.max(...catData.map((c) => c.andrew), 1);
  const shammiMax = Math.max(...catData.map((c) => c.shammi), 1);

  const isMultiMonth = nMonths > 1;
  const periodLabelUpper = periodLabel.toUpperCase();

  function renderPanel(
    owner: 'andrew' | 'shammi',
    total: number,
    maxVal: number,
    accentColor: string,
    gradStart: string,
    gradEnd: string
  ) {
    return (
      <div
        style={{
          border: '1px solid var(--color-border)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px 14px',
            background: `linear-gradient(135deg, ${gradStart}, ${gradEnd})`,
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: accentColor,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 5
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={accentColor} strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
              {owner === 'andrew' ? 'Andrew' : 'Shammi'}
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.04em',
                color: 'var(--color-text-secondary)'
              }}
            >
              Total Spend · {periodLabelUpper}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 700,
                fontFamily: 'var(--font-mono)',
                color: accentColor,
                lineHeight: 1
              }}
            >
              {fmtNum(total)}
            </div>
            {isMultiMonth && (
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--color-text-secondary)',
                  marginTop: 4,
                  fontFamily: 'var(--font-mono)'
                }}
              >
                avg {fmtK(Math.round(total / nMonths))} / mo
              </div>
            )}
          </div>
        </div>

        {/* Category rows */}
        <div
          style={{
            padding: '14px 22px 18px',
            background: 'var(--color-surface)',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: 9
          }}
        >
          {catData.map((cat) => {
            const val = owner === 'andrew' ? cat.andrew : cat.shammi;
            const isNil = val === 0;
            const barW = maxVal > 0 ? Math.round((val / maxVal) * 100) : 0;
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0.0';
            return (
              <div
                key={cat.id}
                style={{ display: 'flex', alignItems: 'center', gap: 10 }}
              >
                <span
                  style={{
                    width: 9,
                    height: 9,
                    borderRadius: '50%',
                    background: cat.color,
                    flexShrink: 0,
                    opacity: isNil ? 0.25 : 1
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    color: isNil ? 'var(--color-text-tertiary)' : 'var(--color-text-secondary)',
                    width: 88,
                    flexShrink: 0
                  }}
                >
                  {cat.name}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 7,
                    background: 'var(--color-border-subtle)',
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${barW}%`,
                      background: cat.color,
                      borderRadius: 4,
                      opacity: isNil ? 0.15 : 0.85
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 12,
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600,
                    width: 66,
                    textAlign: 'right' as const,
                    flexShrink: 0,
                    color: isNil ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)'
                  }}
                >
                  {isNil ? '—' : fmtNum(val)}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--color-text-tertiary)',
                    width: 38,
                    textAlign: 'right' as const,
                    flexShrink: 0
                  }}
                >
                  {isNil ? '' : pct + '%'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {renderPanel('andrew', andrewTotal, andrewMax, '#1e40af', '#eff6ff', '#dbeafe')}
      {renderPanel('shammi', shammiTotal, shammiMax, '#9f1239', '#fff0f6', '#fce7f3')}
    </div>
  );
}
