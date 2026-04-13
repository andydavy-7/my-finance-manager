import { create } from 'zustand';
import { format, parseISO, addMonths } from 'date-fns';
import { Transaction } from '../../domain/entities/Transaction';
import type { MonthlyData } from '../../domain/entities/MonthlyData';
import type { CategorySplit } from '../../domain/entities/CategorySplit';
import { parseHNBStatement, readFileAsText } from '../../domain/services/StatementParser';
import { calculateReconciliation } from '../../domain/services/ReconciliationService';
import { defaultCategorySplits } from '../../data/defaultCategorySplits';
import { saveMonthlyData, loadMonthlyData, listMonthIds, deleteMonthlyData, getAllTransactionsAllTime, getAllSettlements } from '../../infrastructure/database/DatabaseService';
export type { AllTimeTransaction, MonthlySettlement } from '../../infrastructure/database/DatabaseService';

export type Owner = 'andrew' | 'shammi';

function getCurrentMonthId(): string {
  return format(new Date(), 'yyyy-MM');
}

function getMonthLabel(id: string): string {
  return format(parseISO(id + '-01'), 'MMMM yyyy');
}

function getNextMonthId(id: string): string {
  return format(addMonths(parseISO(id + '-01'), 1), 'yyyy-MM');
}

function createEmptyMonthlyData(id: string): MonthlyData {
  return {
    id,
    month: getMonthLabel(id),
    andrewTransactions: [],
    shammiTransactions: [],
    categorySplits: [...defaultCategorySplits],
    reconciliation: null,
    isCommitted: false
  };
}

function getNextAvailableDraftMonth(committedMonthIds: string[]): string {
  const currentMonth = getCurrentMonthId();
  const committedSet = new Set(committedMonthIds);
  
  // Start from current month and find the first uncommitted month
  let candidate = currentMonth;
  let attempts = 0;
  while (committedSet.has(candidate) && attempts < 12) {
    candidate = getNextMonthId(candidate);
    attempts++;
  }
  
  return candidate;
}


export interface TransactionWithOwner extends Transaction {
  owner: Owner;
}

interface TransactionStore {
  draftMonth: MonthlyData | null;
  selectedMonthId: string;
  currentMonth: MonthlyData | null;
  monthIds: string[];
  loading: boolean;
  error: Error | null;
  isEditing: boolean;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;

  setSelectedMonth: (id: string) => Promise<void>;
  refreshMonthIds: () => Promise<void>;
  startEditing: () => void;
  cancelEditing: () => Promise<void>;
  loadFromFile: (owner: Owner, file: File) => Promise<void>;
  updateCategory: (owner: Owner, transactionId: string, categoryId: string) => void;
  clearStatement: (owner: Owner) => void;
  updateCategorySplit: (categoryId: string, shammiPercentage: number, andrewPercentage: number) => void;
  resetCategorySplitsToDefault: () => void;
  calculateReconciliation: () => void;
  saveCurrentMonth: () => Promise<void>;
  getAllTransactions: () => TransactionWithOwner[];
  getTransactionsByOwner: (owner: Owner) => Transaction[];
  getAnalyticsTransactions: () => Promise<import('../../infrastructure/database/DatabaseService').AllTimeTransaction[]>;
  getSettlements: () => Promise<import('../../infrastructure/database/DatabaseService').MonthlySettlement[]>;
  getMonthLabel: (id: string) => string;
  isDraft: () => boolean;
  initDraft: () => Promise<void>;
  deleteCurrentMonth: () => Promise<void>;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
}

export const useTransactionStore = create<TransactionStore>((set, get) => {
  const currentMonthId = getCurrentMonthId();
  const initialMonth = createEmptyMonthlyData(currentMonthId);
  
  return {
    draftMonth: initialMonth,
    selectedMonthId: currentMonthId,
    currentMonth: initialMonth,
    monthIds: [],
    loading: false,
    error: null,
    isEditing: false,
    toast: null,

  initDraft: async () => {
    const state = get();
    if (!state.currentMonth) {
      const currentMonthId = getCurrentMonthId();
      const month = (await loadMonthlyData(currentMonthId)) ?? createEmptyMonthlyData(currentMonthId);
      set({ currentMonth: month, selectedMonthId: currentMonthId, draftMonth: month });
    }
  },

  setSelectedMonth: async (id) => {
    const state = get();
    // If selecting 'draft', use current month
    if (id === 'draft') {
      const currentMonthId = getCurrentMonthId();
      id = currentMonthId;
    }
    
    // Try to load the month from database
    const loaded = await loadMonthlyData(id);
    
    if (loaded) {
      // Month exists - load it
      const updatedMonthIds = await listMonthIds();
      set({ 
        currentMonth: loaded, 
        selectedMonthId: id, 
        draftMonth: state.draftMonth, 
        isEditing: false,
        monthIds: updatedMonthIds
      });
    } else {
      // Month doesn't exist - create empty draft for it
      const newDraft = createEmptyMonthlyData(id);
      const updatedMonthIds = await listMonthIds();
      set({ 
        currentMonth: newDraft, 
        selectedMonthId: id,
        draftMonth: newDraft,
        isEditing: false,
        monthIds: updatedMonthIds
      });
    }
  },

  startEditing: () => {
    const state = get();
    if (state.currentMonth?.isCommitted) {
      set({ isEditing: true });
    }
  },

  cancelEditing: async () => {
    const state = get();
    if (state.isEditing && state.selectedMonthId !== 'draft') {
      const loaded = await loadMonthlyData(state.selectedMonthId);
      set({ currentMonth: loaded, isEditing: false });
    } else {
      set({ isEditing: false });
    }
  },

  refreshMonthIds: async () => {
    const state = get();
    const updatedMonthIds = await listMonthIds();
    
    // If current draft month is already committed, update to next available month
    if (state.draftMonth && state.draftMonth.id && updatedMonthIds.includes(state.draftMonth.id)) {
      const nextDraftId = getNextAvailableDraftMonth(updatedMonthIds);
      const newDraft = createEmptyMonthlyData(nextDraftId);
      set({ 
        monthIds: updatedMonthIds,
        draftMonth: newDraft,
        currentMonth: state.selectedMonthId === 'draft' ? newDraft : state.currentMonth
      });
    } else {
      set({ monthIds: updatedMonthIds });
    }
  },

  loadFromFile: async (owner, file) => {
    const state = get();
    const m = state.currentMonth;
    if (!m || (m.isCommitted && !state.isEditing)) return;
    set({ loading: true, error: null });
    try {
      const content = await readFileAsText(file);
      const transactions = parseHNBStatement(content);
      const next: MonthlyData = {
        ...m,
        andrewTransactions: owner === 'andrew' ? transactions : m.andrewTransactions,
        shammiTransactions: owner === 'shammi' ? transactions : m.shammiTransactions,
        andrewFileName: owner === 'andrew' ? file.name : m.andrewFileName,
        shammiFileName: owner === 'shammi' ? file.name : m.shammiFileName,
        reconciliation: null
      };
      set({
        currentMonth: next,
        draftMonth: state.selectedMonthId === 'draft' ? next : state.draftMonth,
        loading: false,
        error: null,
        toast: { message: `${file.name} loaded successfully (${transactions.length} transactions)`, type: 'success' }
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load file';
      set({ 
        error: err as Error, 
        loading: false,
        toast: { message: `Error: ${errorMessage}`, type: 'error' }
      });
    }
  },

  updateCategory: (owner, transactionId, categoryId) => {
    const state = get();
    const m = state.currentMonth;
    if (!m || (m.isCommitted && !state.isEditing)) return;
    const map = (tx: Transaction) =>
      tx.id === transactionId ? { ...tx, categoryId } : tx;
    const next: MonthlyData = {
      ...m,
      andrewTransactions: owner === 'andrew' ? m.andrewTransactions.map(map) : m.andrewTransactions,
      shammiTransactions: owner === 'shammi' ? m.shammiTransactions.map(map) : m.shammiTransactions,
      reconciliation: null
    };
    set({
      currentMonth: next,
      draftMonth: state.selectedMonthId === 'draft' ? next : state.draftMonth
    });
  },

  clearStatement: (owner) => {
    const state = get();
    const m = state.currentMonth;
    if (!m || (m.isCommitted && !state.isEditing)) return;
    const next: MonthlyData = {
      ...m,
      andrewTransactions: owner === 'andrew' ? [] : m.andrewTransactions,
      shammiTransactions: owner === 'shammi' ? [] : m.shammiTransactions,
      andrewFileName: owner === 'andrew' ? null : m.andrewFileName,
      shammiFileName: owner === 'shammi' ? null : m.shammiFileName,
      reconciliation: null
    };
    set({
      currentMonth: next,
      draftMonth: state.selectedMonthId === 'draft' ? next : state.draftMonth
    });
  },

  updateCategorySplit: (categoryId, shammiPercentage, andrewPercentage) => {
    const state = get();
    const m = state.currentMonth;
    if (!m || (m.isCommitted && !state.isEditing)) return;
    const idx = m.categorySplits.findIndex((s) => s.categoryId === categoryId);
    const splits: CategorySplit[] =
      idx >= 0
        ? m.categorySplits.map((s, i) =>
            i === idx ? { categoryId, shammiPercentage, andrewPercentage } : s
          )
        : [...m.categorySplits, { categoryId, shammiPercentage, andrewPercentage }];
    const next: MonthlyData = { ...m, categorySplits: splits, reconciliation: null };
    set({
      currentMonth: next,
      draftMonth: state.selectedMonthId === 'draft' ? next : state.draftMonth
    });
  },

  resetCategorySplitsToDefault: () => {
    const state = get();
    const m = state.currentMonth;
    if (!m || (m.isCommitted && !state.isEditing)) return;
    const next: MonthlyData = { ...m, categorySplits: [...defaultCategorySplits], reconciliation: null };
    set({
      currentMonth: next,
      draftMonth: state.selectedMonthId === 'draft' ? next : state.draftMonth
    });
  },

  calculateReconciliation: () => {
    const state = get();
    const m = state.currentMonth;
    if (!m) return;
    const result = calculateReconciliation(
      m.andrewTransactions,
      m.shammiTransactions,
      m.categorySplits
    );
    const next: MonthlyData = { ...m, reconciliation: result };
    set({
      currentMonth: next,
      draftMonth: state.selectedMonthId === 'draft' ? next : state.draftMonth
    });
    
    // Reconciliation is now in memory only
    // It will be saved to database and backed up when user clicks "Save & Commit"
  },

  saveCurrentMonth: async () => {
    const state = get();
    const m = state.currentMonth;
    if (!m) return;
    
    if (state.isEditing && m.isCommitted) {
      // Saving edits to a committed month
      // Ensure isCommitted stays true when saving edits
      const toSave: MonthlyData = { ...m, isCommitted: true };
      await saveMonthlyData(toSave);
      const updatedMonthIds = await listMonthIds();
      
      // Reload the saved month from database to ensure UI is in sync
      const savedMonth = await loadMonthlyData(m.id);
      if (savedMonth) {
        set({ 
          currentMonth: savedMonth, 
          isEditing: false, 
          monthIds: updatedMonthIds,
          toast: { message: 'Changes saved successfully', type: 'success' }
        });
      } else {
        set({ 
          isEditing: false, 
          monthIds: updatedMonthIds,
          toast: { message: 'Failed to reload saved data', type: 'error' }
        });
      }
    } else if (!m.isCommitted) {
      // Committing a draft - just mark as committed, stay on the same month
      const toSave: MonthlyData = { ...m, isCommitted: true };
      await saveMonthlyData(toSave);
      
      // Reload the month to get the committed version
      const savedMonth = await loadMonthlyData(m.id);
      const updatedMonthIds = await listMonthIds();
      
      if (savedMonth) {
        set({
          currentMonth: savedMonth,
          draftMonth: state.draftMonth,
          selectedMonthId: m.id,
          monthIds: updatedMonthIds,
          isEditing: false,
          toast: { message: `${m.month} committed successfully`, type: 'success' }
        });
      } else {
        set({
          monthIds: updatedMonthIds,
          isEditing: false,
          toast: { message: 'Failed to reload committed data', type: 'error' }
        });
      }
    }
  },

  deleteCurrentMonth: async () => {
    const state = get();
    const m = state.currentMonth;
    if (!m) return;
    
    try {
      // Delete from database
      await deleteMonthlyData(m.id);
      
      // Create empty month for the same ID
      const emptyMonth = createEmptyMonthlyData(m.id);
      const updatedMonthIds = await listMonthIds();
      
      // Update state - replace current month with empty version, exit edit mode
      set({
        currentMonth: emptyMonth,
        draftMonth: emptyMonth,
        selectedMonthId: m.id,
        monthIds: updatedMonthIds,
        isEditing: false,
        toast: { message: `All data for ${m.month} has been deleted`, type: 'success' }
      });
    } catch (error) {
      set({
        error: error as Error,
        toast: { message: 'Failed to delete month data. Please try again.', type: 'error' }
      });
    }
  },

  showToast: (message, type) => {
    set({ toast: { message, type } });
  },

  hideToast: () => {
    set({ toast: null });
  },

  getAllTransactions: () => {
    const m = get().currentMonth;
    if (!m) return [];
    const withOwner = (tx: Transaction, o: Owner): TransactionWithOwner => ({ ...tx, owner: o });
    return [
      ...m.andrewTransactions.map((t) => withOwner(t, 'andrew')),
      ...m.shammiTransactions.map((t) => withOwner(t, 'shammi'))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());
  },

  getTransactionsByOwner: (owner) => {
    const m = get().currentMonth;
    if (!m) return [];
    return owner === 'andrew' ? m.andrewTransactions : m.shammiTransactions;
  },

  getAnalyticsTransactions: async () => getAllTransactionsAllTime(),
  getSettlements: async () => getAllSettlements(),

  getMonthLabel,

  isDraft: () => get().currentMonth?.isCommitted === false
  };
});
