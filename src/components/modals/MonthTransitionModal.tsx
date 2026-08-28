import React, { useState } from 'react';
import { Language } from '../../types';
import { t, formatMoney, formatMonthYear } from '../../lib/i18n/formatter';
import { IconRenderer } from '../common/IconRenderer';

interface MonthTransitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (option: { carryForward: boolean; newStartingAmount: number }) => void;
  prevMonthId: string;
  currentMonthId: string;
  prevMonthRemaining: number;
  lang: Language;
}

export const MonthTransitionModal: React.FC<MonthTransitionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  prevMonthId,
  currentMonthId,
  prevMonthRemaining,
  lang,
}) => {
  const [carryForward, setCarryForward] = useState<boolean>(prevMonthRemaining > 0);
  const [startingAmountStr, setStartingAmountStr] = useState('15000');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseFloat(startingAmountStr.replace(/,/g, '')) || 0;
    onConfirm({
      carryForward,
      newStartingAmount: Math.round(cleanNum),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <IconRenderer name="Calendar" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t(lang, 'monthTransitionTitle')}</h2>
              <p className="text-xs text-slate-500 font-medium">{formatMonthYear(currentMonthId, lang)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-900">
                {lang === 'bn' ? `${formatMonthYear(prevMonthId, 'bn')}-এর সমাপ্তি:` : `Ending ${formatMonthYear(prevMonthId, 'en')}:`}
              </span>
              <span className="text-sm font-bold text-emerald-800">
                {formatMoney(prevMonthRemaining, lang)}
              </span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              {t(lang, 'monthTransitionDesc', {
                prevMonth: formatMonthYear(prevMonthId, lang),
                amount: formatMoney(prevMonthRemaining, lang),
              })}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            <label
              onClick={() => setCarryForward(true)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                carryForward
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full mt-0.5 border flex items-center justify-center ${
                  carryForward ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                }`}
              >
                {carryForward && <IconRenderer name="Check" className="w-3.5 h-3.5" />}
              </div>
              <div className="text-xs">
                <span className="font-bold block text-slate-900">
                  {t(lang, 'optCarryForward', { amount: formatMoney(prevMonthRemaining, lang) })}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                  {lang === 'bn'
                    ? 'আগের মাসের টাকা নতুন মাসের মোট ব্যালেন্সের সাথে যোগ হবে।'
                    : 'Unspent money from previous month rolls into available funds.'}
                </span>
              </div>
            </label>

            <label
              onClick={() => setCarryForward(false)}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                !carryForward
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full mt-0.5 border flex items-center justify-center ${
                  !carryForward ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                }`}
              >
                {!carryForward && <IconRenderer name="Check" className="w-3.5 h-3.5" />}
              </div>
              <div className="text-xs">
                <span className="font-bold block text-slate-900">{t(lang, 'optFreshStart')}</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                  {lang === 'bn'
                    ? 'আগের মাসের অবশিষ্ট পৃথক থাকবে, নতুন মাস ০ থেকে শুরু হবে।'
                    : 'Start new month fresh with new allowance only.'}
                </span>
              </div>
            </label>
          </div>

          {/* New Month Starting Allowance Input */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              {t(lang, 'newMonthStartingBalancePrompt', {
                currentMonth: formatMonthYear(currentMonthId, lang),
              })}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-emerald-700">৳</span>
              <input
                type="number"
                value={startingAmountStr}
                onChange={(e) => setStartingAmountStr(e.target.value)}
                placeholder="15000"
                className="w-full bg-transparent text-2xl font-extrabold text-slate-900 focus:outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
            >
              {t(lang, 'btnCancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <IconRenderer name="Check" className="w-4 h-4" />
              <span>{t(lang, 'btnConfirmMonthTransition')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
