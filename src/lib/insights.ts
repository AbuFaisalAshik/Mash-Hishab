import { SmartInsight, MonthlySummary, Language } from '../types';
import { formatMoney, t } from './i18n/formatter';

export function generateSmartInsights(
  summary: MonthlySummary,
  lang: Language = 'bn'
): SmartInsight[] {
  const insights: SmartInsight[] = [];

  // 1. Dominant Remaining Balance Insight
  insights.push({
    id: 'insight_remaining',
    type: summary.remainingBalance > 0 ? 'positive' : 'warning',
    titleBn: 'বর্তমান ব্যালেন্স',
    titleEn: 'Current Balance',
    descriptionBn: `আপনার হাতে বর্তমানে ${formatMoney(summary.remainingBalance, 'bn')} রয়েছে।`,
    descriptionEn: `You currently have ${formatMoney(summary.remainingBalance, 'en')} remaining.`,
    icon: 'Wallet',
    statValue: formatMoney(summary.remainingBalance, lang),
  });

  // 2. Highest Spending Category Insight
  if (summary.highestCategory) {
    const catNameBn = summary.highestCategory.category.defaultNameBn;
    const catNameEn = summary.highestCategory.category.defaultNameEn;
    insights.push({
      id: 'insight_highest_cat',
      type: 'highlight',
      titleBn: 'সর্বোচ্চ খরচের খাত',
      titleEn: 'Top Spending Category',
      descriptionBn: `এই মাসে আপনার সবচেয়ে বেশি খরচ হয়েছে ${catNameBn}-এর পেছনে (${formatMoney(summary.highestCategory.amount, 'bn')}, মোট ব্যয়ের ${summary.highestCategory.percentage}%)।`,
      descriptionEn: `${catNameEn} is your highest spending category this month (${formatMoney(summary.highestCategory.amount, 'en')}, ${summary.highestCategory.percentage}% of total expenses).`,
      icon: 'TrendingUp',
      statValue: `${summary.highestCategory.percentage}%`,
    });
  }

  // 3. Daily Average Spending
  if (summary.dailyAverage > 0) {
    insights.push({
      id: 'insight_daily_avg',
      type: 'info',
      titleBn: 'দৈনিক গড় ব্যয়',
      titleEn: 'Daily Average',
      descriptionBn: `আপনার দৈনিক গড় খরচ ${formatMoney(summary.dailyAverage, 'bn')}।`,
      descriptionEn: `Your average daily spending is ${formatMoney(summary.dailyAverage, 'en')}.`,
      icon: 'Calendar',
      statValue: formatMoney(summary.dailyAverage, lang),
    });
  }

  // 4. Burn Pace & Projection (How many days will remaining money last)
  if (summary.dailyAverage > 0 && summary.remainingBalance > 0) {
    const daysLeftInMonth = summary.daysRemaining;
    const projectedDays = summary.projectedDaysLeft;

    if (projectedDays >= daysLeftInMonth) {
      insights.push({
        id: 'insight_burn_pace',
        type: 'positive',
        titleBn: 'খরচের গতি ও স্থায়িত্ব',
        titleEn: 'Spending Pace',
        descriptionBn: `বর্তমান খরচের গতিতে আপনার টাকা প্রায় ${t('bn', 'daysRemainingInMonth', { days: projectedDays })} চলতে পারে। মাসের শেষ পর্যন্ত আপনি নিরাপদে থাকবেন!`,
        descriptionEn: `At your current spending rate, your money may last approximately ${projectedDays} more days. You will comfortably make it through the month!`,
        icon: 'ShieldCheck',
        statValue: `${projectedDays} days`,
      });
    } else {
      insights.push({
        id: 'insight_burn_warning',
        type: 'warning',
        titleBn: 'বাজেট সতর্কতা',
        titleEn: 'Budget Warning',
        descriptionBn: `বর্তমান খরচের গতিতে টাকা প্রায় ${projectedDays} দিনে শেষ হয়ে যেতে পারে (মাসের বাকি আরও ${daysLeftInMonth} দিন)। অপচয় কিছুটা কমানোর চেষ্টা করুন।`,
        descriptionEn: `At your current burn rate, your money may run out in ~${projectedDays} days (${daysLeftInMonth} days left in month). Consider moderating non-essential spending.`,
        icon: 'AlertTriangle',
        statValue: `~${projectedDays} days`,
      });
    }
  }

  return insights;
}
