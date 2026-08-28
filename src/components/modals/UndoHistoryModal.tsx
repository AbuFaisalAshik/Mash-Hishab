import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UndoHistoryItem, Language } from '../../types';
import { IconRenderer } from '../common/IconRenderer';
import { formatTimeAgo } from '../../lib/i18n/formatter';

interface UndoHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  undoStack: UndoHistoryItem[];
  redoStack: UndoHistoryItem[];
  lang: Language;
  onUndoLatest: () => void;
  onRedoLatest: () => void;
  onUndoToStep: (index: number) => void;
  onClearHistory: () => void;
}

export const UndoHistoryModal: React.FC<UndoHistoryModalProps> = ({
  isOpen,
  onClose,
  undoStack,
  redoStack,
  lang,
  onUndoLatest,
  onRedoLatest,
  onUndoToStep,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
                <IconRenderer name="RotateCcw" className="w-5 h-5 stroke-[2.4]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>{lang === 'bn' ? 'অ্যাকাউন্টের পরিবর্তন ও আনডু' : 'Account Activity & Undo Moves'}</span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {lang === 'bn'
                    ? `${undoStack.length} টি পরিবর্তন জমা আছে`
                    : `${undoStack.length} undoable actions recorded`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <IconRenderer name="X" className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Undo & Redo Top Controls */}
          <div className="p-3 bg-emerald-950 text-white flex items-center justify-between gap-2 border-b border-emerald-900">
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                disabled={undoStack.length === 0}
                onClick={onUndoLatest}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  undoStack.length > 0
                    ? 'bg-gradient-to-r from-lime-400 to-emerald-400 text-emerald-950 cursor-pointer shadow-xs'
                    : 'bg-emerald-900/50 text-emerald-600 cursor-not-allowed'
                }`}
              >
                <IconRenderer name="Undo2" className="w-4 h-4 stroke-[2.4]" />
                <span>{lang === 'bn' ? 'শেষ পরিবর্তন আনডু' : 'Undo Latest'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                type="button"
                disabled={redoStack.length === 0}
                onClick={onRedoLatest}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  redoStack.length > 0
                    ? 'bg-emerald-800 text-white hover:bg-emerald-700 cursor-pointer border border-emerald-600'
                    : 'bg-emerald-900/30 text-emerald-700 cursor-not-allowed'
                }`}
              >
                <IconRenderer name="Redo2" className="w-4 h-4 stroke-[2.4]" />
                <span>{lang === 'bn' ? 'রিডু (Redo)' : 'Redo'}</span>
              </motion.button>
            </div>

            {undoStack.length > 0 && (
              <button
                type="button"
                onClick={onClearHistory}
                className="text-[11px] text-emerald-300/80 hover:text-rose-300 transition-colors cursor-pointer px-2 py-1"
              >
                {lang === 'bn' ? 'হিস্ট্রি মুছুন' : 'Clear'}
              </button>
            )}
          </div>

          {/* Moves / Changes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 divide-y divide-slate-100">
            {undoStack.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <IconRenderer name="RotateCcw" className="w-6 h-6" />
                </div>
                <p className="text-sm font-bold text-slate-800">
                  {lang === 'bn' ? 'কোনো পরিবর্তন বাকি নেই' : 'No recorded moves'}
                </p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  {lang === 'bn'
                    ? 'আপনি নতুন কোনো খরচ যোগ, মুছলে বা আপডেট করলে তা এখানে দেখাবে এবং যেকোনো সময় আনডু করা যাবে।'
                    : 'Whenever you add, delete, or edit expenses, actions appear here and can be undone instantly.'}
                </p>
              </div>
            ) : (
              undoStack.map((item, index) => {
                const isLatest = index === 0;
                const desc = lang === 'bn' ? item.descriptionBn : item.descriptionEn;

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 ${
                      isLatest ? 'bg-emerald-50/50 p-2.5 rounded-2xl border border-emerald-200/80' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          isLatest
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        #{undoStack.length - index}
                      </div>

                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {desc}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400">
                          {item.details && <span className="text-emerald-700 font-semibold">{item.details}</span>}
                          <span>•</span>
                          <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => onUndoToStep(index)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                        isLatest
                          ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <IconRenderer name="RotateCcw" className="w-3.5 h-3.5" />
                      <span>{isLatest ? (lang === 'bn' ? 'আনডু' : 'Undo') : (lang === 'bn' ? 'এখানে ফিরুন' : 'Revert to this')}</span>
                    </motion.button>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 font-medium">
            💡 {lang === 'bn' ? 'কীবোর্ড শর্টকাট: Ctrl + Z চেপেও সরাসরি যেকোনো মুভ আনডু করতে পারেন' : 'Tip: You can also press Ctrl + Z / Cmd + Z anytime to undo'}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
