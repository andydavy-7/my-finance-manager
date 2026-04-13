# Finance Manager V3 — Developer Guide

## What it is
A personal finance tracker for two partners: **Andrew** and **Shammi**. They upload monthly HNB bank statement CSVs, categorize expenses, configure how costs are split, then reconcile who owes whom.

Runs as a native **macOS Electron app** — not a browser app.

## Architecture

```
electron/
  main.ts        Main process — BrowserWindow, IPC handlers, native menus
  preload.ts     contextBridge exposing window.electronAPI to renderer
  database.ts    All SQLite logic (better-sqlite3, synchronous)

src/
  domain/
    entities/    Pure data types (Transaction, MonthlyData, CategorySplit, etc.)
    services/    Pure business logic (StatementParser, CategorizationService, ReconciliationService)
  application/
    stores/      Zustand store (transactionStore.ts) — all app state lives here
  infrastructure/
    database/    DatabaseService.ts — thin async IPC client (calls window.electronAPI.db.*)
  data/          Static config (categories.ts, defaultCategorySplits.ts)
  presentation/
    pages/       DashboardPage, AnalyticsPage
    components/  UI components
```

### Process boundary
- **Main process** (`electron/`): Node.js, runs `better-sqlite3`, handles file I/O and native dialogs
- **Renderer process** (`src/`): React/Vite, calls DB via IPC through `window.electronAPI`
- **No sql.js, no localStorage, no OPFS** — all removed

## Data persistence
- SQLite DB at `~/Library/Application Support/finance-manager-v3/finance-manager.db`
- `userData` path is pinned in `main.ts` via `app.setPath('userData', ...)` — never shifts if app is renamed
- Writes on every Save & Commit. No manual backup needed between sessions.
- **Export/Import Backup** available via **File menu** → native macOS dialogs, copies the `.db` file directly

## Core monthly workflow
1. Upload HNB CSV for Andrew and/or Shammi (`UploadTab`)
2. Transactions auto-categorized by keyword matching (`CategorizationService`)
3. Manually re-categorize transactions in `TransactionsTab`
4. Configure category splits in Settings → Category Splits (`CategorySplitEditor`)
5. Calculate Reconciliation → produces who owes whom (`ReconciliationService`)
6. Save & Commit → locks the month and writes to DB

Committed months can be re-opened via the Edit button. Draft = any uncommitted month.

## Category split types
Defined on each `Category` as `splitType`:

| Type | Behaviour |
|------|-----------|
| `shared` | Fixed % split between Andrew/Shammi (configurable per-month in Settings) |
| `individual` | 100% to whoever made the transaction (owner-paid) |

## Categories
16 categories in `src/data/categories.ts`. Shared categories (require split config):
`groceries`, `food`, `healthcare`, `utilities`, `telco`, `entertainment`, `school`, `fifty-fifty`

Individual categories (owner-paid): `transport`, `personal`, `transfers`, `fuel`, `pjfm`, `highway`, `vehicle`, `others`

Default splits are in `src/data/defaultCategorySplits.ts` — one entry per shared category. These two files must stay in sync.

## Reconciliation logic (`ReconciliationService.ts`)
- **individual**: `andrewShouldPay = andrewPaid`, `shammiShouldPay = shammiPaid` (no settlement)
- **shared**: `andrewShouldPay = total × andrewPct%`, `shammiShouldPay = total × shammiPct%`
- Shortfall = shouldPay − paid. Positive = owes money. Net settlement = who pays whom.

## HNB CSV format
```
Date, Ref.No, Particulars, Debits, Credits, Balance
01/01/2026,SD3998951,POS/MERCHANT NAME,30000,,426913.38
```
Only debit rows are imported. Dates are `dd/MM/yyyy`. Currency is LKR.

## State management
Single Zustand store (`useTransactionStore`). Key state:
- `currentMonth: MonthlyData | null` — the month being viewed/edited
- `draftMonth` — the current uncommitted month
- `isEditing` — true when editing a committed month
- `selectedMonthId` — drives URL sync (`/month/YYYY-MM`)

`getAnalyticsTransactions()` and `getSettlements()` are async (IPC calls to main process).

## Pages
- `/` or `/month/:monthId` → `DashboardPage` (upload → transactions → breakdown → reconciliation)
- `/analytics` → `AnalyticsPage` (cross-month charts — only committed months)

## Tech stack
React + TypeScript, Electron, electron-vite, better-sqlite3, Zustand, react-router-dom, date-fns, recharts

## Dev commands
```bash
npm run dev          # Run in Electron with hot-reload
npm run build:mac    # Build → release/My Finance Manager-x.x.x-arm64.dmg
```

## Packaging
- `electron-builder` config in `package.json` under `"build"`
- Output: `release/My Finance Manager-x.x.x-arm64.dmg` (arm64 only)
- App icon: `build/icon.icns`
- Intermediate `.app` bundle is auto-cleaned after DMG is built
