export type Language = 'bn' | 'en';

export type ThemeMode = 'dark' | 'light' | 'system';

export type PaymentMethod = 'cash' | 'bkash' | 'nagad' | 'rocket' | 'bank' | 'card' | 'other';

export interface CurrencyOption {
  code: string; // e.g. 'BDT', 'USD', 'EUR'
  symbol: string; // e.g. '৳', '$', '€'
  nameBn: string; // e.g. 'বাংলাদেশী টাকা'
  nameEn: string; // e.g. 'Bangladeshi Taka'
  flag?: string; // e.g. '🇧🇩'
  isCustom?: boolean;
}

export interface UserProfile {
  id: string;
  name: string; // general display name fallback
  nameBn: string; // Name in Bangla
  nameEn: string; // Name in English
  bioBn?: string; // Profile details/bio in Bangla
  bioEn?: string; // Profile details/bio in English
  phone?: string; // Phone number (e.g. 017XXXXXXXX)
  email?: string; // Email address
  monthlyBudget: number; // Monthly budget or allowance
  monthlyIncome?: number; // Monthly income or allowance
  institutionOrJob?: string; // College, university or job
  themeMode?: ThemeMode; // 'dark' | 'light' | 'system'
  preferredLanguage: Language;
  currency: string;
  currencySymbol: string;
  customCurrencies?: CurrencyOption[];
  onboardingCompleted: boolean;
  hasCompletedOnboarding?: boolean; // backwards compatibility alias
  seedBackupEnabled: boolean;
  seedPhraseEnabled?: boolean;
  seedPhraseHash?: string;
  googleConnected: boolean;
  googleUserEmail?: string;
  lastBackupTime?: number;
  createdAt: number;
}

export interface Category {
  id: string;
  nameKey: string;
  defaultNameBn: string;
  defaultNameEn: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  isCustom: boolean;
}

export interface Transaction {
  id: string;
  monthlyAccountId: string;
  type: 'expense' | 'income';
  amount: number; // Stored as integer (Taka)
  categoryId: string;
  customCategoryName?: string;
  date: string; // YYYY-MM-DD
  note?: string;
  paymentMethod: PaymentMethod;
  receiptUri?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MonthlyAccount {
  id: string; // Format: YYYY-MM (e.g. "2026-08")
  year?: number;
  month?: number; // 1-12
  startingBalance: number;
  additionalIncome?: number;
  carryForwardAmount?: number;
  carryForward?: number; // alias
  targetBudget?: number;
  isClosed?: boolean;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface MonthlySummary {
  monthId: string;
  year: number;
  month: number;
  startingBalance: number;
  additionalIncome: number;
  carryForward: number;
  totalAvailable: number;
  totalExpenses: number;
  remainingBalance: number;
  todayExpenses: number;
  thisWeekExpenses: number;
  dailyAverage: number;
  daysPassedInMonth: number;
  daysInMonth: number;
  daysRemaining: number;
  burnRatePerDay: number;
  projectedDaysLeft: number;
  highestCategory?: {
    category: Category;
    amount: number;
    percentage: number;
  };
  highestExpense?: Transaction;
  transactionCount: number;
}

export interface SmartInsight {
  id: string;
  type: 'highlight' | 'warning' | 'info' | 'positive';
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  icon: string;
  statValue?: string;
}

export interface EncryptedBackupData {
  version: number;
  appName: string;
  createdAt: number;
  salt: string; // Base64
  iv: string; // Base64
  ciphertext: string; // Base64
  checksum: string;
}

export interface AppStateData {
  user: UserProfile;
  accounts: MonthlyAccount[];
  transactions: Transaction[];
  categories: Category[];
  customCategories?: Category[];
  activeMonthId?: string;
  lastSyncTimestamp?: number;
}
