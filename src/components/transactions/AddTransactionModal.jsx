import React, { useState, useEffect } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { PAYMENT_MODES, formatINR } from '../../utils/formatters';
import { getTodayDateStr } from '../../utils/dateUtils';
import { parseExpensePrompt } from '../../api/gemini';
import { validateUdhaarSplits } from '../../utils/udhaar';
import { CategoryIcon, PaymentModeIcon } from '../common/CategoryIcon';
import { AddCategoryModal } from '../common/AddCategoryModal';
import confetti from 'canvas-confetti';
import { 
  X, 
  Sparkles, 
  Check, 
  Loader2, 
  Calendar, 
  FileText, 
  Tag, 
  CreditCard,
  Plus,
  Compass,
  ArrowLeftRight,
  Users,
} from 'lucide-react';

export const AddTransactionModal = ({ isOpen, onClose, defaultTripId = null }) => {
  const { categories, addTransaction, addCashSwap, addReceivables, trips } = useExpense();

  const [activeTab, setActiveTab] = useState('smart'); // 'smart' | 'manual' | 'swap'
  const [smartPrompt, setSmartPrompt] = useState('');
  const [isAiParsing, setIsAiParsing] = useState(false);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);

  // Form Fields
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [categoryName, setCategoryName] = useState('Food & Dining');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [fromMode, setFromMode] = useState('UPI');
  const [toMode, setToMode] = useState('Cash');
  const [date, setDate] = useState(getTodayDateStr());
  const [description, setDescription] = useState('');
  const [selectedTripId, setSelectedTripId] = useState(defaultTripId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [splitWithFriends, setSplitWithFriends] = useState(false);
  const [splitRows, setSplitRows] = useState([{ name: '', amount: '' }]);
  const [splitError, setSplitError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (defaultTripId) {
        setSelectedTripId(defaultTripId);
        setActiveTab('manual');
      } else {
        setSelectedTripId('');
      }
    }
  }, [isOpen, defaultTripId]);

  if (!isOpen) return null;

  // Handle AI Auto-Fill
  const handleAiParse = async (e) => {
    e.preventDefault();
    if (!smartPrompt.trim()) return;

    setIsAiParsing(true);
    try {
      const parsed = await parseExpensePrompt(smartPrompt);
      if (parsed.amount) setAmount(parsed.amount.toString());

      if (parsed.is_swap) {
        setFromMode(parsed.from_mode || 'UPI');
        setToMode(parsed.to_mode || 'Cash');
        if (parsed.description) setDescription(parsed.description);
        setActiveTab('swap');
        return;
      }

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

  const handleSwapSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    if (fromMode === toMode) return;

    setIsSubmitting(true);
    try {
      await addCashSwap({
        amount: parseFloat(amount),
        fromMode,
        toMode,
        note: description.trim(),
        date,
      });

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#6366f1', '#10b981', '#f59e0b'],
      });

      setAmount('');
      setDescription('');
      setSmartPrompt('');
      onClose();
    } catch (err) {
      console.error('Failed to add cash swap:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    if (type === 'transfer' && fromMode === toMode) return;
    const splitResult = validateUdhaarSplits(splitRows, amount);
    const splitEntries = splitResult.entries;
    if (type === 'expense' && splitWithFriends && !splitResult.valid) {
      setSplitError(splitResult.reason);
      return;
    }
    setSplitError('');

    setIsSubmitting(true);
    try {
      const matchedTrip = trips.find((t) => t.id === selectedTripId);

      const transactionId = await addTransaction({
        amount: parseFloat(amount),
        type,
        category_name: type === 'transfer' ? 'Transfer' : categoryName,
        payment_mode: type === 'transfer' ? fromMode : paymentMode,
        from_mode: type === 'transfer' ? fromMode : null,
        to_mode: type === 'transfer' ? toMode : null,
        date,
        description: description.trim() || (type === 'transfer' ? 'Account transfer' : categoryName),
        trip_id: type !== 'transfer' && matchedTrip ? matchedTrip.id : null,
        trip_name: type !== 'transfer' && matchedTrip ? matchedTrip.name : null,
      });
      if (splitWithFriends && type === 'expense') {
        await addReceivables(splitEntries, transactionId, date, description.trim() || categoryName);
      }

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
      setSelectedTripId('');
      setSplitWithFriends(false);
      setSplitRows([{ name: '', amount: '' }]);
      onClose();
    } catch (err) {
      console.error('Failed to add transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-6 pb-3 sm:pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Add New Transaction
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
              Record expense, income, or event spend
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Smart AI vs Manual vs Cash Swap */}
        <div className="px-4 sm:px-6 pt-3 sm:pt-4">
          <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setActiveTab('smart')}
              className={`flex items-center justify-center space-x-1 sm:space-x-1.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition ${
                activeTab === 'smart'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              <span>Smart AI</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`flex items-center justify-center space-x-1 sm:space-x-1.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition ${
                activeTab === 'manual'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>Expense / Income</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('swap')}
              className={`flex items-center justify-center space-x-1 sm:space-x-1.5 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition ${
                activeTab === 'swap'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5 text-indigo-500" />
              <span>Cash Swap</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto">
          {activeTab === 'swap' ? (
            /* Cash Swap / Transfer Form */
            <form onSubmit={handleSwapSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-bold flex items-center space-x-1.5 mb-1">
                  <ArrowLeftRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Money Exchange / Cash Swap</span>
                </span>
                Gave someone money online and got cash in return? Or withdrew cash from ATM? This balances your accounts without falsely inflating your monthly expenses or income!
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount Exchanged (₹)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-400 text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Source & Destination Exchange Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-[1fr,auto,1fr] gap-2.5 items-center">
                {/* Outgoing (Sent From) */}
                <div className="p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/70 dark:border-rose-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                      Paid / Sent From (-)
                    </span>
                    <span className="text-[10px] text-rose-500 font-semibold">Online / Bank</span>
                  </div>
                  <select
                    value={fromMode}
                    onChange={(e) => setFromMode(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Flip Button */}
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      const temp = fromMode;
                      setFromMode(toMode);
                      setToMode(temp);
                    }}
                    className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition shadow-sm"
                    title="Swap from and to modes"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Incoming (Received In) */}
                <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-900/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                      Received In (+)
                    </span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Physical Cash</span>
                  </div>
                  <select
                    value={toMode}
                    onChange={(e) => setToMode(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {PAYMENT_MODES.map((mode) => (
                      <option key={mode} value={mode}>
                        {mode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Live Preview pill */}
              {amount && Number(amount) > 0 && (
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-rose-600 dark:text-rose-400">{fromMode}: -{formatINR(amount)}</span>
                    <span className="mx-1.5 text-slate-400">➔</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{toMode}: +{formatINR(amount)}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300">
                    Net Spend: ₹0
                  </span>
                </div>
              )}

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
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Person / Reason / Note
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Rahul (dinner split), Chai cash withdrawal"
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {type === 'expense' && (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/60 p-3 dark:border-violet-900/60 dark:bg-violet-950/20">
                  <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-violet-900 dark:text-violet-200">
                    <input type="checkbox" checked={splitWithFriends} onChange={(event) => { setSplitWithFriends(event.target.checked); setSplitError(''); }} className="h-4 w-4 accent-violet-600" />
                    <Users className="h-4 w-4" /> Split with friends · track who owes you
                  </label>
                  {splitWithFriends && <div className="mt-3 space-y-2">
                    {splitRows.map((row, index) => <div key={index} className="grid grid-cols-[1fr,110px,32px] gap-2">
                      <input aria-label={`Friend ${index + 1}`} value={row.name} onChange={(event) => setSplitRows((prev) => prev.map((item, i) => i === index ? { ...item, name: event.target.value } : item))} placeholder="Friend’s name" className="min-w-0 rounded-lg border border-violet-200 bg-white px-2.5 py-2 text-xs dark:border-violet-800 dark:bg-slate-900" />
                      <input aria-label={`Amount owed by friend ${index + 1}`} type="number" min="0.01" step="0.01" value={row.amount} onChange={(event) => setSplitRows((prev) => prev.map((item, i) => i === index ? { ...item, amount: event.target.value } : item))} placeholder="₹ owed" className="min-w-0 rounded-lg border border-violet-200 bg-white px-2 py-2 text-xs dark:border-violet-800 dark:bg-slate-900" />
                      <button type="button" aria-label="Remove friend" onClick={() => setSplitRows((prev) => prev.filter((_, i) => i !== index))} className="rounded-lg text-violet-700 hover:bg-violet-100 dark:text-violet-300 dark:hover:bg-violet-900"><X className="mx-auto h-4 w-4" /></button>
                    </div>)}
                    <button type="button" onClick={() => setSplitRows((prev) => [...prev, { name: '', amount: '' }])} className="text-xs font-bold text-violet-700 hover:underline dark:text-violet-300">+ Add another friend</button>
                    <p className="text-[11px] text-violet-700 dark:text-violet-300">Friends owe {formatINR(splitResult.total)} of this {formatINR(amount)} expense.</p>
                    {splitError && <p role="alert" className="text-xs font-semibold text-rose-600">{splitError}</p>}
                  </div>}
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !amount || fromMode === toMode}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition active:scale-95"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <ArrowLeftRight className="w-4 h-4" />
                      <span>Record Cash Swap ({amount ? formatINR(amount) : '₹0'})</span>
                    </>
                  )}
                </button>
                {fromMode === toMode && (
                  <p className="text-[11px] text-rose-500 text-center mt-1">
                    Please choose two different payment modes to swap between.
                  </p>
                )}
              </div>
            </form>
          ) : activeTab === 'smart' ? (
            /* Smart AI Input Tab */
            <div className="space-y-4">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs text-indigo-900 dark:text-indigo-200">
                <span className="font-semibold block mb-1">💡 Try typing naturally:</span>
                "Paid ₹450 for Swiggy dinner with friends via UPI"<br/>
                "Gave 500 online to Rahul and got cash back"<br/>
                "Withdrew 2000 cash from ATM using debit card"
              </div>

              <form onSubmit={handleAiParse} className="space-y-4">
                <textarea
                  value={smartPrompt}
                  onChange={(e) => setSmartPrompt(e.target.value)}
                  placeholder="Describe your transaction in plain English..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                <button
                  type="submit"
                  disabled={isAiParsing || !smartPrompt.trim()}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition"
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
            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              
              {/* Type Switcher */}
              <div className="grid grid-cols-3 gap-2">
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
                <button
                  type="button"
                  onClick={() => setType('transfer')}
                  className={`py-2 text-xs font-bold rounded-xl border transition ${
                    type === 'transfer'
                      ? 'bg-sky-50 text-sky-700 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800'
                      : 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                  }`}
                >
                  Transfer
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
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    autoFocus
                  />
                </div>
                {amount && (
                  <p className="text-[11px] text-slate-400 mt-1">
                    Value: {formatINR(amount, true)}
                  </p>
                )}
              </div>

              {/* Category & Payment Mode in 2 cols */}
              {type !== 'transfer' ? <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Category
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddCategoryOpen(true)}
                      className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-0.5"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New</span>
                    </button>
                  </div>
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
              </div> : <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[['From account', fromMode, setFromMode], ['To account', toMode, setToMode]].map(([label, value, setter]) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">{label}</label>
                    <select value={value} onChange={(e) => setter(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500">
                      {PAYMENT_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                    </select>
                  </div>
                ))}
                <p className="sm:col-span-2 text-[11px] text-sky-700 dark:text-sky-300">Transfers move money between payment modes without changing income or spending totals.</p>
                {fromMode === toMode && <p className="sm:col-span-2 text-[11px] text-rose-600">Choose two different payment modes.</p>}
              </div>}

              {/* Tag to Trip / Hackathon */}
              {type !== 'transfer' && trips && trips.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center space-x-1.5">
                    <Compass className="w-3.5 h-3.5 text-violet-500" />
                    <span>Tag to Trip / Hackathon (Optional)</span>
                  </label>
                  <select
                    value={selectedTripId}
                    onChange={(e) => setSelectedTripId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-200/80 dark:border-violet-900/50 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    <option value="">None (Regular Living Expense)</option>
                    {trips.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.type === 'hackathon' ? '💻' : t.type === 'trip' ? '✈️' : '🎟️'} {t.name} (Budget: {formatINR(t.budget)})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tracks against this event's allotted budget while deducting from your chosen payment mode account balance.
                  </p>
                </div>
              )}

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
                    placeholder="e.g. Swiggy, Metro pass, Hotel"
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || !amount || (type === 'transfer' && fromMode === toMode)}
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition active:scale-95"
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

      <AddCategoryModal
        isOpen={isAddCategoryOpen}
        onClose={() => setIsAddCategoryOpen(false)}
        defaultType={type}
        onCategoryCreated={(newCat) => {
          setCategoryName(newCat.name);
        }}
      />
    </div>
  );
};
