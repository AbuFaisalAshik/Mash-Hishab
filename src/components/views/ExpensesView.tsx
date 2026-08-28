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
  const [selectedPaymentMethod] = useState<string>('all');

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
    categorySpendMap[t.categoryId] =
      (categorySpendMap[t.categoryId] || 0) + Math.round(t.amount || 0);
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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-20"
    >
      {/* Header & Quick Add */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {t(lang, 'navExpenses')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t(lang, 'totalSpent')}:{' '}
            <strong className="text-rose-600 font-bold">{formatMoney(summary.totalExpenses, lang)}</strong>
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddExpense}
          className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <IconRenderer name="Plus" className="w-4 h-4" />
          <span>{t(lang, 'btnAddExpense')}</span>
        </button>
      </div>

      {/* Category Pills Horizontal Scroll */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block px-1">
          {t(lang, 'filterCategory')}
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCatId('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              selectedCatId === 'all'
                ? 'bg-[#032b21] text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t(lang, 'filterAll')} (
            {lang === 'bn'
              ? toBengaliNumerals(expenseTransactions.length)
              : expenseTransactions.length}
            )
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
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#032b21] text-white border-[#032b21] shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}</span>
                  {spend > 0 && (
                    <span className="text-[10px] opacity-90 font-mono">
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
          <div className="bg-white rounded-3xl p-8 text-center space-y-3 border border-dashed border-slate-200">
            <EmptyListGraphic />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">{t(lang, 'emptyExpensesTitle')}</p>
              <p className="text-xs text-slate-500">{t(lang, 'emptyExpensesDesc')}</p>
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
          sortedDates.map((dateStr) => {
            const txList = groupedByDate[dateStr];
            const dayTotal = txList.reduce((sum, t) => sum + Math.round(t.amount || 0), 0);

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-700">
                    {formatDate(dateStr, lang)}
                  </span>
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
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
                                <span className="text-emerald-600 font-bold">• 📷</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-sm font-extrabold text-rose-600 font-sans block">
                            - {formatMoney(tx.amount, lang)}
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
