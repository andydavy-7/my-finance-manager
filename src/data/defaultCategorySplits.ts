import type { CategorySplit } from '../domain/entities/CategorySplit';

/**
 * Owner-paid categories: 100% to whoever made the transaction.
 * Not included in categorySplits; reconciliation uses owner-paid logic.
 */
export const OWNER_PAID_CATEGORY_IDS = [
  'personal',
  'transfers',
  'pjfm',
  'highway',
  'others'
] as const;

/**
 * Default category split configuration for shared categories:
 * - Groceries 60/40, Food 50/50, Healthcare 50/50, Utilities 60/40,
 *   Telco 20/80, Entertainment 50/50, School 50/50, 50/50 category 50/50
 * - Individual categories (transport, fuel, vehicle, etc.) are not included
 *   as they are paid 100% by whoever made the transaction
 */
export const defaultCategorySplits: CategorySplit[] = [
  { categoryId: 'groceries', shammiPercentage: 60, andrewPercentage: 40 },
  { categoryId: 'food', shammiPercentage: 50, andrewPercentage: 50 },
  { categoryId: 'healthcare', shammiPercentage: 50, andrewPercentage: 50 },
  { categoryId: 'utilities', shammiPercentage: 60, andrewPercentage: 40 },
  { categoryId: 'telco', shammiPercentage: 20, andrewPercentage: 80 },
  { categoryId: 'entertainment', shammiPercentage: 50, andrewPercentage: 50 },
  { categoryId: 'school', shammiPercentage: 50, andrewPercentage: 50 },
  { categoryId: 'fifty-fifty', shammiPercentage: 50, andrewPercentage: 50 }
];
