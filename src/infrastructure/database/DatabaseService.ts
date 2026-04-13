import type { MonthlyData } from '../../domain/entities/MonthlyData';
import type { Transaction } from '../../domain/entities/Transaction';

// ─── IPC-serialised shapes (dates come back as strings over IPC) ───

interface RawTransaction {
  id: string;
  date: string;
  refNo: string;
  particulars: string;
  amount: number;
  categoryId: string;
}

interface RawMonthlyData {
  id: string;
  month: string;
  andrewTransactions: RawTransaction[];
  shammiTransactions: RawTransaction[];
  categorySplits: MonthlyData['categorySplits'];
  reconciliation: MonthlyData['reconciliation'];
  isCommitted: boolean;
  andrewFileName?: string | null;
  shammiFileName?: string | null;
}

function deserializeTx(r: RawTransaction): Transaction {
  return { ...r, date: new Date(r.date) };
}

function deserializeMonth(raw: RawMonthlyData): MonthlyData {
  return {
    ...raw,
    andrewTransactions: raw.andrewTransactions.map(deserializeTx),
    shammiTransactions: raw.shammiTransactions.map(deserializeTx),
  };
}

// ─── Public API (mirrors the old DatabaseService surface exactly) ───

export async function initDatabase(): Promise<void> {
  await window.electronAPI.db.init();
}

export async function setupBackupLocation(): Promise<void> {
  // No-op in Electron — DB always lives at userData/finance-manager.db
}

export async function saveMonthlyData(m: MonthlyData): Promise<void> {
  await window.electronAPI.db.saveMonth(m);
}

export async function loadMonthlyData(id: string): Promise<MonthlyData | null> {
  const raw = await window.electronAPI.db.loadMonth(id);
  if (!raw) return null;
  return deserializeMonth(raw as RawMonthlyData);
}

export async function listMonthIds(): Promise<string[]> {
  return window.electronAPI.db.listMonths();
}

export async function deleteMonthlyData(id: string): Promise<void> {
  await window.electronAPI.db.deleteMonth(id);
}

// ─── Analytics queries ───

export interface AllTimeTransaction {
  id: string;
  monthId: string;
  owner: 'andrew' | 'shammi';
  date: Date;
  refNo: string;
  particulars: string;
  amount: number;
  categoryId: string;
}

interface RawAllTimeTransaction {
  id: string;
  monthId: string;
  owner: 'andrew' | 'shammi';
  date: string;
  refNo: string;
  particulars: string;
  amount: number;
  categoryId: string;
}

export async function getAllTransactionsAllTime(): Promise<AllTimeTransaction[]> {
  const rows = await window.electronAPI.db.getAllTransactions();
  return (rows as RawAllTimeTransaction[]).map((r) => ({ ...r, date: new Date(r.date) }));
}

export interface MonthlySettlement {
  monthId: string;
  andrewTotal: number;
  shammiTotal: number;
  payer: 'andrew' | 'shammi' | null;
  payee: 'andrew' | 'shammi' | null;
  amount: number;
}

export async function getAllSettlements(): Promise<MonthlySettlement[]> {
  return window.electronAPI.db.getAllSettlements() as Promise<MonthlySettlement[]>;
}
