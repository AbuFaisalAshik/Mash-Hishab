import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppStateData,
  Language,
  Transaction,
  MonthlyAccount,
  UserProfile,
  ThemeMode,
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
import { authApi, dataApi, AuthUser } from './lib/api';
import { AuthScreen } from './components/auth/AuthScreen';
import { generateSmartInsights } from './lib/insights';
import { OnboardingWizard } from './components/onboarding/OnboardingWizard';
import { HomeDashboard } from './components/views/HomeDashboard';
import { ExpensesView } from './components/views/ExpensesView';
import { ReportsView } from './components/views/ReportsView';
import { HistoryView } from './components/views/HistoryView';
import { SettingsView } from './components/views/SettingsView';
import { BottomNavigation, NavTab } from './components/navigation/BottomNavigation';
import { AddExpenseModal } from './components/modals/AddExpenseModal';
import { AddMoneyModal } from './components/modals/AddMoneyModal';
import { EditTransactionModal } from './components/modals/EditTransactionModal';
import { SeedPhraseModal } from './components/modals/SeedPhraseModal';
import { RestoreModal } from './components/modals/RestoreModal';
import { MonthTransitionModal } from './components/modals/MonthTransitionModal';

export default function App() {
  const [appState, setAppState] = useState<AppStateData>(() => loadAppState());
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeMonthId, setActiveMonthId] = useState<string>(() => getCurrentMonthId());

  // Modal States
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isSeedPhraseModalOpen, setIsSeedPhraseModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [monthTransitionData, setMonthTransitionData] = useState<{
    prevMonthId: string;
    currentMonthId: string;
    prevRemaining: number;
  } | null>(null);

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

    const newState: AppStateData = {
      ...appState,
      transactions: [newTx, ...appState.transactions],
      lastSyncTimestamp: Date.now(),
    };

    updateState(newState);
  };

  // Update existing Transaction
  const handleUpdateTransaction = (updatedTx: Transaction) => {
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
    const newState: AppStateData = {
      ...appState,
      user: updatedUser,
    };
    updateState(newState);
  };

  // Update Starting Balance for Active Month
  const handleUpdateStartingBalance = (newStartingBalance: number) => {
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
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
            />
          )}
        </main>

        {/* Persistent Bottom Navigation */}
        <BottomNavigation
          currentTab={activeTab}
          onTabChange={(tab) => setActiveTab(tab)}
          onOpenQuickAdd={() => setIsAddExpenseOpen(true)}
          lang={lang}
        />
      </div>

      {/* ================= MODALS ================= */}

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
