import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useTransactionStore } from '../../application/stores/transactionStore';
import { LeftNavigationIndex } from '../components/LeftNavigationIndex';
import { MonthYearPicker } from '../components/MonthYearPicker';
import { SaveCommitButton } from '../components/SaveCommitButton';
import { DeleteButton } from '../components/DeleteButton';
import { SettingsModal } from '../components/SettingsModal';
import { AccordionSection } from '../components/AccordionSection';
import { UploadTab } from '../components/UploadTab';
import { TransactionsTab } from '../components/TransactionsTab';
import { CategoryBreakdownView } from '../components/CategoryBreakdownView';
import { ReconciliationView } from '../components/ReconciliationView';
import { Toast } from '../components/Toast';

export default function DashboardPage() {
  const { monthId } = useParams<{ monthId?: string }>();
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { refreshMonthIds, currentMonth, isEditing, startEditing, cancelEditing, setSelectedMonth, selectedMonthId, toast, hideToast } = useTransactionStore();
  const isUpdatingFromUrl = useRef(false);

  // Initialize: Load month from URL on mount
  useEffect(() => {
    const init = async () => {
      await refreshMonthIds();
      
      // On initial load, sync with URL or default to current month
      if (monthId) {
        isUpdatingFromUrl.current = true;
        await setSelectedMonth(monthId);
      } else {
        // No monthId in URL - default to current month
        const currentMonthId = format(new Date(), 'yyyy-MM');
        isUpdatingFromUrl.current = true;
        if (selectedMonthId !== currentMonthId) {
          await setSelectedMonth(currentMonthId);
        }
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Sync with URL when URL param changes (browser back/forward or direct navigation)
  useEffect(() => {
    const sync = async () => {
      if (monthId && monthId !== selectedMonthId) {
        isUpdatingFromUrl.current = true;
        await setSelectedMonth(monthId);
      } else if (!monthId) {
        // No monthId in URL (root path) - default to current month and update URL
        const currentMonthId = format(new Date(), 'yyyy-MM');
        isUpdatingFromUrl.current = true;
        await setSelectedMonth(currentMonthId);
        // Update URL to /month/:id format for consistency
        navigate(`/month/${currentMonthId}`, { replace: true });
      }
    };
    sync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthId, navigate]); // Only depend on monthId to avoid loops

  // Update URL when selectedMonthId changes (from user action, not from URL)
  useEffect(() => {
    if (isUpdatingFromUrl.current) {
      isUpdatingFromUrl.current = false;
      return; // Don't update URL if we just updated from URL
    }

    const currentPath = window.location.pathname;
    
    // All months use /month/:id format for consistency
    if (selectedMonthId) {
      const expectedPath = `/month/${selectedMonthId}`;
      if (currentPath !== expectedPath) {
        navigate(expectedPath, { replace: true });
      }
    }
  }, [selectedMonthId, navigate]);

  const showEditButton = currentMonth?.isCommitted && !isEditing;
  const showCancelButton = isEditing;

  return (
    <>
      <header
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 64,
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          zIndex: 100,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em' }}>Finance Manager V3</span>
          {isEditing && (
            <span
              style={{
                padding: '4px 10px',
                borderRadius: 4,
                fontSize: 12,
                fontWeight: 600,
                background: 'var(--color-warning-light)',
                color: 'var(--color-warning)',
                textTransform: 'uppercase'
              }}
            >
              Editing
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <MonthYearPicker />
          {showEditButton && (
            <button
              type="button"
              onClick={startEditing}
              title="Edit this month"
              style={{
                padding: '8px 16px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                borderRadius: 6,
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <svg width={16} height={16} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          {showCancelButton && (
            <button
              type="button"
              onClick={cancelEditing}
              title="Cancel editing"
              style={{
                padding: '8px 16px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                borderRadius: 6,
                fontFamily: 'var(--font-sans)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            title="Settings"
            style={{
              width: 40,
              height: 40,
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <svg width={18} height={18} fill="none" stroke="var(--color-text-secondary)" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
          <SaveCommitButton />
        </div>
      </header>

      <div style={{ display: 'flex', marginTop: 64, minHeight: 'calc(100vh - 64px)' }}>
        <LeftNavigationIndex />
        <main
          style={{
            marginLeft: 240,
            flex: 1,
            padding: '32px 48px 64px',
            maxWidth: 1400
          }}
        >
          <AccordionSection id="upload" number={1} title="Upload Statements">
            <UploadTab />
          </AccordionSection>

          <AccordionSection id="transactions" number={2} title="Transactions">
            <TransactionsTab />
          </AccordionSection>

          <AccordionSection id="breakdown" number={3} title="Category Breakdown">
            <CategoryBreakdownView />
          </AccordionSection>

          <AccordionSection id="reconciliation" number={4} title="Reconciliation">
            <ReconciliationView />
          </AccordionSection>

          <DeleteButton />
        </main>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </>
  );
}
