import Database from 'better-sqlite3';
import { app } from 'electron';
import { join } from 'path';
import { copyFileSync, existsSync, mkdirSync, rmSync } from 'fs';

const DB_FILENAME = 'finance-manager.db';

const SCHEMA = `
CREATE TABLE IF NOT EXISTS monthly_data (
  id TEXT PRIMARY KEY, month TEXT NOT NULL, year INTEGER NOT NULL, month_number INTEGER NOT NULL,
  is_committed INTEGER DEFAULT 0, andrew_file_name TEXT, shammi_file_name TEXT, created_at TEXT, updated_at TEXT
);
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY, monthly_data_id TEXT NOT NULL, owner TEXT NOT NULL, date TEXT NOT NULL,
  ref_no TEXT, particulars TEXT, amount REAL NOT NULL, category_id TEXT NOT NULL,
  FOREIGN KEY (monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS category_splits (
  id INTEGER PRIMARY KEY AUTOINCREMENT, monthly_data_id TEXT NOT NULL, category_id TEXT NOT NULL,
  shammi_percentage INTEGER NOT NULL, andrew_percentage INTEGER NOT NULL,
  FOREIGN KEY (monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS reconciliation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT, monthly_data_id TEXT NOT NULL UNIQUE,
  andrew_total REAL NOT NULL, shammi_total REAL NOT NULL, andrew_expected_contribution REAL NOT NULL,
  shammi_expected_contribution REAL NOT NULL, andrew_shortfall REAL NOT NULL, shammi_shortfall REAL NOT NULL,
  net_settlement_payer TEXT, net_settlement_payee TEXT, net_settlement_amount REAL, calculated_at TEXT NOT NULL,
  FOREIGN KEY (monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS category_breakdowns (
  id INTEGER PRIMARY KEY AUTOINCREMENT, reconciliation_result_id INTEGER NOT NULL, category_id TEXT NOT NULL,
  total_amount REAL NOT NULL, andrew_paid REAL NOT NULL, shammi_paid REAL NOT NULL,
  andrew_should_pay REAL NOT NULL, shammi_should_pay REAL NOT NULL, andrew_shortfall REAL NOT NULL,
  shammi_shortfall REAL NOT NULL, shammi_split_percentage INTEGER NOT NULL, andrew_split_percentage INTEGER NOT NULL,
  FOREIGN KEY (reconciliation_result_id) REFERENCES reconciliation_results(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_tx_md ON transactions(monthly_data_id);
CREATE INDEX IF NOT EXISTS idx_cs_md ON category_splits(monthly_data_id);
CREATE INDEX IF NOT EXISTS idx_cb_rr ON category_breakdowns(reconciliation_result_id);
`;

// ─── Types (mirrored from renderer domain — no imports across process boundary) ───

interface Transaction {
  id: string;
  date: Date;
  refNo: string;
  particulars: string;
  amount: number;
  categoryId: string;
}

interface CategorySplit {
  categoryId: string;
  shammiPercentage: number;
  andrewPercentage: number;
}

interface CategoryBreakdown {
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

interface ReconciliationResult {
  categoryBreakdowns: CategoryBreakdown[];
  andrewTotal: number;
  shammiTotal: number;
  andrewExpectedContribution: number;
  shammiExpectedContribution: number;
  andrewShortfall: number;
  shammiShortfall: number;
  netSettlement: { payer: 'andrew' | 'shammi'; payee: 'andrew' | 'shammi'; amount: number } | null;
}

interface MonthlyData {
  id: string;
  month: string;
  andrewTransactions: Transaction[];
  shammiTransactions: Transaction[];
  categorySplits: CategorySplit[];
  reconciliation: ReconciliationResult | null;
  isCommitted: boolean;
  andrewFileName?: string | null;
  shammiFileName?: string | null;
}

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

export interface MonthlySettlement {
  monthId: string;
  andrewTotal: number;
  shammiTotal: number;
  payer: 'andrew' | 'shammi' | null;
  payee: 'andrew' | 'shammi' | null;
  amount: number;
}

// ─── DB instance ───

let db: Database.Database | null = null;

export function getDbPath(): string {
  return join(app.getPath('userData'), DB_FILENAME);
}

export function initDatabase(): void {
  const dbPath = getDbPath();
  // Ensure userData directory exists
  const dir = join(app.getPath('userData'));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
}

function getDb(): Database.Database {
  if (!db) throw new Error('Database not initialized');
  return db;
}

/**
 * Replace the current database with a file from the given path.
 * Used for backup restore and first-run data migration.
 */
export function importFromFile(sourcePath: string): boolean {
  if (db) {
    db.close();
    db = null;
  }
  const dest = getDbPath();
  // Remove stale WAL/SHM files before replacing the DB — if left behind they
  // get applied on top of the restored file and overwrite its data.
  for (const suffix of ['-wal', '-shm']) {
    const f = dest + suffix;
    if (existsSync(f)) rmSync(f);
  }
  copyFileSync(sourcePath, dest);
  initDatabase();
  return true;
}

// ─── Helper ───

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Read operations ───

export function listMonthIds(): string[] {
  const d = getDb();
  const rows = d.prepare('SELECT id FROM monthly_data ORDER BY year DESC, month_number DESC').all() as { id: string }[];
  return rows.map((r) => r.id);
}

export function loadMonthlyData(id: string): MonthlyData | null {
  const d = getDb();

  const row = d.prepare('SELECT * FROM monthly_data WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return null;

  const txRows = d.prepare('SELECT * FROM transactions WHERE monthly_data_id = ? ORDER BY date').all(id) as Record<string, unknown>[];
  const andrewTransactions: Transaction[] = [];
  const shammiTransactions: Transaction[] = [];
  for (const r of txRows) {
    const tx: Transaction = {
      id: r.id as string,
      date: new Date(r.date as string),
      refNo: (r.ref_no as string) ?? '',
      particulars: r.particulars as string,
      amount: r.amount as number,
      categoryId: r.category_id as string,
    };
    if (r.owner === 'andrew') andrewTransactions.push(tx);
    else shammiTransactions.push(tx);
  }

  const csRows = d.prepare('SELECT * FROM category_splits WHERE monthly_data_id = ?').all(id) as Record<string, unknown>[];
  const categorySplits: CategorySplit[] = csRows.map((r) => ({
    categoryId: r.category_id as string,
    shammiPercentage: r.shammi_percentage as number,
    andrewPercentage: r.andrew_percentage as number,
  }));

  const rrRow = d.prepare('SELECT * FROM reconciliation_results WHERE monthly_data_id = ?').get(id) as Record<string, unknown> | undefined;
  let reconciliation: ReconciliationResult | null = null;
  if (rrRow) {
    const rrId = rrRow.id as number;
    const cbRows = d.prepare('SELECT * FROM category_breakdowns WHERE reconciliation_result_id = ?').all(rrId) as Record<string, unknown>[];
    const categoryBreakdowns: CategoryBreakdown[] = cbRows.map((r) => ({
      categoryId: r.category_id as string,
      totalAmount: r.total_amount as number,
      andrewPaid: r.andrew_paid as number,
      shammiPaid: r.shammi_paid as number,
      andrewShouldPay: r.andrew_should_pay as number,
      shammiShouldPay: r.shammi_should_pay as number,
      andrewShortfall: r.andrew_shortfall as number,
      shammiShortfall: r.shammi_shortfall as number,
      splitPercentages: {
        shammi: r.shammi_split_percentage as number,
        andrew: r.andrew_split_percentage as number,
      },
    }));
    const np = rrRow.net_settlement_payer as string | null;
    const npe = rrRow.net_settlement_payee as string | null;
    const na = rrRow.net_settlement_amount as number | null;
    reconciliation = {
      categoryBreakdowns,
      andrewTotal: rrRow.andrew_total as number,
      shammiTotal: rrRow.shammi_total as number,
      andrewExpectedContribution: rrRow.andrew_expected_contribution as number,
      shammiExpectedContribution: rrRow.shammi_expected_contribution as number,
      andrewShortfall: rrRow.andrew_shortfall as number,
      shammiShortfall: rrRow.shammi_shortfall as number,
      netSettlement:
        np && npe && na != null
          ? { payer: np as 'andrew' | 'shammi', payee: npe as 'andrew' | 'shammi', amount: na }
          : null,
    };
  }

  return {
    id: row.id as string,
    month: row.month as string,
    andrewTransactions,
    shammiTransactions,
    categorySplits,
    reconciliation,
    isCommitted: (row.is_committed as number) === 1,
    andrewFileName: (row.andrew_file_name as string) ?? null,
    shammiFileName: (row.shammi_file_name as string) ?? null,
  };
}

export function getAllTransactionsAllTime(): AllTimeTransaction[] {
  const d = getDb();
  const rows = d
    .prepare(
      `SELECT t.id, t.owner, t.date, t.ref_no, t.particulars, t.amount, t.category_id,
              md.id AS monthly_data_id
       FROM transactions t
       JOIN monthly_data md ON t.monthly_data_id = md.id
       WHERE md.is_committed = 1
       ORDER BY t.date DESC`
    )
    .all() as Record<string, unknown>[];
  return rows.map((r) => ({
    id: r.id as string,
    monthId: r.monthly_data_id as string,
    owner: r.owner as 'andrew' | 'shammi',
    date: new Date(r.date as string),
    refNo: (r.ref_no as string) ?? '',
    particulars: r.particulars as string,
    amount: r.amount as number,
    categoryId: r.category_id as string,
  }));
}

export function getAllSettlements(): MonthlySettlement[] {
  const d = getDb();
  const rows = d
    .prepare(
      `SELECT rr.monthly_data_id, rr.andrew_total, rr.shammi_total,
              rr.net_settlement_payer, rr.net_settlement_payee, rr.net_settlement_amount
       FROM reconciliation_results rr
       JOIN monthly_data md ON rr.monthly_data_id = md.id
       WHERE md.is_committed = 1
       ORDER BY rr.monthly_data_id ASC`
    )
    .all() as Record<string, unknown>[];
  return rows.map((r) => ({
    monthId: r.monthly_data_id as string,
    andrewTotal: r.andrew_total as number,
    shammiTotal: r.shammi_total as number,
    payer: (r.net_settlement_payer as 'andrew' | 'shammi') ?? null,
    payee: (r.net_settlement_payee as 'andrew' | 'shammi') ?? null,
    amount: r.net_settlement_amount as number,
  }));
}

// ─── Write operations ───

export function saveMonthlyData(m: MonthlyData): void {
  const d = getDb();
  const now = new Date().toISOString();

  const save = d.transaction(() => {
    // Clear existing data for this month
    d.prepare('DELETE FROM category_breakdowns WHERE reconciliation_result_id IN (SELECT id FROM reconciliation_results WHERE monthly_data_id = ?)').run(m.id);
    d.prepare('DELETE FROM reconciliation_results WHERE monthly_data_id = ?').run(m.id);
    d.prepare('DELETE FROM category_splits WHERE monthly_data_id = ?').run(m.id);
    d.prepare('DELETE FROM transactions WHERE monthly_data_id = ?').run(m.id);
    d.prepare('DELETE FROM monthly_data WHERE id = ?').run(m.id);

    d.prepare(
      `INSERT INTO monthly_data (id, month, year, month_number, is_committed, andrew_file_name, shammi_file_name, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      m.id,
      m.month,
      parseInt(m.id.slice(0, 4), 10),
      parseInt(m.id.slice(5, 7), 10),
      m.isCommitted ? 1 : 0,
      m.andrewFileName ?? null,
      m.shammiFileName ?? null,
      now,
      now
    );

    const insertTx = d.prepare(
      `INSERT INTO transactions (id, monthly_data_id, owner, date, ref_no, particulars, amount, category_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const tx of m.andrewTransactions) {
      insertTx.run(tx.id, m.id, 'andrew', isoDate(new Date(tx.date)), tx.refNo ?? null, tx.particulars, tx.amount, tx.categoryId);
    }
    for (const tx of m.shammiTransactions) {
      insertTx.run(tx.id, m.id, 'shammi', isoDate(new Date(tx.date)), tx.refNo ?? null, tx.particulars, tx.amount, tx.categoryId);
    }

    const insertSplit = d.prepare(
      `INSERT INTO category_splits (monthly_data_id, category_id, shammi_percentage, andrew_percentage)
       VALUES (?, ?, ?, ?)`
    );
    for (const s of m.categorySplits) {
      insertSplit.run(m.id, s.categoryId, s.shammiPercentage, s.andrewPercentage);
    }

    if (m.reconciliation) {
      const r = m.reconciliation;
      const rrResult = d.prepare(
        `INSERT INTO reconciliation_results (
          monthly_data_id, andrew_total, shammi_total, andrew_expected_contribution, shammi_expected_contribution,
          andrew_shortfall, shammi_shortfall, net_settlement_payer, net_settlement_payee, net_settlement_amount, calculated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        m.id, r.andrewTotal, r.shammiTotal, r.andrewExpectedContribution, r.shammiExpectedContribution,
        r.andrewShortfall, r.shammiShortfall,
        r.netSettlement?.payer ?? null, r.netSettlement?.payee ?? null, r.netSettlement?.amount ?? null,
        now
      );
      const rrId = rrResult.lastInsertRowid;
      const insertCb = d.prepare(
        `INSERT INTO category_breakdowns (
          reconciliation_result_id, category_id, total_amount, andrew_paid, shammi_paid,
          andrew_should_pay, shammi_should_pay, andrew_shortfall, shammi_shortfall,
          shammi_split_percentage, andrew_split_percentage
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );
      for (const b of r.categoryBreakdowns) {
        insertCb.run(
          rrId, b.categoryId, b.totalAmount, b.andrewPaid, b.shammiPaid,
          b.andrewShouldPay, b.shammiShouldPay, b.andrewShortfall, b.shammiShortfall,
          b.splitPercentages.shammi, b.splitPercentages.andrew
        );
      }
    }
  });

  save();
}

export function deleteMonthlyData(id: string): void {
  const d = getDb();
  const del = d.transaction(() => {
    d.prepare('DELETE FROM category_breakdowns WHERE reconciliation_result_id IN (SELECT id FROM reconciliation_results WHERE monthly_data_id = ?)').run(id);
    d.prepare('DELETE FROM reconciliation_results WHERE monthly_data_id = ?').run(id);
    d.prepare('DELETE FROM category_splits WHERE monthly_data_id = ?').run(id);
    d.prepare('DELETE FROM transactions WHERE monthly_data_id = ?').run(id);
    d.prepare('DELETE FROM monthly_data WHERE id = ?').run(id);
  });
  del();
}
