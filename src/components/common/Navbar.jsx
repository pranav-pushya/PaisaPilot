import React, { useState, useRef, useEffect } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { 
  PlusCircle, 
  Calendar, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  HardDrive,
  ChevronDown,
  Clock,
  Sun,
  Moon,
  Target,
  Compass
} from 'lucide-react';
import { 
  shiftMonthStr, 
  formatMonthTitle, 
  getCurrentMonthStr, 
  MONTH_SHORT_NAMES 
} from '../../utils/dateUtils';

export const Navbar = ({ onOpenAddModal, onOpenBudgetModal, activeTab, onToggleTripsView }) => {
  const { 
    theme,
    toggleTheme,
    selectedMonth, 
    setSelectedMonth, 
    supabaseConnected, 
    transactions,
    trips
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
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 flex items-center justify-center shadow-md shadow-indigo-500/20 text-white font-black text-base sm:text-xl">
              ₹
            </div>
            <div>
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white">
                  PaisaPilot
                </span>
                <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold uppercase tracking-wider bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60">
                  AI
                </span>
              </div>
              <p className="hidden md:block text-[11px] font-medium text-slate-400">
                Next-Gen Indian Expense & Budget Tracker
              </p>
            </div>
          </div>

          {/* Month Navigator & Jump Popover */}
          <div className="relative shrink min-w-0" ref={pickerRef}>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-2xl p-0.5 sm:p-1 shadow-inner border border-slate-200/60 dark:border-slate-700/60">
              <button
                onClick={() => handleShiftMonth(-1)}
                disabled={selectedMonth === 'all'}
                aria-label="Previous month"
                className="p-1 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition shadow-sm shrink-0"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-4 py-1 sm:py-1.5 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 transition shadow-sm truncate"
                title="Click to jump to another month or year"
              >
                <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-indigo-500 shrink-0 hidden xs:inline-block" />
                <span className="truncate max-w-[95px] xs:max-w-none sm:min-w-[100px] text-center">
                  {formatMonthTitle(selectedMonth)}
                </span>
                <ChevronDown className={`w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 transition-transform shrink-0 ${isPickerOpen ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => handleShiftMonth(1)}
                disabled={selectedMonth === 'all'}
                aria-label="Next month"
                className="p-1 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition shadow-sm shrink-0"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Comprehensive Month/Year Dropdown Picker */}
            {isPickerOpen && (
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 animate-fadeIn">
                
                {/* Year Header Selector */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveYear((y) => y - 1)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    {activeYear}
                  </span>
                  <button
                    onClick={() => setActiveYear((y) => y + 1)}
                    className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-3 gap-2 py-3">
                  {MONTH_SHORT_NAMES.map((mName, idx) => {
                    const monthKey = `${activeYear}-${String(idx + 1).padStart(2, '0')}`;
                    const isSelected = selectedMonth === monthKey;
                    const isCurrent = currentMonthStr === monthKey;
                    const hasTransactions = monthsWithData.has(idx);

                    return (
                      <button
                        key={mName}
                        onClick={() => handleSelectMonth(idx)}
                        className={`py-2 px-2.5 rounded-xl text-xs font-semibold relative transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : isCurrent
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800'
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{mName}</span>
                        {hasTransactions && !isSelected && (
                          <span className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Quick Filters Footer */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={handleJumpToCurrent}
                    className="flex items-center space-x-1 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Current Month</span>
                  </button>
                  <button
                    onClick={handleSelectAllTime}
                    className={`px-2 py-1 rounded-lg font-semibold transition ${
                      selectedMonth === 'all'
                        ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    All History
                  </button>
                </div>

              </div>
            )}
          </div>

          {/* Action Buttons & Status */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Supabase Status Badge */}
            <div
              className={`hidden lg:flex items-center px-2.5 py-1.5 rounded-xl text-xs font-medium border ${
                supabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
              title={supabaseConnected ? 'Synced with Supabase Cloud' : 'Running in Local Mode'}
            >
              {supabaseConnected ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Cloud</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  <span>Local</span>
                </>
              )}
            </div>

            {/* Dark/Light Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition active:scale-95"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600" />
              )}
            </button>

            {/* Trips & Hackathons Shortcut Button */}
            <button
              onClick={onToggleTripsView}
              className={`flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold border transition active:scale-95 ${
                activeTab === 'trips'
                  ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                  : 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 dark:hover:bg-violet-900/60 border-violet-200 dark:border-violet-800/60'
              }`}
              title="Trips & Hackathons Dedicated Budgets"
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Trips</span>
              {trips && trips.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
              )}
            </button>

            {/* Manage Budget Button */}
            <button
              onClick={onOpenBudgetModal}
              className="flex items-center space-x-1 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition active:scale-95"
              title="Manage Budgets"
            >
              <Target className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">Budgets</span>
            </button>

            {/* Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1 sm:space-x-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="text-xs sm:text-sm hidden xs:inline">Add</span>
              <span className="text-xs sm:text-sm hidden md:inline">Expense</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
