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
      <div className="w-full max-w-md bg-white/95 border border-slate-200/90 backdrop-blur-xl rounded-full shadow-[0_10px_30px_-5px_rgba(15,23,42,0.12),0_2px_10px_rgba(0,0,0,0.04)] px-3 py-2 flex items-center justify-between pointer-events-auto transition-all">
        
        {/* Left Tab 1: Home */}
        <button
          type="button"
          onClick={() => onTabChange('home')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group py-0.5"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'home'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'text-slate-500 group-hover:text-slate-800'
            }`}
          >
            <IconRenderer name="Home" className="w-4 h-4 fill-current" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              currentTab === 'home'
                ? 'font-bold text-emerald-800'
                : 'font-medium text-slate-500 group-hover:text-slate-700'
            }`}
          >
            {t(lang, 'navHome')}
          </span>
        </button>

        {/* Left Tab 2: Expenses / Transactions */}
        <button
          type="button"
          onClick={() => onTabChange('expenses')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group py-0.5"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'expenses'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'text-slate-500 group-hover:text-slate-800'
            }`}
          >
            <IconRenderer name="CreditCard" className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              currentTab === 'expenses'
                ? 'font-bold text-emerald-800'
                : 'font-medium text-slate-500 group-hover:text-slate-700'
            }`}
          >
            {t(lang, 'navExpenses')}
          </span>
        </button>

        {/* Center: Clean Vibrant Add '+' Button */}
        <div className="px-1.5 flex items-center justify-center">
          <motion.button
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            type="button"
            onClick={onOpenQuickAdd}
            className="w-13 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-600/30 border border-emerald-500 cursor-pointer active:shadow-inner"
            title={t(lang, 'btnAddExpense')}
          >
            <IconRenderer name="Plus" className="w-5 h-5 stroke-[2.5] text-white" />
          </motion.button>
        </div>

        {/* Right Tab 1: Reports */}
        <button
          type="button"
          onClick={() => onTabChange('reports')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group py-0.5"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'reports'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'text-slate-500 group-hover:text-slate-800'
            }`}
          >
            <IconRenderer name="PieChart" className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              currentTab === 'reports'
                ? 'font-bold text-emerald-800'
                : 'font-medium text-slate-500 group-hover:text-slate-700'
            }`}
          >
            {t(lang, 'navReports')}
          </span>
        </button>

        {/* Right Tab 2: Profile & Settings */}
        <button
          type="button"
          onClick={() => onTabChange('settings')}
          className="relative flex-1 flex flex-col items-center justify-center transition-all cursor-pointer group py-0.5"
        >
          <div
            className={`w-9 h-8 rounded-xl flex items-center justify-center transition-all ${
              currentTab === 'settings'
                ? 'bg-emerald-100 text-emerald-800 font-bold'
                : 'text-slate-500 group-hover:text-slate-800'
            }`}
          >
            <IconRenderer name="User" className="w-4 h-4" />
          </div>
          <span
            className={`text-[10px] mt-0.5 tracking-tight transition-colors ${
              currentTab === 'settings'
                ? 'font-bold text-emerald-800'
                : 'font-medium text-slate-500 group-hover:text-slate-700'
            }`}
          >
            {t(lang, 'navProfile')}
          </span>
        </button>

      </div>
    </div>
  );
};
