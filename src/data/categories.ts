/**
 * Category definition with keyword patterns for auto-categorization
 */
export interface Category {
  id: string;
  name: string;
  color: string;
  keywords: string[];
  backgroundColor: string;
  splitType: 'shared' | 'individual';
}

/**
 * Predefined expense categories with keyword patterns
 * Keywords are matched case-insensitively against transaction particulars
 */
export const categories: Category[] = [
  {
    id: 'groceries',
    name: 'Groceries',
    color: '#10B981',
    backgroundColor: '#ECFDF5',
    keywords: ['KEELLS', 'CARGILLS', 'ARPICO', 'FOODCITY', 'CHANDRA'],
    splitType: 'shared'
  },
  {
    id: 'food',
    name: 'Food',
    color: '#F97316',
    backgroundColor: '#FFF7ED',
    keywords: ['PIZZA HUT', 'KALA BALAN', 'KFC', 'SFC', 'RESTAURANT', 'CAFE', 'BAKERS', 'KITCHEN', 'SILVER SPOON', 'INDIAN KITCHEN', 'BUBBLE TEA', 'WOK', 'CARAVAN'],
    splitType: 'shared'
  },
  {
    id: 'transport',
    name: 'Transport',
    color: '#EC4899',
    backgroundColor: '#FDF2F8',
    keywords: ['UBER', 'PICKME'],
    splitType: 'individual'
  },
  {
    id: 'healthcare',
    name: 'Healthcare',
    color: '#14B8A6',
    backgroundColor: '#F0FDFA',
    keywords: ['ASIRI', 'HOSPITAL', 'PHARMACY', 'MEDICAL', 'CLINIC', 'DOCTOR', 'CHANNELING'],
    splitType: 'shared'
  },
  {
    id: 'utilities',
    name: 'Utilities',
    color: '#F59E0B',
    backgroundColor: '#FFFBEB',
    keywords: ['LECO', 'NWSDB', 'WATER SUPPLY', 'NATIONAL WATER', 'ELECTRICITY'],
    splitType: 'shared'
  },
  {
    id: 'telco',
    name: 'Telco',
    color: '#3B82F6',
    backgroundColor: '#EFF6FF',
    keywords: ['DIALOG', 'MOBITEL', 'HUTCH', 'SLT', 'AXIATA', 'AIRTEL'],
    splitType: 'shared'
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    color: '#8B5CF6',
    backgroundColor: '#F5F3FF',
    keywords: ['CINEMA', 'MOVIE'],
    splitType: 'shared'
  },
  {
    id: 'personal',
    name: 'Personal',
    color: '#6B7280',
    backgroundColor: '#F9FAFB',
    keywords: ['MERAKI','CLAUDE.AI', 'NETFLIX', 'SPOTIFY', 'APPLE.COM', 'SUBSCRIPTION'],
    splitType: 'individual'
  },
  {
    id: 'transfers',
    name: 'Transfers',
    color: '#64748B',
    backgroundColor: '#F8FAFC',
    keywords: ['CREDIT CARD', 'CRED', 'LOAN', 'LEASE', 'FRIMI', 'BILLPMT', 'ATM WTD'],
    splitType: 'individual'
  },
  {
    id: 'school',
    name: 'School',
    color: '#6366F1',
    backgroundColor: '#EEF2FF',
    keywords: ['Aethan'],
    splitType: 'shared'
  },
  {
    id: 'fifty-fifty',
    name: '50/50',
    color: '#06B6D4',
    backgroundColor: '#ECFEFF',
    keywords: [],
    splitType: 'shared'
  },
  {
    id: 'fuel',
    name: 'Fuel',
    color: '#EF4444',
    backgroundColor: '#FEF2F2',
    keywords: ['MPCS', 'FUEL', 'PETROL', 'CEYPETCO', 'IOC', 'FILLING'],
    splitType: 'individual'
  },
  {
    id: 'pjfm',
    name: 'PJFM',
    color: '#F43F5E',
    backgroundColor: '#FFF1F2',
    keywords: ['PJFM', 'P J F M', 'PROPHET'],
    splitType: 'individual'
  },
  {
    id: 'highway',
    name: 'Highway',
    color: '#475569',
    backgroundColor: '#F1F5F9',
    keywords: ['INTERCHANGE', 'INTERCHAN', 'INTERCH', 'TOLL', 'EXPRESSWAY'],
    splitType: 'individual'
  },
  {
    id: 'vehicle',
    name: 'Vehicle',
    color: '#84CC16',
    backgroundColor: '#F7FEE7',
    keywords: ['STAFFORD', 'AUTO SERVICE'],
    splitType: 'individual'
  },
  {
    id: 'others',
    name: 'Others',
    color: '#9CA3AF',
    backgroundColor: '#F9FAFB',
    keywords: [],
    splitType: 'individual'
  }
];

/**
 * Get category by ID
 */
export function getCategoryById(id: string): Category | undefined {
  return categories.find(cat => cat.id === id);
}

/**
 * Get the default/fallback category
 */
export function getDefaultCategory(): Category {
  return categories.find(cat => cat.id === 'others')!;
}
