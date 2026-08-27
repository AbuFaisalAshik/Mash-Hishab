import {
  UserProfile,
  MonthlyAccount,
  Transaction,
  Category,
  MonthlySummary,
  AppStateData,
  Language,
} from '../types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_INCOME_CATEGORIES } from './categories';
import { formatDate } from './i18n/formatter';

const STORAGE_KEYS = {
  FULL_STATE: 'amar_hishab_app_state_v2',
  USER: 'amar_hishab_user_v1',
  ACCOUNTS: 'amar_hishab_accounts_v1',
  TRANSACTIONS: 'amar_hishab_transactions_v1',
  CATEGORIES: 'amar_hishab_categories_v1',
};

export function getCurrentMonthId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Initializes default demo data if app is opened for the first time
 */
export function getInitialDemoState(): AppStateData {
  const currentMonthId = getCurrentMonthId();
  const [yearStr, monthStr] = currentMonthId.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const defaultUser: UserProfile = {
    id: 'user_default',
    name: 'আবু ফয়সাল',
    nameBn: 'আবু ফয়সাল',
    nameEn: 'Abu Faisal',
    bioBn: 'শিক্ষার্থী ও মেস বোর্ডার',
    bioEn: 'Student & Mess Boarder',
    phone: '01712-345678',
    email: 'abufaisal@example.com',
    monthlyBudget: 15000,
    monthlyIncome: 17000,
    institutionOrJob: 'ঢাকা বিশ্ববিদ্যালয়',
    preferredLanguage: 'bn', // BANGLA IS DEFAULT
    currency: 'BDT',
    currencySymbol: '৳',
    onboardingCompleted: true,
    hasCompletedOnboarding: true,
    seedBackupEnabled: false,
    seedPhraseEnabled: false,
    googleConnected: false,
    createdAt: Date.now(),
  };

  const defaultAccount: MonthlyAccount = {
    id: currentMonthId,
    year,
    month,
    startingBalance: 15000,
    additionalIncome: 2000,
    carryForwardAmount: 0,
    carryForward: 0,
    targetBudget: 14000,
    notes: 'মেস ও হাতখরচ বাজেট',
    createdAt: Date.now() - 15 * 86400000,
    updatedAt: Date.now(),
  };

  const today = getTodayDateString();
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const dayBefore = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];
  const fiveDaysAgo = new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0];

  const defaultTransactions: Transaction[] = [
    {
      id: 'tx_demo_inc_1',
      monthlyAccountId: currentMonthId,
      type: 'income',
      amount: 2000,
      categoryId: 'father',
      customCategoryName: 'বাবার কাছ থেকে',
      date: fiveDaysAgo,
      note: 'জরুরি হাতখরচ বিকাশ করেছেন',
      paymentMethod: 'bkash',
      createdAt: Date.now() - 5 * 86400000,
      updatedAt: Date.now() - 5 * 86400000,
    },
    {
      id: 'tx_demo_1',
      monthlyAccountId: currentMonthId,
      type: 'expense',
      amount: 4500,
      categoryId: 'hostel_rent',
      date: fiveDaysAgo,
      note: 'মাসের হোস্টেল সীট ভাড়া পরিশোধ',
      paymentMethod: 'bkash',
      createdAt: Date.now() - 5 * 86400000,
      updatedAt: Date.now() - 5 * 86400000,
    },
    {
      id: 'tx_demo_2',
      monthlyAccountId: currentMonthId,
      type: 'expense',
      amount: 2400,
      categoryId: 'grocery',
      date: dayBefore,
      note: 'মেসের চলতি মাসের মিলের অগ্রিম',
      paymentMethod: 'cash',
      createdAt: Date.now() - 2 * 86400000,
      updatedAt: Date.now() - 2 * 86400000,
    },
    {
      id: 'tx_demo_3',
      monthlyAccountId: currentMonthId,
      type: 'expense',
      amount: 450,
      categoryId: 'education',
      date: yesterday,
      note: 'সেমিস্টার পরীক্ষার গাইড বই ও খাতা',
      paymentMethod: 'nagad',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'tx_demo_4',
      monthlyAccountId: currentMonthId,
      type: 'expense',
      amount: 350,
      categoryId: 'mobile',
      date: yesterday,
      note: 'মোবাইল রিচার্জ ও মাসিক ইন্টারনেট প্যাক',
      paymentMethod: 'bkash',
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 86400000,
    },
    {
      id: 'tx_demo_5',
      monthlyAccountId: currentMonthId,
      type: 'expense',
      amount: 150,
      categoryId: 'food',
      date: today,
      note: 'দুপুরের খাবার ও নাস্তা',
      paymentMethod: 'cash',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: 'tx_demo_6',
      monthlyAccountId: currentMonthId,
      type: 'expense',
      amount: 60,
      categoryId: 'transport',
      date: today,
      note: 'ভার্সিটি যাতায়াত বাস ভাড়া',
      paymentMethod: 'cash',
      createdAt: Date.now() - 1800000,
      updatedAt: Date.now() - 1800000,
    },
  ];

  const allCategories: Category[] = [
    ...DEFAULT_EXPENSE_CATEGORIES,
    ...DEFAULT_INCOME_CATEGORIES,
  ];

  return {
    user: defaultUser,
    accounts: [defaultAccount],
    transactions: defaultTransactions,
    categories: allCategories,
    customCategories: [],
    activeMonthId: currentMonthId,
    lastSyncTimestamp: Date.now(),
  };
}

export function loadAppState(): AppStateData {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.FULL_STATE);
    if (!raw) {
      const initial = getInitialDemoState();
      saveAppState(initial);
      return initial;
    }

    const parsed: AppStateData = JSON.parse(raw);

    // Normalize user profile
    if (parsed.user) {
      parsed.user.nameBn = parsed.user.nameBn || parsed.user.name || 'আবু ফয়সাল';
      parsed.user.nameEn = parsed.user.nameEn || 'Abu Faisal';
      parsed.user.name = parsed.user.preferredLanguage === 'bn' ? parsed.user.nameBn : parsed.user.nameEn;
      parsed.user.bioBn = parsed.user.bioBn || 'শিক্ষার্থী ও মেস বোর্ডার';
      parsed.user.bioEn = parsed.user.bioEn || 'Student & Mess Boarder';
      parsed.user.phone = parsed.user.phone || '01712-345678';
      parsed.user.email = parsed.user.email || 'abufaisal@example.com';
      parsed.user.monthlyBudget = parsed.user.monthlyBudget || 15000;
      parsed.user.institutionOrJob = parsed.user.institutionOrJob || 'ঢাকা বিশ্ববিদ্যালয়';
    } else {
      parsed.user = getInitialDemoState().user;
    }

    // Ensure all required fields exist
    if (!parsed.categories || parsed.categories.length === 0) {
      parsed.categories = [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
    }
    if (!parsed.accounts) parsed.accounts = [];
    if (!parsed.transactions) parsed.transactions = [];

    const curMonth = getCurrentMonthId();
    if (!parsed.accounts.some((a) => a.id === curMonth)) {
      const [y, m] = curMonth.split('-');
      parsed.accounts.push({
        id: curMonth,
        year: parseInt(y, 10),
        month: parseInt(m, 10),
        startingBalance: 15000,
        carryForwardAmount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return parsed;
  } catch (e) {
    console.error('Failed to load state from localStorage', e);
    return getInitialDemoState();
  }
}

export function saveAppState(state: AppStateData): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FULL_STATE, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage', e);
  }
}

export function clearAllData(): void {
  try {
    localStorage.clear();
  } catch (e) {
    console.error('Failed to clear data', e);
  }
}

/**
 * Deterministic Financial Summary Calculator
 */
export function calculateMonthlySummary(
  account: MonthlyAccount,
  transactions: Transaction[],
  allCategories: Category[]
): MonthlySummary {
  const monthId = account.id;
  const [yearStr, monthStr] = monthId.split('-');
  const year = parseInt(yearStr, 10) || new Date().getFullYear();
  const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;

  const monthTransactions = transactions.filter((t) => t.monthlyAccountId === monthId);

  let totalExpenseAmount = 0;
  let totalIncomeTransactions = 0;

  const categorySpendMap: Record<string, number> = {};
  let highestExpenseTx: Transaction | undefined;
  let maxExpenseVal = 0;

  const todayStr = getTodayDateString();
  let todayExpenses = 0;

  const now = new Date();
  const currentDay = now.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysRemaining = Math.max(1, daysInMonth - currentDay);
  const daysPassedInMonth = Math.max(1, currentDay);

  const oneWeekAgoMs = Date.now() - 7 * 86400000;
  let thisWeekExpenses = 0;

  monthTransactions.forEach((tx) => {
    if (tx.type === 'expense') {
      const amt = Math.round(tx.amount || 0);
      totalExpenseAmount += amt;

      categorySpendMap[tx.categoryId] = (categorySpendMap[tx.categoryId] || 0) + amt;

      if (amt > maxExpenseVal) {
        maxExpenseVal = amt;
        highestExpenseTx = tx;
      }

      if (tx.date === todayStr) {
        todayExpenses += amt;
      }

      const txTime = new Date(tx.date).getTime();
      if (txTime >= oneWeekAgoMs) {
        thisWeekExpenses += amt;
      }
    } else if (tx.type === 'income') {
      totalIncomeTransactions += Math.round(tx.amount || 0);
    }
  });

  const startingBalance = Math.round(account.startingBalance || 0);
  const carryForward = Math.round(account.carryForwardAmount || account.carryForward || 0);
  const additionalIncome = Math.round((account.additionalIncome || 0) + totalIncomeTransactions);

  // Core Formula: Total Available = Starting + Additional + CarryForward
  const totalAvailable = startingBalance + additionalIncome + carryForward;
  // Core Formula: Remaining = Total Available - Total Expenses
  const remainingBalance = totalAvailable - totalExpenseAmount;

  const dailyAverage = Math.round(totalExpenseAmount / daysPassedInMonth);

  // Projected days left
  let projectedDaysLeft = 30;
  if (dailyAverage > 0 && remainingBalance > 0) {
    projectedDaysLeft = Math.floor(remainingBalance / dailyAverage);
  } else if (remainingBalance <= 0) {
    projectedDaysLeft = 0;
  }

  // Find highest spending category
  let highestCatObj: { category: Category; amount: number; percentage: number } | undefined;
  let maxCatSpend = 0;
  let topCatId = '';

  Object.entries(categorySpendMap).forEach(([catId, spend]) => {
    if (spend > maxCatSpend) {
      maxCatSpend = spend;
      topCatId = catId;
    }
  });

  if (topCatId && totalExpenseAmount > 0) {
    const cat = allCategories.find((c) => c.id === topCatId) || DEFAULT_EXPENSE_CATEGORIES[0];
    highestCatObj = {
      category: cat,
      amount: maxCatSpend,
      percentage: Math.round((maxCatSpend / totalExpenseAmount) * 100),
    };
  }

  return {
    monthId,
    year,
    month,
    startingBalance,
    additionalIncome,
    carryForward,
    totalAvailable,
    totalExpenses: totalExpenseAmount,
    remainingBalance,
    todayExpenses,
    thisWeekExpenses,
    dailyAverage,
    daysPassedInMonth,
    daysInMonth,
    daysRemaining,
    burnRatePerDay: dailyAverage,
    projectedDaysLeft,
    highestCategory: highestCatObj,
    highestExpense: highestExpenseTx,
    transactionCount: monthTransactions.length,
  };
}

/**
 * Exports monthly transaction statement as clean UTF-8 CSV
 */
export function exportCsvData(
  transactions: Transaction[],
  categories: Category[],
  monthId: string,
  lang: Language
): void {
  const headers =
    lang === 'bn'
      ? ['তারিখ', 'ধরন', 'বিভাগ', 'বিবরণ/নোট', 'টাকা (BDT)', 'পেমেন্ট মাধ্যম']
      : ['Date', 'Type', 'Category', 'Note', 'Amount (BDT)', 'Payment Method'];

  const rows = transactions.map((t) => {
    const cat = categories.find((c) => c.id === t.categoryId);
    const catName = cat
      ? lang === 'bn'
        ? cat.defaultNameBn
        : cat.defaultNameEn
      : t.customCategoryName || '';

    const typeStr =
      t.type === 'expense'
        ? lang === 'bn'
          ? 'খরচ'
          : 'Expense'
        : lang === 'bn'
        ? 'জমা/প্রাপ্তি'
        : 'Income';

    return [
      `"${t.date}"`,
      `"${typeStr}"`,
      `"${catName}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`,
      `"${t.amount}"`,
      `"${t.paymentMethod}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `amar-hishab-statement-${monthId}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports full raw JSON backup
 */
export function exportJsonBackup(appState: AppStateData): void {
  const blob = new Blob([JSON.stringify(appState, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `amar-hishab-full-backup-${getTodayDateString()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
