import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Transaction, PaymentMethod, Language } from '../../types';
import { t, parseBengaliNumerals } from '../../lib/i18n/formatter';
import { PAYMENT_METHOD_OPTIONS, DEFAULT_INCOME_CATEGORIES } from '../../lib/categories';
import { IconRenderer } from '../common/IconRenderer';
import { getTodayDateString } from '../../lib/storage';
import { triggerConfetti } from '../common/Graphics';

interface AddMoneyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  monthlyAccountId: string;
  lang: Language;
}

export const AddMoneyModal: React.FC<AddMoneyModalProps> = ({
  isOpen,
  onClose,
  onSave,
  monthlyAccountId,
  lang,
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [selectedSourceId, setSelectedSourceId] = useState<string>('father');
  const [date, setDate] = useState(getTodayDateString());
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bkash');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const incomeSources = DEFAULT_INCOME_CATEGORIES;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumStr = parseBengaliNumerals(amountStr.trim().replace(/,/g, ''));
    const numericAmount = parseFloat(cleanNumStr);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError(t(lang, 'errorInvalidAmount'));
      return;
    }

    const matchedSource = incomeSources.find((s) => s.id === selectedSourceId);
    const sourceLabel = matchedSource
      ? lang === 'bn'
        ? matchedSource.defaultNameBn
        : matchedSource.defaultNameEn
      : 'টাকা প্রাপ্তি';

    onSave({
      monthlyAccountId,
      type: 'income',
      amount: Math.round(numericAmount),
      categoryId: selectedSourceId,
      customCategoryName: sourceLabel,
      date: date || getTodayDateString(),
      note: note.trim() || sourceLabel,
      paymentMethod,
    });

    triggerConfetti();

    setAmountStr('');
    setNote('');
    setError(null);
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <IconRenderer name="ArrowDownLeft" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t(lang, 'addMoneyTitle')}</h2>
              <p className="text-xs text-slate-500 font-medium">{t(lang, 'monthBreakdownTitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
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
              {t(lang, 'incomeAmountLabel')}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-bold text-emerald-700">৳</span>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => {
                  setAmountStr(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="2000"
                autoFocus
                className="w-full bg-transparent text-3xl font-extrabold text-slate-900 placeholder-slate-400 focus:outline-none tracking-tight"
              />
            </div>
          </div>

          {/* Source Category Grid */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {t(lang, 'incomeSourceLabel')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {incomeSources.map((source) => {
                const isSelected = selectedSourceId === source.id;
                return (
                  <button
                    type="button"
                    key={source.id}
                    onClick={() => setSelectedSourceId(source.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-2xl border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-2xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                      style={{ backgroundColor: source.color }}
                    >
                      <IconRenderer name={source.icon} className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-xs font-semibold leading-tight">
                      {lang === 'bn' ? source.defaultNameBn : source.defaultNameEn}
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
              placeholder={lang === 'bn' ? 'যেমন: বাবা পাঠিয়েছেন, টিউশনি বেতন...' : 'e.g., Pocket money from dad, tuition fee...'}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
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

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
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
              <IconRenderer name="Plus" className="w-4 h-4" />
              <span>{t(lang, 'btnSaveMoney')}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
