import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Transaction, Category, Language } from '../../types';
import { t, formatMoney, formatDate, parseBengaliNumerals } from '../../lib/i18n/formatter';
import { IconRenderer } from '../common/IconRenderer';
import { EmptyListGraphic } from '../common/Graphics';

interface HistoryViewProps {
  transactions: Transaction[];
  categories: Category[];
  lang: Language;
  onOpenEditTransaction: (transaction: Transaction) => void;
  undoCount?: number;
  onOpenUndoHistory?: () => void;
  onUndoLatest?: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  categories,
  lang,
  onOpenEditTransaction,
  undoCount = 0,
  onOpenUndoHistory,
  onUndoLatest,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<
    'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'
  >('date_desc');

  // Search & Filter Pipeline
  const filtered = transactions.filter((tItem) => {
    if (typeFilter !== 'all' && tItem.type !== typeFilter) return false;
    if (categoryFilter !== 'all' && tItem.categoryId !== categoryFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const qEn = parseBengaliNumerals(q);
      const cat = categories.find((c) => c.id === tItem.categoryId);
      const catNameBn = cat?.defaultNameBn.toLowerCase() || '';
      const catNameEn = cat?.defaultNameEn.toLowerCase() || '';
      const note = (tItem.note || '').toLowerCase();
      const amountStr = String(tItem.amount);

      const matches =
        note.includes(q) ||
        catNameBn.includes(q) ||
        catNameEn.includes(q) ||
        amountStr.includes(q) ||
        amountStr.includes(qEn);

      if (!matches) return false;
    }

    return true;
  });

  // Sort Pipeline
  const sorted = [...filtered].sort((a, b) => {
    if (sortOrder === 'date_desc') {
      return b.date.localeCompare(a.date) || b.createdAt - a.createdAt;
    }
    if (sortOrder === 'date_asc') {
      return a.date.localeCompare(b.date) || a.createdAt - b.createdAt;
    }
    if (sortOrder === 'amount_desc') {
      return b.amount - a.amount;
    }
    if (sortOrder === 'amount_asc') {
      return a.amount - b.amount;
    }
    return 0;
  });

  // Group by date
  const groupedByDate: Record<string, Transaction[]> = {};
  sorted.forEach((t) => {
    if (!groupedByDate[t.date]) {
      groupedByDate[t.date] = [];
    }
    groupedByDate[t.date].push(t);
  });

  const dateKeys = Object.keys(groupedByDate);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-20"
    >
      {/* Header */}
      <div className="pt-1 px-1 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {t(lang, 'historyTitle')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {lang === 'bn'
              ? 'সকল খরচ ও জমার সময়ক্রমিক পূর্ণাঙ্গ রেকর্ড'
              : 'Complete chronological record of expenses and deposits'}
          </p>
        </div>

        {onOpenUndoHistory && (
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onOpenUndoHistory}
            className="py-1.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 hover:border-emerald-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
          >
            <IconRenderer name="RotateCcw" className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'bn' ? 'আনডু ইতিহাস' : 'Undo Moves'}</span>
            {undoCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {undoCount}
              </span>
            )}
          </motion.button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <IconRenderer
          name="Search"
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t(lang, 'searchPlaceholder')}
          className="w-full bg-white border border-slate-200 focus:border-emerald-600 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-2xs"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <IconRenderer name="X" className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {/* Type Toggle */}
        <div className="flex items-center p-1 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <button
            type="button"
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'all' ? 'bg-[#032b21] text-white shadow-2xs' : 'text-slate-600'
            }`}
          >
            {t(lang, 'filterAll')}
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'expense' ? 'bg-rose-600 text-white shadow-2xs' : 'text-slate-600'
            }`}
          >
            {t(lang, 'filterExpenses')}
          </button>
          <button
            type="button"
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              typeFilter === 'income' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-slate-600'
            }`}
          >
            {t(lang, 'filterIncome')}
          </button>
        </div>

        {/* Category Dropdown */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600 shadow-2xs cursor-pointer"
        >
          <option value="all">
            {t(lang, 'filterCategory')}: {t(lang, 'filterAll')}
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {lang === 'bn' ? c.defaultNameBn : c.defaultNameEn}
            </option>
          ))}
        </select>

        {/* Sort Order */}
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as any)}
          className="bg-white border border-slate-200 rounded-2xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-emerald-600 shadow-2xs cursor-pointer"
        >
          <option value="date_desc">{t(lang, 'sortByDateDesc')}</option>
          <option value="date_asc">{t(lang, 'sortByDateAsc')}</option>
          <option value="amount_desc">{t(lang, 'sortByAmountDesc')}</option>
          <option value="amount_asc">{t(lang, 'sortByAmountAsc')}</option>
        </select>
      </div>

      {/* Grouped Transactions List */}
      <div className="space-y-4">
        {dateKeys.length === 0 ? (
          <div className="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3">
            <EmptyListGraphic />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">{t(lang, 'noTransactionsFound')}</p>
              <p className="text-xs text-slate-500">{t(lang, 'noTransactionsQuery')}</p>
            </div>
          </div>
        ) : (
          dateKeys.map((dateStr) => {
            const txList = groupedByDate[dateStr];
            return (
              <div key={dateStr} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-700">
                    {formatDate(dateStr, lang)}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {txList.length} {lang === 'bn' ? 'টি লেনদেন' : 'items'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {txList.map((tx) => {
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
                        className="p-3 bg-white hover:bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3 cursor-pointer transition-all shadow-2xs hover:border-slate-300"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                            style={{ backgroundColor: cat.color }}
                          >
                            <IconRenderer name={cat.icon} className="w-4 h-4 text-white" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {tx.note || (lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn)}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <span>{lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}</span>
                              <span>•</span>
                              <span className="uppercase text-[10px]">{tx.paymentMethod}</span>
                              {tx.receiptUri && (
                                <span className="text-emerald-600 font-semibold">• 📷</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span
                            className={`text-sm font-extrabold block ${
                              isExp ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {isExp ? '-' : '+'} {formatMoney(tx.amount, lang)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
};
