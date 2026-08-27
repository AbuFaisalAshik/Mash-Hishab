import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Category, Transaction, PaymentMethod, Language } from '../../types';
import { t, parseBengaliNumerals, toBengaliNumerals } from '../../lib/i18n/formatter';
import { PAYMENT_METHOD_OPTIONS } from '../../lib/categories';
import { IconRenderer } from '../common/IconRenderer';

interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (transaction: Transaction) => void;
  onDelete: (transactionId: string) => void;
  categories: Category[];
  lang: Language;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  transaction,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  categories,
  lang,
}) => {
  if (!isOpen || !transaction) return null;

  const [amountStr, setAmountStr] = useState(String(transaction.amount));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(transaction.categoryId);
  const [date, setDate] = useState(transaction.date);
  const [note, setNote] = useState(transaction.note || '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(transaction.paymentMethod);
  const [receiptUri, setReceiptUri] = useState<string | undefined>(transaction.receiptUri);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExpense = transaction.type === 'expense';
  const availableCategories = categories.filter((c) => c.type === transaction.type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumStr = parseBengaliNumerals(amountStr.trim().replace(/,/g, ''));
    const numericAmount = parseFloat(cleanNumStr);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError(t(lang, 'errorInvalidAmount'));
      return;
    }

    onUpdate({
      ...transaction,
      amount: Math.round(numericAmount),
      categoryId: selectedCategoryId,
      date,
      note: note.trim(),
      paymentMethod,
      receiptUri,
      updatedAt: Date.now(),
    });

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
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isExpense ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              <IconRenderer name={isExpense ? 'ArrowUpRight' : 'ArrowDownLeft'} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isExpense ? t(lang, 'editExpenseTitle') : t(lang, 'addMoneyTitle')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">ID: {transaction.id.slice(0, 8)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Warning View */}
        {showConfirmDelete ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-500/15 border border-rose-300 dark:border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <IconRenderer name="Trash2" className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                {lang === 'bn' ? 'লেনদেনটি মুছে ফেলতে চান?' : 'Delete this transaction?'}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {lang === 'bn'
                  ? 'এই হিসাবটি মুছে ফেললে ব্যালেন্স স্বয়ংক্রিয়ভাবে পুনরায় সমন্বয় হবে।'
                  : 'Deleting this transaction will instantly recalculate your remaining balance.'}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                {t(lang, 'btnCancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(transaction.id);
                  onClose();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950 cursor-pointer"
              >
                {t(lang, 'btnDeleteExpense')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5 flex-1">
            {error && (
              <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <IconRenderer name="AlertTriangle" className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Amount Field */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 focus-within:border-emerald-500 transition-all">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                {t(lang, 'amountLabel')}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">৳</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full bg-transparent text-3xl font-extrabold text-slate-900 dark:text-white focus:outline-none tracking-tight"
                />
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                {t(lang, 'categoryLabel')}
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableCategories.map((cat) => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setSelectedCategoryId(cat.id)}
                      className={`flex flex-col items-center justify-center p-2 rounded-2xl border transition-all text-center cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-900 dark:text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white mb-1 shadow-xs"
                        style={{ backgroundColor: cat.color }}
                      >
                        <IconRenderer name={cat.icon} className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[10px] font-semibold leading-tight line-clamp-1">
                        {lang === 'bn' ? cat.defaultNameBn : cat.defaultNameEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Note Field */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                {t(lang, 'noteLabel')}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t(lang, 'notePlaceholder')}
                className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Date and Payment Method */}
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

            {/* Receipt Preview */}
            {receiptUri && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950">
                <img
                  src={receiptUri}
                  alt="Receipt"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => setReceiptUri(undefined)}
                  className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-lg hover:bg-rose-500 shadow-sm cursor-pointer"
                >
                  <IconRenderer name="Trash2" className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Buttons */}
            <div className="pt-2 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="py-3 px-3.5 rounded-xl border border-rose-300 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <IconRenderer name="Trash2" className="w-4 h-4" />
                <span className="hidden sm:inline">{t(lang, 'btnDeleteExpense')}</span>
              </button>
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
                <span>{t(lang, 'btnUpdateExpense')}</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
