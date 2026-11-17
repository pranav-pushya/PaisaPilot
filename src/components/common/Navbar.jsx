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
  Cloud,
  LockKeyhole,
  CalendarClock,
  HandCoins,
  Coffee,
  Hourglass,
  PiggyBank
} from 'lucide-react';
import { 
  shiftMonthStr, 
  formatMonthTitle, 
  formatShortMonthTitle,
  getCurrentMonthStr, 
  MONTH_SHORT_NAMES 
} from '../../utils/dateUtils';

export const Navbar = ({ onOpenAddModal, onOpenBudgetModal, activeTab, onToggleTripsView, onNavigate = () => {}, appLockEnabled = false, onLockApp = () => {}, onOpenAppLockSettings = () => {} }) => {
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
  const [mobileSidebarSide, setMobileSidebarSide] = useState(null);
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
    <>
    <header className="sticky top-0 z-30 bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-20 gap-1.5 sm:gap-4">
          
          {/* Logo & Brand Title */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            <button type="button" onClick={() => setMobileSidebarSide((side) => side === 'left' ? null : 'left')} aria-label="Open finance sidebar from the left" aria-expanded={mobileSidebarSide === 'left'} className="md:hidden w-8 h-8 rounded-xl overflow-hidden shadow-md shadow-indigo-500/30 ring-2 ring-indigo-500/30 flex items-center justify-center bg-slate-950 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
              <img src="/icon-192.png" alt="PaisaPilot Rupee Jet Logo" className="w-full h-full object-cover" />
            </button>
            <div className="hidden md:flex w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl overflow-hidden shadow-md shadow-indigo-500/30 ring-1.5 sm:ring-2 ring-indigo-500/30 items-center justify-center bg-slate-950 shrink-0">
              <img src="/icon-192.png" alt="PaisaPilot Rupee Jet Logo" className="w-full h-full object-cover" />
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
            <button
              onClick={onOpenAppLockSettings}
              className="flex items-center space-x-1.5 px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition active:scale-95"
              title={appLockEnabled ? 'App lock settings' : 'Set up app lock'}
              aria-label={appLockEnabled ? 'App lock settings' : 'Set up app lock'}
            >
              <LockKeyhole className="w-4 h-4 text-indigo-500" />
              <span>App Lock</span>
            </button>
            {appLockEnabled && (
              <button onClick={onLockApp} className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition active:scale-95" title="Lock app now" aria-label="Lock app now">
                <ShieldCheck className="h-4 w-4" />
              </button>
            )}
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

          {/* Keep the familiar hamburger alongside the tappable PaisaPilot logo. */}
          <div className="flex md:hidden items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSidebarSide((side) => side === 'right' ? null : 'right')}
              className="p-2 rounded-xl text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition active:scale-95 flex items-center justify-center"
              aria-label="Open finance sidebar from the right"
              aria-expanded={mobileSidebarSide === 'right'}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

        </div>
      </div>
    </header>

      {/* Mobile Drawer Menu */}
      {mobileSidebarSide && (
        <div className="md:hidden fixed inset-0 z-[70] bg-slate-950/60 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setMobileSidebarSide(null); }}>
          <aside aria-label={`PaisaPilot sidebar from the ${mobileSidebarSide}`} className={`absolute inset-y-0 ${mobileSidebarSide === 'left' ? 'left-0 border-r' : 'right-0 border-l'} flex max-h-[100dvh] w-[min(88vw,22rem)] flex-col overflow-y-auto border-slate-200 bg-white px-4 py-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900`} onMouseDown={(event) => event.stopPropagation()}>
          <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <img src="/icon-192.png" alt="" className="h-9 w-9 rounded-xl" />
              <div><p className="text-sm font-extrabold text-slate-900 dark:text-white">PaisaPilot</p><p className="text-[10px] font-semibold uppercase tracking-wider text-indigo-500">Finance tools</p></div>
            </div>
            <button type="button" onClick={() => setMobileSidebarSide(null)} aria-label="Close sidebar" className="rounded-xl border border-slate-200 p-2 text-slate-600 dark:border-slate-700 dark:text-slate-300"><X className="h-5 w-5" /></button>
          </div>
          {/* Primary Action: Add Expense */}
          <button
            onClick={() => {
              setMobileSidebarSide(null);
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
                  setMobileSidebarSide(null);
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
                setMobileSidebarSide(null);
                setIsAuthModalOpen(true);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 transition active:scale-95"
            >
              <Cloud className="w-4 h-4" />
              <span>Sign In to Sync All Devices</span>
            </button>
          )}

          <div className="border-t border-slate-100 pt-3 dark:border-slate-800">
            <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Your tools</p>
            <nav aria-label="Finance tool pages" className="space-y-1">
              {[
                ['feature-recurring', 'Recurring bills & income', CalendarClock],
                ['feature-udhaar', 'Quick Udhaar ledger', HandCoins],
                ['feature-quick-logs', 'Campus Quick Logs', Coffee],
                ['feature-impulse', 'Impulse Vault', Hourglass],
                ['feature-savings', 'Micro-Savings Jars', PiggyBank],
              ].map(([view, label, Icon]) => (
                <button key={view} type="button" aria-current={activeTab === view ? 'page' : undefined} onClick={() => { setMobileSidebarSide(null); onNavigate(view); }} className={`flex min-h-12 w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-bold transition active:scale-[.99] ${activeTab === view ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-transparent text-slate-700 hover:border-indigo-200 hover:bg-indigo-50 dark:text-slate-200 dark:hover:border-indigo-900 dark:hover:bg-indigo-950/50'}`}>
                  <Icon className={`h-4 w-4 shrink-0 ${activeTab === view ? 'text-white' : 'text-indigo-500'}`} /><span>{label}</span>
                </button>
              ))}
            </nav>
          </div>

          <button onClick={() => { setMobileSidebarSide(null); onOpenBudgetModal(); }} className="mt-3 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"><Target className="h-4 w-4 text-indigo-500" />Set Budgets</button>

          {/* Device app lock controls */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setMobileSidebarSide(null); onOpenAppLockSettings(); }}
              className="flex items-center space-x-2 rounded-xl border border-indigo-200 bg-indigo-50 p-3 text-xs font-bold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-300"
            >
              <LockKeyhole className="h-4 w-4 shrink-0" />
              <span>{appLockEnabled ? 'App Lock Settings' : 'Set Up App Lock'}</span>
            </button>
            {appLockEnabled ? (
              <button onClick={() => { setMobileSidebarSide(null); onLockApp(); }} className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-slate-100 p-3 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <ShieldCheck className="h-4 w-4 shrink-0" /><span>Lock Now</span>
              </button>
            ) : (
              <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">Set a PIN to enable manual locking</div>
            )}
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
          </aside>
        </div>
      )}
    </>
  );
};
