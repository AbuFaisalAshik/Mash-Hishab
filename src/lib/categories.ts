import { Category, PaymentMethod } from '../types';

export const DEFAULT_EXPENSE_CATEGORIES: Category[] = [
  {
    id: 'food',
    nameKey: 'catFood',
    defaultNameBn: 'খাবার',
    defaultNameEn: 'Food',
    icon: 'Utensils',
    color: '#10B981', // Emerald green
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'hostel_rent',
    nameKey: 'catHostelRent',
    defaultNameBn: 'হোস্টেল / বাসা ভাড়া',
    defaultNameEn: 'Hostel / Rent',
    icon: 'Home',
    color: '#0284C7', // Sky blue
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'transport',
    nameKey: 'catTransport',
    defaultNameBn: 'যাতায়াত',
    defaultNameEn: 'Transportation',
    icon: 'Bus',
    color: '#F59E0B', // Amber
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'education',
    nameKey: 'catEducation',
    defaultNameBn: 'পড়াশোনা ও বইপত্র',
    defaultNameEn: 'Education',
    icon: 'GraduationCap',
    color: '#8B5CF6', // Purple
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'mobile',
    nameKey: 'catMobile',
    defaultNameBn: 'মোবাইল রিচার্জ',
    defaultNameEn: 'Mobile Recharge',
    icon: 'Smartphone',
    color: '#EC4899', // Pink
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'internet',
    nameKey: 'catInternet',
    defaultNameBn: 'ইন্টারনেট ও ওয়াইফাই',
    defaultNameEn: 'Internet & Wifi',
    icon: 'Wifi',
    color: '#06B6D4', // Cyan
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'grocery',
    nameKey: 'catGrocery',
    defaultNameBn: 'বাজার / মেস মিল',
    defaultNameEn: 'Grocery / Mess Meal',
    icon: 'ShoppingBag',
    color: '#84CC16', // Lime
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'clothing',
    nameKey: 'catClothing',
    defaultNameBn: 'পোশাক ও ফ্যাশন',
    defaultNameEn: 'Clothing & Fashion',
    icon: 'Shirt',
    color: '#F97316', // Orange
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'medical',
    nameKey: 'catMedical',
    defaultNameBn: 'চিকিৎসা ও ওষুধ',
    defaultNameEn: 'Medical & Pharmacy',
    icon: 'HeartPulse',
    color: '#EF4444', // Red
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'entertainment',
    nameKey: 'catEntertainment',
    defaultNameBn: 'বিনোদন ও আড্ডা',
    defaultNameEn: 'Entertainment',
    icon: 'Film',
    color: '#A855F7', // Violet
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'personal',
    nameKey: 'catPersonal',
    defaultNameBn: 'ব্যক্তিগত খরচ',
    defaultNameEn: 'Personal',
    icon: 'User',
    color: '#6366F1', // Indigo
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'bills',
    nameKey: 'catBills',
    defaultNameBn: 'ইউটিলিটি বিল',
    defaultNameEn: 'Utility Bills',
    icon: 'ReceiptText',
    color: '#14B8A6', // Teal
    type: 'expense',
    isCustom: false,
  },
  {
    id: 'other',
    nameKey: 'catOther',
    defaultNameBn: 'অন্যান্য খরচ',
    defaultNameEn: 'Other Expenses',
    icon: 'MoreHorizontal',
    color: '#64748B', // Slate
    type: 'expense',
    isCustom: false,
  },
];

export const DEFAULT_INCOME_CATEGORIES: Category[] = [
  {
    id: 'father',
    nameKey: 'sourceFather',
    defaultNameBn: 'বাবার কাছ থেকে',
    defaultNameEn: 'From Father',
    icon: 'HandCoins',
    color: '#10B981',
    type: 'income',
    isCustom: false,
  },
  {
    id: 'mother',
    nameKey: 'sourceMother',
    defaultNameBn: 'মায়ের কাছ থেকে',
    defaultNameEn: 'From Mother',
    icon: 'Heart',
    color: '#EC4899',
    type: 'income',
    isCustom: false,
  },
  {
    id: 'family',
    nameKey: 'sourceFamily',
    defaultNameBn: 'পরিবারের কাছ থেকে',
    defaultNameEn: 'From Family',
    icon: 'Users',
    color: '#06B6D4',
    type: 'income',
    isCustom: false,
  },
  {
    id: 'tuition',
    nameKey: 'sourceTuition',
    defaultNameBn: 'টিউশনি / পার্ট-টাইম',
    defaultNameEn: 'Tuition / Part-time',
    icon: 'BookOpenCheck',
    color: '#8B5CF6',
    type: 'income',
    isCustom: false,
  },
  {
    id: 'scholarship',
    nameKey: 'sourceScholarship',
    defaultNameBn: 'স্কলারশিপ / বৃত্তি',
    defaultNameEn: 'Scholarship',
    icon: 'Award',
    color: '#F59E0B',
    type: 'income',
    isCustom: false,
  },
  {
    id: 'gift',
    nameKey: 'sourceGift',
    defaultNameBn: 'উপহার / সালামি',
    defaultNameEn: 'Gift / Salami',
    icon: 'Gift',
    color: '#F43F5E',
    type: 'income',
    isCustom: false,
  },
  {
    id: 'other_income',
    nameKey: 'sourceOtherIncome',
    defaultNameBn: 'অন্যান্য উৎস',
    defaultNameEn: 'Other Income',
    icon: 'PiggyBank',
    color: '#3B82F6',
    type: 'income',
    isCustom: false,
  },
];

export const PAYMENT_METHOD_OPTIONS: { id: PaymentMethod; nameBn: string; nameEn: string; icon: string; brandColor: string }[] = [
  { id: 'cash', nameBn: 'নগদ ক্যাশ', nameEn: 'Cash', icon: 'Banknote', brandColor: '#10B981' },
  { id: 'bkash', nameBn: 'বিকাশ', nameEn: 'bKash', icon: 'Smartphone', brandColor: '#D12053' },
  { id: 'nagad', nameBn: 'নগদ', nameEn: 'Nagad', icon: 'Smartphone', brandColor: '#F7941D' },
  { id: 'rocket', nameBn: 'রকেট', nameEn: 'Rocket', icon: 'Smartphone', brandColor: '#8C3494' },
  { id: 'bank', nameBn: 'ব্যাংক', nameEn: 'Bank', icon: 'Building2', brandColor: '#3B82F6' },
  { id: 'card', nameBn: 'কার্ড', nameEn: 'Card', icon: 'CreditCard', brandColor: '#6366F1' },
  { id: 'other', nameBn: 'অন্যান্য', nameEn: 'Other', icon: 'Layers', brandColor: '#64748B' },
];
