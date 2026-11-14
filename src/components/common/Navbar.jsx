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
  Compass, 
  Menu, 
  X,
  LogIn,
  LogOut,
  User,
  Cloud
} from 'lucide-react';
import { 
  shiftMonthStr, 
  formatMonthTitle, 
  formatShortMonthTitle,
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
    trips,
    user,
    logout,
    setIsAuthModalOpen
  } = useExpense();

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const pickerRef = useRef(null);
  const userMenuRef = useRef(null);

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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clean month shift
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
        <div className="flex items-center justify-between h-14 sm:h-20 gap-1.5 sm:gap-4">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-indigo-500/30 ring-1.5 sm:ring-2 ring-indigo-500/30 flex items-center justify-center bg-slate-950 shrink-0">
              <img src="/favicon.svg" alt="PaisaPilot Rupee Jet Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-sm sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 dark:from-white dark:via-indigo-200 dark:to-slate-200 bg-clip-text text-transparent leading-none sm:leading-normal">
                PaisaPilot
              </span>
              <span className="hidden xs:inline text-[9px] sm:text-xs font-semibold text-indigo-700 dark:text-indigo-400 mt-0.5 tracking-wider uppercase">
                AI Guide
              </span>
            </div>
          </div>

          {/* Month Navigator & Popover Picker */}
          <div className="relative shrink-0 max-w-[170px] sm:max-w-none" ref={pickerRef}>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-2xl p-0.5 sm:p-1 border border-slate-200/60 dark:border-slate-700/60 shadow-sm">
              <button
                onClick={() => handleShiftMonth(-1)}
                className="p-1 sm:p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition shrink-0"
                title="Previous Month"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={() => setIsPickerOpen(!isPickerOpen)}
                className="flex items-center space-x-1 sm:space-x-1.5 px-1.5 sm:px-3 py-1 rounded-xl text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 hover:bg-white dark:hover:bg-slate-700 transition min-w-0"
                title="Choose Month & Year"
              >
                <Calendar className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{formatMonthTitle(selectedMonth)}</span>
                <span className="sm:hidden whitespace-nowrap text-[11px] font-extrabold">{formatShortMonthTitle(selectedMonth)}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform shrink-0 ${isPickerOpen ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => handleShiftMonth(1)}
                className="p-1 sm:p-1.5 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 transition shrink-0"
                title="Next Month"
                aria-label="Next Month"
              >
                <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Month & Year Picker Dropdown */}
            {isPickerOpen && (
              <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setActiveYear((y) => y - 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-extrabold text-slate-800 dark:text-white">
                    {activeYear}
                  </span>
                  <button
                    onClick={() => setActiveYear((y) => y + 1)}
                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {MONTH_SHORT_NAMES.map((mName, idx) => {
                    const monthVal = `${activeYear}-${String(idx + 1).padStart(2, '0')}`;
                    const isSelected = selectedMonth === monthVal;
                    const isCurrent = currentMonthStr === monthVal;
                    const hasTransactions = monthsWithData.has(idx);

                    return (
                      <button
                        key={mName}
                        onClick={() => handleSelectMonth(idx)}
                        className={`relative py-2 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                            : isCurrent
                            ? 'border-2 border-indigo-500/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
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

          {/* Desktop Actions (visible on md+) */}
          <div className="hidden md:flex items-center space-x-2 sm:space-x-2.5 shrink-0">
            {/* User Account / Auth & Sync Button */}
            <div className="relative" ref={userMenuRef}>
              {user ? (
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold transition hover:bg-emerald-100/60 active:scale-95"
                  title="Multi-Device Sync Active"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] shadow-sm">
                    {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="max-w-[110px] truncate">{user.user_metadata?.full_name || user.email?.split('@')[0]}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </button>
              ) : (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-indigo-500 transition active:scale-95 shadow-sm"
                  title="Sign in to sync your expenses across all devices"
                >
                  <Cloud className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Sync Devices</span>
                </button>
              )}

              {/* User Dropdown Menu */}
              {isUserMenuOpen && user && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3">
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
                    <p className="text-xs text-slate-400">Signed in as</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{user.email}</p>
                    <div className="mt-2 flex items-center space-x-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Multi-Device Sync Active</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center space-x-2 py-2 px-3 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
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
              <span>Trips</span>
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
              <span>Budgets</span>
            </button>

            {/* Quick Add Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center space-x-1 sm:space-x-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-lg shadow-indigo-600/25 active:scale-95 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span className="text-xs sm:text-sm">Add Expense</span>
            </button>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center space-x-1.5 shrink-0">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 sm:p-2.5 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition active:scale-95 flex items-center justify-center"
              aria-label="Navigation Menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-4 space-y-3 shadow-xl animate-fadeIn">
          {/* Primary Action: Add Expense */}
          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenAddModal();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-indigo-600/25 active:scale-98 transition"
          >
            <PlusCircle className="w-5 h-5" />
            <span className="text-sm">Add New Expense</span>
          </button>

          {/* Auth / Sync Button on Mobile */}
          {user ? (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  {user.email ? user.email.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{user.email}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Synced Across Devices
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="text-xs text-red-600 dark:text-red-400 font-bold hover:underline shrink-0 ml-2"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsAuthModalOpen(true);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 transition active:scale-95"
            >
              <Cloud className="w-4 h-4" />
              <span>Sign In to Sync All Devices</span>
            </button>
          )}

          {/* Navigation Quick Links Grid */}
          <div className="grid grid-cols-2 gap-2">
            {/* Trips & Hackathons */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onToggleTripsView();
              }}
              className={`flex items-center space-x-2 p-3 rounded-xl text-xs font-bold border transition active:scale-95 ${
                activeTab === 'trips'
                  ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                  : 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800/60'
              }`}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span className="truncate">Trips & Events</span>
              {trips && trips.length > 0 && (
                <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>

            {/* Set Budgets */}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenBudgetModal();
              }}
              className="flex items-center space-x-2 p-3 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700 transition active:scale-95"
            >
              <Target className="w-4 h-4 text-indigo-500 shrink-0" />
              <span className="truncate">Set Budgets</span>
            </button>
          </div>

          {/* Utility Row: Theme Toggle & Cloud Status */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
            <button
              onClick={toggleTheme}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition active:scale-95"
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            <div
              className={`flex items-center px-3 py-1.5 rounded-xl text-xs font-medium border ${
                supabaseConnected
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
              }`}
            >
              {supabaseConnected ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Cloud Live</span>
                </>
              ) : (
                <>
                  <HardDrive className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
                  <span>Local Mode</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
