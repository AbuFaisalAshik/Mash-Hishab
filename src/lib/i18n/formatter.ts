import { Language } from '../../types';
import { translations, TranslationKey } from './translations';

const BENGALI_NUMERALS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const ENGLISH_NUMERALS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

/**
 * Converts English digits (0-9) to Bengali digits (০-৯)
 */
export function toBengaliNumerals(value: number | string): string {
  const str = String(value);
  return str.replace(/[0-9]/g, (digit) => BENGALI_NUMERALS[parseInt(digit, 10)]);
}

/**
 * Converts Bengali digits (০-৯) to standard English digits (0-9)
 */
export function parseBengaliNumerals(str: string): string {
  let result = str;
  BENGALI_NUMERALS.forEach((bnDigit, idx) => {
    result = result.replaceAll(bnDigit, ENGLISH_NUMERALS[idx]);
  });
  return result;
}

let activeCurrencySymbol = '৳';

export function setDefaultCurrencySymbol(symbol: string) {
  if (symbol && symbol.trim()) {
    activeCurrencySymbol = symbol.trim();
  }
}

export function getDefaultCurrencySymbol(): string {
  return activeCurrencySymbol;
}

/**
 * Formats a monetary amount into a clean, localized string with active currency symbol
 * e.g., 15000 -> ৳ ১৫,০০০ or $ 15,000 / € 15,000 / ﷼ ১৫,০০০
 */
export function formatMoney(
  amount: number | null | undefined,
  lang: Language = 'bn',
  showSymbol = true,
  customSymbol?: string
): string {
  const num = Math.round(Number(amount) || 0);
  const formattedEnNumber = new Intl.NumberFormat('en-IN').format(num);
  const symbol = customSymbol || activeCurrencySymbol || '৳';

  if (lang === 'bn') {
    const bnFormatted = toBengaliNumerals(formattedEnNumber);
    return showSymbol ? `${symbol} ${bnFormatted}` : bnFormatted;
  }

  return showSymbol ? `${symbol} ${formattedEnNumber}` : formattedEnNumber;
}

/**
 * Formats a date string (YYYY-MM-DD) into Bengali or English format
 * e.g. "2026-08-27" -> "২৭ আগস্ট ২০২৬" (bn) or "August 27, 2026" (en)
 */
export function formatDate(dateString: string, lang: Language = 'bn', options?: { short?: boolean; includeDay?: boolean }): string {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length < 3) return dateString;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const monthKey = `month${month}` as TranslationKey;
  const monthName = translations[lang][monthKey] || `Month ${month}`;

  if (lang === 'bn') {
    const bnDay = toBengaliNumerals(day);
    const bnYear = toBengaliNumerals(year);
    if (options?.short) {
      return `${bnDay} ${monthName.slice(0, 3)}`;
    }
    return `${bnDay} ${monthName} ${bnYear}`;
  }

  if (options?.short) {
    return `${monthName.slice(0, 3)} ${day}`;
  }
  return `${monthName} ${day}, ${year}`;
}

/**
 * Formats Year-Month string
 * e.g. "2026-08" -> "আগস্ট ২০২৬" (bn) or "August 2026" (en)
 */
export function formatMonthYear(monthId: string, lang: Language = 'bn'): string {
  const [yearStr, monthStr] = monthId.split('-');
  const monthNum = parseInt(monthStr, 10);
  const yearNum = parseInt(yearStr, 10);

  const monthKey = `month${monthNum}` as TranslationKey;
  const monthName = translations[lang][monthKey] || `Month ${monthNum}`;

  if (lang === 'bn') {
    return `${monthName} ${toBengaliNumerals(yearNum)}`;
  }
  return `${monthName} ${yearNum}`;
}

/**
 * Formats relative or standard time string
 */
export function formatRelativeTime(timestamp: number, lang: Language = 'bn'): string {
  if (!timestamp) return '';
  const now = Date.now();
  const diffMinutes = Math.floor((now - timestamp) / (1000 * 60));

  if (diffMinutes < 1) {
    return lang === 'bn' ? 'এইমাত্র' : 'Just now';
  }
  if (diffMinutes < 60) {
    return lang === 'bn'
      ? `${toBengaliNumerals(diffMinutes)} মিনিট আগে`
      : `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return lang === 'bn'
      ? `${toBengaliNumerals(diffHours)} ঘণ্টা আগে`
      : `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return lang === 'bn'
      ? `${toBengaliNumerals(diffDays)} দিন আগে`
      : `${diffDays}d ago`;
  }

  const dateObj = new Date(timestamp);
  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
  const dd = String(dateObj.getDate()).padStart(2, '0');
  return formatDate(`${yyyy}-${mm}-${dd}`, lang, { short: true });
}

/**
 * Localized string template interpolator
 */
export function t(
  lang: Language,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  let template = (translations[lang][key] || translations.bn[key] || key) as string;

  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      let valStr = String(v);
      if (typeof v === 'number' && lang === 'bn') {
        valStr = toBengaliNumerals(v);
      }
      template = template.replace(new RegExp(`\\{${k}\\}`, 'g'), valStr);
    });
  }

  return template;
}

/**
 * Get greeting based on time of day
 */
export function getTimeGreeting(lang: Language = 'bn', userName?: string): string {
  const hour = new Date().getHours();
  let greetingKey: TranslationKey = 'greetingMorning';

  if (hour >= 5 && hour < 12) {
    greetingKey = 'greetingMorning';
  } else if (hour >= 12 && hour < 17) {
    greetingKey = 'greetingAfternoon';
  } else if (hour >= 17 && hour < 21) {
    greetingKey = 'greetingEvening';
  } else {
    greetingKey = 'greetingNight';
  }

  const greeting = translations[lang][greetingKey];
  if (userName && userName.trim()) {
    return `${greeting}, ${userName.trim()}`;
  }
  return greeting;
}
