import type { Transaction } from './Transaction';
import type { CategorySplit } from './CategorySplit';
import type { ReconciliationResult } from './ReconciliationResult';

/**
 * All data for a single month: transactions, splits snapshot, and reconciliation
 */
export interface MonthlyData {
  id: string;                    // "YYYY-MM"
  month: string;
  andrewTransactions: Transaction[];
  shammiTransactions: Transaction[];
  categorySplits: CategorySplit[];
  reconciliation: ReconciliationResult | null;
  isCommitted: boolean;
  andrewFileName?: string | null;
  shammiFileName?: string | null;
}
