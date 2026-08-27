import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language, ThemeMode, UserProfile, AppStateData } from '../../types';
import { authApi, AuthResponse } from '../../lib/api';
import { IconRenderer } from '../common/IconRenderer';
import { triggerConfetti } from '../common/Graphics';

interface AuthScreenProps {
  lang: Language;
  onLanguageToggle: () => void;
  onAuthSuccess: (data: AuthResponse) => void;
  initialMode?: 'login' | 'register';
}

type AuthMode = 'login' | 'register' | 'forgot' | 'seed_recovery';

export const AuthScreen: React.FC<AuthScreenProps> = ({
  lang,
  onLanguageToggle,
  onAuthSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [monthlyBudget, setMonthlyBudget] = useState('15000');
  const [institutionOrJob, setInstitutionOrJob] = useState('');
  const [createSeedPhrase, setCreateSeedPhrase] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Newly generated seed phrase modal view (post-registration)
  const [newSeedPhrase, setNewSeedPhrase] = useState<string[] | null>(null);
  const [hasCopiedSeed, setHasCopiedSeed] = useState(false);
  const [pendingAuthResponse, setPendingAuthResponse] = useState<AuthResponse | null>(null);

  // Forgot Password state
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  // Seed Recovery state
  const [seedStep, setSeedStep] = useState<1 | 2 | 3>(1);
  const [seedWords, setSeedWords] = useState<string[]>(Array(12).fill(''));
  const [seedRawInput, setSeedRawInput] = useState('');
  const [isInputtingRaw, setIsInputtingRaw] = useState(false);
  const [seedEmailCode, setSeedEmailCode] = useState('');
  const [seedEmailHint, setSeedEmailHint] = useState('');
  const [emergencyOverride, setEmergencyOverride] = useState(false);

  const clearErrors = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setDemoCodeHint(null);
  };

  const handleSwitchMode = (newM: AuthMode) => {
    clearErrors();
    setMode(newM);
    setForgotStep(1);
    setSeedStep(1);
  };

  // 1. LOGIN HANDLER
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setIsLoading(true);

    try {
      const res = await authApi.login(email, password);
      triggerConfetti();
      onAuthSuccess(res);
    } catch (err: any) {
      setErrorMessage(err.message || (lang === 'bn' ? 'লগইন ব্যর্থ হয়েছে।' : 'Login failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 2. REGISTER HANDLER
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (password !== confirmPassword) {
      setErrorMessage(
        lang === 'bn'
          ? 'পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মেলেনি!'
          : 'Passwords do not match!'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        lang === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।'
          : 'Password must be at least 6 characters.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const budgetNum = parseFloat(monthlyBudget.replace(/,/g, '')) || 15000;
      const res = await authApi.register({
        email,
        password,
        nameBn: nameBn.trim() || undefined,
        nameEn: nameEn.trim() || undefined,
        name: (nameBn.trim() || nameEn.trim() || email.split('@')[0]),
        monthlyBudget: Math.round(budgetNum),
        institutionOrJob: institutionOrJob.trim() || undefined,
        preferredLanguage: lang,
        themeMode: 'dark',
        createSeedPhrase,
      });

      if (res.generatedSeedPhrase && res.generatedSeedPhrase.length === 12) {
        setNewSeedPhrase(res.generatedSeedPhrase);
        setPendingAuthResponse(res);
      } else {
        triggerConfetti();
        onAuthSuccess(res);
      }
    } catch (err: any) {
      setErrorMessage(err.message || (lang === 'bn' ? 'অ্যাকাউন্ট তৈরিতে সমস্যা হয়েছে।' : 'Registration failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 3. FORGOT PASSWORD STEP 1: REQUEST CODE
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    setIsLoading(true);

    try {
      const res = await authApi.forgotPassword(email);
      setSuccessMessage(
        lang === 'bn'
          ? 'আপনার ইমেইলে ৬-সংখ্যার পাসওয়ার্ড রিসেট কোড পাঠানো হয়েছে।'
          : 'A 6-digit password reset code has been sent to your email.'
      );
      if (res.debugCode) {
        setDemoCodeHint(res.debugCode);
      }
      setForgotStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || 'Request failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // 4. FORGOT PASSWORD STEP 2: RESET PASSWORD
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (newPassword.length < 6) {
      setErrorMessage(
        lang === 'bn' ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.'
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.resetPassword({
        email,
        code: resetCode.trim(),
        newPassword,
      });
      triggerConfetti();
      onAuthSuccess(res);
    } catch (err: any) {
      setErrorMessage(err.message || (lang === 'bn' ? 'কোড বা পাসওয়ার্ড সঠিক নয়।' : 'Invalid code or password.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 5. SEED RECOVERY STEP 1: VERIFY 12 WORDS
  const handleVerifySeed = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    const phraseStr = isInputtingRaw ? seedRawInput.trim() : seedWords.filter(Boolean).join(' ');
    const count = phraseStr.split(/\s+/).filter(Boolean).length;

    if (count !== 12) {
      setErrorMessage(
        lang === 'bn'
          ? `১২টি শব্দ লিখুন (বর্তমানে ${count}টি দেওয়া হয়েছে)`
          : `Please enter all 12 words (currently ${count} entered)`
      );
      return;
    }

    setIsLoading(true);

    try {
      const res = await authApi.verifySeedPhrase({
        email,
        seedPhrase: phraseStr,
      });

      setSeedEmailHint(res.emailHint);
      if (res.debugCode) {
        setDemoCodeHint(res.debugCode);
      }
      setSuccessMessage(
        lang === 'bn'
          ? 'সিড ফ্রেজ সঠিকভাবে যাচাই করা হয়েছে। অতিরিক্ত সুরক্ষার জন্য নিবন্ধিত ইমেইলে কোড পাঠানো হয়েছে।'
          : 'Seed phrase verified. For security, a verification code was sent to your registered email.'
      );
      setSeedStep(2);
    } catch (err: any) {
      setErrorMessage(err.message || (lang === 'bn' ? 'সিড ফ্রেজ সঠিক নয় বা অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।' : 'Invalid seed phrase.'));
    } finally {
      setIsLoading(false);
    }
  };

  // 6. SEED RECOVERY STEP 2: COMPLETE RECOVERY & SET NEW PASSWORD
  const handleCompleteSeedRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (newPassword.length < 6) {
      setErrorMessage(
        lang === 'bn' ? 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'New password must be at least 6 characters.'
      );
      return;
    }

    const phraseStr = isInputtingRaw ? seedRawInput.trim() : seedWords.filter(Boolean).join(' ');

    setIsLoading(true);

    try {
      const res = await authApi.completeSeedRecovery({
        email,
        seedPhrase: phraseStr,
        emailCode: emergencyOverride ? undefined : seedEmailCode.trim(),
        newPassword,
        emergencyOverride,
      });

      triggerConfetti();
      onAuthSuccess(res);
    } catch (err: any) {
      setErrorMessage(err.message || (lang === 'bn' ? 'রিকভারি সম্পন্ন করা সম্ভব হয়নি।' : 'Recovery failed.'));
    } finally {
      setIsLoading(false);
    }
  };

  // Helper for seed word cell input
  const handleWordChange = (index: number, val: string) => {
    // If user pasted a full phrase into one cell
    if (val.includes(' ')) {
      const split = val.trim().split(/\s+/);
      if (split.length >= 12) {
        setSeedWords(split.slice(0, 12));
        return;
      }
    }
    const updated = [...seedWords];
    updated[index] = val.trim().toLowerCase();
    setSeedWords(updated);
  };

  return (
    <div className="min-h-screen bg-[#070B0D] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[300px] bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-lime-400 p-[1.5px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-[#091013] rounded-2xl flex items-center justify-center">
              <span className="text-emerald-400 font-extrabold text-lg">ম</span>
            </div>
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>মাস খরচ</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 font-mono font-semibold border border-emerald-800/60">
                PRO
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium">Mash Khoroch • Smart Expense Vault</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onLanguageToggle}
          className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-bold text-slate-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <IconRenderer name="Globe" className="w-3.5 h-3.5 text-emerald-400" />
          <span>{lang === 'bn' ? 'English' : 'বাংলা'}</span>
        </button>
      </header>

      {/* Main Authentication Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-[#0D1519]/90 border border-emerald-900/40 rounded-3xl p-6 sm:p-7 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Status Messages */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-rose-200 text-xs font-medium flex items-start gap-2.5 shadow-md"
              >
                <IconRenderer name="AlertCircle" className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMessage}</span>
              </motion.div>
            )}

            {successMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs font-medium flex items-start gap-2.5 shadow-md"
              >
                <IconRenderer name="CheckCircle" className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="leading-relaxed block">{successMessage}</span>
                  {demoCodeHint && (
                    <div className="pt-1 text-[11px] font-mono text-lime-300 font-bold">
                      {lang === 'bn' ? '🔑 ভেরিফিকেশন কোড: ' : '🔑 Verification Code: '}
                      <span className="bg-black/60 px-2 py-0.5 rounded border border-lime-500/40">{demoCodeHint}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================================= */}
          {/* VIEW A: PRIMARY LOGIN (Gmail + Password) */}
          {/* ========================================================================= */}
          {mode === 'login' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {lang === 'bn' ? 'একাউন্টে প্রবেশ করুন' : 'Sign in to Account'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'আপনার Gmail ও পাসওয়ার্ড দিয়ে নিরাপদে লগইন করুন'
                    : 'Log in securely with your Gmail and password'}
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Gmail Field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>{lang === 'bn' ? 'Gmail / ইমেইল ঠিকানা' : 'Gmail / Email Address'}</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Primary ID</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <IconRenderer name="Mail" className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-2xl pl-10 pr-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                    </label>
                    <button
                      type="button"
                      onClick={() => handleSwitchMode('forgot')}
                      className="text-[11px] font-medium text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
                    >
                      {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <IconRenderer name="Lock" className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      <IconRenderer name={showPassword ? 'EyeOff' : 'Eye'} className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <IconRenderer name="LogIn" className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
                    </>
                  )}
                </button>
              </form>

              {/* Seed Recovery Link */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('seed_recovery')}
                  className="w-full py-2.5 px-3 rounded-2xl bg-[#091013] hover:bg-slate-900 border border-amber-900/40 hover:border-amber-700/60 text-amber-300 text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <IconRenderer name="Key" className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'bn' ? '১২-শব্দের সিকিউরিটি ফ্রেজ দিয়ে রিকভারি' : 'Recover with 12-Word Seed Phrase'}</span>
                </button>

                {/* Create Account Switch */}
                <div className="text-center text-xs text-slate-400">
                  <span>{lang === 'bn' ? 'নতুন অ্যাকাউন্ট নেই? ' : "Don't have an account? "}</span>
                  <button
                    type="button"
                    onClick={() => handleSwitchMode('register')}
                    className="text-emerald-400 font-bold hover:underline cursor-pointer"
                  >
                    {lang === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW B: CREATE ACCOUNT (Register) */}
          {/* ========================================================================= */}
          {mode === 'register' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {lang === 'bn' ? 'নতুন একাউন্ট খুলুন' : 'Create an Account'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {lang === 'bn'
                    ? 'আপনার সম্পূর্ণ ব্যক্তিগত খরচ ও বাজেট পরিচালনার ভল্ট'
                    : 'Your personal and isolated expense management vault'}
                </p>
              </div>

              <form onSubmit={handleRegister} className="space-y-3.5">
                {/* Names */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      {lang === 'bn' ? 'নাম (বাংলায়)' : 'Name (Bangla)'}
                    </label>
                    <input
                      type="text"
                      placeholder="আবু ফয়সাল"
                      value={nameBn}
                      onChange={(e) => setNameBn(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      {lang === 'bn' ? 'নাম (English)' : 'Name (English)'}
                    </label>
                    <input
                      type="text"
                      placeholder="Abu Faisal"
                      value={nameEn}
                      onChange={(e) => setNameEn(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Gmail Address */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-300">
                    {lang === 'bn' ? 'Gmail / ইমেইল' : 'Gmail / Email'} <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                  />
                </div>

                {/* Password & Confirm */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'} <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="কমপক্ষে ৬ অক্ষর"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500"
                      >
                        <IconRenderer name={showPassword ? 'EyeOff' : 'Eye'} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      {lang === 'bn' ? 'নিশ্চিত করুন' : 'Confirm'} <span className="text-emerald-400">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        placeholder="একই পাসওয়ার্ড দিন"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-xl pl-3 pr-8 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-500"
                      >
                        <IconRenderer name={showConfirmPassword ? 'EyeOff' : 'Eye'} className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Additional Info: Monthly Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      {lang === 'bn' ? 'মাসিক বাজেট (৳)' : 'Monthly Budget (৳)'}
                    </label>
                    <input
                      type="number"
                      placeholder="15000"
                      value={monthlyBudget}
                      onChange={(e) => setMonthlyBudget(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-300">
                      {lang === 'bn' ? 'প্রতিষ্ঠান বা পদবি' : 'Institution / Job'}
                    </label>
                    <input
                      type="text"
                      placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয়"
                      value={institutionOrJob}
                      onChange={(e) => setInstitutionOrJob(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 12-Word Seed Phrase Checkbox */}
                <label className="p-3 rounded-2xl bg-[#091013] border border-emerald-900/50 flex items-start gap-2.5 cursor-pointer hover:border-emerald-700/60 transition-colors">
                  <input
                    type="checkbox"
                    checked={createSeedPhrase}
                    onChange={(e) => setCreateSeedPhrase(e.target.checked)}
                    className="mt-0.5 accent-emerald-500 w-4 h-4 rounded"
                  />
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <IconRenderer name="ShieldCheck" className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{lang === 'bn' ? '১২-শব্দের ব্যাকআপ রিকভারি ফ্রেজ তৈরি করুন' : 'Create 12-Word Recovery Phrase'}</span>
                    </span>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {lang === 'bn'
                        ? 'পাসওয়ার্ড ভুলে গেলে অ্যাকাউন্ট পুনরুদ্ধারের জন্য এটি ক্রিপ্টোগ্রাফিকভাবে সুরক্ষিত ব্যাকআপ হিসেবে কাজ করবে।'
                        : 'Cryptographic master backup phrase to recover your account if password is lost.'}
                    </p>
                  </div>
                </label>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <IconRenderer name="UserPlus" className="w-4 h-4" />
                      <span>{lang === 'bn' ? 'অ্যাকাউন্ট তৈরি সম্পন্ন করুন' : 'Complete Registration'}</span>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center text-xs text-slate-400 pt-1">
                <span>{lang === 'bn' ? 'ইতোমধ্যে অ্যাকাউন্ট আছে? ' : 'Already have an account? '}</span>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  {lang === 'bn' ? 'লগইন করুন' : 'Sign In'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW C: FORGOT PASSWORD FLOW */}
          {/* ========================================================================= */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight">
                    {lang === 'bn' ? 'পাসওয়ার্ড রিসেট করুন' : 'Forgot Password'}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {forgotStep === 1
                      ? lang === 'bn'
                        ? 'আপনার নিবন্ধিত Gmail ঠিকানাটি লিখুন'
                        : 'Enter your registered Gmail address'
                      : lang === 'bn'
                      ? '৬-সংখ্যার কোড ও নতুন পাসওয়ার্ড দিন'
                      : 'Enter 6-digit code and new password'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
                >
                  <IconRenderer name="X" className="w-4 h-4" />
                </button>
              </div>

              {forgotStep === 1 ? (
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      {lang === 'bn' ? 'Gmail / ইমেইল' : 'Gmail / Email'}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-2xl px-3.5 py-3 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <IconRenderer name="Send" className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'রিসেট কোড পাঠান' : 'Send Reset Code'}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {lang === 'bn' ? '৬-সংখ্যার ভেরিফিকেশন কোড' : '6-Digit Verification Code'}
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="123456"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-2xl px-3.5 py-2.5 text-center text-sm font-mono tracking-widest text-emerald-400 font-bold placeholder-slate-700 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {lang === 'bn' ? 'নতুন পাসওয়ার্ড' : 'New Password'}
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-emerald-500 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <IconRenderer name="Key" className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'পাসওয়ার্ড পরিবর্তন ও লগইন' : 'Reset Password & Sign In'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setForgotStep(1)}
                    className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-1"
                  >
                    {lang === 'bn' ? 'পুনরায় কোড পাঠান' : 'Resend Code'}
                  </button>
                </form>
              )}

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {lang === 'bn' ? '← লগইন স্ক্রিনে ফিরে যান' : '← Back to Sign In'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* VIEW D: SEED PHRASE RECOVERY (With Stolen Seed Phrase Protection) */}
          {/* ========================================================================= */}
          {mode === 'seed_recovery' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-amber-400 tracking-tight flex items-center gap-1.5">
                    <IconRenderer name="ShieldAlert" className="w-5 h-5 text-amber-400" />
                    <span>{lang === 'bn' ? '১২-শব্দের সিকিউরিটি রিকভারি' : 'Seed Phrase Recovery'}</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {seedStep === 1
                      ? lang === 'bn'
                        ? 'অ্যাকাউন্টের Gmail ও ১২টি গোপন শব্দ প্রদান করুন'
                        : 'Enter your Gmail and 12 secret recovery words'
                      : lang === 'bn'
                      ? 'দ্বি-স্তর নিরাপত্তা যাচাই ও নতুন পাসওয়ার্ড তৈরি'
                      : '2-Step Verification & New Password'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white cursor-pointer"
                >
                  <IconRenderer name="X" className="w-4 h-4" />
                </button>
              </div>

              {/* Seed Recovery Step 1 */}
              {seedStep === 1 ? (
                <form onSubmit={handleVerifySeed} className="space-y-3.5">
                  {/* Account Gmail */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {lang === 'bn' ? 'নিবন্ধিত Gmail / ইমেইল' : 'Registered Gmail / Email'}
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="yourname@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none font-mono"
                    />
                  </div>

                  {/* Seed Input Switch */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{lang === 'bn' ? '১২টি সিকিউরিটি শব্দ:' : '12 Recovery Words:'}</span>
                    <button
                      type="button"
                      onClick={() => setIsInputtingRaw(!isInputtingRaw)}
                      className="text-amber-400 hover:underline cursor-pointer"
                    >
                      {isInputtingRaw
                        ? lang === 'bn'
                          ? 'গ্রিড মোডে দেখুন'
                          : 'Switch to Grid View'
                        : lang === 'bn'
                        ? 'একবারে পেস্ট করুন'
                        : 'Paste All at Once'}
                    </button>
                  </div>

                  {isInputtingRaw ? (
                    <textarea
                      rows={3}
                      placeholder="word1 word2 word3 word4 word5 word6 word7 word8 word9 word10 word11 word12"
                      value={seedRawInput}
                      onChange={(e) => setSeedRawInput(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-amber-200 font-mono focus:outline-none resize-none"
                    />
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto pr-1">
                      {seedWords.map((w, idx) => (
                        <div key={idx} className="relative">
                          <span className="absolute left-2 top-2 text-[9px] font-mono text-slate-500 select-none">
                            {idx + 1}.
                          </span>
                          <input
                            type="text"
                            value={w}
                            onChange={(e) => handleWordChange(idx, e.target.value)}
                            className="w-full bg-[#080D0F] border border-slate-800 focus:border-amber-500 rounded-lg pl-6 pr-1.5 py-1.5 text-[11px] text-amber-200 font-mono focus:outline-none"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stolen Seed Phrase Security Disclaimer Banner */}
                  <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/50 text-[11px] text-amber-300 leading-relaxed space-y-1">
                    <p className="font-bold flex items-center gap-1">
                      <IconRenderer name="ShieldAlert" className="w-3.5 h-3.5 text-amber-400" />
                      <span>{lang === 'bn' ? 'সিড ফ্রেজ চুরি রোধে অতিরিক্ত সুরক্ষা:' : 'Protection Against Stolen Phrases:'}</span>
                    </p>
                    <p className="text-amber-200/80">
                      {lang === 'bn'
                        ? 'শুধুমাত্র সিড ফ্রেজ থাকলেই তৎক্ষণাৎ অ্যাকাউন্ট দখল করা সম্ভব নয়। রিকভারির সময় নিবন্ধিত ইমেইলে সিকিউরিটি এলার্ট ও অনুমোদন কোড পাঠানো হবে।'
                        : 'Possession of the seed phrase alone does not permit instant unrestricted access. A security confirmation code is dispatched to the registered email.'}
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <IconRenderer name="ShieldCheck" className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'সিড ফ্রেজ যাচাই করুন' : 'Verify Seed Phrase'}</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* Seed Recovery Step 2: 2-Step Email Verification + New Password */
                <form onSubmit={handleCompleteSeedRecovery} className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                    <span className="text-[10px] text-slate-500 block font-semibold">নিবন্ধিত ইমেইল ঠিকানা</span>
                    <p className="font-mono text-emerald-400 font-bold">{seedEmailHint || email}</p>
                  </div>

                  {!emergencyOverride ? (
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>{lang === 'bn' ? 'ইমেইল সিকিউরিটি অনুমোদন কোড' : 'Email Security Code'}</span>
                        <span className="text-[10px] text-amber-400 font-mono">2-Step Security</span>
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={6}
                        placeholder="123456"
                        value={seedEmailCode}
                        onChange={(e) => setSeedEmailCode(e.target.value)}
                        className="w-full bg-[#080D0F] border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-center text-sm font-mono tracking-widest text-amber-300 font-bold placeholder-slate-700 focus:outline-none"
                      />
                    </div>
                  ) : (
                    <div className="p-3 rounded-2xl bg-rose-950/60 border border-rose-800 text-[11px] text-rose-200 leading-relaxed">
                      ⚠️ <strong>{lang === 'bn' ? 'জরুরি মাস্টার রিকভারি মোড সক্রিয়:' : 'Emergency Master Mode Active:'}</strong>{' '}
                      {lang === 'bn'
                        ? 'আপনার ইমেইল অ্যাক্সেস না থাকলে সিড ফ্রেজ দিয়ে সরাসরি রিকভারি হবে। সফল রিকভারির সাথে সাথে অন্যান্য সকল ডিভাইসের সেশন স্থায়ীভাবে বাতিল হবে।'
                        : 'Direct master recovery without email. All active sessions across all devices will be forcefully invalidated immediately.'}
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300">
                      {lang === 'bn' ? 'নতুন পাসওয়ার্ড সেট করুন' : 'Set New Password'} <span className="text-amber-400">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="কমপক্ষে ৬ অক্ষর"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#080D0F] border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none"
                    />
                  </div>

                  {/* Toggle emergency override */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => setEmergencyOverride(!emergencyOverride)}
                      className="text-[10px] text-slate-500 hover:text-amber-400 transition-colors"
                    >
                      {emergencyOverride
                        ? lang === 'bn'
                          ? 'ইমেইল কোড দিয়ে যাচাই করতে চান?'
                          : 'Use Email Verification Code instead'
                        : lang === 'bn'
                        ? 'ইমেইল অনুপলব্ধ? জরুরি মাস্টার রিকভারি'
                        : 'Email inaccessible? Master Recovery Override'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md"
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <IconRenderer name="CheckCircle" className="w-4 h-4" />
                        <span>{lang === 'bn' ? 'অ্যাকাউন্ট পুনরুদ্ধার ও নতুন পাসওয়ার্ড সক্রিয়' : 'Complete Recovery & Sign In'}</span>
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => handleSwitchMode('login')}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  {lang === 'bn' ? '← লগইন স্ক্রিনে ফিরে যান' : '← Back to Sign In'}
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ========================================================================= */}
      {/* MODAL: POST-REGISTRATION 12-WORD SEED DISPLAY (SHOW ONCE & ENCOURAGE BACKUP) */}
      {/* ========================================================================= */}
      {newSeedPhrase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0D1519] border border-amber-500/50 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto">
              <IconRenderer name="Key" className="w-6 h-6" />
            </div>

            <div className="space-y-1.5 text-left">
              <h3 className="text-base font-bold text-white text-center">
                {lang === 'bn' ? 'আপনার ১২-শব্দের ব্যাকআপ সিকিউরিটি ফ্রেজ' : 'Your 12-Word Recovery Phrase'}
              </h3>
              <p className="text-xs text-amber-300/80 leading-relaxed text-center">
                {lang === 'bn'
                  ? 'এটি শুধুমাত্র একবারই দেখানো হচ্ছে। এই ১২টি শব্দ একটি নিরাপদ ডায়েরি বা স্থানে ক্রমানুসারে লিখে রাখুন।'
                  : 'This phrase is shown only once. Write down these 12 words in order in a safe and secure place.'}
              </p>
            </div>

            {/* 12-Word Grid */}
            <div className="grid grid-cols-3 gap-2 bg-[#080D0F] p-3.5 rounded-2xl border border-slate-800">
              {newSeedPhrase.map((w, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-left flex items-center gap-1.5"
                >
                  <span className="text-[10px] font-mono text-slate-500 select-none w-4">{idx + 1}.</span>
                  <span className="text-xs font-mono font-bold text-amber-300 truncate">{w}</span>
                </div>
              ))}
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(newSeedPhrase.join(' '));
                setHasCopiedSeed(true);
                setTimeout(() => setHasCopiedSeed(false), 3000);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <IconRenderer name={hasCopiedSeed ? 'Check' : 'Copy'} className="w-3.5 h-3.5 text-emerald-400" />
              <span>{hasCopiedSeed ? (lang === 'bn' ? 'কপি করা হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'শব্দগুলো কপি করুন' : 'Copy All Words')}</span>
            </button>

            {/* Confirmation & Continue */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (pendingAuthResponse) {
                    triggerConfetti();
                    onAuthSuccess(pendingAuthResponse);
                  }
                  setNewSeedPhrase(null);
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 cursor-pointer"
              >
                {lang === 'bn' ? 'আমি শব্দগুলো সংরক্ষণ করেছি — প্রবেশ করুন' : 'I Have Saved the Phrase — Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-[11px] text-slate-500">
        <p>মাস খরচ © 2026 • সম্পূর্ণ ডেটা আইসোলেশন ও ক্রিপ্টোগ্রাফিক সুরক্ষা</p>
      </footer>
    </div>
  );
};
