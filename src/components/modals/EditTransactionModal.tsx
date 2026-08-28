import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Category, Transaction, PaymentMethod, Language } from '../../types';
import { t, parseBengaliNumerals } from '../../lib/i18n/formatter';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                isExpense ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
              }`}
            >
              <IconRenderer name={isExpense ? 'ArrowUpRight' : 'ArrowDownLeft'} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isExpense ? t(lang, 'editExpenseTitle') : t(lang, 'addMoneyTitle')}
              </h2>
              <p className="text-xs text-slate-500 font-medium">{transaction.date}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Delete Confirmation Warning View */}
        {showConfirmDelete ? (
          <div className="p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <IconRenderer name="Trash2" className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 mb-1">
                {lang === 'bn' ? 'লেনদেনটি মুছে ফেলতে চান?' : 'Delete this transaction?'}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {lang === 'bn'
                  ? 'এই হিসাবটি মুছে ফেললে ব্যালেন্স স্বয়ংক্রিয়ভাবে পুনরায় সমন্বয় হবে।'
                  : 'Deleting this transaction will instantly recalculate your remaining balance.'}
              </p>
            </div>
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {t(lang, 'btnCancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(transaction.id);
                  onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {t(lang, 'btnDeleteExpense')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                <IconRenderer name="AlertTriangle" className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Amount Field */}
            <div className="bg-slate-50 border border-slate-200 focus-within:border-emerald-500 focus-within:bg-white rounded-2xl p-4 transition-all">
              <label className="block text-xs font-semibold text-slate-500 mb-1">
                {t(lang, 'amountLabel')}
              </label>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-emerald-700">৳</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full bg-transparent text-3xl font-extrabold text-slate-900 focus:outline-none tracking-tight"
                />
              </div>
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
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
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-2xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white mb-1 shadow-2xs"
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
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t(lang, 'noteLabel')}
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t(lang, 'notePlaceholder')}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white"
              />
            </div>

            {/* Date and Payment Method */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t(lang, 'dateLabel')}
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {t(lang, 'paymentMethodLabel')}
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  {PAYMENT_METHOD_OPTIONS.map((pm) => (
                    <option key={pm.id} value={pm.id} className="bg-white text-slate-900">
                      {lang === 'bn' ? pm.nameBn : pm.nameEn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Receipt Preview */}
            {receiptUri && (
              <div className="relative w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={receiptUri}
                  alt="Receipt"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => setReceiptUri(undefined)}
                  className="absolute top-2 right-2 bg-rose-600 text-white p-1 rounded-lg hover:bg-rose-500 shadow-2xs cursor-pointer"
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
                className="py-2.5 px-3.5 rounded-xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <IconRenderer name="Trash2" className="w-4 h-4" />
                <span className="hidden sm:inline">{t(lang, 'btnDeleteExpense')}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {t(lang, 'btnCancel')}
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
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
