import { categories, getDefaultCategory } from '../../data/categories';

/**
 * Auto-categorizes a transaction based on keyword matching
 *
 * Scans the particulars field for keyword matches (case-insensitive)
 * Returns the first matching category ID, or 'others' if no match
 *
 * @param particulars - Transaction description/particulars from statement
 * @returns Category ID
 */
export function categorizeTransaction(particulars: string): string {
  const upperParticulars = particulars.toUpperCase();

  for (const category of categories) {
    // Skip categories with no keywords (personal, others)
    if (category.keywords.length === 0) continue;

    for (const keyword of category.keywords) {
      if (upperParticulars.includes(keyword.toUpperCase())) {
        return category.id;
      }
    }
  }

  return getDefaultCategory().id;
}

/**
 * Gets category statistics from a list of transactions
 *
 * @param transactions - Array of transactions with categoryId
 * @returns Map of categoryId to total amount
 */
export function getCategoryTotals(
  transactions: { categoryId: string; amount: number }[]
): Map<string, number> {
  const totals = new Map<string, number>();

  for (const tx of transactions) {
    const current = totals.get(tx.categoryId) || 0;
    totals.set(tx.categoryId, current + tx.amount);
  }

  return totals;
}
