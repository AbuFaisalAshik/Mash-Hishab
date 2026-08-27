import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Category, Transaction, PaymentMethod, Language } from '../../types';
import { t, formatMoney, parseBengaliNumerals, toBengaliNumerals } from '../../lib/i18n/formatter';
import { PAYMENT_METHOD_OPTIONS } from '../../lib/categories';
import { IconRenderer } from '../common/IconRenderer';
import { getTodayDateString } from '../../lib/storage';
import { triggerConfetti } from '../common/Graphics';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  categories: Category[];
  monthlyAccountId: string;
  lang: Language;
}

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  monthlyAccountId,
  lang,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || 'food');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [receiptUri, setReceiptUri] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const quickNotesBn = ['দুপুরের খাবার', 'মেস মিল', 'রিকশা ভাড়া', 'মোবাইল রিচার্জ', 'বই/ফটোকপি', 'নাস্তা'];
  const quickNotesEn = ['Lunch', 'Mess Meal', 'Bus/Rickshaw', 'Mobile Recharge', 'Book/Notes', 'Snacks'];
  const quickNotes = lang === 'bn' ? quickNotesBn : quickNotesEn;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmountStr(val);
    if (error) setError(null);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setError(lang === 'bn' ? 'ছবির সাইজ ৩ মেগাবাইটের কম হতে হবে' : 'Image must be under 3MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptUri(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumStr = parseBengaliNumerals(amountStr.trim().replace(/,/g, ''));
    const numericAmount = parseFloat(cleanNumStr);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError(t(lang, 'errorInvalidAmount'));
      return;
    }

    if (!selectedCategoryId) {
      setError(t(lang, 'errorCategoryRequired'));
      return;
    }

    onSave({
      monthlyAccountId,
      type: 'expense',
      amount: Math.round(numericAmount),
      categoryId: selectedCategoryId,
      date: date || getTodayDateString(),
      note: note.trim(),
      paymentMethod,
      receiptUri,
    });

    triggerConfetti();

    // Reset and close
    setAmountStr('');
    setNote('');
    setReceiptUri(undefined);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <IconRenderer name="ArrowUpRight" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t(lang, 'addExpenseTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t(lang, 'heroRemainingQuestion')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <IconRenderer name="AlertTriangle" className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Amount Field */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-emerald-500/30 rounded-2xl p-4 focus-within:border-emerald-500 transition-all shadow-inner">
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              {t(lang, 'amountLabel')}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">৳</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={handleAmountChange}
                placeholder={t(lang, 'amountPlaceholder')}
                autoFocus
                className="w-full bg-transparent text-3xl font-extrabold text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none tracking-tight"
              />
            </div>
          </div>

          {/* Category Selector Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
              {t(lang, 'categoryLabel')}
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {expenseCategories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all text-center cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white mb-1.5 shadow-xs"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconRenderer name={cat.icon} className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-[11px] font-semibold leading-tight line-clamp-1">
                      {lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick Note Suggestions */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t(lang, 'noteLabel')}
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickNotes.map((qNote) => (
                <button
                  type="button"
                  key={qNote}
                  onClick={() => setNote(qNote)}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer"
                >
                  + {qNote}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t(lang, 'notePlaceholder')}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Date and Payment Method Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t(lang, 'dateLabel')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t(lang, 'paymentMethodLabel')}
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {PAYMENT_METHOD_OPTIONS.map((pm) => (
                  <option key={pm.id} value={pm.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    {lang === 'bn' ? pm.nameBn : pm.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Receipt Attachment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {t(lang, 'receiptLabel')}
            </label>
            {receiptUri ? (
              <div className="relative w-full h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 group">
                <img
                  src={receiptUri}
                  alt="Receipt memo"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => setReceiptUri(undefined)}
                  className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-lg hover:bg-rose-500 transition-colors shadow-sm cursor-pointer"
                >
                  <IconRenderer name="Trash2" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/40 cursor-pointer transition-colors text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200">
                <IconRenderer name="Camera" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold">
                  {lang === 'bn' ? 'রসিদ / মেমোর ছবি তুলুন বা আপলোড করুন' : 'Attach memo / receipt photo'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {t(lang, 'btnCancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 dark:shadow-emerald-950 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <IconRenderer name="Check" className="w-4 h-4" />
              <span>{t(lang, 'btnSaveExpense')}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
