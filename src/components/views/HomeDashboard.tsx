import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MonthlySummary,
  Transaction,
  Category,
  Language,
  UserProfile,
  SmartInsight,
  ThemeMode,
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
import {
  TakaCoinBadge,
  AnimatedBudgetRing,
  EmptyListGraphic,
  CryptoIsometricGraphic,
} from '../common/Graphics';

interface HomeDashboardProps {
  summary: MonthlySummary;
  recentTransactions: Transaction[];
  categories: Category[];
  insights: SmartInsight[];
  user: UserProfile;
  lang: Language;
  themeMode?: ThemeMode;
  onToggleTheme?: () => void;
  onOpenAddExpense: () => void;
  onOpenAddMoney: () => void;
  onOpenEditTransaction: (transaction: Transaction) => void;
  onNavigateTab: (tab: 'expenses' | 'reports' | 'history' | 'settings') => void;
  onMonthChange: (monthId: string) => void;
  availableMonthIds: string[];
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  summary,
  recentTransactions,
  categories,
  insights,
  user,
  lang,
  themeMode = 'dark',
  onToggleTheme,
  onOpenAddExpense,
  onOpenAddMoney,
  onOpenEditTransaction,
  onNavigateTab,
  onMonthChange,
  availableMonthIds,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [activeMarketFilter, setActiveMarketFilter] = useState<string>('all');

  const displayName = lang === 'bn' ? (user.nameBn || user.name || 'ফয়সাল') : (user.nameEn || user.name || 'Gabriel');
  const greeting = getTimeGreeting(lang, displayName);
  const isHealthyBalance = summary.remainingBalance > 0;

  // Safe daily allowance calculation
  const safeDailyAllowance =
    summary.daysRemaining > 0 && summary.remainingBalance > 0
      ? Math.floor(summary.remainingBalance / summary.daysRemaining)
      : 0;

  const budgetUsedPercent =
    summary.totalAvailable > 0
      ? Math.round((summary.totalExpenses / summary.totalAvailable) * 100)
      : 0;

  const remainingPercent = Math.max(0, 100 - budgetUsedPercent);

  // Filter categories for the quick marketplace category chips
  const displayCategories = categories.slice(0, 6);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5 pb-24"
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR: Profile Avatar, Hi Name, Theme Toggle & Notification */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between gap-3 pt-2">
        {/* Left: User Avatar + Greeting */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onNavigateTab('settings')}
            className="w-11 h-11 rounded-full p-0.5 bg-gradient-to-tr from-emerald-500 via-teal-400 to-lime-400 cursor-pointer shadow-md shadow-emerald-950/30 flex items-center justify-center shrink-0"
          >
            <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-emerald-300 font-extrabold text-sm border-2 border-slate-950">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </motion.div>

          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-100 dark:text-white tracking-tight flex items-center gap-1.5">
              <span>Hi, {displayName}</span>
            </h1>
            <p className="text-[11px] text-emerald-400 font-semibold tracking-wide flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {t(lang, 'appTagline')}
            </p>
          </div>
        </div>

        {/* Right: Month Selector + Theme Toggle + Notification Bell */}
        <div className="flex items-center gap-2">
          {/* Month Selector Pill */}
          <div className="relative">
            <select
              value={summary.monthId}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-slate-900/90 dark:bg-slate-900/90 border border-emerald-500/20 text-slate-200 rounded-full px-3 py-1.5 text-[11px] font-semibold focus:outline-none focus:border-emerald-400 shadow-sm cursor-pointer"
            >
              {availableMonthIds.map((mId) => (
                <option key={mId} value={mId} className="bg-slate-900 text-slate-200">
                  {formatMonthYear(mId, lang)}
                </option>
              ))}
            </select>
          </div>

          {/* Dark / Light Mode Toggle */}
          {onToggleTheme && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-full bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
              title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <IconRenderer name={themeMode === 'dark' ? 'Sun' : 'Moon'} className="w-4 h-4 text-emerald-400" />
            </motion.button>
          )}

          {/* Notification Bell */}
          <button
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="relative w-9 h-9 rounded-full bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-slate-300 flex items-center justify-center transition-all cursor-pointer shadow-xs"
          >
            <IconRenderer name="Bell" className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#D2FA35] shadow-[0_0_8px_#D2FA35]" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOTAL BALANCE HERO SECTION (Matching Design 1, 2, 3 Reference) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl fintech-card p-5 sm:p-6 transition-all border border-emerald-500/20">
        {/* Subtle Background Radial Atmosphere Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          {/* Label + Eye Hide/Show Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
                {lang === 'bn' ? 'মোট ব্যালেন্স' : 'Total Balance'}
              </span>
              <button
                type="button"
                onClick={() => setIsBalanceHidden(!isBalanceHidden)}
                className="text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer p-0.5"
                title={isBalanceHidden ? 'Show Balance' : 'Hide Balance'}
              >
                <IconRenderer name={isBalanceHidden ? 'EyeOff' : 'Eye'} className="w-4 h-4" />
              </button>
            </div>

            <span className="text-[11px] font-medium text-emerald-400/90 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {formatMonthYear(summary.monthId, lang)}
            </span>
          </div>

          {/* Prominent Amount & Percent Badge */}
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white font-sans drop-shadow-sm">
                {isBalanceHidden ? '••••••••' : formatMoney(summary.remainingBalance, lang)}
              </span>
            </div>

            {/* Percentage Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <IconRenderer name="TrendingUp" className="w-3.5 h-3.5 text-emerald-400" />
              <span>+{lang === 'bn' ? toBengaliNumerals(remainingPercent) : remainingPercent}% {lang === 'bn' ? 'অবশিষ্ট' : 'Left'}</span>
            </div>
          </div>

          {/* Quick Metrics Bar: Total Available & Total Spent */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <IconRenderer name="ArrowDownLeft" className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t(lang, 'totalAvailable')}</span>
              </div>
              <p className="text-base font-bold text-slate-100">
                {isBalanceHidden ? '••••••' : formatMoney(summary.totalAvailable, lang)}
              </p>
            </div>

            <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-3 shadow-xs">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                <IconRenderer name="ArrowUpRight" className="w-3.5 h-3.5 text-rose-400" />
                <span>{t(lang, 'totalSpent')}</span>
              </div>
              <p className="text-base font-bold text-slate-100">
                {isBalanceHidden ? '••••••' : formatMoney(summary.totalExpenses, lang)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. FOUR QUICK ACTION BUTTONS (Matching Reference: Deposit, Expense, Calc, More) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {/* 1. Deposit / Add Money */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          onClick={onOpenAddMoney}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl fintech-quick-action flex items-center justify-center text-emerald-400 group-hover:text-emerald-300 shadow-sm mb-1.5">
            <IconRenderer name="ArrowDownLeft" className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white transition-colors tracking-tight">
            {lang === 'bn' ? 'জমা' : 'Deposit'}
          </span>
        </motion.button>

        {/* 2. Expense / Add Expense */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          onClick={onOpenAddExpense}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl fintech-quick-action flex items-center justify-center text-rose-400 group-hover:text-rose-300 shadow-sm mb-1.5">
            <IconRenderer name="CreditCard" className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white transition-colors tracking-tight">
            {lang === 'bn' ? 'খরচ' : 'Expense'}
          </span>
        </motion.button>

        {/* 3. Budget / Reports */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl fintech-quick-action flex items-center justify-center text-cyan-400 group-hover:text-cyan-300 shadow-sm mb-1.5">
            <IconRenderer name="PieChart" className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white transition-colors tracking-tight">
            {lang === 'bn' ? 'বাজেট' : 'Budget'}
          </span>
        </motion.button>

        {/* 4. More / Categories */}
        <motion.button
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.94 }}
          type="button"
          onClick={() => onNavigateTab('expenses')}
          className="flex flex-col items-center group cursor-pointer"
        >
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl fintech-quick-action flex items-center justify-center text-amber-400 group-hover:text-amber-300 shadow-sm mb-1.5">
            <IconRenderer name="LayoutGrid" className="w-6 h-6 stroke-[2.2]" />
          </div>
          <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white transition-colors tracking-tight">
            {lang === 'bn' ? 'ক্যাটাগরি' : 'More'}
          </span>
        </motion.button>
      </div>

      {/* ========================================================================= */}
      {/* 4. SHOWCASE 3D FEATURE BANNER CARD ("THE FUTURE ASSETS OF CRYPTO" STYLE) */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl fintech-banner-card p-5 sm:p-6 transition-all">
        {/* Glow light accents */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-lime-400/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-4">
          {/* Left Content */}
          <div className="space-y-2.5 max-w-[62%]">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-950/60 border border-emerald-400/40 text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D2FA35] animate-ping" />
              MAS KHOROCH PRO
            </span>

            <h3 className="text-base sm:text-lg font-black text-white leading-tight tracking-tight uppercase">
              {lang === 'bn' ? 'মাসিক স্মার্ট সঞ্চয় ও বাজেট ট্র্যাকিং' : 'THE FUTURE OF SMART EXPENSE ASSETS'}
            </h3>

            <p className="text-xs text-emerald-100/85 leading-snug">
              {lang === 'bn'
                ? `দৈনিক নিরাপদ বরাদ্দ: ${formatMoney(safeDailyAllowance, lang)}`
                : `Safe Daily Allowance: ${formatMoney(safeDailyAllowance, lang)}`}
            </p>

            <div className="pt-1 flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.05, filter: 'brightness(1.05)' }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onNavigateTab('reports')}
                className="px-4 py-1.5 rounded-full bg-[#D2FA35] hover:bg-[#c0f32e] text-slate-950 font-extrabold text-xs shadow-[0_4px_15px_rgba(210,250,53,0.4)] cursor-pointer"
              >
                {lang === 'bn' ? 'বাজেট প্ল্যান' : 'JOIN NOW'}
              </motion.button>

              {/* Slider Indicator Dots */}
              <div className="flex items-center gap-1.5 pl-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D2FA35]" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
                <span className="w-2 h-2 rounded-full bg-white/40" />
              </div>
            </div>
          </div>

          {/* Right: 3D Isometric Illustration Graphic */}
          <div className="w-28 sm:w-36 shrink-0 flex items-center justify-center">
            <CryptoIsometricGraphic className="w-full h-auto" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DISCOVER & MARKETPLACE SECTION (Category Chips & 2-Col Activity Cards) */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <IconRenderer name="Compass" className="w-4 h-4 text-emerald-400" />
            <span>{lang === 'bn' ? 'খরচের খাতসমূহ ও মার্কেট' : 'Discover Categories & Market'}</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('expenses')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{lang === 'bn' ? 'সব দেখুন' : 'See all'}</span>
            <IconRenderer name="ChevronRight" className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Category Chips Horizontal Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveMarketFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeMarketFilter === 'all'
                ? 'bg-slate-100 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {lang === 'bn' ? 'সব খাত' : 'All Categories'}
          </button>

          {displayCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveMarketFilter(cat.id);
                onNavigateTab('expenses');
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                activeMarketFilter === cat.id
                  ? 'bg-emerald-500 text-white font-bold'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <IconRenderer name={cat.icon} className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}</span>
            </button>
          ))}
        </div>

        {/* 2-Column Discover Activity Cards */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Card 1: Discover Assets / Insights */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigateTab('reports')}
            className="p-4 rounded-2xl fintech-card border border-emerald-500/15 relative overflow-hidden cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <IconRenderer name="TrendingUp" className="w-4 h-4" />
              </span>
              <IconRenderer name="ArrowUpRight" className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-xs font-bold text-white mb-0.5">
              {lang === 'bn' ? 'মাসিক বিশ্লেষণ' : 'Discover Assets'}
            </p>
            <span className="text-[11px] text-emerald-400 font-semibold block">
              {summary.daysRemaining} {lang === 'bn' ? 'দিন বাকি' : 'days left'}
            </span>
          </motion.div>

          {/* Card 2: Update News / Weekly Spend */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigateTab('history')}
            className="p-4 rounded-2xl fintech-card border border-emerald-500/15 relative overflow-hidden cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <IconRenderer name="Activity" className="w-4 h-4" />
              </span>
              <IconRenderer name="ArrowUpRight" className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            </div>
            <p className="text-xs font-bold text-white mb-0.5">
              {lang === 'bn' ? 'এই সপ্তাহের খরচ' : 'Update News'}
            </p>
            <span className="text-[11px] text-cyan-400 font-semibold block">
              {formatMoney(summary.thisWeekExpenses, lang)}
            </span>
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 6. RECENT TRANSACTIONS LIST */}
      {/* ========================================================================= */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <IconRenderer name="History" className="w-4 h-4 text-emerald-400" />
            <span>{t(lang, 'recentTransactions')}</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('history')}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>{t(lang, 'viewAllTransactions')}</span>
            <IconRenderer name="ChevronRight" className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="fintech-card rounded-3xl p-6 text-center space-y-3 border border-dashed border-slate-800">
            <EmptyListGraphic />
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-200">{t(lang, 'emptyExpensesTitle')}</p>
              <p className="text-[11px] text-slate-400">{t(lang, 'emptyExpensesDesc')}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              <IconRenderer name="Plus" className="w-4 h-4" />
              <span>{t(lang, 'btnAddExpense')}</span>
            </motion.button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTransactions.slice(0, 5).map((tx) => {
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
                <motion.div
                  key={tx.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onOpenEditTransaction(tx)}
                  className="p-3.5 fintech-card hover:border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconRenderer name={cat.icon} className="w-5 h-5 text-white" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">
                        {tx.note || (lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn)}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                        <span>{lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}</span>
                        <span>•</span>
                        <span>{formatDate(tx.date, lang, { short: true })}</span>
                        {tx.receiptUri && (
                          <span className="text-emerald-400 font-bold">• 📷</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-extrabold block font-sans ${
                        isExp ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {isExp ? '-' : '+'} {formatMoney(tx.amount, lang)}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">
                      {tx.paymentMethod}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
};
