import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  MonthlySummary,
  Transaction,
  Category,
  Language,
  UserProfile,
  SmartInsight,
} from '../../types';
import {
  t,
  formatMoney,
  getTimeGreeting,
  formatMonthYear,
  formatDate,
  toBengaliNumerals,
} from '../../lib/i18n/formatter';
import { IconRenderer } from '../common/IconRenderer';
import { EmptyListGraphic } from '../common/Graphics';

interface HomeDashboardProps {
  summary: MonthlySummary;
  recentTransactions: Transaction[];
  categories: Category[];
  insights: SmartInsight[];
  user: UserProfile;
  lang: Language;
  onOpenAddExpense: () => void;
  onOpenAddMoney: () => void;
  onOpenEditTransaction: (transaction: Transaction) => void;
  onNavigateTab: (tab: 'expenses' | 'reports' | 'history' | 'settings') => void;
  onMonthChange: (monthId: string) => void;
  onOpenCurrencyPicker?: () => void;
  availableMonthIds: string[];
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  summary,
  recentTransactions,
  categories,
  insights,
  user,
  lang,
  onOpenAddExpense,
  onOpenAddMoney,
  onOpenEditTransaction,
  onNavigateTab,
  onMonthChange,
  onOpenCurrencyPicker,
  availableMonthIds,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');

  const displayName =
    lang === 'bn'
      ? user.nameBn || user.name || 'ব্যবহারকারী'
      : user.nameEn || user.name || 'User';
  const greeting = getTimeGreeting(lang, displayName);

  // Safe daily allowance calculation
  const safeDailyAllowance =
    summary.daysRemaining > 0 && summary.remainingBalance > 0
      ? Math.floor(summary.remainingBalance / summary.daysRemaining)
      : 0;

  const budgetUsedPercent =
    summary.totalAvailable > 0
      ? Math.min(100, Math.round((summary.totalExpenses / summary.totalAvailable) * 100))
      : 0;

  const remainingPercent = Math.max(0, 100 - budgetUsedPercent);
  const currencySymbol = user.currencySymbol || '৳';

  // Filter transactions based on category selection
  const filteredTransactions =
    selectedCategoryFilter === 'all'
      ? recentTransactions
      : recentTransactions.filter((tx) => tx.categoryId === selectedCategoryFilter);

  const displayCategories = categories.slice(0, 7);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-20"
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: User Profile, Month Selector, Minimalist Currency Button   */}
      {/* ========================================================================= */}
      <header className="flex items-center justify-between gap-3 pt-2">
        {/* Left: User Avatar & Greeting */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center border border-emerald-200/80 shadow-xs hover:scale-105 transition-transform cursor-pointer shrink-0"
            title={lang === 'bn' ? 'প্রোফাইল সেটিংস' : 'Profile Settings'}
          >
            {displayName.charAt(0).toUpperCase()}
          </button>

          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate tracking-tight">
              {greeting}
            </h1>
            <p className="text-[11px] text-slate-500 font-medium truncate">
              {formatMonthYear(summary.monthId, lang)} • {summary.daysRemaining}{' '}
              {lang === 'bn' ? 'দিন বাকি' : 'days left'}
            </p>
          </div>
        </div>

        {/* Right: Month Selector + Minimalist Currency Emblem + Notification */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Month Selector Pill */}
          <div className="relative">
            <select
              value={summary.monthId}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 rounded-full px-2.5 py-1 text-xs font-semibold focus:outline-none focus:border-emerald-500 shadow-xs cursor-pointer"
            >
              {availableMonthIds.map((mId) => (
                <option key={mId} value={mId}>
                  {formatMonthYear(mId, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Minimalist Round Currency Badge Button (Opens world currency selector) */}
          <button
            type="button"
            onClick={onOpenCurrencyPicker}
            className="w-8 h-8 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-extrabold text-sm flex items-center justify-center shadow-xs transition-all cursor-pointer hover:scale-105 active:scale-95"
            title={lang === 'bn' ? 'কারেন্সি পরিবর্তন বা নতুন কারেন্সি যুক্ত করুন' : 'Change or add world currency'}
          >
            <span>{currencySymbol}</span>
          </button>

          {/* Reports / Insights Quick Button */}
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="w-8 h-8 rounded-full bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 flex items-center justify-center shadow-xs transition-colors cursor-pointer"
            title={lang === 'bn' ? 'রিপোর্ট' : 'Reports'}
          >
            <IconRenderer name="PieChart" className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. PRIMARY FINANCIAL HERO CARD: Current Balance, Budget & Expenses        */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs transition-all">
        {/* Top line: Label + Eye toggle + Status Badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {lang === 'bn' ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}
            </span>
            <button
              type="button"
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="text-slate-400 hover:text-slate-600 p-0.5 transition-colors cursor-pointer"
              title={isBalanceHidden ? 'Show' : 'Hide'}
            >
              <IconRenderer name={isBalanceHidden ? 'EyeOff' : 'Eye'} className="w-3.5 h-3.5" />
            </button>
          </div>

          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
              summary.remainingBalance >= 0
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}
          >
            {summary.remainingBalance >= 0
              ? `${lang === 'bn' ? toBengaliNumerals(remainingPercent) : remainingPercent}% ${
                  lang === 'bn' ? 'অবশিষ্ট' : 'Remaining'
                }`
              : lang === 'bn'
              ? 'বাজেট অতিক্রম!'
              : 'Over Budget!'}
          </span>
        </div>

        {/* Main Big Number */}
        <div className="mb-4">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            {isBalanceHidden ? '••••••••' : formatMoney(summary.remainingBalance, lang)}
          </span>
        </div>

        {/* Budget Progress Bar */}
        <div className="space-y-1.5 mb-4">
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetUsedPercent > 90
                  ? 'bg-rose-500'
                  : budgetUsedPercent > 70
                  ? 'bg-amber-500'
                  : 'bg-emerald-600'
              }`}
              style={{ width: `${Math.min(100, Math.max(2, budgetUsedPercent))}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] text-slate-500 font-medium">
            <span>
              {lang === 'bn' ? 'ব্যয় হয়েছে' : 'Spent'}:{' '}
              <strong className="text-slate-700">
                {lang === 'bn' ? toBengaliNumerals(budgetUsedPercent) : budgetUsedPercent}%
              </strong>
            </span>
            <span>
              {lang === 'bn' ? 'দৈনিক নিরাপদ খরচ' : 'Safe Daily'}:{' '}
              <strong className="text-emerald-700">{formatMoney(safeDailyAllowance, lang)}</strong>
            </span>
          </div>
        </div>

        {/* Three Key Financial Metrics Cards */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
          <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
            <span className="text-[10px] font-medium text-slate-500 block mb-0.5 truncate">
              {lang === 'bn' ? 'মাসিক বাজেট' : 'Monthly Budget'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 block truncate">
              {isBalanceHidden ? '••••' : formatMoney(summary.startingBalance, lang)}
            </span>
          </div>

          <div className="bg-emerald-50/60 rounded-xl p-2.5 border border-emerald-100/80">
            <span className="text-[10px] font-medium text-emerald-700 block mb-0.5 truncate">
              {lang === 'bn' ? 'মোট আয়/জমা' : 'Total Income'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-emerald-800 block truncate">
              {isBalanceHidden ? '••••' : formatMoney(summary.totalIncome, lang)}
            </span>
          </div>

          <div className="bg-rose-50/60 rounded-xl p-2.5 border border-rose-100/80">
            <span className="text-[10px] font-medium text-rose-700 block mb-0.5 truncate">
              {lang === 'bn' ? 'মোট খরচ' : 'Total Spent'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-rose-800 block truncate">
              {isBalanceHidden ? '••••' : formatMoney(summary.totalExpenses, lang)}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FOUR CLEAN ACTION TILES: Add Expense, Add Income, Budget Plan, History */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-4 gap-2">
        {/* 1. Add Expense */}
        <button
          type="button"
          onClick={onOpenAddExpense}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-rose-50/50 hover:border-rose-200 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <IconRenderer name="MinusCircle" className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-rose-700 tracking-tight">
            {lang === 'bn' ? 'খরচ' : 'Expense'}
          </span>
        </button>

        {/* 2. Add Income / Deposit */}
        <button
          type="button"
          onClick={onOpenAddMoney}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-emerald-50/50 hover:border-emerald-200 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <IconRenderer name="PlusCircle" className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-emerald-700 tracking-tight">
            {lang === 'bn' ? 'জমা/আয়' : 'Income'}
          </span>
        </button>

        {/* 3. Reports / Budget */}
        <button
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-teal-50/50 hover:border-teal-200 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <IconRenderer name="PieChart" className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-teal-700 tracking-tight">
            {lang === 'bn' ? 'রিপোর্ট' : 'Reports'}
          </span>
        </button>

        {/* 4. History / Categories */}
        <button
          type="button"
          onClick={() => onNavigateTab('expenses')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
            <IconRenderer name="List" className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 tracking-tight">
            {lang === 'bn' ? 'খাতসমূহ' : 'Categories'}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 4. CATEGORY HORIZONTAL FILTER CHIPS                                       */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            {lang === 'bn' ? 'খরচের খাত' : 'Filter by Category'}
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab('expenses')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
          >
            {lang === 'bn' ? 'সব দেখুন →' : 'See all →'}
          </button>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {lang === 'bn' ? 'সব' : 'All'}
          </button>

          {displayCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategoryFilter === cat.id
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <IconRenderer name={cat.icon} className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. RECENT EXPENSES / TRANSACTIONS LIST                                    */}
      {/* ========================================================================= */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-0.5">
          <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <IconRenderer name="History" className="w-4 h-4 text-emerald-600" />
            <span>{t(lang, 'recentTransactions')}</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('history')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-0.5"
          >
            <span>{t(lang, 'viewAllTransactions')}</span>
            <IconRenderer name="ChevronRight" className="w-3.5 h-3.5" />
          </button>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center space-y-3 border border-dashed border-slate-200">
            <EmptyListGraphic />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">{t(lang, 'emptyExpensesTitle')}</p>
              <p className="text-[11px] text-slate-500">{t(lang, 'emptyExpensesDesc')}</p>
            </div>
            <button
              type="button"
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <IconRenderer name="Plus" className="w-4 h-4" />
              <span>{t(lang, 'btnAddExpense')}</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.slice(0, 6).map((tx) => {
              const isExp = tx.type === 'expense';
              const cat = categories.find((c) => c.id === tx.categoryId) || {
                id: tx.categoryId,
                nameKey: 'catOther',
                defaultNameBn: tx.customCategoryName || 'অন্যান্য',
                defaultNameEn: tx.customCategoryName || 'Other',
                icon: 'MoreHorizontal',
                color: '#64748B',
                type: tx.type,
                isCustom: false,
              };

              return (
                <div
                  key={tx.id}
                  onClick={() => onOpenEditTransaction(tx)}
                  className="p-3 bg-white hover:bg-slate-50/80 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs hover:border-slate-300"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconRenderer name={cat.icon} className="w-5 h-5 text-white" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {tx.note || (lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn)}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span>{lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}</span>
                        <span>•</span>
                        <span>{formatDate(tx.date, lang, { short: true })}</span>
                        {tx.receiptUri && <span className="text-emerald-600 font-bold">• 📷</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-extrabold block font-sans ${
                        isExp ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {isExp ? '-' : '+'} {formatMoney(tx.amount, lang)}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {tx.paymentMethod}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
