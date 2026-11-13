import React from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR } from '../../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  PiggyBank, 
  Flame, 
  ArrowUpRight 
} from 'lucide-react';

export const SummaryCards = () => {
  const { 
    totalIncome, 
    totalExpense, 
    balance, 
    savingsRate, 
    dailyAverage, 
    transactionCount 
  } = useExpense();

  const getSavingsBadge = (rate) => {
    if (rate >= 40) return { label: 'Excellent', color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' };
    if (rate >= 20) return { label: 'Good Pace', color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800' };
    if (rate > 0) return { label: 'Tight', color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800' };
    return { label: 'Deficit Alert', color: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800' };
  };

  const badge = getSavingsBadge(savingsRate);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
      
      {/* 1. Net Balance */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Net Balance
          </span>
          <div className="p-2 sm:p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4">
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate">
            {formatINR(balance)}
          </h3>
          <div className="mt-1 sm:mt-2 flex items-center text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
            <span>Remaining surplus</span>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 2. Monthly Expenses */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Spent
          </span>
          <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4">
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate">
            {formatINR(totalExpense)}
          </h3>
          <div className="mt-1 sm:mt-2 flex items-center text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 space-x-1 truncate">
            <Flame className="w-3 h-3 text-amber-500 shrink-0 hidden xs:inline" />
            <span className="truncate">Avg {formatINR(dailyAverage)}/day</span>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 3. Monthly Income */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Total Income
          </span>
          <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4">
          <h3 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate">
            {formatINR(totalIncome)}
          </h3>
          <div className="mt-1 sm:mt-2 flex items-center text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 truncate">
            <ArrowUpRight className="w-3 h-3 mr-0.5 shrink-0" />
            <span>Credited earnings</span>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* 4. Savings Rate */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Savings Rate
          </span>
          <div className="p-2 sm:p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0">
            <PiggyBank className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
        <div className="mt-2.5 sm:mt-4">
          <div className="flex items-baseline space-x-1.5 sm:space-x-2">
            <h3 className="text-lg sm:text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              {savingsRate}%
            </h3>
            <span className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-md text-[9px] sm:text-[11px] font-semibold border ${badge.color}`}>
              {badge.label}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-2 sm:mt-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 sm:h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, savingsRate))}%` }}
            />
          </div>
        </div>
      </div>

    </div>
  );
};
