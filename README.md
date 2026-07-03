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
- **react-router-dom** — client-side routing
- **better-sqlite3** — local SQLite database (main process)
- **Zustand** — state management
- **electron-vite** — build tooling
- **recharts** — analytics charts
- **date-fns** — date formatting/display
- **electron-builder** — packaging into a macOS DMG

HNB statement CSVs are parsed by a small custom reader (`StatementParser.ts`) — no third-party CSV/spreadsheet library is used.

## Project Structure

```
electron/
  main.ts        Main process — BrowserWindow, IPC handlers, native menus
  preload.ts     contextBridge exposing window.electronAPI to renderer
  database.ts    All SQLite logic (better-sqlite3, synchronous)

src/
  domain/
    entities/    Pure data types (Transaction, MonthlyData, etc.)
    services/    Business logic (StatementParser, CategorizationService, ReconciliationService)
  application/
    stores/      Zustand store — all app state
  infrastructure/
    database/    DatabaseService.ts — thin async IPC client
  data/          Static config (categories, default splits)
  presentation/
    pages/       DashboardPage, AnalyticsPage
    components/  UI components
```

## Data Storage

All data is stored locally in a SQLite database — no accounts, no cloud, nothing leaves your machine. The location depends on how the app is run:

| Mode | Database location |
|------|-------------------|
| **Production** (installed `.app`) | `~/Library/Application Support/finance-manager-v3/finance-manager.db` |
| **Development** (`npm run dev`) | `<repo>/dev-data/finance-manager.db` |

The two are completely isolated: running `npm run dev` never touches your production data, and rebuilding/replacing the app never touches the database (the DB lives outside the app bundle). The `dev-data/` folder is gitignored and never committed.

To develop against a copy of real data, quit the app and copy the production DB into `dev-data/`:

```bash
mkdir -p dev-data
sqlite3 "$HOME/Library/Application Support/finance-manager-v3/finance-manager.db" \
  ".backup 'dev-data/finance-manager.db'"
```

### Date handling

Statement dates are stored as plain calendar strings (`yyyy-MM-dd`) using **local** date components — never `toISOString()`, which would convert to UTC and shift dates back a day in positive-offset timezones (e.g. Asia/Colombo, UTC+5:30). A bank statement date is a calendar date, not a moment in time, so no timezone is ever applied on the way in or out.

## Requirements

- macOS on Apple Silicon (arm64) — M1 or later
- Node.js 20+ (required by Vite 7)

## Dev Setup

```bash
npm install
npm run dev        # Run with hot-reload in Electron (uses <repo>/dev-data DB)
```

`npm run dev` serves the renderer on `http://localhost:5173` (or the next free port) and opens an Electron window with DevTools. It reads/writes only the dev database in `dev-data/`.

## Development Workflow

`main` is the single source of truth. All work is done on a short-lived branch, merged to `main` via PR, and releases are built directly from `main`.

```bash
git checkout -b my-fix          # branch off main
# ...make changes, verify with `npm run dev`...
git commit -am "..."
git push -u origin my-fix
gh pr create --base main --head my-fix
gh pr merge --merge            # merge to main
```

Then build the release from `main` (see below). Building does not require a separate branch — the branch name has no effect on the output, and all build tooling lives in `package.json` / `node_modules` shared across branches.

## Build & Update

```bash
npm run build:mac  # Produces release/My Finance Manager-x.x.x-arm64.dmg
```

> Don't run `npm run build:mac` while `npm run dev` is running — both write to `out/`. Stop the dev server first, then restart it afterward if needed.

To install or update the app:

1. **Quit** the running Finance Manager app (it holds the database open).
2. Run `npm run build:mac` from `main`.
3. Open the DMG and drag **My Finance Manager** into `/Applications`, choosing **Replace** when prompted.
4. Reopen the app.

Your database is **preserved across updates** — it lives in `~/Library/Application Support/finance-manager-v3/`, not inside the app bundle, so replacing the `.app` never affects your data. Deleting the old app and copying the new one, or drag-to-replace, are equivalent.

**Unsigned build note:** the app is not code-signed, so macOS Gatekeeper may block the first launch of a new build. If so, **right-click the app → Open** once (or run `xattr -dr com.apple.quarantine "/Applications/My Finance Manager.app"`). This is a one-time step per build and does not affect data.

## Backup & Restore

Use **File → Export Backup** to save a copy of the database file. Use **File → Import Backup** to restore from a previous backup.
