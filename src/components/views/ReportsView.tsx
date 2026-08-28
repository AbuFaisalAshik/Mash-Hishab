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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4 pb-20"
    >
      {/* Header & Export Action */}
      <div className="flex items-center justify-between pt-1 px-1">
        <div>
          <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {t(lang, 'reportTitle')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {formatMonthYear(summary.monthId, lang)} • {t(lang, 'reportSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={onExportCsv}
          className="py-2 px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-all hover:scale-105 active:scale-95"
        >
          <IconRenderer name="Download" className="w-4 h-4 text-emerald-700" />
          <span>{lang === 'bn' ? 'CSV রিপোর্ট' : 'Export CSV'}</span>
        </button>
      </div>

      {/* Monthly Utilization Meter */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-700 font-bold">
            {t(lang, 'budgetUtilization', { percent: budgetUtilization })}
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
              budgetUtilization > 85
                ? 'text-rose-700 bg-rose-50 border border-rose-200'
                : 'text-emerald-800 bg-emerald-50 border border-emerald-200'
            }`}
          >
            {summary.daysRemaining} {lang === 'bn' ? 'দিন বাকি' : 'days left'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              budgetUtilization > 90
                ? 'bg-rose-500'
                : budgetUtilization > 70
                ? 'bg-amber-500'
                : 'bg-emerald-600'
            }`}
            style={{ width: `${Math.min(100, Math.max(2, budgetUtilization))}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>
            {lang === 'bn' ? 'মোট প্রাপ্ত:' : 'Received:'}{' '}
            <strong className="text-slate-800 font-bold">{formatMoney(summary.totalAvailable, lang)}</strong>
          </span>
          <span>
            {lang === 'bn' ? 'অবশিষ্ট:' : 'Remaining:'}{' '}
            <strong className="text-emerald-700 font-bold">{formatMoney(summary.remainingBalance, lang)}</strong>
          </span>
        </div>
      </div>

      {/* Category Donut Chart Section */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <IconRenderer name="PieChart" className="w-4 h-4 text-emerald-700" />
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
      <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-4 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
          <IconRenderer name="TrendingUp" className="w-4 h-4 text-emerald-700" />
          <span>{t(lang, 'dailyTrendTitle')}</span>
        </h2>

        <DailySpendingBarChart
          transactions={transactions}
          lang={lang}
          dailyAverage={summary.dailyAverage}
        />
      </div>

      {/* Key Financial Statistics Grid */}
      <div className="space-y-2.5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 px-1">
          {t(lang, 'reportMetrics')}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {/* Total Received */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium block">
              {t(lang, 'statTotalReceived')}
            </span>
            <p className="text-sm sm:text-base font-bold text-emerald-700">
              {formatMoney(summary.totalAvailable, lang)}
            </p>
          </div>

          {/* Total Spent */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium block">
              {t(lang, 'statTotalSpent')}
            </span>
            <p className="text-sm sm:text-base font-bold text-rose-600">
              {formatMoney(summary.totalExpenses, lang)}
            </p>
          </div>

          {/* Net Remaining Balance */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium block">
              {t(lang, 'statNetBalance')}
            </span>
            <p className="text-sm sm:text-base font-bold text-slate-900">
              {formatMoney(summary.remainingBalance, lang)}
            </p>
          </div>

          {/* Daily Average */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium block">
              {t(lang, 'statAvgDaily')}
            </span>
            <p className="text-sm sm:text-base font-bold text-teal-700">
              {formatMoney(summary.dailyAverage, lang)}
            </p>
          </div>

          {/* Highest Single Expense */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium block">
              {t(lang, 'statHighestSingleExpense')}
            </span>
            <p className="text-sm sm:text-base font-bold text-amber-600 truncate">
              {summary.highestExpense ? formatMoney(summary.highestExpense.amount, lang) : '—'}
            </p>
          </div>

          {/* Total Transactions Count */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 space-y-1 shadow-2xs">
            <span className="text-[11px] text-slate-500 font-medium block">
              {t(lang, 'statTransactionCount')}
            </span>
            <p className="text-sm sm:text-base font-bold text-slate-900">
              {lang === 'bn'
                ? toBengaliNumerals(summary.transactionCount)
                : summary.transactionCount}{' '}
              <span className="text-xs text-slate-500 font-normal">
                {t(lang, 'statTotalTransactionsUnit')}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
