import React from 'react';
import { motion } from 'motion/react';
import { MonthlySummary, Transaction, Category, Language } from '../../types';
import { t, formatMoney, formatMonthYear, toBengaliNumerals } from '../../lib/i18n/formatter';
import { CategoryDonutChart, DailySpendingBarChart } from '../reports/ReportCharts';
import { IconRenderer } from '../common/IconRenderer';

interface ReportsViewProps {
  summary: MonthlySummary;
  transactions: Transaction[];
  categories: Category[];
  lang: Language;
  onExportCsv: () => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  summary,
  transactions,
  categories,
  lang,
  onExportCsv,
}) => {
  const budgetUtilization =
    summary.totalAvailable > 0
      ? Math.min(100, Math.round((summary.totalExpenses / summary.totalAvailable) * 100))
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-24"
    >
      {/* Header & Export Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {t(lang, 'reportTitle')}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatMonthYear(summary.monthId, lang)} • {t(lang, 'reportSubtitle')}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.95 }}
          type="button"
          onClick={onExportCsv}
          className="py-2 px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <IconRenderer name="Download" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'bn' ? 'CSV রিপোর্ট' : 'Export CSV'}</span>
        </motion.button>
      </div>

      {/* Monthly Utilization Meter */}
      <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-3 shadow-md">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 dark:text-slate-300">
            {t(lang, 'budgetUtilization', { percent: budgetUtilization })}
          </span>
          <span className={budgetUtilization > 85 ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400 font-bold'}>
            {summary.daysRemaining} {lang === 'bn' ? 'দিন বাকি' : 'days left'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3.5 bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-200 dark:border-white/5">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, budgetUtilization)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              budgetUtilization > 90
                ? 'bg-rose-500'
                : budgetUtilization > 70
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{lang === 'bn' ? 'মোট প্রাপ্ত:' : 'Received:'} {formatMoney(summary.totalAvailable, lang)}</span>
          <span>{lang === 'bn' ? 'অবশিষ্ট:' : 'Remaining:'} <strong className="text-slate-900 dark:text-white">{formatMoney(summary.remainingBalance, lang)}</strong></span>
        </div>
      </div>

      {/* Category Donut Chart Section */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
          <IconRenderer name="PieChart" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>{t(lang, 'spendingByCategory')}</span>
        </h2>

        <CategoryDonutChart
          transactions={transactions}
          categories={categories}
          totalExpense={summary.totalExpenses}
          lang={lang}
        />
      </div>

      {/* Daily Spending Trend Chart */}
      <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
          <IconRenderer name="TrendingUp" className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span>{t(lang, 'dailyTrendTitle')}</span>
        </h2>

        <DailySpendingBarChart
          transactions={transactions}
          lang={lang}
          dailyAverage={summary.dailyAverage}
        />
      </div>

      {/* Key Financial Statistics Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
          {t(lang, 'reportMetrics')}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {/* Total Received */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
              {t(lang, 'statTotalReceived')}
            </span>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
              {formatMoney(summary.totalAvailable, lang)}
            </p>
          </div>

          {/* Total Spent */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
              {t(lang, 'statTotalSpent')}
            </span>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400">
              {formatMoney(summary.totalExpenses, lang)}
            </p>
          </div>

          {/* Net Remaining Balance */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
              {t(lang, 'statNetBalance')}
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              {formatMoney(summary.remainingBalance, lang)}
            </p>
          </div>

          {/* Daily Average */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
              {t(lang, 'statAvgDaily')}
            </span>
            <p className="text-base font-bold text-cyan-600 dark:text-cyan-400">
              {formatMoney(summary.dailyAverage, lang)}
            </p>
          </div>

          {/* Highest Single Expense */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
              {t(lang, 'statHighestSingleExpense')}
            </span>
            <p className="text-base font-bold text-amber-600 dark:text-amber-400 truncate">
              {summary.highestExpense ? formatMoney(summary.highestExpense.amount, lang) : '—'}
            </p>
          </div>

          {/* Total Transactions Count */}
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-2xl p-4 space-y-1 shadow-xs">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold block">
              {t(lang, 'statTransactionCount')}
            </span>
            <p className="text-base font-bold text-slate-900 dark:text-slate-100">
              {lang === 'bn' ? toBengaliNumerals(summary.transactionCount) : summary.transactionCount}{' '}
              <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">{t(lang, 'statTotalTransactionsUnit')}</span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
