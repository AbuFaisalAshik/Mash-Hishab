import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UndoHistoryItem, Language } from '../../types';
import { IconRenderer } from './IconRenderer';

interface UndoToastProps {
  item: UndoHistoryItem | null;
  lang: Language;
  onUndo: (item: UndoHistoryItem) => void;
  onDismiss: () => void;
  durationMs?: number;
}

export const UndoToast: React.FC<UndoToastProps> = ({
  item,
  lang,
  onUndo,
  onDismiss,
  durationMs = 6000,
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!item) {
      setProgress(100);
      return;
    }

    setProgress(100);
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
        onDismiss();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [item, durationMs, onDismiss]);

  if (!item) return null;

  const description = lang === 'bn' ? item.descriptionBn : item.descriptionEn;

  return (
    <AnimatePresence>
      <div className="fixed bottom-22 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 15, scale: 0.94 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="pointer-events-auto max-w-md w-full bg-[#032b21] text-white rounded-2xl shadow-[0_16px_36px_-6px_rgba(3,43,33,0.6)] border border-emerald-500/30 overflow-hidden"
        >
          {/* Progress countdown bar */}
          <div className="h-1 bg-emerald-950/80 w-full">
            <motion.div
              className="h-full bg-gradient-to-r from-lime-400 to-emerald-400"
              style={{ width: `${progress}%` }}
              transition={{ ease: 'linear' }}
            />
          </div>

          <div className="p-3.5 flex items-center justify-between gap-3">
            {/* Left: Icon and Action Details */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-800/80 border border-emerald-600/40 text-emerald-300 flex items-center justify-center shrink-0">
                <IconRenderer name="RotateCcw" className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate">
                  {description}
                </p>
                {item.details && (
                  <p className="text-[10px] text-emerald-300/80 truncate">
                    {item.details}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Interactive Undo button & Close */}
            <div className="flex items-center gap-1.5 shrink-0">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="button"
                onClick={() => onUndo(item)}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 text-emerald-950 font-extrabold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer hover:opacity-95"
              >
                <IconRenderer name="Undo2" className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{lang === 'bn' ? 'আনডু (Undo)' : 'Undo Move'}</span>
              </motion.button>

              <button
                type="button"
                onClick={onDismiss}
                className="p-1 rounded-lg text-emerald-400/80 hover:text-white hover:bg-emerald-800/50 transition-colors cursor-pointer"
                title="Dismiss"
              >
                <IconRenderer name="X" className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
