import React from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR } from '../../utils/formatters';
import { Sparkles, AlertTriangle, CheckCircle, TrendingDown, ArrowRight } from 'lucide-react';

export const SmartBudgetAlert = ({ onOpenAiChat }) => {
  const { 
    categoryBreakdown, 
    savingsRate, 
    balance, 
    totalExpense, 
    topCategory,
    budgets 
  } = useExpense();

  // Find any category that has breached its budget
  const overBudgetCategories = categoryBreakdown.filter((c) => c.isOverBudget);

  if (overBudgetCategories.length > 0) {
    const highestBreach = overBudgetCategories[0];
    const diff = highestBreach.amount - budgets[highestBreach.name];

    return (
      <div className="rounded-2xl p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 flex-shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-950 dark:text-rose-200">
              Budget Alert: {highestBreach.name} is over limit by {formatINR(diff)}
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300/80 mt-0.5">
              You have spent {formatINR(highestBreach.amount)} of your {formatINR(budgets[highestBreach.name])} limit. Consider cooling off non-essential spends.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAiChat}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ask AI for Advice</span>
        </button>
      </div>
    );
  }

  // If spending is healthy
  if (savingsRate >= 30) {
    return (
      <div className="rounded-2xl p-4 bg-gradient-to-r from-indigo-50 via-emerald-50/40 to-white dark:from-indigo-950/40 dark:via-emerald-950/20 dark:to-slate-900 border border-indigo-100/80 dark:border-indigo-900/40 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-300 flex-shrink-0">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Smart Spending Insight</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                {savingsRate}% Saved
              </span>
            </h4>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Great financial discipline! Your surplus is currently at <strong>{formatINR(balance)}</strong>.
            </p>
          </div>
        </div>
        <button
          onClick={onOpenAiChat}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 transition"
        >
          <span>Chat with PaisaPilot AI</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return null;
};
