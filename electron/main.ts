import { app, BrowserWindow, ipcMain, dialog, Menu } from 'electron';
import { join } from 'path';
import { copyFileSync } from 'fs';
import * as db from './database';

// Pin userData so the database location never shifts when the app name changes.
// Production: ~/Library/Application Support/finance-manager-v3
// Dev: <repo>/dev-data — the dev database lives alongside the code and never
// touches production data. (process.cwd() is the repo root under `npm run dev`.)
if (app.isPackaged) {
  app.setPath('userData', join(app.getPath('appData'), 'finance-manager-v3'));
} else {
  app.setPath('userData', join(process.cwd(), 'dev-data'));
}

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: '',
    titleBarStyle: 'default',
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    void mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL']);
    mainWindow.webContents.openDevTools();
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  mainWindow.on('page-title-updated', (e) => e.preventDefault());
  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildMenu(): void {
  const template = Menu.buildFromTemplate([
    // macOS app menu (first menu = app name)
    {
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    // File menu with backup actions
    {
      label: 'File',
      submenu: [
        {
          label: 'Export Backup…',
          accelerator: 'CmdOrCtrl+Shift+S',
          async click() {
            if (!mainWindow) return;
            const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
              title: 'Export Backup',
              defaultPath: `finance-manager-backup-${new Date().toISOString().slice(0, 10)}.db`,
              filters: [{ name: 'SQLite Database', extensions: ['db'] }],
            });
            if (canceled || !filePath) return;
            copyFileSync(db.getDbPath(), filePath);
            void dialog.showMessageBox(mainWindow, {
              type: 'info',
              message: 'Backup exported successfully.',
              detail: filePath,
              buttons: ['OK'],
            });
          },
        },
        {
          label: 'Import Backup…',
          async click() {
            if (!mainWindow) return;
            const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
              title: 'Import Backup',
              filters: [{ name: 'SQLite Database', extensions: ['db'] }],
              properties: ['openFile'],
            });
            if (canceled || !filePaths[0]) return;
            const { response } = await dialog.showMessageBox(mainWindow, {
              type: 'warning',
              message: 'Import Backup',
              detail: 'This will replace all current data with the selected backup. This cannot be undone.',
              buttons: ['Import', 'Cancel'],
              defaultId: 1,
              cancelId: 1,
            });
            if (response !== 0) return;
            db.importFromFile(filePaths[0]);
            mainWindow.webContents.reload();
          },
        },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    // Edit menu (standard Mac shortcuts)
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    // View menu
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    // Window menu
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'front' },
      ],
    },
  ]);

  Menu.setApplicationMenu(template);
}

// ─── IPC: Database ───

ipcMain.handle('db:init', () => {
  db.initDatabase();
});

ipcMain.handle('db:listMonths', () => {
  return db.listMonthIds();
});

ipcMain.handle('db:loadMonth', (_event, id: string) => {
  return db.loadMonthlyData(id);
});

ipcMain.handle('db:saveMonth', (_event, m: Parameters<typeof db.saveMonthlyData>[0]) => {
  db.saveMonthlyData(m);
});

ipcMain.handle('db:deleteMonth', (_event, id: string) => {
  db.deleteMonthlyData(id);
});

ipcMain.handle('db:getAllTransactions', () => {
  return db.getAllTransactionsAllTime();
});

ipcMain.handle('db:getAllSettlements', () => {
  return db.getAllSettlements();
});

// ─── App lifecycle ───

app.whenReady().then(() => {
  buildMenu();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
