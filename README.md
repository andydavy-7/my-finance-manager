# Finance Manager V3

A modern, browser-based monthly expense reconciliation system for managing shared household finances. Automatically calculates settlements between partners based on configurable category splits and transaction categorization.

## Features

### 📊 Core Functionality
- **Monthly Expense Tracking**: Organize transactions by month with year/month navigation
- **Dual Statement Upload**: Upload CSV statements from two accounts (Andrew & Shammi)
- **Smart Categorization**: Automatic transaction categorization with manual override capability
- **Configurable Category Splits**: Set custom percentage splits for each expense category
- **Automated Reconciliation**: Calculate expected contributions, shortfalls, and net settlements
- **Category Breakdown**: Detailed per-category analysis showing who paid what and who should pay

### 💾 Data Management
- **Browser-Based Storage**: SQLite database stored in browser localStorage
- **Automatic Backups**: Automatic backup to local file system (Chrome/Edge) or download (other browsers)
- **Edit Committed Data**: Edit previously saved months with full data integrity
- **Delete Month Data**: Remove all data for a specific month with confirmation
- **Manual Backup/Restore**: Manual backup and restore buttons for data safety

### 🎨 User Experience
- **Clean, Modern UI**: Responsive design with intuitive navigation
- **URL-Based Navigation**: Each month has its own URL (`/month/YYYY-MM`) for bookmarking
- **Toast Notifications**: Success and error feedback for all operations
- **Sticky Navigation**: Quick navigation to sections with left sidebar index
- **Empty States**: Helpful messages when no data is available

## Tech Stack

- **Frontend**: React 19 + TypeScript
- **State Management**: Zustand
- **Routing**: React Router v7
- **Database**: SQL.js (SQLite in the browser)
- **Build Tool**: Vite
- **Date Handling**: date-fns
- **File Parsing**: xlsx (for CSV/Excel support)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Modern browser (Chrome/Edge recommended for File System Access API)

### Installation

1. **Clone or download the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   - Navigate to `http://localhost:5173`
   - The app will automatically redirect to the current month

### Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory. You can preview it with:

```bash
npm run preview
```

## Usage Guide

### 1. Setting Up a Month

1. **Select Month/Year**: Use the dropdowns at the top to navigate to any month
2. **Upload Statements**: 
   - Click "Upload" tab
   - Drag and drop or select CSV files for Andrew and Shammi
   - Files are automatically parsed and transactions extracted

### 2. Categorizing Transactions

1. **View Transactions**: Click "Transactions" tab
2. **Assign Categories**: 
   - Each transaction shows its current category
   - Click the category badge to change it
   - Categories are color-coded for easy identification

### 3. Configuring Category Splits

1. **Open Settings**: Click the gear icon in the header
2. **Edit Splits**: 
   - Adjust percentage splits for each category
   - Total must equal 100% (validation included)
   - Changes apply to the current month

### 4. Calculating Reconciliation

1. **View Breakdown**: Click "Category Breakdown" tab
2. **Calculate**: Click "Calculate Reconciliation" button
3. **Review Results**: 
   - See overall reconciliation summary
   - View per-category breakdown
   - Check net settlement amount and who pays whom

### 5. Saving and Committing

1. **Save & Commit**: Click the blue "Save & Commit" button
2. **Data Persisted**: 
   - All transactions, categories, splits, and reconciliation saved
   - Month marked as committed
   - Automatic backup created (if File System Access API available)

### 6. Editing Committed Months

1. **Select Month**: Navigate to a committed month
2. **Click Edit**: Click "Edit" button (appears for committed months)
3. **Make Changes**: Modify transactions, categories, or splits
4. **Save Changes**: Click "Save & Commit" to update
5. **Delete (Optional)**: Use "Delete" button at bottom to remove all month data

## Data Storage & Backup

### How Data is Stored

- **Primary Storage**: SQLite database in browser `localStorage` (key: `fm_db`)
- **Backup Location**: `./backups/finance-manager-backup.db` (local file system)

### Automatic Backups

- **After Save & Commit**: Automatic backup created silently
- **On Startup**: If localStorage is empty, automatically restores from backup file
- **File System Access API** (Chrome/Edge): Direct file system access, no prompts after initial permission
- **Download Method** (Safari/Firefox): Downloads backup file, manual restore required

### Manual Backup/Restore

- **Backup Button**: Manually create a backup (useful before major changes)
- **Restore Button**: Restore from a backup file (replaces current data)

See [BACKUP_SYSTEM.md](./BACKUP_SYSTEM.md) for detailed backup system documentation.

## Project Structure

```
src/
├── application/
│   └── stores/          # Zustand state management
├── data/                # Static data (categories, default splits)
├── domain/
│   ├── entities/        # TypeScript interfaces/types
│   └── services/        # Business logic (reconciliation, parsing)
├── infrastructure/
│   └── database/         # Database service & backup system
└── presentation/
    ├── components/       # Reusable UI components
    └── pages/           # Page components
```

## Database Schema

The app uses SQLite with the following main tables:
- `monthly_data`: Month metadata and file names
- `transactions`: Individual transactions with categorization
- `category_splits`: Percentage splits per category per month
- `reconciliation_results`: Calculated reconciliation summary
- `category_breakdowns`: Per-category reconciliation details

See `src/infrastructure/database/schema.sql` for full schema.

## Browser Compatibility

- **Chrome/Edge**: Full support including File System Access API
- **Safari**: Works with download/upload backup method
- **Firefox**: Works with download/upload backup method

## Development

### Code Style

The project follows the guidelines in [CLAUDE_APP_DEVELOPMENT_GUIDELINES.md](./CLAUDE_APP_DEVELOPMENT_GUIDELINES.md).

### Linting

```bash
npm run lint
```

### TypeScript

The project uses strict TypeScript configuration. All code is fully typed.

## Troubleshooting

### Data Not Saving

- Check browser console for errors
- Ensure localStorage is not disabled
- Try manual backup to verify database is working

### Backup Not Working

- **Chrome/Edge**: Grant directory permission when prompted
- **Other browsers**: Use download method and manually save files
- Check `backups/` folder exists and is writable

### Reconciliation Not Calculating

- Ensure both statements are uploaded
- Verify transactions are categorized
- Check category splits are configured (sum to 100%)

### Month Not Loading

- Check URL format: `/month/YYYY-MM`
- Verify month exists in database
- Try refreshing the page

## License

MIT

## Version History

- **v3.0.0**: Production release with full reconciliation system, backup/restore, and edit functionality
