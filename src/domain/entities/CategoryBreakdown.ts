/**
 * Per-category reconciliation breakdown
 */
export interface CategoryBreakdown {
  categoryId: string;
  totalAmount: number;
  andrewPaid: number;
  shammiPaid: number;
  andrewShouldPay: number;
  shammiShouldPay: number;
  andrewShortfall: number;
  shammiShortfall: number;
  splitPercentages: { shammi: number; andrew: number };
}
