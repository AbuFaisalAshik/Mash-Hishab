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
              <IconRenderer name="Upload" className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">{t(lang, 'importDataTitle')}</h2>
              <p className="text-xs text-slate-500 font-medium">{t(lang, 'importDataDesc')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <IconRenderer name="X" className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-start gap-2">
              <IconRenderer name="AlertTriangle" className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* File Upload Box */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              {lang === 'bn' ? '১. ব্যাকআপ ফাইল আপলোড করুন (.json)' : '1. Upload Backup File (.json)'}
            </label>
            <label className="flex flex-col items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all text-center group">
              <div className="w-10 h-10 rounded-full bg-slate-200 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center transition-colors">
                <IconRenderer name="FileText" className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {fileName ? fileName : lang === 'bn' ? 'ফাইল সিলেক্ট করতে ক্লিক করুন' : 'Click to choose file'}
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5 block font-medium">
                  {fileName ? (lang === 'bn' ? 'ফাইল রেডি' : 'Ready to restore') : '.json format only'}
                </span>
              </div>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Seed Phrase Input (if required) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {lang === 'bn' ? '২. আপনার ১২-শব্দের Seed Phrase লিখুন (এনক্রিপ্ট ব্যাকআপের জন্য)' : '2. 12-Word Seed Phrase (For encrypted backups)'}
            </label>
            <textarea
              rows={2}
              value={seedPhrase}
              onChange={(e) => setSeedPhrase(e.target.value)}
              placeholder="word1 word2 word3 ... word12"
              className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl p-3 text-xs font-mono text-slate-900 focus:outline-none resize-none"
            />
          </div>

          {/* Buttons */}
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
              disabled={!fileContent || isLoading}
              onClick={handleRestore}
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 disabled:opacity-40 hover:bg-emerald-600 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              {isLoading ? (
                <span>{lang === 'bn' ? 'যাচাই হচ্ছে...' : 'Decrypting...'}</span>
              ) : (
                <>
                  <IconRenderer name="Upload" className="w-4 h-4" />
                  <span>{t(lang, 'btnRestoreBackup')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
