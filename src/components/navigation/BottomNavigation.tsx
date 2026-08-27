import React from 'react';
import { motion } from 'motion/react';
import { Language } from '../../types';
import { t } from '../../lib/i18n/formatter';
import { IconRenderer } from '../common/IconRenderer';

export type NavTab = 'home' | 'expenses' | 'reports' | 'history' | 'settings';

interface BottomNavigationProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onOpenQuickAdd: () => void;
  lang: Language;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  currentTab,
  onTabChange,
  onOpenQuickAdd,
  lang,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-4 pt-1 pointer-events-none flex justify-center">
      <div className="w-full max-w-md bg-[#101B1E]/95 dark:bg-[#101B1E]/95 border border-emerald-500/20 backdrop-blur-2xl rounded-full shadow-[0_12px_40px_-8px_rgba(0,0,0,0.7),0_0_20px_rgba(16,185,129,0.1)] px-3 py-2.5 flex items-center justify-between pointer-events-auto transition-all">
        
        {/* Left Tab 1: Home */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'home'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            <IconRenderer name="Home" className="w-4 h-4 fill-current" />
          </div>
          <span
            className={`text-[10px] mt-1 tracking-tight transition-colors ${
              currentTab === 'home'
                ? 'font-bold text-emerald-400'
                : 'font-medium text-slate-400 group-hover:text-slate-300'
            }`}
          >
            {t(lang, 'navHome')}
          </span>
        </button>

        {/* Left Tab 2: Expenses / Transactions */}
        <button
          type="button"
          onClick={() => onTabChange('expenses')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'expenses'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            <IconRenderer name="CreditCard" className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] mt-1 tracking-tight transition-colors ${
              currentTab === 'expenses'
                ? 'font-bold text-emerald-400'
                : 'font-medium text-slate-400 group-hover:text-slate-300'
            }`}
          >
            {t(lang, 'navExpenses')}
          </span>
        </button>

        {/* Center: Glowing Lime Horizontal Capsule Add '+' Button (Reference Layout) */}
        <div className="px-2 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.06, filter: 'brightness(1.05)' }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={onOpenQuickAdd}
            className="w-18 sm:w-20 h-11 rounded-full bg-gradient-to-r from-[#D2FA35] via-[#C0F32E] to-[#99E335] text-slate-950 flex items-center justify-center shadow-[0_4px_20px_rgba(210,250,53,0.55)] border border-lime-300/80 cursor-pointer active:shadow-inner"
            title={t(lang, 'btnAddExpense')}
          >
            <IconRenderer name="Plus" className="w-6 h-6 stroke-[3] text-slate-950" />
          </motion.button>
        </div>

        {/* Right Tab 1: Reports */}
        <button
          type="button"
          onClick={() => onTabChange('reports')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'reports'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            <IconRenderer name="PieChart" className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] mt-1 tracking-tight transition-colors ${
              currentTab === 'reports'
                ? 'font-bold text-emerald-400'
                : 'font-medium text-slate-400 group-hover:text-slate-300'
            }`}
          >
            {t(lang, 'navReports')}
          </span>
        </button>

        {/* Right Tab 2: Profile & Settings */}
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'settings'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/30'
                : 'text-slate-400 group-hover:text-slate-200'
            }`}
          >
            <IconRenderer name="User" className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] mt-1 tracking-tight transition-colors ${
              currentTab === 'settings'
                ? 'font-bold text-emerald-400'
                : 'font-medium text-slate-400 group-hover:text-slate-300'
            }`}
          >
            {t(lang, 'navProfile')}
          </span>
        </button>

      </div>
    </div>
  );
};
