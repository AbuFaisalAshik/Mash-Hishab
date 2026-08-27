import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
      setFormError(lang === 'bn' ? 'কারেন্সি কোড দিন (যেমন: USD, BDT, EUR)' : 'Enter currency code (e.g. USD, BDT, EUR)');
      return;
    }

    if (!symbol) {
      setFormError(lang === 'bn' ? 'কারেন্সি প্রতীক দিন (যেমন: $, ৳, €, £)' : 'Enter currency symbol (e.g. $, ৳, €, £)');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-slate-900 border border-emerald-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
              {selectedCurrencySymbol || '৳'}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {lang === 'bn' ? 'কারেন্সি ও মুদ্রা নির্বাচন' : 'Select Currency'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {lang === 'bn' ? 'যেকোনো দেশের কারেন্সি ব্যবহার বা যুক্ত করুন' : 'Choose or add any world currency'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar & Custom Add Toggle */}
        <div className="p-4 border-b border-slate-800/80 space-y-2.5 bg-slate-900/50">
          <div className="relative">
            <IconRenderer
              name="Search"
              className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              type="text"
              placeholder={lang === 'bn' ? 'দেশ, কোড বা প্রতীক খুঁজুন...' : 'Search currency, code or symbol...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500/60 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Add Custom Button Toggle */}
          <button
            type="button"
            onClick={() => setIsAddingCustom(!isAddingCustom)}
            className="w-full py-2 px-3 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <IconRenderer name={isAddingCustom ? 'ChevronUp' : 'Plus'} className="w-3.5 h-3.5" />
            <span>
              {isAddingCustom
                ? (lang === 'bn' ? 'তালিকা দেখুন' : 'View List')
                : (lang === 'bn' ? '+ যেকোনো দেশের কারেন্সি নিজে যুক্ত করুন' : '+ Add Custom Currency')}
            </span>
          </button>
        </div>

        {/* Modal Content: Custom Currency Form OR Currency Grid List */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 max-h-[50vh]">
          {isAddingCustom ? (
            <form onSubmit={handleSaveCustom} className="space-y-3">
              <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl">
                <p className="text-[11px] text-emerald-300 font-medium">
                  {lang === 'bn'
                    ? 'আপনার পছন্দের যেকোনো দেশের মুদ্রা কোড ও প্রতীক লিখুন। এটি সাথে সাথে অ্যাপ জুড়ে সক্রিয় হবে।'
                    : 'Enter any country currency code & symbol. It will immediately apply across the app.'}
                </p>
              </div>

              {formError && (
                <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {lang === 'bn' ? 'কারেন্সি কোড *' : 'Currency Code *'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. USD, BDT, SAR"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono uppercase focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {lang === 'bn' ? 'মুদ্রা প্রতীক *' : 'Currency Symbol *'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. $, ৳, €, ﷼"
                    value={customSymbol}
                    onChange={(e) => setCustomSymbol(e.target.value)}
                    maxLength={5}
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {lang === 'bn' ? 'কারেন্সির নাম (বাংলা)' : 'Currency Name (BN)'}
                  </label>
                  <input
                    type="text"
                    placeholder="যেমন: কুয়েতি দিনার"
                    value={customNameBn}
                    onChange={(e) => setCustomNameBn(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    {lang === 'bn' ? 'পতাকা/ইমোজি' : 'Flag Emoji'}
                  </label>
                  <input
                    type="text"
                    placeholder="🌐"
                    value={customFlag}
                    onChange={(e) => setCustomFlag(e.target.value)}
                    maxLength={4}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white text-center focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  {lang === 'bn' ? 'কারেন্সির নাম (ইংরেজি)' : 'Currency Name (EN)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kuwaiti Dinar"
                  value={customNameEn}
                  onChange={(e) => setCustomNameEn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingCustom(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <IconRenderer name="Check" className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'যুক্ত ও সক্রিয় করুন' : 'Save & Select'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-1.5">
              {filteredCurrencies.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  {lang === 'bn' ? 'কোনো কারেন্সি পাওয়া যায়নি।' : 'No currency found.'}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCustom(true);
                      setCustomCode(searchQuery.toUpperCase());
                    }}
                    className="block mx-auto mt-2 text-emerald-400 font-bold hover:underline"
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
                    <motion.button
                      key={item.code}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        onSelectCurrency(item);
                        triggerConfetti();
                        onClose();
                      }}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-950/60 border-emerald-400/50 text-white shadow-xs'
                          : 'bg-slate-950/50 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Minimal Round Flag/Symbol Badge */}
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 font-bold ${
                            isSelected
                              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                              : 'bg-slate-800 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {item.flag || item.symbol}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white tracking-tight">
                              {item.code}
                            </span>
                            <span className="text-xs font-black text-emerald-400">
                              ({item.symbol})
                            </span>
                            {item.isCustom && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                                কাস্টম
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {lang === 'bn' ? item.nameBn : item.nameEn}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                          <IconRenderer name="Check" className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </motion.button>
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
