import React, { useState } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR } from '../../utils/formatters';
import { CategoryIcon } from '../common/CategoryIcon';
import { X, Target, Check, AlertCircle } from 'lucide-react';

export const BudgetManagerModal = ({ isOpen, onClose }) => {
  const { categories, budgets, setCategoryBudget, categoryBreakdown } = useExpense();
  const [localBudgets, setLocalBudgets] = useState({ ...budgets });
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleBudgetChange = (catName, val) => {
    setLocalBudgets((prev) => ({
      ...prev,
      [catName]: val === '' ? '' : Math.max(0, Number(val)),
    }));
  };

  const handleSave = () => {
    Object.keys(localBudgets).forEach((catName) => {
      setCategoryBudget(catName, localBudgets[catName] || 0);
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Monthly Category Budgets
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Set monthly spending targets to keep your expenses in check
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Categories List */}
        <div className="p-5 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {expenseCategories.map((cat) => {
            const currentSpent = categoryBreakdown.find((c) => c.name === cat.name)?.amount || 0;
            const currentLimit = localBudgets[cat.name] || '';

            return (
              <div 
                key={cat.id || cat.name}
                className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80 flex items-center justify-between space-x-3"
              >
                <div className="flex items-center space-x-2.5 flex-1 min-w-0">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: cat.color || '#6366f1' }}
                  >
                    <CategoryIcon iconName={cat.icon} className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Spent: <strong>{formatINR(currentSpent)}</strong>
                    </span>
                  </div>
                </div>

                <div className="relative w-36 flex-shrink-0">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-xs font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="100"
                    placeholder="Limit"
                    value={currentLimit}
                    onChange={(e) => handleBudgetChange(cat.name, e.target.value)}
                    className="w-full pl-6 pr-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 text-right"
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save Budgets</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
