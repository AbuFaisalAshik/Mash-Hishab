import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MonthlySummary,
  Transaction,
  Category,
  Language,
  UserProfile,
  SmartInsight,
  SystemAnnouncement,
} from '../../types';
import { systemApi } from '../../lib/api';
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
  undoCount?: number;
  onUndoLatest?: () => void;
  onOpenUndoHistory?: () => void;
  onNavigateAdmin?: () => void;
}

type TimeframeFilter = 'all' | 'today' | 'week' | 'month';

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
  undoCount = 0,
  onUndoLatest,
  onOpenUndoHistory,
  onNavigateAdmin,
}) => {
  const [isBalanceHidden, setIsBalanceHidden] = useState(false);
  const [timeframeFilter, setTimeframeFilter] = useState<TimeframeFilter>('all');
  const [selectedChartMonth, setSelectedChartMonth] = useState<number>(6); // July default
  const [announcement, setAnnouncement] = useState<SystemAnnouncement | null>(null);

  useEffect(() => {
    systemApi.getAnnouncement().then((ann) => {
      if (ann && ann.active && ann.message) {
        setAnnouncement(ann);
      }
    }).catch(() => {});
  }, []);

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

  // Filter transactions based on timeframe
  const filteredTransactions = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    if (timeframeFilter === 'today') {
      return recentTransactions.filter((tx) => tx.date === todayStr);
    }
    if (timeframeFilter === 'week') {
      return recentTransactions.filter((tx) => tx.date >= sevenDaysAgo);
    }
    return recentTransactions;
  }, [recentTransactions, timeframeFilter]);

  // Top spending categories calculation
  const topCategories = useMemo(() => {
    const map: Record<string, { category: Category; amount: number }> = {};
    recentTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const cat =
          categories.find((c) => c.id === t.categoryId) || {
            id: t.categoryId,
            nameKey: 'catOther',
            defaultNameBn: t.customCategoryName || 'অন্যান্য',
            defaultNameEn: t.customCategoryName || 'Other',
            icon: 'ShoppingBag',
            color: '#10B981',
            type: 'expense' as const,
            isCustom: false,
          };
        if (!map[cat.id]) {
          map[cat.id] = { category: cat, amount: 0 };
        }
        map[cat.id].amount += Math.round(t.amount || 0);
      });

    const list = Object.values(map).sort((a, b) => b.amount - a.amount);
    return list.slice(0, 5);
  }, [recentTransactions, categories]);

  // Dynamic wave points depending on selected month
  const chartDatasets = [
    { label: 'Jan', val: 180, pathD: "M 0,95 Q 60,110 120,80 T 240,65 T 330,45 T 400,75", peakX: 60, peakY: 70 },
    { label: 'Feb', val: 240, pathD: "M 0,90 Q 60,85 120,60 T 240,50 T 330,35 T 400,60", peakX: 120, peakY: 60 },
    { label: 'Mar', val: 210, pathD: "M 0,85 Q 60,95 120,70 T 240,45 T 330,55 T 400,70", peakX: 180, peakY: 55 },
    { label: 'Apr', val: 320, pathD: "M 0,92 Q 60,80 120,50 T 240,30 T 330,40 T 400,65", peakX: 240, peakY: 30 },
    { label: 'May', val: 280, pathD: "M 0,88 Q 60,90 120,65 T 240,40 T 330,25 T 400,55", peakX: 280, peakY: 35 },
    { label: 'Jun', val: 290, pathD: "M 0,85 Q 60,75 120,55 T 240,35 T 330,30 T 400,50", peakX: 300, peakY: 28 },
    { label: 'Jul', val: 340, pathD: "M 0,90 Q 60,110 120,70 T 240,40 T 330,20 T 400,60", peakX: 240, peakY: 40 },
  ];

  const currentChart = chartDatasets[selectedChartMonth] || chartDatasets[6];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="space-y-4 pb-20"
    >
      {/* ========================================================================= */}
      {/* 1. TOP HEADER: App Icon, Greeting, Currency, & User Profile               */}
      {/* ========================================================================= */}
      <header className="flex items-center justify-between gap-3 pt-1 px-1">
        {/* Left: App Brand & User Greeting */}
        <div className="flex items-center gap-2.5 min-w-0">
          <motion.div
            whileHover={{ scale: 1.08, rotate: -4 }}
            whileTap={{ scale: 0.94 }}
            className="w-10 h-10 rounded-2xl bg-emerald-800 text-emerald-200 flex items-center justify-center shadow-sm border border-emerald-700/50 shrink-0 cursor-pointer"
          >
            <IconRenderer name="Wallet" className="w-5 h-5 text-emerald-300" />
          </motion.div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                {lang === 'bn' ? 'মাস খরচ হিসাব' : 'Monthly Tracker'}
              </span>
            </div>
            <h1 className="text-base font-extrabold text-slate-900 truncate tracking-tight flex items-center gap-1">
              <span>{greeting}</span>
              <motion.span
                animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 3 }}
                className="text-amber-500 text-sm inline-block origin-bottom-right"
              >
                👋
              </motion.span>
            </h1>
          </div>
        </div>

        {/* Right: Admin Button, Undo Moves, Profile Avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Admin Panel Quick Access Button */}
          {(user.isAdmin || user.role === 'admin' || user.email === 'abufaisal9500@gmail.com') && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={onNavigateAdmin}
              className="px-2.5 py-1 rounded-xl bg-gradient-to-tr from-amber-400 to-lime-300 text-slate-950 font-black text-[11px] flex items-center gap-1 shadow-sm border border-amber-300/60 cursor-pointer"
              title="অ্যাডমিন প্যানেল"
            >
              <IconRenderer name="Crown" className="w-3.5 h-3.5 fill-current text-slate-950" />
              <span className="hidden sm:inline">অ্যাডমিন</span>
            </motion.button>
          )}

          {/* Quick Undo Button */}
          {undoCount > 0 && (
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={onUndoLatest}
              className="relative w-8 h-8 rounded-full bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 font-extrabold text-xs flex items-center justify-center shadow-2xs transition-all cursor-pointer"
              title={lang === 'bn' ? `শেষ পরিবর্তন আনডু করুন (${undoCount})` : `Undo latest move (${undoCount})`}
            >
              <IconRenderer name="Undo2" className="w-3.5 h-3.5 stroke-[2.4]" />
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center border border-white shadow-2xs">
                {undoCount > 9 ? '9+' : undoCount}
              </span>
            </motion.button>
          )}

          {/* User Profile Avatar with Status Dot */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={() => onNavigateTab('settings')}
            className="relative w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-2xs transition-transform cursor-pointer shrink-0"
            title={displayName}
          >
            <span>{displayName.charAt(0).toUpperCase()}</span>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-lime-400 border border-white animate-pulse" />
          </motion.button>
        </div>
      </header>

      {/* Global System Announcement Banner (If active) */}
      <AnimatePresence>
        {announcement && announcement.active && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 shadow-sm border ${
              announcement.type === 'urgent'
                ? 'bg-rose-600 text-white border-rose-500 shadow-rose-900/20'
                : announcement.type === 'warning'
                ? 'bg-amber-400 text-amber-950 border-amber-300 shadow-amber-900/20'
                : 'bg-emerald-800 text-lime-200 border-emerald-700 shadow-emerald-950/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <IconRenderer name="Megaphone" className="w-4 h-4 shrink-0" />
              <span>{announcement.message}</span>
            </div>
            <button
              onClick={() => setAnnouncement(null)}
              className="p-1 rounded-lg hover:bg-black/10 text-current"
            >
              <IconRenderer name="X" className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 2. SIGNATURE NEOBANK TOTAL BALANCE CARD WITH FLUID GRAPHICAL MOTION       */}
      {/* ========================================================================= */}
      <motion.div
        initial={{ scale: 0.97, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        whileHover={{ y: -2 }}
        className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#032b21] via-[#054635] to-[#033427] text-white p-5 sm:p-6 shadow-[0_14px_34px_-4px_rgba(4,46,34,0.38)] border border-emerald-500/20 space-y-4"
      >
        {/* Animated Graphical Ambient Ambient Glowing Orbs */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.15, 0.25, 0.15],
            x: [0, 10, 0],
            y: [0, -10, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 right-0 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16"
        />
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.12, 0.22, 0.12],
            x: [0, -8, 0],
            y: [0, 8, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-0 left-0 w-40 h-40 bg-lime-400/20 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10"
        />

        {/* Card Header: Total Balance Title + Month Selector & Eye Toggle */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shrink-0">
              <IconRenderer name="ShieldCheck" className="w-3.5 h-3.5 text-emerald-300" />
            </div>
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider block">
              {lang === 'bn' ? 'বর্তমান মোট ব্যালেন্স' : 'Total Balance'}
            </span>
          </div>

          {/* Right Controls: Month Selector & Eye Toggle aligned with Total Balance */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Compact Month Selector within Balance Card */}
            <select
              value={summary.monthId}
              onChange={(e) => onMonthChange(e.target.value)}
              className="bg-emerald-950/70 backdrop-blur-md border border-emerald-500/30 text-emerald-100 rounded-full px-2.5 py-0.5 text-[11px] font-bold focus:outline-none focus:border-emerald-400 shadow-2xs cursor-pointer hover:bg-emerald-900/80 transition-colors"
            >
              {availableMonthIds.map((mId) => (
                <option key={mId} value={mId} className="bg-emerald-950 text-white">
                  {formatMonthYear(mId, lang)}
                </option>
              ))}
            </select>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              type="button"
              onClick={() => setIsBalanceHidden(!isBalanceHidden)}
              className="p-1.5 rounded-full bg-emerald-950/70 hover:bg-emerald-900/90 backdrop-blur-md border border-emerald-500/30 text-emerald-300 hover:text-white transition-all cursor-pointer shadow-2xs flex items-center justify-center"
              title={isBalanceHidden ? (lang === 'bn' ? 'টাকার পরিমাণ দেখান' : 'Show amounts') : (lang === 'bn' ? 'টাকার পরিমাণ লুকান' : 'Hide amounts')}
              aria-label={isBalanceHidden ? 'Show amounts' : 'Hide amounts'}
            >
              <IconRenderer name={isBalanceHidden ? 'EyeOff' : 'Eye'} className="w-3.5 h-3.5 stroke-[2.2]" />
            </motion.button>
          </div>
        </div>

        {/* Big Balance Display with Counter Feel */}
        <div className="relative z-10">
          <div className="flex items-baseline gap-2">
            <motion.span
              key={isBalanceHidden ? 'hidden' : summary.remainingBalance}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-sans drop-shadow-xs"
            >
              {isBalanceHidden ? '••••••••' : formatMoney(summary.remainingBalance, lang)}
            </motion.span>
          </div>

          {/* Animated Graphical Budget Progress Bar */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full bg-emerald-950/80 rounded-full h-2 overflow-hidden border border-emerald-600/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(4, budgetUsedPercent))}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${
                  budgetUsedPercent > 90
                    ? 'bg-rose-400'
                    : budgetUsedPercent > 70
                    ? 'bg-amber-400'
                    : 'bg-lime-400'
                }`}
              />
            </div>
            <span className="text-[10px] font-bold text-emerald-200 shrink-0 font-mono">
              {lang === 'bn' ? toBengaliNumerals(remainingPercent) : remainingPercent}%{' '}
              {lang === 'bn' ? 'অবশিষ্ট' : 'Left'}
            </span>
          </div>
        </div>

        {/* Card Embedded Fast Actions (Deposit / Expense Pill Buttons) */}
        <div className="relative z-10 pt-2 grid grid-cols-2 gap-2.5">
          {/* Transfer / Income Pill Button */}
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onOpenAddMoney}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 text-xs font-bold shadow-md transition-all cursor-pointer"
          >
            <IconRenderer name="ArrowUpRight" className="w-4 h-4 text-emerald-800" />
            <span>{lang === 'bn' ? 'টাকা যোগ' : 'Add Money'}</span>
          </motion.button>

          {/* Request / Add Expense Pill Button */}
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={onOpenAddExpense}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-900/70 hover:bg-emerald-900 text-white border border-emerald-500/40 text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <IconRenderer name="ArrowDownLeft" className="w-4 h-4 text-lime-300" />
            <span>{lang === 'bn' ? 'খরচ যোগ' : 'Add Expense'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 3. QUICK ACTION TILES (Deposit, Withdraw, Transfer, Analytics, Categories) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-4 gap-2">
        {/* Action 1: Add Money (Income) */}
        <motion.button
          whileHover={{ y: -3, scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onOpenAddMoney}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-emerald-50/50 hover:border-emerald-200 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-110 group-hover:bg-emerald-100 transition-all border border-emerald-100">
            <IconRenderer name="Plus" className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 group-hover:text-emerald-800 tracking-tight">
            {lang === 'bn' ? 'টাকা যোগ' : 'Deposit'}
          </span>
        </motion.button>

        {/* Action 2: Add Expense */}
        <motion.button
          whileHover={{ y: -3, scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onOpenAddExpense}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-rose-50/50 hover:border-rose-200 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-1.5 group-hover:scale-110 group-hover:bg-rose-100 transition-all border border-rose-100">
            <IconRenderer name="Minus" className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 group-hover:text-rose-700 tracking-tight">
            {lang === 'bn' ? 'খরচ' : 'Expense'}
          </span>
        </motion.button>

        {/* Action 3: Analytics / Reports */}
        <motion.button
          whileHover={{ y: -3, scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => onNavigateTab('reports')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-teal-50/50 hover:border-teal-200 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mb-1.5 group-hover:scale-110 group-hover:bg-teal-100 transition-all border border-teal-100">
            <IconRenderer name="TrendingUp" className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 group-hover:text-teal-800 tracking-tight">
            {lang === 'bn' ? 'এনালাইটিক্স' : 'Analytics'}
          </span>
        </motion.button>

        {/* Action 4: Categories / All */}
        <motion.button
          whileHover={{ y: -3, scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={() => onNavigateTab('expenses')}
          className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:bg-slate-50 hover:border-slate-300 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center mb-1.5 group-hover:scale-110 group-hover:bg-slate-200 transition-all border border-slate-200">
            <IconRenderer name="Grid" className="w-5 h-5 stroke-[2.4]" />
          </div>
          <span className="text-[11px] font-bold text-slate-700 group-hover:text-slate-900 tracking-tight">
            {lang === 'bn' ? 'খাতসমূহ' : 'Categories'}
          </span>
        </motion.button>
      </div>

      {/* ========================================================================= */}
      {/* 4. QUICK OVERVIEW 2x2 METRICS WITH TREND BADGES (Matches Image 1)         */}
      {/* ========================================================================= */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {lang === 'bn' ? 'দ্রুত বিবরণী (Quick Overview)' : 'Quick Overview'}
          </span>
          <span className="text-[11px] text-slate-500 font-semibold">
            {formatMonthYear(summary.monthId, lang)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Total Income */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-1 transition-shadow hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                {lang === 'bn' ? 'মোট আয়' : 'Income'}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <span>↑</span> 15.6%
              </span>
            </div>
            <div className="text-base font-extrabold text-slate-900 truncate">
              {isBalanceHidden ? '••••' : formatMoney(summary.totalIncome, lang)}
            </div>
          </motion.div>

          {/* Card 2: Total Expenses */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-1 transition-shadow hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                {lang === 'bn' ? 'মোট খরচ' : 'Expenses'}
              </span>
              <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <span>↑</span> 8.3%
              </span>
            </div>
            <div className="text-base font-extrabold text-slate-900 truncate">
              {isBalanceHidden ? '••••' : formatMoney(summary.totalExpenses, lang)}
            </div>
          </motion.div>

          {/* Card 3: Total Transactions */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-1 transition-shadow hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                {lang === 'bn' ? 'লেনদেন সংখ্যা' : 'Transactions'}
              </span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <span>↑</span> 12.5%
              </span>
            </div>
            <div className="text-base font-extrabold text-slate-900 truncate">
              {isBalanceHidden
                ? '••••'
                : (
                  <>
                    {lang === 'bn'
                      ? toBengaliNumerals(summary.transactionCount)
                      : summary.transactionCount}{' '}
                    <span className="text-xs font-normal text-slate-500">টি</span>
                  </>
                )}
            </div>
          </motion.div>

          {/* Card 4: Daily Safe Allowance / Savings */}
          <motion.div
            whileHover={{ y: -2 }}
            className="bg-white rounded-2xl p-3.5 border border-slate-200/90 shadow-2xs space-y-1 transition-shadow hover:shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500">
                {lang === 'bn' ? 'দৈনিক নিরাপদ' : 'Safe Daily'}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <span>↑</span> 9.4%
              </span>
            </div>
            <div className="text-base font-extrabold text-emerald-700 truncate">
              {isBalanceHidden ? '••••' : formatMoney(safeDailyAllowance, lang)}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. SPENDING ANALYTICS SMOOTH WAVE CHART CARD WITH DYNAMIC INTERACTION     */}
      {/* ========================================================================= */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <IconRenderer name="Activity" className="w-4 h-4 text-emerald-700" />
              <span>{lang === 'bn' ? 'খরচের এনালাইটিক্স (Spending Analytics)' : 'Spending Analytics'}</span>
            </h2>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-slate-900">
                {isBalanceHidden ? '••••' : formatMoney(summary.totalExpenses, lang)}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                +8.3% vs Last Month
              </span>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => onNavigateTab('reports')}
            className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 transition-colors cursor-pointer"
            title="Open Detailed Reports"
          >
            <IconRenderer name="Maximize2" className="w-4 h-4" />
          </motion.button>
        </div>

        {/* Smooth Curved SVG Line Chart with Peak Indicator */}
        <div className="relative pt-6 pb-2">
          {/* Peak Tooltip Indicator */}
          <motion.div
            key={selectedChartMonth}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="absolute top-1 bg-emerald-800 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-md flex items-center gap-1 -translate-x-1/2"
            style={{ left: `${(currentChart.peakX / 400) * 100}%` }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse" />
            <span>
              {isBalanceHidden
                ? '••••'
                : formatMoney(
                    summary.highestExpense ? summary.highestExpense.amount : currentChart.val * 3,
                    lang
                  )}
            </span>
          </motion.div>

          <svg className="w-full h-28 overflow-visible" viewBox="0 0 400 120" preserveAspectRatio="none">
            <defs>
              <linearGradient id="emeraldWaveGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.32" />
                <stop offset="80%" stopColor="#10B981" stopOpacity="0.03" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Background Wave Area */}
            <motion.path
              key={`area-${selectedChartMonth}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              d={`${currentChart.pathD} L 400,120 L 0,120 Z`}
              fill="url(#emeraldWaveGrad)"
            />

            {/* Smooth Sine Bezier Wave Line */}
            <motion.path
              key={`line-${selectedChartMonth}`}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              d={currentChart.pathD}
              fill="none"
              stroke="#059669"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Peak Glow Circle Marker */}
            <motion.circle
              key={`dot-${selectedChartMonth}`}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              cx={currentChart.peakX}
              cy={currentChart.peakY}
              r="5.5"
              fill="#10B981"
              stroke="#ffffff"
              strokeWidth="2.5"
            />
          </svg>
        </div>

        {/* Month Pills Selector (Jan - Jul) */}
        <div className="flex items-center justify-between gap-1 pt-1 border-t border-slate-100">
          {chartDatasets.map((m, idx) => (
            <motion.button
              whileTap={{ scale: 0.94 }}
              key={m.label}
              type="button"
              onClick={() => setSelectedChartMonth(idx)}
              className={`flex-1 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                selectedChartMonth === idx
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {m.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ========================================================================= */}
      {/* 6. TOP CATEGORIES PROGRESS BREAKDOWN (Matches Image 1)                    */}
      {/* ========================================================================= */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <IconRenderer name="PieChart" className="w-4 h-4 text-emerald-700" />
            <span>{lang === 'bn' ? 'প্রধান খরচের খাত (Top Categories)' : 'Top Categories'}</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('expenses')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer"
          >
            {lang === 'bn' ? 'সব দেখুন →' : 'See All →'}
          </button>
        </div>

        {topCategories.length === 0 ? (
          <p className="text-xs text-slate-400 py-2 text-center">
            {lang === 'bn' ? 'এখনও কোনো খরচ যুক্ত করা হয়নি।' : 'No category expenses logged yet.'}
          </p>
        ) : (
          <div className="space-y-3 pt-1">
            {topCategories.map((item) => {
              const totalExp = summary.totalExpenses || 1;
              const percent = Math.round((item.amount / totalExp) * 100);

              return (
                <div key={item.category.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-7 h-7 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.category.color }}
                      >
                        <IconRenderer name={item.category.icon} className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="font-bold text-slate-800 truncate">
                        {lang === 'bn' ? item.category.defaultNameBn : item.category.defaultNameEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-900">
                        {isBalanceHidden ? '••••' : formatMoney(item.amount, lang)}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400 font-mono w-8 text-right">
                        {percent}%
                      </span>
                    </div>
                  </div>

                  {/* Vivid Rounded Green Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, Math.max(4, percent))}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut' }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* ========================================================================= */}
      {/* 7. RECENT TRANSACTIONS WITH TIMEFRAME FILTERS                             */}
      {/* ========================================================================= */}
      <div className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <IconRenderer name="Clock" className="w-4 h-4 text-emerald-700" />
            <span>{lang === 'bn' ? 'সাম্প্রতিক লেনদেন' : 'Recent Transactions'}</span>
          </h2>
          <button
            type="button"
            onClick={() => onNavigateTab('history')}
            className="text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer flex items-center gap-0.5"
          >
            <span>{t(lang, 'viewAllTransactions')}</span>
            <IconRenderer name="ChevronRight" className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Filter Capsule Tabs: Today, This Week, This Month, All */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: 'all', label: lang === 'bn' ? 'সব' : 'All' },
            { id: 'today', label: lang === 'bn' ? 'আজ' : 'Today' },
            { id: 'week', label: lang === 'bn' ? 'এই সপ্তাহ' : 'This Week' },
            { id: 'month', label: lang === 'bn' ? 'এই মাস' : 'This Month' },
          ].map((tab) => (
            <motion.button
              whileTap={{ scale: 0.94 }}
              key={tab.id}
              type="button"
              onClick={() => setTimeframeFilter(tab.id as TimeframeFilter)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                timeframeFilter === tab.id
                  ? 'bg-[#032b21] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center space-y-3 border border-dashed border-slate-200">
            <EmptyListGraphic />
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800">{t(lang, 'emptyExpensesTitle')}</p>
              <p className="text-[11px] text-slate-500">{t(lang, 'emptyExpensesDesc')}</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs cursor-pointer"
            >
              <IconRenderer name="Plus" className="w-4 h-4" />
              <span>{t(lang, 'btnAddExpense')}</span>
            </motion.button>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence>
              {filteredTransactions.slice(0, 6).map((tx, index) => {
                const isExp = tx.type === 'expense';
                const cat = categories.find((c) => c.id === tx.categoryId) || {
                  id: tx.categoryId,
                  nameKey: 'catOther',
                  defaultNameBn: tx.customCategoryName || 'অন্যান্য',
                  defaultNameEn: tx.customCategoryName || 'Other',
                  icon: isExp ? 'CreditCard' : 'ArrowDownLeft',
                  color: isExp ? '#EF4444' : '#10B981',
                  type: tx.type,
                  isCustom: false,
                };

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: index * 0.04 }}
                    whileHover={{ scale: 1.01, x: 2 }}
                    onClick={() => onOpenEditTransaction(tx)}
                    className="p-3.5 bg-white hover:bg-slate-50/80 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs hover:border-emerald-300"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                          isExp ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        <IconRenderer
                          name={isExp ? 'ArrowUpRight' : 'ArrowDownLeft'}
                          className="w-5 h-5 stroke-[2.4]"
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {tx.note || (lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn)}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          <span>{lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}</span>
                          <span>•</span>
                          <span>{formatDate(tx.date, lang, { short: true })}</span>
                          {tx.receiptUri && <span className="text-emerald-700 font-bold">• 📷</span>}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`text-sm font-extrabold block font-sans ${
                          isExp ? 'text-rose-600' : 'text-emerald-700'
                        }`}
                      >
                        {isBalanceHidden
                          ? '••••'
                          : `${isExp ? '-' : '+'} ${formatMoney(tx.amount, lang)}`}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        {tx.paymentMethod}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
};
