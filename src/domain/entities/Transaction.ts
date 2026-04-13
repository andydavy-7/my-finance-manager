/**
 * Represents a bank transaction from HNB statement
 */
export interface Transaction {
  id: string;
  date: Date;
  refNo: string;
  particulars: string;
  amount: number;
  categoryId: string;
}
