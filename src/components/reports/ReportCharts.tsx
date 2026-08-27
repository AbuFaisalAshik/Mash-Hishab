import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Category, Transaction, Language } from '../../types';
import { formatMoney, toBengaliNumerals, formatDate } from '../../lib/i18n/formatter';
import { IconRenderer } from '../common/IconRenderer';

interface CategoryChartProps {
  transactions: Transaction[];
  categories: Category[];
  totalExpense: number;
  lang: Language;
}

export const CategoryDonutChart: React.FC<CategoryChartProps> = ({
  transactions,
  categories,
  totalExpense,
  lang,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Aggregate category spending
  const spendMap: Record<string, { category: Category; amount: number }> = {};

  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      const cat =
        categories.find((c) => c.id === t.categoryId) ||
        categories.find((c) => c.id === 'other') || {
          id: t.categoryId,
          nameKey: 'catOther',
          defaultNameBn: t.customCategoryName || 'অন্যান্য',
          defaultNameEn: t.customCategoryName || 'Other',
          icon: 'MoreHorizontal',
          color: '#64748b',
          type: 'expense' as const,
          isCustom: false,
        };

      if (!spendMap[cat.id]) {
        spendMap[cat.id] = { category: cat, amount: 0 };
      }
      spendMap[cat.id].amount += Math.round(t.amount || 0);
    });

  const sortedCategories = Object.values(spendMap).sort((a, b) => b.amount - a.amount);

  if (sortedCategories.length === 0 || totalExpense <= 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-sm">
        {lang === 'bn' ? 'কোন খরচের ডেটা নেই' : 'No expense data available'}
      </div>
    );
  }

  // Calculate SVG Pie Segments
  let cumulativeAngle = 0;
  const radius = 80;
  const strokeWidth = 24;
  const center = 100;
  const circumference = 2 * Math.PI * radius;

  const segments = sortedCategories.map((item) => {
    const fraction = item.amount / totalExpense;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;
    const percentage = Math.round(fraction * 100);

    return {
      ...item,
      fraction,
      percentage,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
        {/* SVG Donut Chart */}
        <div className="relative w-52 h-52 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 200 200">
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800/60"
              strokeWidth={strokeWidth}
            />

            {segments.map((seg) => {
              const isHovered = hoveredCategory === seg.category.id;
              return (
                <circle
                  key={seg.category.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="transparent"
                  stroke={seg.category.color}
                  strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={seg.strokeDasharray}
                  strokeDashoffset={seg.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-300 cursor-pointer origin-center hover:opacity-95"
                  onMouseEnter={() => setHoveredCategory(seg.category.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                />
              );
            })}
          </svg>

          {/* Center Info Display */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {hoveredCategory
                ? sortedCategories.find((c) => c.category.id === hoveredCategory)?.category[
                    lang === 'bn' ? 'defaultNameBn' : 'defaultNameEn'
                  ]
                : lang === 'bn'
                ? 'মোট খরচ'
                : 'Total Expense'}
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              {hoveredCategory
                ? formatMoney(
                    sortedCategories.find((c) => c.category.id === hoveredCategory)?.amount || 0,
                    lang
                  )
                : formatMoney(totalExpense, lang)}
            </span>
            {hoveredCategory && (
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {lang === 'bn'
                  ? `${toBengaliNumerals(
                      sortedCategories.find((c) => c.category.id === hoveredCategory)?.amount
                        ? Math.round(
                            ((sortedCategories.find((c) => c.category.id === hoveredCategory)
                              ?.amount || 0) /
                              totalExpense) *
                              100
                          )
                        : 0
                    )}%`
                  : `${Math.round(
                      ((sortedCategories.find((c) => c.category.id === hoveredCategory)?.amount ||
                        0) /
                        totalExpense) *
                        100
                    )}%`}
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2 max-h-56 overflow-y-auto pr-1">
          {segments.map((seg) => {
            const isHovered = hoveredCategory === seg.category.id;
            return (
              <div
                key={seg.category.id}
                onMouseEnter={() => setHoveredCategory(seg.category.id)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                  isHovered
                    ? 'bg-emerald-50 dark:bg-slate-800/80 border border-emerald-300 dark:border-slate-700/80 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: seg.category.color }}
                  >
                    <IconRenderer name={seg.category.icon} className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {lang === 'bn' ? seg.category.defaultNameBn : seg.category.defaultNameEn}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {formatMoney(seg.amount, lang)}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 ml-1.5 font-medium">
                    ({lang === 'bn' ? toBengaliNumerals(seg.percentage) : seg.percentage}%)
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

interface DailyTrendChartProps {
  transactions: Transaction[];
  lang: Language;
  dailyAverage: number;
}

export const DailySpendingBarChart: React.FC<DailyTrendChartProps> = ({
  transactions,
  lang,
  dailyAverage,
}) => {
  const days: { dateStr: string; dayNumber: number; amount: number }[] = [];

  const dayMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense')
    .forEach((t) => {
      dayMap[t.date] = (dayMap[t.date] || 0) + Math.round(t.amount || 0);
    });

  // Last 14 days list
  for (let i = 13; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    days.push({
      dateStr,
      dayNumber: d.getDate(),
      amount: dayMap[dateStr] || 0,
    });
  }

  const maxAmount = Math.max(...days.map((d) => d.amount), dailyAverage * 1.5, 500);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{lang === 'bn' ? 'গত ১৪ দিনের দৈনিক খরচ' : 'Daily spending (Last 14 days)'}</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          {lang === 'bn' ? 'দৈনিক গড়: ' : 'Avg: '} {formatMoney(dailyAverage, lang)}
        </span>
      </div>

      <div className="h-44 flex items-end justify-between gap-1.5 pt-4 pb-2 px-2 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5">
        {days.map((d, index) => {
          const heightPercent = Math.min(100, Math.round((d.amount / maxAmount) * 100));
          const isToday = index === days.length - 1;
          const isHigh = d.amount > dailyAverage && d.amount > 0;

          return (
            <div key={d.dateStr} className="flex-1 flex flex-col items-center h-full justify-end group relative">
              {/* Tooltip */}
              <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 dark:bg-slate-950 text-white text-[10px] py-1 px-2 rounded-lg border border-slate-700 whitespace-nowrap pointer-events-none z-20 shadow-lg">
                <p className="font-semibold">{formatDate(d.dateStr, lang, { short: true })}</p>
                <p className="text-emerald-400 font-bold">{formatMoney(d.amount, lang)}</p>
              </div>

              {/* Bar with spring animation */}
              <div className="w-full max-w-[14px] bg-slate-200 dark:bg-slate-800/60 rounded-t-md relative flex items-end h-full">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(6, heightPercent)}%` }}
                  transition={{ duration: 0.5, delay: index * 0.02 }}
                  className={`w-full rounded-t-md ${
                    d.amount === 0
                      ? 'bg-slate-300 dark:bg-slate-800'
                      : isToday
                      ? 'bg-emerald-500 ring-2 ring-emerald-500/30 shadow-xs'
                      : isHigh
                      ? 'bg-gradient-to-t from-rose-600 to-rose-400'
                      : 'bg-gradient-to-t from-emerald-600 to-teal-400'
                  }`}
                />
              </div>

              {/* Day Label */}
              <span className={`text-[10px] mt-1.5 font-semibold ${isToday ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                {lang === 'bn' ? toBengaliNumerals(d.dayNumber) : d.dayNumber}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
