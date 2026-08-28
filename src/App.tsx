import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppStateData,
  Language,
  Transaction,
  MonthlyAccount,
  UserProfile,
  ThemeMode,
  UndoHistoryItem,
  ActionCategory,
  CurrencyOption,
} from './types';
import {
  loadAppState,
  saveAppState,
  getCurrentMonthId,
  calculateMonthlySummary,
  exportCsvData,
  exportJsonBackup,
  clearAllData,
} from './lib/storage';
import { formatMoney, setDefaultCurrencySymbol } from './lib/i18n/formatter';
import { authApi, dataApi, AuthUser } from './lib/api';
import { AuthScreen } from './components/auth/AuthScreen';
import { generateSmartInsights } from './lib/insights';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { HomeDashboard } from './components/views/HomeDashboard';
import { ExpensesView } from './components/views/ExpensesView';
import { ReportsView } from './components/views/ReportsView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { AdminPanelView } from './components/views/AdminPanelView';
import { BottomNavigation, NavTab } from './components/navigation/BottomNavigation';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { AddMoneyModal } from './components/modals/AddMoneyModal';
import { EditTransactionModal } from './components/modals/EditTransactionModal';
import { SeedPhraseModal } from './components/modals/SeedPhraseModal';
import { RestoreModal } from './components/modals/RestoreModal';
import { MonthTransitionModal } from './components/modals/MonthTransitionModal';
import { UndoToast } from './components/common/UndoToast';
import { UndoHistoryModal } from './components/modals/UndoHistoryModal';
import { CurrencyPickerModal } from './components/modals/CurrencyPickerModal';

export default function App() {
  const [appState, setAppState] = useState<AppStateData>(() => loadAppState());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab | 'admin'>('home');
  const [activeMonthId, setActiveMonthId] = useState<string>(() => getCurrentMonthId());

  // Undo & Redo History State
  const [undoStack, setUndoStack] = useState<UndoHistoryItem[]>([]);
  const [redoStack, setRedoStack] = useState<UndoHistoryItem[]>([]);
  const [activeUndoToast, setActiveUndoToast] = useState<UndoHistoryItem | null>(null);
  const [isUndoHistoryModalOpen, setIsUndoHistoryModalOpen] = useState(false);

  // Modal States
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSeedPhraseModalOpen, setIsSeedPhraseModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isCurrencyPickerOpen, setIsCurrencyPickerOpen] = useState(false);
  const [monthTransitionData, setMonthTransitionData] = useState<{
    prevMonthId: string;
    currentMonthId: string;
    prevRemaining: number;
  } | null>(null);

  // Synchronize global currency symbol with user profile
  useEffect(() => {
    if (appState.user && appState.user.currencySymbol) {
      setDefaultCurrencySymbol(appState.user.currencySymbol);
    }
  }, [appState.user?.currencySymbol]);

  // Authenticate session on load
  useEffect(() => {
    async function checkSession() {
      const token = authApi.getToken();
      if (!token) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const user = await authApi.getMe();
        setCurrentUser(user);

        // Fetch cloud data for this user
        const cloudData = await dataApi.getData();
        if (cloudData && cloudData.accounts && cloudData.accounts.length > 0) {
          setAppState(cloudData);
          saveAppState(cloudData);
        }
      } catch (err) {
        console.warn('Session verification failed, resetting token', err);
        authApi.logout();
        setCurrentUser(null);
      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkSession();
  }, []);

  // Ensure DOM is in light mode
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);

  // Synchronize state with LocalStorage and Server
  const updateState = useCallback(
    (newState: AppStateData) => {
      setAppState(newState);
      saveAppState(newState);

      // Async cloud sync if logged in
      if (authApi.getToken()) {
        dataApi.syncData(newState).catch((err) => {
          console.warn('Background cloud sync failed:', err);
        });
      }
    },
    []
  );

  const handleAuthSuccess = (user: AuthUser, initialData?: AppStateData) => {
    setCurrentUser(user);
    if (initialData && initialData.accounts && initialData.accounts.length > 0) {
      setAppState(initialData);
      saveAppState(initialData);
    } else {
      // Sync current local state to new user account
      const syncPayload = {
        ...appState,
        user: {
          ...appState.user,
          id: user.id,
          name: user.name,
          email: user.email,
          nameBn: user.name,
          preferredLanguage: user.preferredLanguage || 'bn',
          seedBackupEnabled: user.seedBackupEnabled || false,
        },
      };
      setAppState(syncPayload);
      saveAppState(syncPayload);
      dataApi.syncData(syncPayload).catch(console.error);
    }
  };

  const handleLogout = () => {
    authApi.logout();
    setCurrentUser(null);
  };

  const handleRegenerateSeedPhrase = async (password: string): Promise<string[]> => {
    const res = await authApi.regenerateSeed(password);
    if (res.user) {
      setCurrentUser(res.user);
      const updatedUser = {
        ...appState.user,
        seedBackupEnabled: true,
      };
      updateState({ ...appState, user: updatedUser });
    }
    return res.seedPhrase;
  };

  const user = appState.user;
  const lang: Language = user.preferredLanguage || 'bn';

  // Ensure current month account exists in state
  const activeAccount = useMemo(() => {
    let acc = appState.accounts.find((a) => a.id === activeMonthId);
    if (!acc) {
      acc = {
        id: activeMonthId,
        startingBalance: 15000,
        carryForwardAmount: 0,
        isClosed: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    }
    return acc;
  }, [appState.accounts, activeMonthId]);

  // List of all transactions for the active month
  const activeMonthTransactions = useMemo(() => {
    return appState.transactions.filter((t) => t.monthlyAccountId === activeMonthId);
  }, [appState.transactions, activeMonthId]);

  // Calculate high-performance deterministic monthly summary
  const summary = useMemo(() => {
    return calculateMonthlySummary(activeAccount, activeMonthTransactions, appState.categories);
  }, [activeAccount, activeMonthTransactions, appState.categories]);

  // Generate localized smart financial insights
  const insights = useMemo(() => {
    return generateSmartInsights(summary, lang);
  }, [summary, lang]);

  // Available month IDs for picker
  const availableMonthIds = useMemo(() => {
    const ids = new Set<string>(appState.accounts.map((a) => a.id));
    ids.add(getCurrentMonthId());
    ids.add(activeMonthId);
    return Array.from(ids).sort((a: string, b: string) => b.localeCompare(a));
  }, [appState.accounts, activeMonthId]);

  // Handle Onboarding Completion
  const handleOnboardingComplete = (data: {
    name: string;
    startingBalance: number;
    preferredLanguage: Language;
    enableSeedBackup: boolean;
  }) => {
    const curMonth = getCurrentMonthId();
    const updatedUser: UserProfile = {
      ...user,
      name: data.name,
      preferredLanguage: data.preferredLanguage,
      onboardingCompleted: true,
      seedBackupEnabled: data.enableSeedBackup,
      themeMode: 'light',
    };

    const updatedAccounts = appState.accounts.map((acc) => {
      if (acc.id === curMonth) {
        return { ...acc, startingBalance: data.startingBalance, updatedAt: Date.now() };
      }
      return acc;
    });

    const newState: AppStateData = {
      ...appState,
      user: updatedUser,
      accounts: updatedAccounts,
      lastSyncTimestamp: Date.now(),
    };

    updateState(newState);

    if (data.enableSeedBackup) {
      setIsSeedPhraseModalOpen(true);
    }
  };

  // Record user moves for instant Undo capability
  const pushUndoMove = useCallback(
    (actionCategory: ActionCategory, descriptionBn: string, descriptionEn: string, details?: string) => {
      const historyItem: UndoHistoryItem = {
        id: 'undo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        actionCategory,
        descriptionBn,
        descriptionEn,
        details,
        previousState: JSON.parse(JSON.stringify(appState)),
        timestamp: Date.now(),
      };

      setUndoStack((prev) => [historyItem, ...prev.slice(0, 29)]);
      setRedoStack([]); // Clear redo on new action
      setActiveUndoToast(historyItem);
    },
    [appState]
  );

  // Undo the latest move
  const handleUndoLatest = useCallback(() => {
    if (undoStack.length === 0) return;

    const [itemToUndo, ...remainingUndo] = undoStack;
    const currentStateSnapshot: UndoHistoryItem = {
      id: 'redo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      actionCategory: itemToUndo.actionCategory,
      descriptionBn: `পুনরুদ্ধার: ${itemToUndo.descriptionBn}`,
      descriptionEn: `Reapply: ${itemToUndo.descriptionEn}`,
      details: itemToUndo.details,
      previousState: JSON.parse(JSON.stringify(appState)),
      timestamp: Date.now(),
    };

    setRedoStack((prev) => [currentStateSnapshot, ...prev]);
    setUndoStack(remainingUndo);
    setActiveUndoToast(null);
    updateState(itemToUndo.previousState);
  }, [undoStack, appState, updateState]);

  // Redo the latest undone move
  const handleRedoLatest = useCallback(() => {
    if (redoStack.length === 0) return;

    const [itemToRedo, ...remainingRedo] = redoStack;
    const currentStateSnapshot: UndoHistoryItem = {
      id: 'undo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      actionCategory: itemToRedo.actionCategory,
      descriptionBn: itemToRedo.descriptionBn,
      descriptionEn: itemToRedo.descriptionEn,
      details: itemToRedo.details,
      previousState: JSON.parse(JSON.stringify(appState)),
      timestamp: Date.now(),
    };

    setUndoStack((prev) => [currentStateSnapshot, ...prev]);
    setRedoStack(remainingRedo);
    updateState(itemToRedo.previousState);
  }, [redoStack, appState, updateState]);

  // Undo to a specific step in history list
  const handleUndoToStep = useCallback(
    (index: number) => {
      if (index < 0 || index >= undoStack.length) return;

      const targetItem = undoStack[index];
      const remaining = undoStack.slice(index + 1);

      const currentStateSnapshot: UndoHistoryItem = {
        id: 'redo_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
        actionCategory: targetItem.actionCategory,
        descriptionBn: `পুনরুদ্ধার: ${targetItem.descriptionBn}`,
        descriptionEn: `Reapply: ${targetItem.descriptionEn}`,
        details: targetItem.details,
        previousState: JSON.parse(JSON.stringify(appState)),
        timestamp: Date.now(),
      };

      setRedoStack((prev) => [currentStateSnapshot, ...prev]);
      setUndoStack(remaining);
      setActiveUndoToast(null);
      updateState(targetItem.previousState);
    },
    [undoStack, appState, updateState]
  );

  // Global Keyboard shortcuts: Ctrl+Z / Cmd+Z for undo, Ctrl+Y / Cmd+Shift+Z for redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting if user is typing inside an input/textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedoLatest();
        } else {
          handleUndoLatest();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedoLatest();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndoLatest, handleRedoLatest]);

  // Add new Expense or Income Transaction
  const handleSaveTransaction = (
    txData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newTx: Transaction = {
      ...txData,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const isExp = txData.type === 'expense';
    const cat = appState.categories.find((c) => c.id === txData.categoryId);
    const catName = lang === 'bn' ? cat?.defaultNameBn || 'অন্যান্য' : cat?.defaultNameEn || 'Other';
    const descBn = isExp
      ? `${formatMoney(txData.amount, 'bn')} খরচ যোগ করা হয়েছে`
      : `${formatMoney(txData.amount, 'bn')} টাকা জমা যোগ করা হয়েছে`;
    const descEn = isExp
      ? `Added expense of ${formatMoney(txData.amount, 'en')}`
      : `Added deposit of ${formatMoney(txData.amount, 'en')}`;

    pushUndoMove(isExp ? 'add_expense' : 'add_income', descBn, descEn, txData.note || catName);

    const newState: AppStateData = {
      ...appState,
      transactions: [newTx, ...appState.transactions],
      lastSyncTimestamp: Date.now(),
    };

    updateState(newState);
  };

  // Update existing Transaction
  const handleUpdateTransaction = (updatedTx: Transaction) => {
    const isExp = updatedTx.type === 'expense';
    const descBn = `লেনদেন আপডেট করা হয়েছে (${formatMoney(updatedTx.amount, 'bn')})`;
    const descEn = `Updated transaction (${formatMoney(updatedTx.amount, 'en')})`;

    pushUndoMove('edit_transaction', descBn, descEn, updatedTx.note || undefined);

    const newState: AppStateData = {
      ...appState,
      transactions: appState.transactions.map((t) => (t.id === updatedTx.id ? updatedTx : t)),
      lastSyncTimestamp: Date.now(),
    };
    updateState(newState);
    setEditingTransaction(null);
  };

  // Delete Transaction
  const handleDeleteTransaction = (transactionId: string) => {
    const txToDelete = appState.transactions.find((t) => t.id === transactionId);
    const amountStr = txToDelete ? formatMoney(txToDelete.amount, 'bn') : '';
    const descBn = `লেনদেন মুছে ফেলা হয়েছে (${amountStr})`;
    const descEn = `Deleted transaction (${txToDelete ? formatMoney(txToDelete.amount, 'en') : ''})`;

    pushUndoMove('delete_transaction', descBn, descEn, txToDelete?.note || undefined);

    const newState: AppStateData = {
      ...appState,
      transactions: appState.transactions.filter((t) => t.id !== transactionId),
      lastSyncTimestamp: Date.now(),
    };
    updateState(newState);
    setEditingTransaction(null);
  };

  // Change Language
  const handleLanguageChange = (newLang: Language) => {
    const newState: AppStateData = {
      ...appState,
      user: {
        ...user,
        preferredLanguage: newLang,
        name: newLang === 'bn' ? (user.nameBn || user.name) : (user.nameEn || user.name),
      },
    };
    updateState(newState);
  };

  // Update User Profile
  const handleUpdateUser = (updatedUser: UserProfile) => {
    pushUndoMove('update_profile', 'প্রোফাইল সেটিংস আপডেট করা হয়েছে', 'Updated profile settings');

    const newState: AppStateData = {
      ...appState,
      user: updatedUser,
    };
    updateState(newState);
  };

  // Update Starting Balance for Active Month
  const handleUpdateStartingBalance = (newStartingBalance: number) => {
    pushUndoMove(
      'update_balance',
      `মাসিক প্রারম্ভিক ব্যালেন্স আপডেট করা হয়েছে (${formatMoney(newStartingBalance, 'bn')})`,
      `Updated monthly starting balance (${formatMoney(newStartingBalance, 'en')})`
    );

    const newState: AppStateData = {
      ...appState,
      accounts: appState.accounts.map((acc) => {
        if (acc.id === activeMonthId) {
          return { ...acc, startingBalance: newStartingBalance, updatedAt: Date.now() };
        }
        return acc;
      }),
    };
    updateState(newState);
  };

  // Confirm Seed Backup Enabled
  const handleConfirmSeedEnabled = (phraseHash: string) => {
    const newState: AppStateData = {
      ...appState,
      user: {
        ...user,
        seedBackupEnabled: true,
        seedPhraseHash: phraseHash,
      },
    };
    updateState(newState);
  };

  // Handle Restore Success
  const handleRestoreSuccess = (restoredState: AppStateData) => {
    updateState(restoredState);
    if (restoredState.accounts.length > 0) {
      setActiveMonthId(restoredState.accounts[0].id);
    }
  };

  // Export JSON Backup
  const handleExportJson = () => {
    exportJsonBackup(appState);
  };

  // Export CSV Report
  const handleExportCsv = () => {
    exportCsvData(activeMonthTransactions, appState.categories, activeMonthId, lang);
  };

  // Delete All Data (Reset)
  const handleDeleteAllData = () => {
    clearAllData();
    window.location.reload();
  };

  // Check Month Transition Rollover
  const handleConfirmMonthTransition = (option: {
    carryForward: boolean;
    newStartingAmount: number;
  }) => {
    if (!monthTransitionData) return;
    const { currentMonthId, prevRemaining } = monthTransitionData;

    const existingAccIndex = appState.accounts.findIndex((a) => a.id === currentMonthId);
    let updatedAccounts: MonthlyAccount[];

    const carryAmount = option.carryForward ? Math.max(0, prevRemaining) : 0;

    if (existingAccIndex >= 0) {
      updatedAccounts = appState.accounts.map((a) => {
        if (a.id === currentMonthId) {
          return {
            ...a,
            startingBalance: option.newStartingAmount,
            carryForwardAmount: carryAmount,
            updatedAt: Date.now(),
          };
        }
        return a;
      });
    } else {
      updatedAccounts = [
        {
          id: currentMonthId,
          startingBalance: option.newStartingAmount,
          carryForwardAmount: carryAmount,
          isClosed: false,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        ...appState.accounts,
      ];
    }

    updateState({
      ...appState,
      accounts: updatedAccounts,
    });
    setActiveMonthId(currentMonthId);
    setMonthTransitionData(null);
  };

  // Handle Currency Selection
  const handleSelectCurrency = (currency: CurrencyOption) => {
    const updatedUser: UserProfile = {
      ...user,
      currency: currency.code,
      currencySymbol: currency.symbol,
    };
    updateState({
      ...appState,
      user: updatedUser,
    });
    setDefaultCurrencySymbol(currency.symbol);
    setIsCurrencyPickerOpen(false);
  };

  // Handle Adding Custom Currency
  const handleAddCustomCurrency = (currency: CurrencyOption) => {
    const existing = user.customCurrencies || [];
    const updatedUser: UserProfile = {
      ...user,
      currency: currency.code,
      currencySymbol: currency.symbol,
      customCurrencies: [currency, ...existing.filter((c) => c.code !== currency.code)],
    };
    updateState({
      ...appState,
      user: updatedUser,
    });
    setDefaultCurrencySymbol(currency.symbol);
  };

  // Loading Splash while verifying initial session
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-900">
        <div className="w-10 h-10 border-3 border-emerald-600/20 border-t-emerald-700 rounded-full animate-spin mb-4" />
        <p className="text-sm text-slate-600 font-semibold">নিরাপত্তা যাচাই হচ্ছে...</p>
      </div>
    );
  }

  // If user is not authenticated, display the unified AuthScreen
  if (!currentUser) {
    return <AuthScreen lang={lang} onLanguageToggle={() => handleLanguageChange(lang === 'bn' ? 'en' : 'bn')} onAuthSuccess={handleAuthSuccess} />;
  }

  // Render First Launch Onboarding Wizard if not completed
  if (!user.onboardingCompleted) {
    return <OnboardingWizard onComplete={handleOnboardingComplete} />;
  }

  // If in Admin Panel view, render the dedicated AdminPanelView
  if (activeTab === 'admin') {
    return (
      <AdminPanelView
        currentUser={user}
        lang={lang}
        onBackToApp={() => setActiveTab('home')}
      />
    );
  }

  return (
    <div className="min-h-screen app-mint-gradient text-slate-900 font-sans antialiased selection:bg-emerald-200 selection:text-emerald-950 relative overflow-x-hidden">
      {/* Background Decorative Ambient Grid and Glow matching the uploaded style */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Subtle geometric micro-grid */}
        <div className="absolute inset-0 app-grid-overlay opacity-50" />
        
        {/* Luminous Top-Center/Left Ambient Lime & Emerald Aura */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-gradient-to-b from-lime-300/40 via-emerald-300/30 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-lime-200/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-10 -left-20 w-72 h-72 bg-emerald-200/30 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 max-w-lg mx-auto min-h-screen flex flex-col px-4 sm:px-5 pt-3 pb-24">
        {/* View Switcher */}
        <main className="flex-1">
          {activeTab === 'home' && (
            <HomeDashboard
              summary={summary}
              recentTransactions={activeMonthTransactions}
              categories={appState.categories}
              insights={insights}
              user={user}
              lang={lang}
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onOpenAddMoney={() => setIsAddMoneyOpen(true)}
              onOpenEditTransaction={(tx) => setEditingTransaction(tx)}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onMonthChange={(mId) => setActiveMonthId(mId)}
              availableMonthIds={availableMonthIds}
              undoCount={undoStack.length}
              onUndoLatest={handleUndoLatest}
              onOpenUndoHistory={() => setIsUndoHistoryModalOpen(true)}
              onNavigateAdmin={() => setActiveTab('admin')}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesView
              transactions={activeMonthTransactions}
              categories={appState.categories}
              summary={summary}
              lang={lang}
              onOpenAddExpense={() => setIsAddExpenseOpen(true)}
              onOpenEditTransaction={(tx) => setEditingTransaction(tx)}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              summary={summary}
              transactions={activeMonthTransactions}
              categories={appState.categories}
              lang={lang}
              onExportCsv={handleExportCsv}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              transactions={activeMonthTransactions}
              categories={appState.categories}
              lang={lang}
              onOpenEditTransaction={(tx) => setEditingTransaction(tx)}
              undoCount={undoStack.length}
              onUndoLatest={handleUndoLatest}
              onOpenUndoHistory={() => setIsUndoHistoryModalOpen(true)}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              user={user}
              activeAccount={activeAccount}
              appState={appState}
              lang={lang}
              onLanguageChange={handleLanguageChange}
              onUpdateUser={handleUpdateUser}
              onUpdateStartingBalance={handleUpdateStartingBalance}
              onOpenSeedPhraseModal={() => setIsSeedPhraseModalOpen(true)}
              onOpenRestoreModal={() => setIsRestoreModalOpen(true)}
              onExportJson={handleExportJson}
              onExportCsv={handleExportCsv}
              onDeleteAllData={handleDeleteAllData}
              onLogout={handleLogout}
              onRegenerateSeedPhrase={handleRegenerateSeedPhrase}
              undoCount={undoStack.length}
              onOpenUndoHistory={() => setIsUndoHistoryModalOpen(true)}
              onOpenCurrencyPicker={() => setIsCurrencyPickerOpen(true)}
              onNavigateAdmin={() => setActiveTab('admin')}
            />
          )}
        </main>

        {/* Persistent Bottom Navigation */}
        <BottomNavigation
          currentTab={activeTab === 'admin' ? 'home' : activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenQuickAdd={() => setIsAddExpenseOpen(true)}
          lang={lang}
        />
      </div>

      {/* ================= MODALS & OVERLAYS ================= */}

      {/* Full 160+ World & Custom Currencies Modal */}
      <CurrencyPickerModal
        isOpen={isCurrencyPickerOpen}
        onClose={() => setIsCurrencyPickerOpen(false)}
        selectedCurrencyCode={user.currency || 'BDT'}
        selectedCurrencySymbol={user.currencySymbol || '৳'}
        customCurrencies={user.customCurrencies}
        onSelectCurrency={handleSelectCurrency}
        onAddCustomCurrency={handleAddCustomCurrency}
        lang={lang}
      />

      {/* Floating Undo Toast notification on actions */}
      <UndoToast
        item={activeUndoToast}
        onUndo={handleUndoLatest}
        onDismiss={() => setActiveUndoToast(null)}
        lang={lang}
      />

      {/* Complete Step-by-Step Undo History Modal */}
      <UndoHistoryModal
        isOpen={isUndoHistoryModalOpen}
        onClose={() => setIsUndoHistoryModalOpen(false)}
        history={undoStack}
        onUndoStep={handleUndoToStep}
        onClearHistory={() => setUndoStack([])}
        lang={lang}
      />

      {/* Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSave={handleSaveTransaction}
        categories={appState.categories}
        monthlyAccountId={activeMonthId}
        lang={lang}
      />

      {/* Add Money (Income) Modal */}
      <AddMoneyModal
        isOpen={isAddMoneyOpen}
        onClose={() => setIsAddMoneyOpen(false)}
        onSave={handleSaveTransaction}
        monthlyAccountId={activeMonthId}
        lang={lang}
      />

      {/* Edit / Delete Transaction Modal */}
      <EditTransactionModal
        transaction={editingTransaction}
        isOpen={!!editingTransaction}
        onClose={() => setEditingTransaction(null)}
        onUpdate={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
        categories={appState.categories}
        lang={lang}
      />

      {/* 12-Word Seed Phrase Modal */}
      <SeedPhraseModal
        isOpen={isSeedPhraseModalOpen}
        onClose={() => setIsSeedPhraseModalOpen(false)}
        onConfirmSeedEnabled={handleConfirmSeedEnabled}
        appState={appState}
        lang={lang}
      />

      {/* Restore Encrypted / JSON Backup Modal */}
      <RestoreModal
        isOpen={isRestoreModalOpen}
        onClose={() => setIsRestoreModalOpen(false)}
        onRestoreSuccess={handleRestoreSuccess}
        lang={lang}
      />

      {/* Month Rollover / Transition Modal */}
      {monthTransitionData && (
        <MonthTransitionModal
          isOpen={!!monthTransitionData}
          onClose={() => setMonthTransitionData(null)}
          onConfirm={handleConfirmMonthTransition}
          prevMonthId={monthTransitionData.prevMonthId}
          currentMonthId={monthTransitionData.currentMonthId}
          prevMonthRemaining={monthTransitionData.prevRemaining}
          lang={lang}
        />
      )}
    </div>
  );
}
