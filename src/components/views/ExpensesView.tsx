import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Transaction, Category, Language, MonthlySummary } from '../../types';
import { t, formatMoney, formatDate, toBengaliNumerals } from '../../lib/i18n/formatter';
import { IconRenderer } from '../common/IconRenderer';
import { EmptyListGraphic } from '../common/Graphics';

interface ExpensesViewProps {
  transactions: Transaction[];
  categories: Category[];
  summary: MonthlySummary;
  lang: Language;
  onOpenAddExpense: () => void;
  onOpenEditTransaction: (transaction: Transaction) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  transactions,
  categories,
  summary,
  lang,
  onOpenAddExpense,
  onOpenEditTransaction,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('all');

  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  // Filter transactions
  const filtered = expenseTransactions.filter((t) => {
    if (selectedCatId !== 'all' && t.categoryId !== selectedCatId) return false;
    if (selectedPaymentMethod !== 'all' && t.paymentMethod !== selectedPaymentMethod) return false;
    return true;
  });

  // Calculate category spend map
  const categorySpendMap: Record<string, number> = {};
  expenseTransactions.forEach((t) => {
    categorySpendMap[t.categoryId] = (categorySpendMap[t.categoryId] || 0) + Math.round(t.amount || 0);
  });

  // Group transactions by date
  const groupedByDate: Record<string, Transaction[]> = {};
  filtered.forEach((t) => {
    if (!groupedByDate[t.date]) {
      groupedByDate[t.date] = [];
    }
    groupedByDate[t.date].push(t);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => b.localeCompare(a));

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5 pb-24"
    >
      {/* Header & Quick Add */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            {t(lang, 'navExpenses')}
          </h1>
          <p className="text-xs text-slate-400">
            {t(lang, 'totalSpent')}: <span className="font-bold text-rose-400">{formatMoney(summary.totalExpenses, lang)}</span>
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onOpenAddExpense}
          className="py-2 px-3.5 rounded-full bg-gradient-to-r from-red-600 to-rose-500 hover:from-red-500 hover:to-rose-400 text-white font-bold text-xs shadow-md shadow-red-950 flex items-center gap-1.5 cursor-pointer"
        >
          <IconRenderer name="Plus" className="w-4 h-4" />
          <span>{t(lang, 'btnAddExpense')}</span>
        </motion.button>
      </div>

      {/* Category Pills Horizontal Scroll */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block px-0.5">
          {t(lang, 'filterCategory')}
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCatId('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCatId === 'all'
                ? 'bg-slate-100 text-slate-950 font-bold shadow-sm'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t(lang, 'filterAll')} ({lang === 'bn' ? toBengaliNumerals(expenseTransactions.length) : expenseTransactions.length})
          </button>

          {categories
            .filter((c) => c.type === 'expense')
            .map((cat) => {
              const spend = categorySpendMap[cat.id] || 0;
              const isSelected = selectedCatId === cat.id;

              return (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-white border-emerald-400 font-bold shadow-xs'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                  <span>{lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}</span>
                  {spend > 0 && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      {formatMoney(spend, lang)}
                    </span>
                  )}
                </button>
              );
            })}
        </div>
      </div>

      {/* Date-Grouped Transaction Cards */}
      <div className="space-y-4">
        {sortedDates.length === 0 ? (
          <div className="fintech-card rounded-3xl p-8 text-center space-y-3 border border-dashed border-slate-800">
            <EmptyListGraphic />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-200">{t(lang, 'emptyExpensesTitle')}</p>
              <p className="text-xs text-slate-400">{t(lang, 'emptyExpensesDesc')}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={onOpenAddExpense}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold text-xs shadow-sm cursor-pointer"
            >
              <IconRenderer name="Plus" className="w-4 h-4" />
              <span>{t(lang, 'btnAddExpense')}</span>
            </motion.button>
          </div>
        ) : (
          sortedDates.map((dateStr) => {
            const txList = groupedByDate[dateStr];
            const dayTotal = txList.reduce((sum, t) => sum + Math.round(t.amount || 0), 0);

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-300">
                    {formatDate(dateStr, lang)}
                  </span>
                  <span className="text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                    {t(lang, 'dayTotal', { amount: formatMoney(dayTotal, lang) })}
                  </span>
                </div>

                {/* Day's Transactions */}
                <div className="space-y-1.5">
                  {txList.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.categoryId) || {
                      id: tx.categoryId,
                      nameKey: 'catOther',
                      defaultNameBn: tx.customCategoryName || 'অন্যান্য',
                      defaultNameEn: tx.customCategoryName || 'Other',
                      icon: 'MoreHorizontal',
                      color: '#64748B',
                      type: 'expense' as const,
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
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                            style={{ backgroundColor: cat.color }}
                          >
                            <IconRenderer name={cat.icon} className="w-4 h-4 text-white" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-100 truncate">
                              {tx.note || (lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn)}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                              <span>{lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}</span>
                              <span>•</span>
                              <span className="uppercase text-[10px]">{tx.paymentMethod}</span>
                              {tx.receiptUri && (
                                <span className="text-emerald-400 font-bold">• 📷</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-extrabold text-rose-400 font-sans block">
                            - {formatMoney(tx.amount, lang)}
                          </span>
                        </div>
                      </motion.div>
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
