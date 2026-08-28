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
      <div className="w-full max-w-md bg-[#032b21]/95 border border-emerald-500/20 backdrop-blur-xl rounded-full shadow-[0_12px_32px_-4px_rgba(3,43,33,0.5)] px-3 py-2 flex items-center justify-between pointer-events-auto transition-all">
        
        {/* Left Tab 1: Home */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={() => onTabChange('home')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group py-0.5"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'home'
                ? 'bg-emerald-600/40 text-lime-300 font-bold shadow-xs'
                : 'text-emerald-300/70 group-hover:text-white'
            }`}
          >
            <IconRenderer name="Home" className="w-4 h-4 fill-current" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              currentTab === 'home'
                ? 'font-bold text-lime-300'
                : 'font-medium text-emerald-300/70 group-hover:text-emerald-100'
            }`}
          >
            {t(lang, 'navHome')}
          </span>
        </motion.button>

        {/* Left Tab 2: Expenses / Transactions */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={() => onTabChange('expenses')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group py-0.5"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'expenses'
                ? 'bg-emerald-600/40 text-lime-300 font-bold shadow-xs'
                : 'text-emerald-300/70 group-hover:text-white'
            }`}
          >
            <IconRenderer name="CreditCard" className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              currentTab === 'expenses'
                ? 'font-bold text-lime-300'
                : 'font-medium text-emerald-300/70 group-hover:text-emerald-100'
            }`}
          >
            {t(lang, 'navExpenses')}
          </span>
        </motion.button>

        {/* Center: Clean Vibrant Add '+' Button */}
        <div className="px-1.5 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            type="button"
            onClick={onOpenQuickAdd}
            className="w-12 h-11 rounded-full bg-gradient-to-tr from-emerald-500 to-lime-400 hover:from-emerald-400 hover:to-lime-300 text-emerald-950 flex items-center justify-center shadow-lg shadow-emerald-900/40 border border-lime-300/50 cursor-pointer active:shadow-inner"
            title={t(lang, 'btnAddExpense')}
          >
            <IconRenderer name="Plus" className="w-5 h-5 stroke-[2.8] text-emerald-950" />
          </motion.button>
        </div>

        {/* Right Tab 1: Reports */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={() => onTabChange('reports')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group py-0.5"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'reports'
                ? 'bg-emerald-600/40 text-lime-300 font-bold shadow-xs'
                : 'text-emerald-300/70 group-hover:text-white'
            }`}
          >
            <IconRenderer name="PieChart" className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              currentTab === 'reports'
                ? 'font-bold text-lime-300'
                : 'font-medium text-emerald-300/70 group-hover:text-emerald-100'
            }`}
          >
            {t(lang, 'navReports')}
          </span>
        </motion.button>

        {/* Right Tab 2: Profile & Settings */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          type="button"
          onClick={() => onTabChange('settings')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group py-0.5"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'settings'
                ? 'bg-emerald-600/40 text-lime-300 font-bold shadow-xs'
                : 'text-emerald-300/70 group-hover:text-white'
            }`}
          >
            <IconRenderer name="User" className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              currentTab === 'settings'
                ? 'font-bold text-lime-300'
                : 'font-medium text-emerald-300/70 group-hover:text-emerald-100'
            }`}
          >
            {t(lang, 'navProfile')}
          </span>
        </motion.button>

      </div>
    </div>
  );
};
