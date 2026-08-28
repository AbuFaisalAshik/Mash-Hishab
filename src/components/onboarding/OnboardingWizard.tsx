import React, { useState } from 'react';
import { Language } from '../../types';
import { t, parseBengaliNumerals, toBengaliNumerals } from '../../lib/i18n/formatter';
import { IconRenderer } from '../common/IconRenderer';
import confetti from 'canvas-confetti';

interface OnboardingWizardProps {
  onComplete: (data: { name: string; startingBalance: number; preferredLanguage: Language; enableSeedBackup: boolean }) => void;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [lang, setLang] = useState<Language>('bn');
  const [name, setName] = useState('আবু ফয়সাল');
  const [startingBalanceStr, setStartingBalanceStr] = useState('15000');
  const [enableSeedBackup, setEnableSeedBackup] = useState(false);

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 4) {
        try {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#047857', '#059669', '#10B981'],
          });
        } catch (e) {
          // ignore
        }
      }
    } else {
      const cleanNum = parseFloat(parseBengaliNumerals(startingBalanceStr.replace(/,/g, ''))) || 15000;
      onComplete({
        name: name.trim() || (lang === 'bn' ? 'আবু ফয়সাল' : 'Student'),
        startingBalance: Math.round(cleanNum),
        preferredLanguage: lang,
        enableSeedBackup,
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-100/90 text-slate-900 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        {/* Top Language Toggle + Step Progress */}
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === currentStep
                    ? 'w-6 bg-emerald-700'
                    : s < currentStep
                    ? 'w-2 bg-emerald-300'
                    : 'w-2 bg-slate-200'
                }`}
              />
            ))}
          </div>

          {/* Quick Language Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                lang === 'bn' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                lang === 'en' ? 'bg-white text-emerald-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Step 1: Welcome & Brand */}
        {currentStep === 1 && (
          <div className="space-y-5 text-center py-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto shadow-xs">
              <IconRenderer name="Wallet" className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {t(lang, 'onboardingStep1Title')}
              </h1>
              <p className="text-sm font-semibold text-emerald-700">
                “{t(lang, 'onboardingStep1Tagline')}”
              </p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed pt-1">
                {t(lang, 'onboardingStep1Desc')}
              </p>
            </div>
          </div>
        )}

        {/* Step 2: Name */}
        {currentStep === 2 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                {t(lang, 'onboardingStep2Title')}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {t(lang, 'onboardingStep2Question')}
              </h2>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 focus-within:border-emerald-500 focus-within:bg-white transition-all">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t(lang, 'onboardingStep2Placeholder')}
                autoFocus
                className="w-full bg-transparent text-lg font-semibold text-slate-900 placeholder-slate-400 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Step 3: Initial Monthly Allowance */}
        {currentStep === 3 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                {t(lang, 'onboardingStep3Title')}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {t(lang, 'onboardingStep3Question')}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t(lang, 'onboardingStep3Helper')}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 focus-within:border-emerald-500 focus-within:bg-white transition-all">
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-emerald-700">৳</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={startingBalanceStr}
                  onChange={(e) => setStartingBalanceStr(e.target.value)}
                  placeholder={t(lang, 'onboardingStep3Placeholder')}
                  autoFocus
                  className="w-full bg-transparent text-3xl font-bold text-slate-900 placeholder-slate-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Quick preset buttons */}
            <div className="flex items-center gap-2 pt-1">
              {['10000', '15000', '20000', '25000'].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setStartingBalanceStr(amt)}
                  className="flex-1 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 cursor-pointer shadow-2xs"
                >
                  ৳ {lang === 'bn' ? toBengaliNumerals(amt) : amt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Backup Choice */}
        {currentStep === 4 && (
          <div className="space-y-4 py-2 animate-in fade-in duration-200">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                {t(lang, 'onboardingStep4Title')}
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                {t(lang, 'onboardingStep4Question')}
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                {t(lang, 'onboardingStep4Desc')}
              </p>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => setEnableSeedBackup(false)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  !enableSeedBackup
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full mt-0.5 border flex items-center justify-center ${
                    !enableSeedBackup ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {!enableSeedBackup && <IconRenderer name="Check" className="w-3.5 h-3.5" />}
                </div>
                <div className="text-xs">
                  <span className="font-bold block text-slate-900">{t(lang, 'onboardingStep4OptionLocal')}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                    {lang === 'bn' ? '১০০% ব্যক্তিগত, কোনো লগইন বা পাসওয়ার্ডের প্রয়োজন নেই।' : '100% private, no password or account needed.'}
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setEnableSeedBackup(true)}
                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3 cursor-pointer ${
                  enableSeedBackup
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full mt-0.5 border flex items-center justify-center ${
                    enableSeedBackup ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                  }`}
                >
                  {enableSeedBackup && <IconRenderer name="Check" className="w-3.5 h-3.5" />}
                </div>
                <div className="text-xs">
                  <span className="font-bold block text-slate-900">{t(lang, 'onboardingStep4OptionSeed')}</span>
                  <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                    {lang === 'bn' ? '১২টি সিক্রেট শব্দ দিয়ে যেকোনো ডিভাইসে ডেটা পুনরুদ্ধার করুন।' : 'Restore data anywhere with 12 secret words.'}
                  </span>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Ready! */}
        {currentStep === 5 && (
          <div className="space-y-5 text-center py-4 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto shadow-2xs">
              <IconRenderer name="Check" className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-2xl font-bold text-slate-900">
                {t(lang, 'onboardingStep5Title')}
              </h2>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed font-medium">
                {t(lang, 'onboardingStep5Desc')}
              </p>
            </div>
          </div>
        )}

        {/* Footer Navigation Buttons */}
        <div className="pt-2 flex items-center gap-3">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              {t(lang, 'btnBack')}
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            className="flex-1 py-2.5 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{currentStep === 5 ? t(lang, 'btnGetStarted') : t(lang, 'btnNext')}</span>
            <IconRenderer name={currentStep === 5 ? 'Check' : 'ChevronRight'} className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
