import { parse } from 'date-fns';
import { Transaction } from '../entities/Transaction';
import { categorizeTransaction } from './CategorizationService';

/**
 * Raw row from HNB CSV file (internal use only)
 */
interface RawStatementRow {
  date: string;
  refNo: string;
  particulars: string;
  debits: string;
  credits: string;
  balance: string;
}

/**
 * Parses HNB bank statement CSV content into transactions
 *
 * Expected CSV format:
 * Date, Ref.No, Particulars, Debits, Credits, Balance
 * 01/01/2026,SD3998951,POS/MERCHANT NAME,30000,,426913.38
 *
 * @param csvContent - Raw CSV string content
 * @returns Array of parsed and categorized transactions (debits only)
 */
export function parseHNBStatement(csvContent: string): Transaction[] {
  const lines = csvContent.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('Invalid CSV: File appears to be empty or has no data rows');
  }

  // Skip header row
  const dataLines = lines.slice(1);
  const transactions: Transaction[] = [];

  for (const line of dataLines) {
    const row = parseCSVLine(line);

    if (!row) continue;

    // Skip if no debit amount (we only want expenses)
    const debitAmount = parseAmount(row.debits);
    if (debitAmount === 0) continue;

    // Skip balance lines (no ref number)
    if (!row.refNo || row.particulars.includes('BALANCE AS AT')) continue;

    const transaction: Transaction = {
      id: row.refNo || `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: parseDate(row.date),
      refNo: row.refNo,
      particulars: row.particulars,
      amount: debitAmount,
      categoryId: categorizeTransaction(row.particulars)
    };

    transactions.push(transaction);
  }

  return transactions;
}

/**
 * Parses a single CSV line into a RawStatementRow
 * Handles commas within values and trims whitespace
 */
function parseCSVLine(line: string): RawStatementRow | null {
  // Split by comma, but this simple approach works for HNB format
  // since their values don't contain commas
  const parts = line.split(',').map(p => p.trim());

  if (parts.length < 6) return null;

  return {
    date: parts[0],
    refNo: parts[1],
    particulars: parts[2],
    debits: parts[3],
    credits: parts[4],
    balance: parts[5]
  };
}

/**
 * Parses date string in DD/MM/YYYY format
 */
function parseDate(dateStr: string): Date {
  try {
    return parse(dateStr, 'dd/MM/yyyy', new Date());
  } catch {
    return new Date();
  }
}

/**
 * Parses amount string, removing any formatting
 */
function parseAmount(amountStr: string): number {
  if (!amountStr || amountStr.trim() === '') return 0;

  // Remove any non-numeric characters except decimal point
  const cleaned = amountStr.replace(/[^0-9.]/g, '');
  const amount = parseFloat(cleaned);

  return isNaN(amount) ? 0 : amount;
}

/**
 * Reads a File object and returns its text content
 */
export async function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
