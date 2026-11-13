import React, { useState } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR } from '../../utils/formatters';
import { PaymentModeIcon } from '../common/CategoryIcon';
import { Wallet, ArrowUpRight, ArrowDownRight, Sliders, X, Check } from 'lucide-react';

export const PaymentModeBalances = () => {
  const { 
    paymentModeBalances, 
    totalLiquidFunds, 
    startingBalances, 
    updateStartingBalances 
  } = useExpense();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formValues, setFormValues] = useState({ ...startingBalances });
  const [isSaved, setIsSaved] = useState(false);

  const handleOpenModal = () => {
    setFormValues({ ...startingBalances });
    setIsSaved(false);
    setIsModalOpen(true);
  };

  const handleChange = (mode, val) => {
    setFormValues((prev) => ({
      ...prev,
      [mode]: val === '' ? '' : Number(val),
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const cleaned = {};
    Object.keys(formValues).forEach((mode) => {
      cleaned[mode] = Number(formValues[mode]) || 0;
    });
    updateStartingBalances(cleaned);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      setIsModalOpen(false);
    }, 700);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 sm:pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <span>Payment Mode Balances</span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
              Live money available across your accounts, wallets & cash
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between sm:justify-start space-x-2 w-full sm:w-auto pt-1 sm:pt-0">
          {/* Set / Edit Starting Balances Button */}
          <button
            onClick={handleOpenModal}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition active:scale-95"
            title="Set your starting balance for each payment mode"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Set Balances</span>
          </button>

          {/* Total Liquid Funds Pill */}
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold shrink-0">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Net:</span>
            <span className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm">
              {formatINR(totalLiquidFunds)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid of Payment Modes */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3 pt-3 sm:pt-4">
        {paymentModeBalances.map((pm) => {
          const isCreditCard = pm.mode === 'Credit Card';
          const isPositive = pm.balance >= 0;

          return (
            <div
              key={pm.mode}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800/80 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-800/80 transition group"
            >
              {/* Mode Icon & Name */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-slate-800 shadow-sm">
                    <PaymentModeIcon mode={pm.mode} className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                    {pm.mode}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800">
                  {pm.count} txns
                </span>
              </div>

              {/* Balance Amount */}
              <div className="mt-3">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                  {isCreditCard ? 'Spent / Due' : 'Available Balance'}
                </span>
                <h4 className={`text-base sm:text-lg font-black tracking-tight mt-0.5 ${
                  isCreditCard
                    ? 'text-rose-600 dark:text-rose-400'
                    : isPositive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-amber-600 dark:text-amber-400'
                }`}>
                  {isCreditCard ? formatINR(pm.expense) : formatINR(pm.balance)}
                </h4>
              </div>

              {/* Inflow vs Outflow Mini-Stats */}
              <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold" title="Total Inflow">
                  <ArrowUpRight className="w-3 h-3 mr-0.5" />
                  <span>{formatINR(pm.income)}</span>
                </div>
                <div className="flex items-center text-rose-500 dark:text-rose-400 font-semibold" title="Total Outflow">
                  <ArrowDownRight className="w-3 h-3 mr-0.5" />
                  <span>{formatINR(pm.expense)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Set Starting Balances */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Set Current Balances
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Enter your starting money in each mode
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-4 sm:p-5 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                💡 Enter how much money you have right now. As you record transactions, your live balances will adjust automatically.
              </p>

              {paymentModeBalances.map((pm) => (
                <div key={pm.mode} className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center space-x-2.5">
                    <PaymentModeIcon mode={pm.mode} className="w-4 h-4" />
                    <div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                        {pm.mode}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {pm.mode === 'Credit Card' ? 'Current Outstanding' : 'Starting Balance'}
                      </span>
                    </div>
                  </div>

                  <div className="relative w-36">
                    <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400 font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="any"
                      value={formValues[pm.mode] ?? ''}
                      onChange={(e) => handleChange(pm.mode, e.target.value)}
                      placeholder="0"
                      className="w-full pl-6 pr-3 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              ))}

              {/* Footer */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/25 active:scale-95 transition"
                >
                  {isSaved ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Balances</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
