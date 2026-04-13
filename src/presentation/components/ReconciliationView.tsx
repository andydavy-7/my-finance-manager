import { useTransactionStore } from '../../application/stores/transactionStore';

/**
 * Formats a number as currency with LKR prefix
 */
function fmt(n: number): string {
  return 'LKR ' + new Intl.NumberFormat('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
}

/**
 * ReconciliationView Component
 *
 * Displays overall reconciliation summary including totals, expected contributions,
 * shortfalls, and net settlement between Andrew and Shammi.
 * Shows empty state when no transactions or reconciliation data exists.
 *
 * @example
 * <ReconciliationView />
 */
export function ReconciliationView() {
  const { currentMonth, calculateReconciliation: runCalc } = useTransactionStore();
  const m = currentMonth;
  const rec = m?.reconciliation;
  const hasTx = m && (m.andrewTransactions.length > 0 || m.shammiTransactions.length > 0);

  if (!m) return null;

  return (
    <div>
      {!rec && hasTx && (
        <div style={{ marginBottom: 24 }}>
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

      {rec && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20, marginBottom: 32 }}>
          <div style={{ background: 'var(--color-border-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Andrew</div>
              <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#dbeafe', color: '#1e40af' }}>Andrew</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Total Paid</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500 }}>{fmt(rec.andrewTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Should Pay</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500 }}>{fmt(rec.andrewExpectedContribution)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 0', marginTop: 8, borderTop: '2px solid var(--color-border)' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Balance</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 18,
                  fontWeight: 600,
                  color: rec.andrewShortfall >= 0 ? 'var(--color-error)' : 'var(--color-success)'
                }}
              >
                {rec.andrewShortfall >= 0 ? '+' : ''}{fmt(rec.andrewShortfall)}
              </span>
            </div>
          </div>

          <div style={{ background: 'var(--color-border-subtle)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase' }}>Shammi</div>
              <span style={{ padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: '#fce7f3', color: '#9f1239' }}>Shammi</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Total Paid</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500 }}>{fmt(rec.shammiTotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--color-border-subtle)' }}>
              <span style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Should Pay</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500 }}>{fmt(rec.shammiExpectedContribution)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0 0', marginTop: 8, borderTop: '2px solid var(--color-border)' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>Balance</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 18,
                  fontWeight: 600,
                  color: rec.shammiShortfall > 0 ? 'var(--color-error)' : 'var(--color-success)'
                }}
              >
                {rec.shammiShortfall > 0 ? '-' : ''}{fmt(Math.abs(rec.shammiShortfall))}
              </span>
            </div>
          </div>

          {rec.netSettlement && rec.netSettlement.amount >= 0.01 && (
            <div
              style={{
                gridColumn: '1 / -1',
                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                border: 'none',
                color: '#fff',
                padding: 32,
                borderRadius: 8,
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9, marginBottom: 12 }}>
                Net Settlement
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 48, fontWeight: 600, marginBottom: 12 }}>{fmt(rec.netSettlement.amount)}</div>
              <div style={{ fontSize: 16, opacity: 0.95, fontWeight: 500 }}>
                {rec.netSettlement.payer === 'andrew' ? 'Andrew' : 'Shammi'}{' '}
                <span style={{ display: 'inline-block', margin: '0 8px' }}>→</span>{' '}
                {rec.netSettlement.payee === 'andrew' ? 'Andrew' : 'Shammi'}
              </div>
            </div>
          )}
        </div>
      )}

      {!rec && !hasTx && (
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
            No reconciliation data
          </div>
          <div style={{ fontSize: 14 }}>
            Upload statements and run reconciliation to see the settlement calculation.
          </div>
        </div>
      )}
    </div>
  );
}
