import React from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR } from '../../utils/formatters';
import { CategoryIcon, PaymentModeIcon } from '../common/CategoryIcon';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon, AlertTriangle, CheckCircle2, CreditCard } from 'lucide-react';

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white px-3.5 py-2.5 rounded-xl shadow-xl text-xs border border-slate-700">
        <div className="font-semibold text-sm flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.color }} />
          <span>{data.name}</span>
        </div>
        <div className="mt-1 flex items-baseline justify-between space-x-4 text-slate-300">
          <span>Amount:</span>
          <span className="font-bold text-white">{formatINR(data.amount)}</span>
        </div>
        <div className="flex items-baseline justify-between space-x-4 text-slate-300">
          <span>Share:</span>
          <span className="font-medium text-indigo-400">{data.percentage}%</span>
        </div>
      </div>
    );
  }
  return null;
};

export const SpendingCharts = ({ onOpenBudgetModal }) => {
  const { 
    categoryBreakdown, 
    totalExpense, 
    paymentModeBreakdown, 
    budgets 
  } = useExpense();

  const pieData = categoryBreakdown.slice(0, 6);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* 1. Category Distribution Donut Chart */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Expense by Category
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {categoryBreakdown.length} Active Categories
            </span>
          </div>

          {totalExpense === 0 ? (
            <div className="py-16 text-center text-slate-400 text-sm">
              No expenses recorded for this month yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center pt-4">
              
              {/* Donut Chart Visual */}
              <div className="md:col-span-5 h-56 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Pie
                      data={pieData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={88}
                      paddingAngle={3}
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || '#6366f1'} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                {/* Center metric */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-medium text-slate-400">Total Spent</span>
                  <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                    {formatINR(totalExpense)}
                  </span>
                </div>
              </div>

              {/* Category Legend & Budget Progress */}
              <div className="md:col-span-7 space-y-3">
                {categoryBreakdown.slice(0, 4).map((cat) => {
                  const budgetLimit = budgets[cat.name];
                  const budgetPct = budgetLimit ? Math.round((cat.amount / budgetLimit) * 100) : null;
                  const isOver = budgetLimit && cat.amount > budgetLimit;

                  return (
                    <div key={cat.name} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                            {cat.name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white">{formatINR(cat.amount)}</span>
                          <span className="text-slate-400 font-medium">({cat.percentage}%)</span>
                        </div>
                      </div>

                      {/* Mini Budget Bar */}
                      {budgetLimit && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Budget: {formatINR(budgetLimit)}</span>
                            <span className={isOver ? 'text-rose-500 font-bold' : 'text-slate-400'}>
                              {budgetPct}% used
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-1.5 rounded-full transition-all duration-500 ${isOver ? 'bg-rose-500' : 'bg-indigo-500'}`}
                              style={{ width: `${Math.min(100, budgetPct)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}

                {categoryBreakdown.length > 4 && (
                  <p className="text-[11px] text-center text-slate-400 pt-1">
                    + {categoryBreakdown.length - 4} more categories
                  </p>
                )}
              </div>

            </div>
          )}
        </div>
      </div>

      {/* 2. Payment Method Breakdown (UPI vs Cards vs Cash) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Payment Modes
              </h3>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {paymentModeBreakdown.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-8">No payment mode data yet.</p>
            ) : (
              paymentModeBreakdown.map((pm) => {
                const modeName = pm.mode || pm.name;
                return (
                  <div key={modeName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <div className="flex items-center space-x-2">
                        <PaymentModeIcon mode={modeName} />
                        <span className="text-slate-700 dark:text-slate-200">{modeName}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-slate-900 dark:text-white font-bold">{formatINR(pm.amount)}</span>
                        <span className="text-slate-400 text-[11px]">({pm.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full"
                        style={{ width: `${pm.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500 dark:text-slate-400">UPI & Digital preferred</span>
          <button 
            onClick={onOpenBudgetModal}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Adjust Budgets &rarr;
          </button>
        </div>
      </div>

    </div>
  );
};
