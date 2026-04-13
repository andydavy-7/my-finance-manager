/**
 * Category split configuration: percentage each person is responsible for
 * andrewPercentage + shammiPercentage should equal 100 for shared categories
 */
export interface CategorySplit {
  categoryId: string;
  shammiPercentage: number;  // 0-100
  andrewPercentage: number;  // 0-100
}
