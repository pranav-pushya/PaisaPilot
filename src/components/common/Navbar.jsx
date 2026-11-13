import React, { useState, useRef, useEffect } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { 
  PlusCircle, 
  Settings, 
  Calendar, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  HardDrive,
  ChevronDown,
  Clock
} from 'lucide-react';
import { 
  shiftMonthStr, 
  formatMonthTitle, 
  getCurrentMonthStr, 
  MONTH_SHORT_NAMES 
} from '../../utils/dateUtils';

export const Navbar = ({ onOpenAddModal, onOpenSettingsModal, onOpenBudgetModal }) => {
  const { 
    selectedMonth, 
    setSelectedMonth, 
    supabaseConnected, 
    transactions 
  } = useExpense();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // Month & Year state for the picker popover
  const currentMonthStr = getCurrentMonthStr();
  const [activeYear, setActiveYear] = useState(() => {
    if (!selectedMonth || selectedMonth === 'all') {
      return parseInt(currentMonthStr.split('-')[0], 10);
    }
    return parseInt(selectedMonth.split('-')[0], 10);
  });

  // Keep picker activeYear synced when selectedMonth changes
  useEffect(() => {
    if (selectedMonth && selectedMonth !== 'all') {
      const yr = parseInt(selectedMonth.split('-')[0], 10);
      if (!isNaN(yr)) setActiveYear(yr);
    }
  }, [selectedMonth]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setIsPickerOpen(false);
      }
    };
    if (isPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPickerOpen]);

  // Clean, timezone-safe month shift
  const handleShiftMonth = (offset) => {
    const newMonth = shiftMonthStr(selectedMonth, offset);
    setSelectedMonth(newMonth);
  };

  const handleSelectMonth = (monthIndex) => {
    const monthNum = String(monthIndex + 1).padStart(2, '0');
    setSelectedMonth(`${activeYear}-${monthNum}`);
    setIsPickerOpen(false);
  };

  const handleJumpToCurrent = () => {
    setSelectedMonth(currentMonthStr);
    setActiveYear(parseInt(currentMonthStr.split('-')[0], 10));
    setIsPickerOpen(false);
  };

  const handleSelectAllTime = () => {
    setSelectedMonth('all');
    setIsPickerOpen(false);
  };

  // Check which months have transactions in the currently viewed year
  const monthsWithData = new Set(
    transactions
      .filter((t) => t.date && t.date.startsWith(String(activeYear)))
      .map((t) => parseInt(t.date.split('-')[1], 10) - 1)
  );

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-black text-xl">
              ₹
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent">
                  PaisaPilot
                </span>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800">
                  <Sparkles className="w-3 h-3 mr-1 text-indigo-500 animate-pulse" />
                  AI Guided
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
                Smart Personal Expense Co-Pilot
              </p>
            </div>
          </div>

          {/* Month Selector Pill with Interactive Popover */}
          <div className="relative" ref={pickerRef}>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 rounded-2xl p-1 border border-slate-200 dark:border-slate-700 shadow-inner">
              {/* Previous Month */}
              <button
                type="button"
                onClick={() => handleShiftMonth(-1)}
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm active:scale-95 transition"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Clickable Month Label */}
              <button
                type="button"
                onClick={() => setIsPickerOpen((prev) => !prev)}
                className="flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-white/70 dark:hover:bg-slate-700/70 transition"
                title="Click to change month or year"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>{formatMonthTitle(selectedMonth)}</span>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isPickerOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Next Month */}
              <button
                type="button"
                onClick={() => handleShiftMonth(1)}
                className="p-1.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm active:scale-95 transition"
                title="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Interactive Month & Year Picker Popover */}
            {isPickerOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fadeIn">
                
                {/* Year Switcher Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setActiveYear((y) => y - 1)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-slate-800 dark:text-white">
                    {activeYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveYear((y) => y + 1)}
                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-3 gap-2 py-3">
                  {MONTH_SHORT_NAMES.map((mName, idx) => {
                    const monthCode = `${activeYear}-${String(idx + 1).padStart(2, '0')}`;
                    const isSelected = selectedMonth === monthCode;
                    const isCurrent = currentMonthStr === monthCode;
                    const hasData = monthsWithData.has(idx);

                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => handleSelectMonth(idx)}
                        className={`relative py-2 rounded-xl text-xs font-semibold transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : isCurrent
                            ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <span>{mName}</span>
                        {hasData && (
                          <span
                            className={`w-1 h-1 rounded-full mt-0.5 ${
                              isSelected ? 'bg-white' : 'bg-emerald-500'
                            }`}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Footer Quick Links */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={handleJumpToCurrent}
                    className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:underline py-1"
                  >
                    <Clock className="w-3 h-3" />
                    <span>This Month</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAllTime}
                    className={`py-1 px-2 rounded-lg transition ${
                      selectedMonth === 'all'
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-white'
                    }`}
                  >
                    All Transactions
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Action Buttons & Status */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Supabase Status Pill */}
            <button
              onClick={onOpenSettingsModal}
              className={`hidden md:flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                supabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 hover:border-slate-300'
              }`}
              title={supabaseConnected ? 'Synced with Supabase Cloud' : 'Running in Local Mode. Click to connect Supabase.'}
            >
              {supabaseConnected ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  Supabase Cloud
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  Local Mode
                </>
              )}
            </button>

            {/* Manage Budget Button */}
            <button
              onClick={onOpenBudgetModal}
              className="hidden lg:flex items-center px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
            >
              Budgets
            </button>

            {/* Settings Button */}
            <button
              onClick={onOpenSettingsModal}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
              title="App Settings (Supabase & Gemini API)"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Add Expense</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
