import type { CategoryBreakdown } from './CategoryBreakdown';

/**
 * Result of running the reconciliation algorithm for a month
 */
export interface ReconciliationResult {
  categoryBreakdowns: CategoryBreakdown[];
  andrewTotal: number;
  shammiTotal: number;
  andrewExpectedContribution: number;
  shammiExpectedContribution: number;
  andrewShortfall: number;   // Positive = owes, negative = overpaid
  shammiShortfall: number;
  netSettlement: {
    payer: 'andrew' | 'shammi';
    payee: 'andrew' | 'shammi';
    amount: number;
  } | null;
}
