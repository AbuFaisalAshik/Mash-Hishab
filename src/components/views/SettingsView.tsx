import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserProfile,
  Language,
  MonthlyAccount,
  AppStateData,
} from '../../types';
import { t, formatMoney, formatMonthYear, formatRelativeTime } from '../../lib/i18n/formatter';
import { IconRenderer } from '../common/IconRenderer';
import { VaultSecurityGraphic, triggerConfetti } from '../common/Graphics';

interface SettingsViewProps {
  user: UserProfile;
  activeAccount: MonthlyAccount;
  appState: AppStateData;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onUpdateUser: (user: UserProfile) => void;
  onUpdateStartingBalance: (newStartingBalance: number) => void;
  onOpenSeedPhraseModal: () => void;
  onOpenRestoreModal: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onDeleteAllData: () => void;
  onLogout?: () => void;
  onRegenerateSeedPhrase?: (password: string) => Promise<string[]>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  activeAccount,
  appState,
  lang,
  onLanguageChange,
  onUpdateUser,
  onUpdateStartingBalance,
  onOpenSeedPhraseModal,
  onOpenRestoreModal,
  onExportJson,
  onExportCsv,
  onDeleteAllData,
  onLogout,
  onRegenerateSeedPhrase,
}) => {
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    nameBn: user.nameBn || user.name || '',
    nameEn: user.nameEn || '',
    bioBn: user.bioBn || '',
    bioEn: user.bioEn || '',
    phone: user.phone || '',
    email: user.email || '',
    monthlyBudget: user.monthlyBudget ? String(user.monthlyBudget) : '',
    institutionOrJob: user.institutionOrJob || '',
  });

  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [startingBalanceInput, setStartingBalanceInput] = useState(String(activeAccount.startingBalance));
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showRegenerateSeedModal, setShowRegenerateSeedModal] = useState(false);
  const [currentPasswordForSeed, setCurrentPasswordForSeed] = useState('');
  const [regeneratedWords, setRegeneratedWords] = useState<string[] | null>(null);
  const [seedRegenError, setSeedRegenError] = useState<string | null>(null);
  const [isRegeneratingSeed, setIsRegeneratingSeed] = useState(false);
  const [hasCopiedNewSeed, setHasCopiedNewSeed] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState('');
  const [googleSyncLoading, setGoogleSyncLoading] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  const handleRegenerateSeed = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onRegenerateSeedPhrase) return;
    setSeedRegenError(null);
    setIsRegeneratingSeed(true);

    try {
      const words = await onRegenerateSeedPhrase(currentPasswordForSeed);
      setRegeneratedWords(words);
      triggerConfetti();
    } catch (err: any) {
      setSeedRegenError(err.message || (lang === 'bn' ? 'পাসওয়ার্ড সঠিক নয়।' : 'Incorrect password.'));
    } finally {
      setIsRegeneratingSeed(false);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const budgetNum = parseFloat(profileForm.monthlyBudget.replace(/,/g, ''));
    const resolvedName = lang === 'bn' 
      ? (profileForm.nameBn.trim() || profileForm.nameEn.trim() || user.name)
      : (profileForm.nameEn.trim() || profileForm.nameBn.trim() || user.name);

    const updated: UserProfile = {
      ...user,
      name: resolvedName,
      nameBn: profileForm.nameBn.trim(),
      nameEn: profileForm.nameEn.trim(),
      bioBn: profileForm.bioBn.trim(),
      bioEn: profileForm.bioEn.trim(),
      phone: profileForm.phone.trim(),
      email: profileForm.email.trim(),
      monthlyBudget: isNaN(budgetNum) ? undefined : Math.round(budgetNum),
      institutionOrJob: profileForm.institutionOrJob.trim(),
    };

    onUpdateUser(updated);
    setIsEditingProfile(false);
    setSaveSuccessNotice(true);
    triggerConfetti();
    setTimeout(() => setSaveSuccessNotice(false), 3000);
  };

  const handleSaveBalance = () => {
    const amt = parseFloat(startingBalanceInput.replace(/,/g, ''));
    if (!isNaN(amt) && amt >= 0) {
      onUpdateStartingBalance(Math.round(amt));
    }
    setIsEditingBalance(false);
  };

  const handleToggleGoogleSync = () => {
    setGoogleSyncLoading(true);
    setTimeout(() => {
      if (user.googleConnected) {
        onUpdateUser({
          ...user,
          googleConnected: false,
          googleUserEmail: undefined,
        });
      } else {
        onUpdateUser({
          ...user,
          googleConnected: true,
          googleUserEmail: user.email || 'user@mashkhoroch.app',
          lastBackupTime: Date.now(),
        });
        triggerConfetti();
      }
      setGoogleSyncLoading(false);
    }, 600);
  };

  const handleBackupNow = () => {
    onUpdateUser({
      ...user,
      lastBackupTime: Date.now(),
    });
    triggerConfetti();
  };

  const displayName = lang === 'bn' 
    ? (user.nameBn || user.name) 
    : (user.nameEn || user.name);

  const displayBio = lang === 'bn' 
    ? (user.bioBn || user.bioEn) 
    : (user.bioEn || user.bioBn);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 pb-28"
    >
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>{lang === 'bn' ? 'প্রোফাইল ও সেটিংস' : 'Profile & Settings'}</span>
        </h1>
        <p className="text-xs text-slate-500 font-medium">
          {lang === 'bn' ? 'ব্যক্তিগত তথ্য, ভাষা ও ব্যাকআপ নিয়ন্ত্রণ' : 'Manage your profile, language and backups'}
        </p>
      </div>

      {saveSuccessNotice && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs text-emerald-800 font-bold"
        >
          <IconRenderer name="CheckCircle" className="w-4 h-4 text-emerald-600" />
          <span>{lang === 'bn' ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে!' : 'Profile updated successfully!'}</span>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 1. BILINGUAL PROFILE SECTION */}
      {/* ========================================================================= */}
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconRenderer name="User" className="w-4 h-4 text-emerald-700" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t(lang, 'profileSectionTitle')}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setIsEditingProfile(!isEditingProfile)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition-all cursor-pointer"
          >
            <IconRenderer name={isEditingProfile ? 'ChevronUp' : 'Edit3'} className="w-3.5 h-3.5" />
            <span>{isEditingProfile ? (lang === 'bn' ? 'বন্ধ করুন' : 'Close') : t(lang, 'btnEditProfile')}</span>
          </button>
        </div>

        {/* Profile Card View */}
        {!isEditingProfile ? (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-md shadow-emerald-800/20 shrink-0">
                {displayName ? displayName.slice(0, 1) : 'ম'}
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {displayName}
                  </h3>
                  {user.nameEn && user.nameBn && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
                      {lang === 'bn' ? user.nameEn : user.nameBn}
                    </span>
                  )}
                </div>

                {user.institutionOrJob && (
                  <p className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5">
                    <IconRenderer name="Building" className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{user.institutionOrJob}</span>
                  </p>
                )}

                {displayBio && (
                  <p className="text-xs text-slate-600 leading-relaxed pt-0.5">
                    {displayBio}
                  </p>
                )}
              </div>
            </div>

            {/* Profile Meta Grid (Phone, Email, Monthly Budget) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold block">{t(lang, 'profilePhone')}</span>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user.phone || '—'}
                </p>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 space-y-0.5">
                <span className="text-[10px] text-slate-500 font-semibold block">{t(lang, 'profileEmail')}</span>
                <p className="text-xs font-bold text-slate-800 truncate">
                  {user.email || '—'}
                </p>
              </div>

              <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-200/60 space-y-0.5">
                <span className="text-[10px] text-emerald-700 font-semibold block">{t(lang, 'profileMonthlyBudget')}</span>
                <p className="text-xs font-extrabold text-emerald-800 truncate">
                  {user.monthlyBudget ? formatMoney(user.monthlyBudget, lang) : '—'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Profile Edit Form */
          <form onSubmit={handleSaveProfile} className="space-y-3.5 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Name in Bangla */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t(lang, 'profileNameBn')} <span className="text-emerald-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আবু ফয়সাল"
                  value={profileForm.nameBn}
                  onChange={(e) => setProfileForm({ ...profileForm, nameBn: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              {/* Name in English */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t(lang, 'profileNameEn')}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Abu Faisal"
                  value={profileForm.nameEn}
                  onChange={(e) => setProfileForm({ ...profileForm, nameEn: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t(lang, 'profilePhone')}
                </label>
                <input
                  type="tel"
                  placeholder="017XXXXXXXX"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t(lang, 'profileEmail')}
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Monthly Budget / Income */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t(lang, 'profileMonthlyBudget')} (৳)
                </label>
                <input
                  type="number"
                  placeholder="যেমন: 15000"
                  value={profileForm.monthlyBudget}
                  onChange={(e) => setProfileForm({ ...profileForm, monthlyBudget: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>

              {/* Institution or Job */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  {t(lang, 'profileInstitution')}
                </label>
                <input
                  type="text"
                  placeholder="যেমন: ঢাকা বিশ্ববিদ্যালয় / সফটওয়্যার ইঞ্জিনিয়ার"
                  value={profileForm.institutionOrJob}
                  onChange={(e) => setProfileForm({ ...profileForm, institutionOrJob: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                />
              </div>
            </div>

            {/* Bio in Bangla */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {t(lang, 'profileBioBn')}
              </label>
              <textarea
                rows={2}
                placeholder="নিজের সম্পর্কে বা খরচের লক্ষ্য সম্পর্কে কিছু লিখুন..."
                value={profileForm.bioBn}
                onChange={(e) => setProfileForm({ ...profileForm, bioBn: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none resize-none"
              />
            </div>

            {/* Bio in English */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                {t(lang, 'profileBioEn')}
              </label>
              <textarea
                rows={2}
                placeholder="Brief personal bio or financial notes in English..."
                value={profileForm.bioEn}
                onChange={(e) => setProfileForm({ ...profileForm, bioEn: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none resize-none"
              />
            </div>

            {/* Save Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {t(lang, 'btnCancel')}
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-900/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <IconRenderer name="Check" className="w-4 h-4" />
                <span>{t(lang, 'btnSaveProfile')}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. LANGUAGE SELECTION (বাংলা DEFAULT / ENGLISH) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <IconRenderer name="Layers" className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t(lang, 'sectionLanguage')}
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onLanguageChange('bn')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              lang === 'bn'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div>
              <span className="text-sm font-bold block">বাংলা</span>
              <span className="text-[11px] text-emerald-700 mt-0.5 block font-medium">ডিফল্ট ও প্রস্তাবিত</span>
            </div>
            {lang === 'bn' && <IconRenderer name="Check" className="w-4 h-4 text-emerald-700" />}
          </button>

          <button
            type="button"
            onClick={() => onLanguageChange('en')}
            className={`p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
              lang === 'en'
                ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-xs'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div>
              <span className="text-sm font-bold block">English</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">Secondary Language</span>
            </div>
            {lang === 'en' && <IconRenderer name="Check" className="w-4 h-4 text-emerald-700" />}
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MONTHLY BUDGET & STARTING MONEY */}
      {/* ========================================================================= */}
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconRenderer name="Calendar" className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              {t(lang, 'sectionMonthConfig')}
            </h2>
          </div>
          <span className="text-xs font-bold text-emerald-700">
            {formatMonthYear(activeAccount.id, lang)}
          </span>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 block font-medium">{t(lang, 'startingMoney')}</span>
            {isEditingBalance ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={startingBalanceInput}
                  onChange={(e) => setStartingBalanceInput(e.target.value)}
                  className="bg-white border border-emerald-500 rounded-lg px-2 py-0.5 text-sm text-slate-900 w-28"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveBalance}
                  className="p-1 text-emerald-700 cursor-pointer"
                >
                  <IconRenderer name="Check" className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-base font-bold text-slate-900 mt-0.5">
                {formatMoney(activeAccount.startingBalance, lang)}
              </p>
            )}
          </div>

          {!isEditingBalance && (
            <button
              type="button"
              onClick={() => setIsEditingBalance(true)}
              className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer shadow-xs"
            >
              {lang === 'bn' ? 'পরিবর্তন' : 'Edit'}
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ACCOUNT & BACKUP (GOOGLE + 12-WORD SEED PHRASE) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 space-y-4 shadow-xs">
        <div className="flex items-center gap-2">
          <IconRenderer name="ShieldCheck" className="w-4 h-4 text-emerald-700" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t(lang, 'sectionBackupSync')}
          </h2>
        </div>

        {/* Google Account Backup Card */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900">{t(lang, 'googleAccountTitle')}</h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                {user.googleConnected
                  ? t(lang, 'googleConnectedAs', { email: user.googleUserEmail || user.email || '' })
                  : t(lang, 'googleNotConnected')}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleGoogleSync}
              disabled={googleSyncLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                user.googleConnected
                  ? 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
                  : 'bg-emerald-100 border border-emerald-300 text-emerald-800 hover:bg-emerald-200'
              }`}
            >
              {googleSyncLoading
                ? '...'
                : user.googleConnected
                ? t(lang, 'btnDisconnectGoogle')
                : t(lang, 'btnConnectGoogle')}
            </button>
          </div>

          {user.googleConnected && (
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">
                {user.lastBackupTime
                  ? t(lang, 'lastBackupTimeLabel', {
                      time: formatRelativeTime(user.lastBackupTime, lang),
                    })
                  : t(lang, 'neverBackedUp')}
              </span>
              <button
                type="button"
                onClick={handleBackupNow}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 cursor-pointer shadow-xs"
              >
                {t(lang, 'btnBackupNow')}
              </button>
            </div>
          )}
        </div>

        {/* 12-Word Seed Phrase Card */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
          <div className="flex items-center gap-3">
            <VaultSecurityGraphic />
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <IconRenderer name="Key" className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'bn' ? '১২-শব্দের রিকভারি ফ্রেজ' : '12-Word Recovery Phrase'}</span>
                </h3>
                {user.seedBackupEnabled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                    {lang === 'bn' ? 'সুরক্ষিত ও সক্রিয়' : 'Active'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {lang === 'bn'
                  ? 'পাসওয়ার্ড ভুলে গেলে অ্যাকাউন্ট পুনরুদ্ধারের জন্য এটি ব্যবহার করা হয়। ফ্রেজ চুরি বা হারানোর আশঙ্কা থাকলে এখান থেকে নতুন ফ্রেজ তৈরি করুন।'
                  : 'Used to recover your account if password is lost. If compromised, regenerate a new phrase immediately.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setShowRegenerateSeedModal(true);
                setCurrentPasswordForSeed('');
                setRegeneratedWords(null);
                setSeedRegenError(null);
              }}
              className="flex-1 py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <IconRenderer name="RefreshCw" className="w-3.5 h-3.5 text-amber-600" />
              <span>{lang === 'bn' ? 'রিকভারি ফ্রেজ পরিবর্তন / পুনর্জন্ম' : 'Regenerate Recovery Phrase'}</span>
            </button>

            <button
              type="button"
              onClick={onOpenSeedPhraseModal}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <IconRenderer name="Eye" className="w-3.5 h-3.5 text-slate-500" />
              <span>{lang === 'bn' ? 'অফলাইন ব্যাকআপ ফাইল' : 'Offline Backup'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. DATA EXPORT & IMPORT */}
      {/* ========================================================================= */}
      <div className="bg-white border border-emerald-900/10 rounded-3xl p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <IconRenderer name="Download" className="w-4 h-4 text-teal-700" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
            {t(lang, 'sectionDataManagement')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={onExportJson}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-3 transition-colors cursor-pointer shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center text-teal-700 shrink-0">
              <IconRenderer name="Download" className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">{t(lang, 'btnExportJson')}</span>
              <span className="text-[10px] text-slate-500 block font-medium">JSON Backup</span>
            </div>
          </button>

          <button
            type="button"
            onClick={onExportCsv}
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-left flex items-center gap-3 transition-colors cursor-pointer shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
              <IconRenderer name="FileText" className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block">{t(lang, 'btnExportCsv')}</span>
              <span className="text-[10px] text-slate-500 block font-medium">Excel CSV Report</span>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenRestoreModal}
          className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
        >
          <IconRenderer name="Upload" className="w-4 h-4 text-emerald-700" />
          <span>{t(lang, 'btnRestoreWithSeedPhrase')}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 6. LOGOUT & ACCOUNT SESSION */}
      {/* ========================================================================= */}
      {onLogout && (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                <IconRenderer name="LogOut" className="w-4 h-4 text-slate-600" />
                <span>{lang === 'bn' ? 'সেশন ও লগআউট' : 'Session & Logout'}</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn'
                  ? `বর্তমান লগইন: ${user.email || 'user@example.com'}`
                  : `Signed in as ${user.email || 'user@example.com'}`}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLogoutConfirmModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <IconRenderer name="LogOut" className="w-3.5 h-3.5 text-slate-600" />
              <span>{lang === 'bn' ? 'লগআউট' : 'Logout'}</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. PRIVACY & SECURITY */}
      {/* ========================================================================= */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 space-y-2">
        <h3 className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
          <IconRenderer name="Shield" className="w-4 h-4 text-emerald-700" />
          <span>{t(lang, 'privacyTitle')}</span>
        </h3>
        <p className="text-xs text-slate-700 leading-relaxed">{t(lang, 'privacyP1')}</p>
        <p className="text-xs text-slate-600 leading-relaxed">{t(lang, 'privacyP2')}</p>
      </div>

      {/* ========================================================================= */}
      {/* 8. DANGER ZONE (DELETE ALL DATA) */}
      {/* ========================================================================= */}
      <div className="bg-rose-50/80 border border-rose-200 rounded-3xl p-5 space-y-3">
        <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
          <IconRenderer name="AlertTriangle" className="w-4 h-4" />
          <span>{t(lang, 'dangerZoneTitle')}</span>
        </h3>

        <button
          type="button"
          onClick={() => setShowDeleteConfirmModal(true)}
          className="w-full py-3 px-4 rounded-2xl bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
        >
          <IconRenderer name="Trash2" className="w-4 h-4" />
          <span>{t(lang, 'btnDeleteAllData')}</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 mx-auto">
              <IconRenderer name="LogOut" className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {lang === 'bn' ? 'আপনি কি লগআউট করতে চান?' : 'Do you want to log out?'}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                {lang === 'bn'
                  ? 'লগআউট করলে আপনার সক্রিয় সেশন শেষ হবে। আপনার অ্যাকাউন্টের কোনো ডেটা মুছে যাবে না।'
                  : 'Logging out ends your active session. Your account data remains safely stored.'}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল (Cancel)' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowLogoutConfirmModal(false);
                  if (onLogout) onLogout();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {lang === 'bn' ? 'লগআউট (Logout)' : 'Logout'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Seed Phrase Modal */}
      {showRegenerateSeedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-amber-300 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700">
                  <IconRenderer name="Key" className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900">
                  {lang === 'bn' ? '১২-শব্দের রিকভারি ফ্রেজ পুনর্জন্ম' : 'Regenerate Recovery Phrase'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRegenerateSeedModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <IconRenderer name="X" className="w-4 h-4" />
              </button>
            </div>

            {!regeneratedWords ? (
              <form onSubmit={handleRegenerateSeed} className="space-y-3.5">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 leading-relaxed">
                  ⚠️ <strong>{lang === 'bn' ? 'সতর্কতা:' : 'Warning:'}</strong>{' '}
                  {lang === 'bn'
                    ? 'নতুন ফ্রেজ তৈরি করলে আপনার পূর্বের ১২-শব্দের রিকভারি ফ্রেজটি সাথে সাথে বাতিল হয়ে যাবে। নিশ্চিত করতে আপনার বর্তমান অ্যাকাউন্টের পাসওয়ার্ড দিন।'
                    : 'Regenerating will immediately invalidate your previous 12-word seed phrase. Confirm with your current account password.'}
                </div>

                {seedRegenError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                    {seedRegenError}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">
                    {lang === 'bn' ? 'বর্তমান পাসওয়ার্ড লিখুন' : 'Enter Current Password'}
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={currentPasswordForSeed}
                    onChange={(e) => setCurrentPasswordForSeed(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowRegenerateSeedModal(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isRegeneratingSeed || !currentPasswordForSeed}
                    className="flex-1 py-2.5 rounded-xl bg-amber-600 disabled:opacity-50 hover:bg-amber-500 text-white text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
                  >
                    {isRegeneratingSeed ? (
                      '...'
                    ) : (
                      <>
                        <IconRenderer name="RefreshCw" className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'নতুন ফ্রেজ তৈরি করুন' : 'Generate New'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3.5">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900">
                  ✅ {lang === 'bn' ? 'নতুন ১২-শব্দের ফ্রেজ তৈরি হয়েছে! আগেরটি বাতিল হয়েছে।' : 'New 12-word recovery phrase generated! Old phrase is revoked.'}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 gap-1.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  {regeneratedWords.map((w, idx) => (
                    <div key={idx} className="p-1.5 rounded-lg bg-white border border-slate-200 text-left flex items-center gap-1">
                      <span className="text-[9px] font-mono text-slate-400 select-none w-3.5">{idx + 1}.</span>
                      <span className="text-xs font-mono font-bold text-slate-800 truncate">{w}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(regeneratedWords.join(' '));
                    setHasCopiedNewSeed(true);
                    setTimeout(() => setHasCopiedNewSeed(false), 3000);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <IconRenderer name={hasCopiedNewSeed ? 'Check' : 'Copy'} className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{hasCopiedNewSeed ? (lang === 'bn' ? 'কপি হয়েছে!' : 'Copied!') : (lang === 'bn' ? 'শব্দগুলো কপি করুন' : 'Copy All Words')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRegenerateSeedModal(false)}
                  className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-md"
                >
                  {lang === 'bn' ? 'সংরক্ষণ সম্পন্ন' : 'Done & Close'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white border border-rose-200 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mx-auto">
              <IconRenderer name="Trash2" className="w-6 h-6" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">{t(lang, 'deleteModalTitle')}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {t(lang, 'deleteModalWarning')}
              </p>
            </div>

            <div className="text-left space-y-1">
              <label className="text-[11px] text-slate-500 block font-semibold">
                {t(lang, 'deleteModalConfirmInput')}
              </label>
              <input
                type="text"
                value={deleteConfirmationText}
                onChange={(e) => setDeleteConfirmationText(e.target.value)}
                placeholder="DELETE"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-rose-500 uppercase font-mono"
              />
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirmModal(false);
                  setDeleteConfirmationText('');
                }}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 cursor-pointer"
              >
                {t(lang, 'btnCancel')}
              </button>
              <button
                type="button"
                disabled={
                  deleteConfirmationText.trim().toUpperCase() !== 'DELETE' &&
                  deleteConfirmationText.trim() !== 'মুছে ফেলুন'
                }
                onClick={() => {
                  onDeleteAllData();
                  setShowDeleteConfirmModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 disabled:opacity-40 hover:bg-rose-500 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                {t(lang, 'btnConfirmDeleteForever')}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};
