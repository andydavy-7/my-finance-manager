import type { Transaction } from '../entities/Transaction';
import type { CategorySplit } from '../entities/CategorySplit';
import type { CategoryBreakdown } from '../entities/CategoryBreakdown';
import type { ReconciliationResult } from '../entities/ReconciliationResult';
import { defaultCategorySplits } from '../../data/defaultCategorySplits';
import { getCategoryById } from '../../data/categories';

function getSplitFor(
  categoryId: string,
  splits: CategorySplit[]
): { shammi: number; andrew: number } {
  const s = splits.find((x) => x.categoryId === categoryId);
  if (s) return { shammi: s.shammiPercentage, andrew: s.andrewPercentage };
  const def = defaultCategorySplits.find((x) => x.categoryId === categoryId);
  if (def) return { shammi: def.shammiPercentage, andrew: def.andrewPercentage };
  return { shammi: 50, andrew: 50 };
}

function isIndividualCategory(categoryId: string): boolean {
  const category = getCategoryById(categoryId);
  return category?.splitType === 'individual';
}

/**
 * Compute per-category breakdown
 */
export function calculateCategoryBreakdown(
  categoryId: string,
  andrewTx: Transaction[],
  shammiTx: Transaction[],
  splits: CategorySplit[]
): CategoryBreakdown | null {
  const andrewPaid = andrewTx.reduce((s, t) => s + t.amount, 0);
  const shammiPaid = shammiTx.reduce((s, t) => s + t.amount, 0);
  const totalAmount = andrewPaid + shammiPaid;
  if (totalAmount === 0) return null;

  const pct = getSplitFor(categoryId, splits);

  let andrewShouldPay: number;
  let shammiShouldPay: number;

  if (isIndividualCategory(categoryId)) {
    // Individual categories: each person pays exactly what they spent
    andrewShouldPay = andrewPaid;
    shammiShouldPay = shammiPaid;
  } else {
    // Shared categories: split according to percentages
    andrewShouldPay = totalAmount * (pct.andrew / 100);
    shammiShouldPay = totalAmount * (pct.shammi / 100);
  }

  const andrewShortfall = andrewShouldPay - andrewPaid;
  const shammiShortfall = shammiShouldPay - shammiPaid;

  return {
    categoryId,
    totalAmount,
    andrewPaid,
    shammiPaid,
    andrewShouldPay,
    shammiShouldPay,
    andrewShortfall,
    shammiShortfall,
    splitPercentages: pct
  };
}

/**
 * Compute net settlement: who pays whom and how much
 */
export function calculateNetSettlement(
  andrewShortfall: number,
  shammiShortfall: number
): ReconciliationResult['netSettlement'] {
  const totalAndrewShortfall = andrewShortfall;
  const totalShammiShortfall = shammiShortfall;

  // Settlement amount is just the absolute value of one shortfall
  // (they should be equal and opposite for shared expenses)
  const amount = Math.abs(totalAndrewShortfall);

  if (amount < 0.01) return null;

  if (totalAndrewShortfall > 0) {
    // Andrew owes money
    return { payer: 'andrew', payee: 'shammi', amount };
  } else if (totalShammiShortfall > 0) {
    // Shammi owes money
    return { payer: 'shammi', payee: 'andrew', amount: Math.abs(totalShammiShortfall) };
  }

  return null;
}

/**
 * Full reconciliation for a month
 */
export function calculateReconciliation(
  andrewTransactions: Transaction[],
  shammiTransactions: Transaction[],
  categorySplits: CategorySplit[]
): ReconciliationResult {
  const byCat = (tx: Transaction[]) => {
    const m = new Map<string, Transaction[]>();
    tx.forEach((t) => {
      const list = m.get(t.categoryId) ?? [];
      list.push(t);
      m.set(t.categoryId, list);
    });
    return m;
  };
  const andrewByCat = byCat(andrewTransactions);
  const shammiByCat = byCat(shammiTransactions);
  const allCatIds = new Set<string>([
    ...andrewByCat.keys(),
    ...shammiByCat.keys()
  ]);

  const categoryBreakdowns: CategoryBreakdown[] = [];
  for (const cid of allCatIds) {
    const b = calculateCategoryBreakdown(
      cid,
      andrewByCat.get(cid) ?? [],
      shammiByCat.get(cid) ?? [],
      categorySplits
    );
    if (b) categoryBreakdowns.push(b);
  }
  categoryBreakdowns.sort((a, b) => b.totalAmount - a.totalAmount);

  const andrewTotal = andrewTransactions.reduce((s, t) => s + t.amount, 0);
  const shammiTotal = shammiTransactions.reduce((s, t) => s + t.amount, 0);
  const andrewExpectedContribution = categoryBreakdowns.reduce(
    (s, b) => s + b.andrewShouldPay,
    0
  );
  const shammiExpectedContribution = categoryBreakdowns.reduce(
    (s, b) => s + b.shammiShouldPay,
    0
  );
  const andrewShortfall = categoryBreakdowns.reduce(
    (s, b) => s + b.andrewShortfall,
    0
  );
  const shammiShortfall = categoryBreakdowns.reduce(
    (s, b) => s + b.shammiShortfall,
    0
  );
  const netSettlement = calculateNetSettlement(andrewShortfall, shammiShortfall);

  return {
    categoryBreakdowns,
    andrewTotal,
    shammiTotal,
    andrewExpectedContribution,
    shammiExpectedContribution,
    andrewShortfall,
    shammiShortfall,
    netSettlement
  };
}
