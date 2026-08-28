import React, { useState } from 'react';
import { motion } from 'motion/react';
import { CurrencyOption, Language } from '../../types';
import { WORLD_CURRENCIES } from '../../lib/currencies';
import { IconRenderer } from '../common/IconRenderer';
import { triggerConfetti } from '../common/Graphics';

interface CurrencyPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCurrencyCode: string;
  selectedCurrencySymbol: string;
  customCurrencies?: CurrencyOption[];
  onSelectCurrency: (currency: CurrencyOption) => void;
  onAddCustomCurrency: (currency: CurrencyOption) => void;
  lang: Language;
}

export const CurrencyPickerModal: React.FC<CurrencyPickerModalProps> = ({
  isOpen,
  onClose,
  selectedCurrencyCode,
  selectedCurrencySymbol,
  customCurrencies = [],
  onSelectCurrency,
  onAddCustomCurrency,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingCustom, setIsAddingCustom] = useState(false);

  // Custom currency form fields
  const [customCode, setCustomCode] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [customNameBn, setCustomNameBn] = useState('');
  const [customNameEn, setCustomNameEn] = useState('');
  const [customFlag, setCustomFlag] = useState('🌐');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Merge default world currencies with user-created custom currencies
  const allCurrencies: CurrencyOption[] = [
    ...customCurrencies,
    ...WORLD_CURRENCIES.filter(
      (c) => !customCurrencies.some((custom) => custom.code === c.code)
    ),
  ];

  const filteredCurrencies = allCurrencies.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      c.code.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q) ||
      c.nameBn.toLowerCase().includes(q) ||
      c.nameEn.toLowerCase().includes(q)
    );
  });

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const code = customCode.trim().toUpperCase();
    const symbol = customSymbol.trim();
    const nameBn = customNameBn.trim() || `${code} কারেন্সি`;
    const nameEn = customNameEn.trim() || `${code} Currency`;
    const flag = customFlag.trim() || '🌐';

    if (!code) {
      setFormError(
        lang === 'bn'
          ? 'কারেন্সি কোড দিন (যেমন: USD, BDT, EUR)'
          : 'Enter currency code (e.g. USD, BDT, EUR)'
      );
      return;
    }

    if (!symbol) {
      setFormError(
        lang === 'bn'
          ? 'কারেন্সি প্রতীক দিন (যেমন: $, ৳, €, £)'
          : 'Enter currency symbol (e.g. $, ৳, €, £)'
      );
      return;
    }

    const newCurrency: CurrencyOption = {
      code,
      symbol,
      nameBn,
      nameEn,
      flag,
      isCustom: true,
    };

    onAddCustomCurrency(newCurrency);
    onSelectCurrency(newCurrency);
    triggerConfetti();

    // Reset form
    setCustomCode('');
    setCustomSymbol('');
    setCustomNameBn('');
    setCustomNameEn('');
    setCustomFlag('🌐');
    setFormError(null);
    setIsAddingCustom(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-extrabold text-sm shadow-2xs">
              {selectedCurrencySymbol || '৳'}
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {lang === 'bn' ? 'কারেন্সি নির্বাচন' : 'Select Currency'}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                {lang === 'bn'
                  ? 'যেকোনো দেশের মুদ্রা নির্বাচন বা নিজে তৈরি করুন'
                  : 'Choose or add any world currency'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Custom Add Toggle */}
        <div className="p-4 border-b border-slate-100 space-y-2 bg-white">
          <div className="relative">
            <IconRenderer
              name="Search"
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder={
                lang === 'bn' ? 'দেশ, কোড বা প্রতীক খুঁজুন...' : 'Search currency, code or symbol...'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Add Custom Button Toggle */}
          <button
            type="button"
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
          >
            <IconRenderer name={isAddingCustom ? 'ChevronUp' : 'Plus'} className="w-3.5 h-3.5" />
            <span>
              {isAddingCustom
                ? lang === 'bn'
                  ? 'কারেন্সি তালিকা দেখুন'
                  : 'View Currency List'
                : lang === 'bn'
                ? '+ যেকোনো দেশের কারেন্সি নিজে যুক্ত করুন'
                : '+ Add Custom Currency'}
            </span>
          </button>
        </div>

        {/* Modal Content: Custom Currency Form OR Currency Grid List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2 max-h-[50vh]">
          {isAddingCustom ? (
            <form onSubmit={handleSaveCustom} className="space-y-3">
              <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
                <p className="text-[11px] text-emerald-800 font-medium leading-relaxed">
                  {lang === 'bn'
                    ? 'আপনার পছন্দের যেকোনো দেশের মুদ্রা কোড ও প্রতীক লিখুন। এটি সাথে সাথে পুরো অ্যাপে প্রযোজ্য হবে।'
                    : 'Enter any country currency code & symbol. It will immediately apply across the entire app.'}
                </p>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {lang === 'bn' ? 'কারেন্সি কোড *' : 'Currency Code *'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. USD, BDT, SAR"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {lang === 'bn' ? 'মুদ্রা প্রতীক *' : 'Currency Symbol *'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $, ৳, €, ﷼"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    maxLength={5}
                    required
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {lang === 'bn' ? 'কারেন্সির নাম (বাংলা)' : 'Currency Name (BN)'}
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: কুয়েতি দিনার"
                    value={customNameBn}
                    onChange={(e) => setCustomNameBn(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    {lang === 'bn' ? 'পতাকা' : 'Flag'}
                  </label>
                  <input
                    type="text"
                    placeholder="🌐"
                    value={customFlag}
                    onChange={(e) => setCustomFlag(e.target.value)}
                    maxLength={4}
                    className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 text-center focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'কারেন্সির নাম (ইংরেজি)' : 'Currency Name (EN)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kuwaiti Dinar"
                  value={customNameEn}
                  onChange={(e) => setCustomNameEn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <IconRenderer name="Check" className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'সংরক্ষণ ও প্রয়োগ করুন' : 'Save & Select'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-1.5">
              {filteredCurrencies.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  {lang === 'bn' ? 'কোনো কারেন্সি পাওয়া যায়নি।' : 'No currency found.'}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustom(true);
                      setCustomCode(searchQuery.toUpperCase());
                    }}
                    className="block mx-auto mt-2 text-emerald-700 font-bold hover:underline"
                  >
                    + {searchQuery} কারেন্সি হিসেবে যোগ করুন
                  </button>
                </div>
              ) : (
                filteredCurrencies.map((item) => {
                  const isSelected =
                    item.code === selectedCurrencyCode ||
                    (item.symbol === selectedCurrencySymbol && !selectedCurrencyCode);

                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        onSelectCurrency(item);
                        triggerConfetti();
                        onClose();
                      }}
                      className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 text-slate-900 shadow-2xs'
                          : 'bg-white border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 font-bold ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : 'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {item.flag || item.symbol}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-slate-900">{item.code}</span>
                            <span className="text-xs font-extrabold text-emerald-700">
                              ({item.symbol})
                            </span>
                            {item.isCustom && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                                কাস্টম
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            {lang === 'bn' ? item.nameBn : item.nameEn}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                          <IconRenderer name="Check" className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
