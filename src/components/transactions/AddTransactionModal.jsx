import React, { useState } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { PAYMENT_MODES, formatINR } from '../../utils/formatters';
import { getTodayDateStr } from '../../utils/dateUtils';
import { parseExpensePrompt } from '../../api/gemini';
import { CategoryIcon, PaymentModeIcon } from '../common/CategoryIcon';
import confetti from 'canvas-confetti';
import { 
  X, 
  Sparkles, 
  Check, 
  Loader2, 
  Calendar, 
  FileText, 
  Tag, 
  CreditCard 
} from 'lucide-react';

export const AddTransactionModal = ({ isOpen, onClose }) => {
  const { categories, addTransaction } = useExpense();

  const [activeTab, setActiveTab] = useState('smart'); // 'smart' | 'manual'
  const [smartPrompt, setSmartPrompt] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryName, setCategoryName] = useState('Food & Dining');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [date, setDate] = useState(getTodayDateStr());
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  // Handle AI Auto-Fill
  const handleAiParse = async (e) => {
    e.preventDefault();
    if (!smartPrompt.trim()) return;

    setIsAiParsing(true);
    try {
      const parsed = await parseExpensePrompt(smartPrompt);
      if (parsed.amount) setAmount(parsed.amount.toString());
      if (parsed.type) setType(parsed.type);
      if (parsed.category_name) setCategoryName(parsed.category_name);
      if (parsed.payment_mode) setPaymentMode(parsed.payment_mode);
      if (parsed.description) setDescription(parsed.description);

      // Switch to manual tab to show the populated fields to the user
      setActiveTab('manual');
    } catch (err) {
      console.error('Error parsing with AI:', err);
    } finally {
      setIsAiParsing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    setIsSubmitting(true);
    try {
      await addTransaction({
        amount: parseFloat(amount),
        type,
        category_name: categoryName,
        payment_mode: paymentMode,
        date,
        description: description.trim() || categoryName,
      });

      // Celebration burst!
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#f59e0b'],
      });

      // Reset
      setAmount('');
      setDescription('');
      setSmartPrompt('');
      onClose();
    } catch (err) {
      console.error('Failed to add transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 pb-0 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Add New Transaction
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Log an expense or income in Indian Rupees (₹)
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-5 sm:px-6 pt-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('smart')}
              className={`flex items-center justify-center py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
                activeTab === 'smart'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5 text-indigo-500" />
              AI Natural Text
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex items-center justify-center py-2 text-xs sm:text-sm font-semibold rounded-xl transition ${
                activeTab === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Manual Form
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-5 sm:p-6">
          {activeTab === 'smart' ? (
            /* Smart AI Input Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-semibold block mb-1">💡 Try typing naturally:</span>
                "Paid ₹450 for Swiggy dinner with friends via UPI"<br/>
                "Spent 1800 on petrol using HDFC card"<br/>
                "Received 4500 freelance payment via UPI"
              </div>

              <form onSubmit={handleAiParse} className="space-y-4">
                <textarea
                  value={smartPrompt}
                  onChange={(e) => setSmartPrompt(e.target.value)}
                  placeholder="Describe your transaction in plain English..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="submit"
                  disabled={isAiParsing || !smartPrompt.trim()}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition"
                >
                  {isAiParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Parsing with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Auto-Fill Details</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            /* Manual Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Type Switcher: Expense / Income */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    type === 'expense'
                      ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                      : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  Expense
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    type === 'income'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  Income
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-400 text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                {amount && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Value: {formatINR(amount, true)}
                  </p>
                )}
              </div>

              {/* Category & Payment Mode in 2 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories
                      .filter((c) => (type === 'income' ? c.type === 'income' : c.type === 'expense'))
                      .map((cat) => (
                        <option key={cat.id || cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Payment Mode */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Description / Note
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Swiggy, Metro pass"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !amount}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Save Transaction</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
};
