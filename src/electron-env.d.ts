interface ElectronAPI {
  db: {
    init(): Promise<void>;
    listMonths(): Promise<string[]>;
    loadMonth(id: string): Promise<unknown>;
    saveMonth(m: unknown): Promise<void>;
    deleteMonth(id: string): Promise<void>;
    getAllTransactions(): Promise<unknown[]>;
    getAllSettlements(): Promise<unknown[]>;
  };
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
