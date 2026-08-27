import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Language, AppStateData, EncryptedBackupData } from '../../types';
import { t } from '../../lib/i18n/formatter';
import { decryptAppData } from '../../lib/crypto';
import { IconRenderer } from '../common/IconRenderer';
import { triggerConfetti } from '../common/Graphics';

interface RestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreSuccess: (restoredState: AppStateData) => void;
  lang: Language;
}

export const RestoreModal: React.FC<RestoreModalProps> = ({
  isOpen,
  onClose,
  onRestoreSuccess,
  lang,
}) => {
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [seedPhrase, setSeedPhrase] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setFileContent(event.target?.result as string);
        setError(null);
      };
      reader.readAsText(file);
    }
  };

  const handleRestore = async () => {
    setError(null);
    setIsLoading(true);

    try {
      if (!fileContent) {
        throw new Error(lang === 'bn' ? 'অনুগ্রহ করে ব্যাকআপ ফাইল নির্বাচন করুন' : 'Please select a backup file');
      }

      const parsedJson = JSON.parse(fileContent);

      // Check if it is an encrypted backup
      if (parsedJson.ciphertext && parsedJson.salt && parsedJson.iv) {
        if (!seedPhrase.trim()) {
          throw new Error(
            lang === 'bn'
              ? 'এই ফাইলটি এনক্রিপ্টেড। দয়া করে আপনার ১২-শব্দের Seed Phrase লিখুন।'
              : 'This backup is encrypted. Please provide your 12-word seed phrase.'
          );
        }

        const decryptedState = await decryptAppData(
          parsedJson as EncryptedBackupData,
          seedPhrase.trim()
        );

        if (!decryptedState.user || !decryptedState.accounts) {
          throw new Error(lang === 'bn' ? 'অকার্যকর ব্যাকআপ ফাইল' : 'Invalid decrypted structure');
        }

        triggerConfetti();
        onRestoreSuccess(decryptedState);
        onClose();
      } else if (parsedJson.user && parsedJson.accounts && parsedJson.transactions) {
        // Plain unencrypted state export
        triggerConfetti();
        onRestoreSuccess(parsedJson as AppStateData);
        onClose();
      } else {
        throw new Error(lang === 'bn' ? 'ব্যাকআপ ফাইলের ফরম্যাট সঠিক নয়।' : 'Unrecognized backup format.');
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.message ||
          (lang === 'bn'
            ? 'ডেটা পুনরুদ্ধার ব্যর্থ হয়েছে। Seed Phrase বা ফাইলটি সঠিক কিনা যাচাই করুন।'
            : 'Restore failed. Please check your seed phrase or backup file.')
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <IconRenderer name="Upload" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">{t(lang, 'importDataTitle')}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t(lang, 'importDataDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <IconRenderer name="AlertTriangle" className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
              {lang === 'bn' ? '১. ব্যাকআপ ফাইল আপলোড করুন (.json)' : '1. Upload Backup File (.json)'}
            </label>
            <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/30 cursor-pointer transition-all text-center group">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 group-hover:bg-emerald-500/20 text-slate-600 dark:text-slate-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 flex items-center justify-center transition-colors">
                <IconRenderer name="FileText" className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {fileName ? fileName : lang === 'bn' ? 'JSON ব্যাকআপ ফাইল নির্বাচন করুন' : 'Select JSON backup file'}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'bn' ? 'ক্লিক করে ফাইল ব্রাউজ করুন' : 'Click to browse files'}
                </p>
              </div>
              <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Seed phrase entry */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              {lang === 'bn' ? '২. সিক্রেট Seed Phrase (যদি এনক্রিপ্টেড হয়)' : '2. Secret Seed Phrase (If encrypted)'}
            </label>
            <textarea
              rows={3}
              value={seedPhrase}
              onChange={(e) => setSeedPhrase(e.target.value)}
              placeholder={lang === 'bn' ? 'আপনার ১২টি সিক্রেট শব্দ লিখুন (যেমন: ability absent absorb...)' : 'Enter your 12 secret words separated by spaces...'}
              className="w-full bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              {t(lang, 'btnCancel')}
            </button>
            <button
              type="button"
              disabled={!fileContent || isLoading}
              onClick={handleRestore}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-emerald-900/20 dark:shadow-emerald-950 flex items-center justify-center gap-2 cursor-pointer"
            >
              <IconRenderer name="Upload" className="w-4 h-4" />
              <span>{isLoading ? (lang === 'bn' ? 'পুনরুদ্ধার হচ্ছে...' : 'Restoring...') : (lang === 'bn' ? 'ডেটা রিস্টোর করুন' : 'Restore Backup')}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
