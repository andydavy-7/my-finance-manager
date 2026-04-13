# My Finance Manager

A personal finance tracker for managing shared household expenses between two people. Upload monthly bank statement CSVs, categorize transactions, configure cost splits, and reconcile who owes whom.

Built as a native macOS Electron app with local SQLite persistence — no accounts, no cloud, no sync required.

## Features

- Import HNB bank statement CSVs for two accounts (Andrew & Shammi)
- Auto-categorize transactions by keyword matching
- Configure per-category split percentages per month
- Reconciliation engine calculates net settlement amount
- Committed months are locked and stored permanently
- Cross-month analytics with charts
- Export/Import database backup via File menu

## Tech Stack

- **Electron** — native macOS app shell
- **React + TypeScript** — UI
- **better-sqlite3** — local SQLite database (main process)
- **Zustand** — state management
- **electron-vite** — build tooling
- **recharts** — analytics charts

## Data Storage

All data is stored locally at:

```
~/Library/Application Support/finance-manager-v3/finance-manager.db
```

No data ever leaves your machine.

## Dev Setup

```bash
npm install
npm run dev        # Run with hot-reload in Electron
```

## Build

```bash
npm run build:mac  # Produces release/My Finance Manager-x.x.x-arm64.dmg
```

Install by opening the DMG and dragging the app to `/Applications`. To update, rebuild and drag again — your database is unaffected.

## Backup & Restore

Use **File → Export Backup** to save a copy of the database file. Use **File → Import Backup** to restore from a previous backup.
