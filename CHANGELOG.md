# Changelog

All notable changes to Finance Manager V3 will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0] - 2025-01-XX

### Added
- Monthly expense reconciliation system with dual account support
- CSV statement upload and parsing for two accounts (Andrew & Shammi)
- Transaction categorization with manual override
- Configurable category split percentages with validation
- Automated reconciliation calculation with settlement amounts
- Category breakdown view showing per-category analysis
- URL-based month navigation (`/month/YYYY-MM`)
- Year/month picker for navigating to any month (past or future)
- Edit functionality for committed months
- Delete month data with two-step confirmation
- Browser-based SQLite database storage (SQL.js)
- Automatic backup system with File System Access API support
- Manual backup/restore buttons
- Toast notifications for user feedback
- Sticky left navigation sidebar with section index
- Empty states for better UX
- Comprehensive error handling and validation

### Technical
- React 19 with TypeScript
- Zustand for state management
- React Router v7 for navigation
- SQL.js for in-browser SQLite database
- File System Access API for seamless backups (Chrome/Edge)
- Download/upload fallback for other browsers
- IndexedDB for persistent directory handle storage

### Documentation
- Comprehensive README with usage guide
- Backup system documentation
- Development guidelines
