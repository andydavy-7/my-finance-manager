-- Monthly data table
CREATE TABLE IF NOT EXISTS monthly_data (
  id TEXT PRIMARY KEY,
  month TEXT NOT NULL,
  year INTEGER NOT NULL,
  month_number INTEGER NOT NULL,
  is_committed INTEGER DEFAULT 0,
  andrew_file_name TEXT,
  shammi_file_name TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  monthly_data_id TEXT NOT NULL,
  owner TEXT NOT NULL,
  date TEXT NOT NULL,
  ref_no TEXT,
  particulars TEXT,
  amount REAL NOT NULL,
  category_id TEXT NOT NULL,
  FOREIGN KEY (monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
);

-- Category splits (snapshot per month)
CREATE TABLE IF NOT EXISTS category_splits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monthly_data_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  shammi_percentage INTEGER NOT NULL,
  andrew_percentage INTEGER NOT NULL,
  FOREIGN KEY (monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
);

-- Reconciliation results
CREATE TABLE IF NOT EXISTS reconciliation_results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  monthly_data_id TEXT NOT NULL UNIQUE,
  andrew_total REAL NOT NULL,
  shammi_total REAL NOT NULL,
  andrew_expected_contribution REAL NOT NULL,
  shammi_expected_contribution REAL NOT NULL,
  andrew_shortfall REAL NOT NULL,
  shammi_shortfall REAL NOT NULL,
  net_settlement_payer TEXT,
  net_settlement_payee TEXT,
  net_settlement_amount REAL,
  calculated_at TEXT NOT NULL,
  FOREIGN KEY (monthly_data_id) REFERENCES monthly_data(id) ON DELETE CASCADE
);

-- Category breakdowns
CREATE TABLE IF NOT EXISTS category_breakdowns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reconciliation_result_id INTEGER NOT NULL,
  category_id TEXT NOT NULL,
  total_amount REAL NOT NULL,
  andrew_paid REAL NOT NULL,
  shammi_paid REAL NOT NULL,
  andrew_should_pay REAL NOT NULL,
  shammi_should_pay REAL NOT NULL,
  andrew_shortfall REAL NOT NULL,
  shammi_shortfall REAL NOT NULL,
  shammi_split_percentage INTEGER NOT NULL,
  andrew_split_percentage INTEGER NOT NULL,
  FOREIGN KEY (reconciliation_result_id) REFERENCES reconciliation_results(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_transactions_monthly_data ON transactions(monthly_data_id);
CREATE INDEX IF NOT EXISTS idx_category_splits_monthly_data ON category_splits(monthly_data_id);
CREATE INDEX IF NOT EXISTS idx_breakdowns_reconciliation ON category_breakdowns(reconciliation_result_id);
