import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Language, AppStateData } from '../../types';
import { t } from '../../lib/i18n/formatter';
import { generateSeedPhrase, hashSeedPhrase, encryptAppData } from '../../lib/crypto';
import { IconRenderer } from '../common/IconRenderer';
import { triggerConfetti } from '../common/Graphics';

interface SeedPhraseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSeedEnabled: (hash: string) => void;
  appState: AppStateData;
  lang: Language;
}

export const SeedPhraseModal: React.FC<SeedPhraseModalProps> = ({
  isOpen,
  onClose,
  onConfirmSeedEnabled,
  appState,
  lang,
}) => {
  const [step, setStep] = useState<'generate' | 'verify' | 'success'>('generate');
  const [seedWords, setSeedWords] = useState<string[]>(() => generateSeedPhrase());
  const [copied, setCopied] = useState(false);
  const [verifyIndex, setVerifyIndex] = useState<number>(() => Math.floor(Math.random() * 12));
  const [selectedWord, setSelectedWord] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(seedWords.join(' '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerate = () => {
    const fresh = generateSeedPhrase();
    setSeedWords(fresh);
    setVerifyIndex(Math.floor(Math.random() * 12));
    setSelectedWord('');
    setError(null);
  };

  const handleProceedToVerify = () => {
    setVerifyIndex(Math.floor(Math.random() * 12));
    setStep('verify');
  };

  const handleVerify = async () => {
    const correctWord = seedWords[verifyIndex];
    if (selectedWord.trim().toLowerCase() !== correctWord.toLowerCase()) {
      setError(
        lang === 'bn'
          ? `${verifyIndex + 1} নম্বর শব্দটি সঠিক নয়। অনুগ্রহ করে আবার মিলিয়ে নিন।`
          : `Word #${verifyIndex + 1} is incorrect. Please check your written words.`
      );
      return;
    }

    const fullPhrase = seedWords.join(' ');
    const phraseHash = await hashSeedPhrase(fullPhrase);
    onConfirmSeedEnabled(phraseHash);
    setStep('success');
    triggerConfetti();
  };

  const handleDownloadEncryptedBackup = async () => {
    const fullPhrase = seedWords.join(' ');
    const encrypted = await encryptAppData(appState, fullPhrase);
    const blob = new Blob([JSON.stringify(encrypted, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `amar-hishab-backup-${new Date().toISOString().slice(0, 10)}.encrypted.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const verificationOptions = React.useMemo(() => {
    const correct = seedWords[verifyIndex];
    const pool = seedWords.filter((w) => w !== correct);
    const shuffled = [correct, ...pool.slice(0, 3)].sort(() => Math.random() - 0.5);
    return shuffled;
  }, [verifyIndex, seedWords]);

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
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <IconRenderer name="Key" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t(lang, 'seedPhraseTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">AES-256 Client-Side Zero Knowledge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Warning Banner */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-500/15 border border-amber-300 dark:border-amber-500/30 rounded-2xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
            <IconRenderer name="Shield" className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-800 dark:text-amber-300">
                {lang === 'bn'
                  ? '“আপনার Seed Phrase অত্যন্ত গুরুত্বপূর্ণ। এটি কারও সঙ্গে শেয়ার করবেন না।”'
                  : '“Your seed phrase is extremely important. Never share it with anyone.”'}
              </p>
              <p className="text-amber-800/80 dark:text-amber-200/80 text-[11px] leading-relaxed">
                {lang === 'bn'
                  ? 'এই ১২টি শব্দ একটি নিরাপদ ডায়েরি বা জায়গায় লিখে রাখুন। এটি দিয়ে আপনি যেকোনো ডিভাইসে আপনার হিসাব সম্পূর্ণ এনক্রিপ্ট অবস্থায় ফিরে পাবেন।'
                  : 'Write down these 12 secret words safely offline. They derive the AES-256 encryption keys to restore your encrypted financial backups.'}
              </p>
            </div>
          </div>

          {step === 'generate' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {lang === 'bn' ? '১২-শব্দের গোপন রিকভারি ফ্রেজ:' : '12-Word Secret Recovery Phrase:'}
                </span>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <IconRenderer name="RefreshCw" className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'নতুন ফ্রেজ' : 'Generate New'}</span>
                </button>
              </div>

              {/* 12-Word Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono">
                {seedWords.map((word, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs"
                  >
                    <span className="text-slate-400 text-[10px] w-4">{idx + 1}.</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold">{word}</span>
                  </div>
                ))}
              </div>

              {/* Copy Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <IconRenderer name={copied ? 'Check' : 'Copy'} className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{copied ? t(lang, 'seedPhraseCopySuccess') : (lang === 'bn' ? 'শব্দগুলো কপি করুন' : 'Copy 12 Words')}</span>
              </button>

              <button
                type="button"
                onClick={handleProceedToVerify}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 dark:shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{lang === 'bn' ? 'আমি লিখে রেখেছি (যাচাই করুন)' : 'I Have Written Them Down (Verify)'}</span>
                <IconRenderer name="ChevronRight" className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {lang === 'bn' ? 'শব্দ যাচাই পরীক্ষা' : 'Seed Phrase Verification'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {lang === 'bn'
                    ? `আপনার তালিকার ${verifyIndex + 1} নম্বর শব্দটি কোনটি?`
                    : `Which word was #${verifyIndex + 1} in your 12-word list?`}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                {verificationOptions.map((optWord) => (
                  <button
                    key={optWord}
                    type="button"
                    onClick={() => {
                      setSelectedWord(optWord);
                      setError(null);
                    }}
                    className={`py-3 px-4 rounded-xl border text-sm font-mono font-bold transition-all cursor-pointer ${
                      selectedWord === optWord
                        ? 'bg-emerald-50 dark:bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {optWord}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('generate')}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t(lang, 'btnBack')}
                </button>
                <button
                  type="button"
                  disabled={!selectedWord}
                  onClick={handleVerify}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 dark:shadow-emerald-950 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <IconRenderer name="Check" className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'যাচাই সম্পন্ন করুন' : 'Confirm Word'}</span>
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                <IconRenderer name="ShieldCheck" className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {lang === 'bn' ? 'Seed Phrase ব্যাকআপ সফলভাবে সক্রিয়!' : 'Seed Phrase Backup Active!'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {lang === 'bn'
                    ? 'এখন আপনি যেকোনো সময় সম্পূর্ণ এনক্রিপ্ট করা ফাইল ডাউনলোড ও রিস্টোর করতে পারবেন।'
                    : 'Your client-side cryptographic key is ready. You can download AES-256 encrypted backups at any time.'}
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleDownloadEncryptedBackup}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 dark:shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <IconRenderer name="Download" className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'এনক্রিপ্টেড ব্যাকআপ ফাইল ডাউনলোড' : 'Download Encrypted Backup File'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
