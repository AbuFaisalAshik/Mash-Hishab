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
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <IconRenderer name="Key" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t(lang, 'seedPhraseTitle')}</h2>
              <p className="text-xs text-slate-500 font-medium">AES-256 Client-Side Zero Knowledge</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Warning Banner */}
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-2.5">
            <IconRenderer name="Shield" className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-amber-900">
                {lang === 'bn'
                  ? '“আপনার Seed Phrase অত্যন্ত গুরুত্বপূর্ণ। এটি কারও সঙ্গে শেয়ার করবেন না।”'
                  : '“Your seed phrase is extremely important. Never share it with anyone.”'}
              </p>
              <p className="text-amber-800 text-[11px] leading-relaxed">
                {lang === 'bn'
                  ? 'এই ১২টি শব্দ একটি নিরাপদ ডায়েরি বা জায়গায় লিখে রাখুন। এটি দিয়ে আপনি যেকোনো ডিভাইসে আপনার হিসাব সম্পূর্ণ এনক্রিপ্ট অবস্থায় ফিরে পাবেন।'
                  : 'Write down these 12 secret words safely offline. They derive the AES-256 encryption keys to restore your encrypted financial backups.'}
              </p>
            </div>
          </div>

          {step === 'generate' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  {lang === 'bn' ? 'আপনার ১২-শব্দের গোপন রিকভারি ফ্রেজ:' : 'Your 12-Word Recovery Phrase:'}
                </span>
                <button
                  type="button"
                  onClick={handleRegenerate}
                  className="text-[11px] text-amber-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <IconRenderer name="RefreshCw" className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'নতুন তৈরি করুন' : 'Regenerate'}</span>
                </button>
              </div>

              {/* 12 Words Grid */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                {seedWords.map((word, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-xl bg-white border border-slate-200 flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="text-[10px] font-mono text-slate-400 select-none w-4">{idx + 1}.</span>
                    <span className="text-xs font-mono font-bold text-slate-900 truncate">{word}</span>
                  </div>
                ))}
              </div>

              {/* Copy Phrase Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-200"
              >
                <IconRenderer name={copied ? 'Check' : 'Copy'} className="w-4 h-4 text-emerald-700" />
                <span>
                  {copied
                    ? lang === 'bn'
                      ? '১২টি শব্দ ক্লিপবোর্ডে কপি হয়েছে!'
                      : 'Copied to clipboard!'
                    : lang === 'bn'
                    ? 'সব শব্দ একসাথে কপি করুন'
                    : 'Copy All 12 Words'}
                </span>
              </button>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {t(lang, 'btnCancel')}
                </button>
                <button
                  type="button"
                  onClick={handleProceedToVerify}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{lang === 'bn' ? 'লিখে নিয়েছি (যাচাই করুন)' : 'I Wrote It Down (Verify)'}</span>
                  <IconRenderer name="ArrowRight" className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-950">
                <p className="font-bold">
                  {lang === 'bn'
                    ? `যাচাইকরণ: আপনার তালিকার ${verifyIndex + 1} নম্বর শব্দটি কোনটি?`
                    : `Verification: Which word was #${verifyIndex + 1} on your list?`}
                </p>
              </div>

              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <IconRenderer name="AlertTriangle" className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5">
                {verificationOptions.map((word) => (
                  <button
                    type="button"
                    key={word}
                    onClick={() => {
                      setSelectedWord(word);
                      setError(null);
                    }}
                    className={`py-3 px-4 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer ${
                      selectedWord === word
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-2xs'
                        : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    {word}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('generate')}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  {lang === 'bn' ? 'ফিরে যান' : 'Back'}
                </button>
                <button
                  type="button"
                  disabled={!selectedWord}
                  onClick={handleVerify}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 disabled:opacity-40 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <IconRenderer name="Check" className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'যাচাই সম্পন্ন করুন' : 'Confirm & Enable'}</span>
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center py-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700 mx-auto">
                <IconRenderer name="CheckCircle" className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">
                  {lang === 'bn' ? 'Seed Phrase ব্যাকআপ সক্রিয়!' : 'Seed Phrase Backup Active!'}
                </h3>
                <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
                  {lang === 'bn'
                    ? 'আপনার আর্থিক ডেটা এখন পূর্ণ জিরো-নলেজ এনক্রিপশনের আওতায় সুরক্ষিত। এখন আপনি এনক্রিপ্টেড ব্যাকআপ ফাইল ডাউনলোড করে সংরক্ষণ করতে পারেন।'
                    : 'Your account is secured with Zero-Knowledge encryption. You can now download your encrypted file backup.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadEncryptedBackup}
                className="w-full py-3 px-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors cursor-pointer"
              >
                <IconRenderer name="Download" className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'bn' ? 'এনক্রিপ্টেড ব্যাকআপ ফাইল ডাউনলোড করুন (.json)' : 'Download Encrypted Backup File (.json)'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {lang === 'bn' ? 'সম্পন্ন করুন' : 'Done'}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
