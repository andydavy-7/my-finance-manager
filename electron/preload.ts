import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  db: {
    init: (): Promise<void> =>
      ipcRenderer.invoke('db:init'),
    listMonths: (): Promise<string[]> =>
      ipcRenderer.invoke('db:listMonths'),
    loadMonth: (id: string): Promise<unknown> =>
      ipcRenderer.invoke('db:loadMonth', id),
    saveMonth: (m: unknown): Promise<void> =>
      ipcRenderer.invoke('db:saveMonth', m),
    deleteMonth: (id: string): Promise<void> =>
      ipcRenderer.invoke('db:deleteMonth', id),
    getAllTransactions: (): Promise<unknown[]> =>
      ipcRenderer.invoke('db:getAllTransactions'),
    getAllSettlements: (): Promise<unknown[]> =>
      ipcRenderer.invoke('db:getAllSettlements'),
  },
});
