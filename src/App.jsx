import React, { useState, useEffect } from 'react';
import { ExpenseProvider, useExpense } from './context/ExpenseContext';
import { Navbar } from './components/common/Navbar';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { PaymentModeBalances } from './components/dashboard/PaymentModeBalances';
import { SpendingCharts } from './components/dashboard/SpendingCharts';
import { SmartBudgetAlert } from './components/dashboard/SmartBudgetAlert';
import { TransactionList } from './components/transactions/TransactionList';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';
import { BudgetManagerModal } from './components/budget/BudgetManagerModal';
import { AiAdvisorWidget } from './components/ai-advisor/AiAdvisorWidget';
import { TripsSection } from './components/trips/TripsSection';
import { LayoutDashboard, Compass } from 'lucide-react';

function DashboardContent() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'trips'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [openAiTrigger, setOpenAiTrigger] = useState(false);
  const [selectedTripForAdd, setSelectedTripForAdd] = useState(null);
  const { trips } = useExpense();

  // Global keyboard shortcut: Press "n" or "N" to open quick add
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        (e.key === 'n' || e.key === 'N') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        setIsAddModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleOpenAddForTrip = (trip) => {
    setSelectedTripForAdd(trip?.id || null);
    setIsAddModalOpen(true);
  };

  const handleCloseAddModal = () => {
    setIsAddModalOpen(false);
    setSelectedTripForAdd(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenAddModal={() => {
          setSelectedTripForAdd(null);
          setIsAddModalOpen(true);
        }}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
        activeTab={activeTab}
        onToggleTripsView={() => setActiveTab((prev) => (prev === 'trips' ? 'dashboard' : 'trips'))}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-5 sm:space-y-6">
        
        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl border border-slate-200/60 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Main Dashboard</span>
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`flex items-center space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold transition active:scale-95 ${
                activeTab === 'trips'
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Trips & Hackathons</span>
              {trips && trips.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === 'trips' ? 'bg-violet-800 text-white' : 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400'
                }`}>
                  {trips.length}
                </span>
              )}
            </button>
          </div>

          <span className="hidden sm:inline-block text-xs text-slate-400 font-medium">
            Unified Bank & UPI Balances &bull; Separate Event Budgets
          </span>
        </div>

        {/* Tab 1: Main Regular Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Proactive AI Insight & Alerts */}
            <SmartBudgetAlert onOpenAiChat={() => setOpenAiTrigger((prev) => !prev)} />

            {/* Financial KPI Summary Cards */}
            <SummaryCards />

            {/* Real-Time Payment Mode Balances */}
            <PaymentModeBalances />

            {/* Visual Charts & Payment Breakdown */}
            <SpendingCharts onOpenBudgetModal={() => setIsBudgetModalOpen(true)} />

            {/* Searchable Transaction Ledger */}
            <TransactionList />
          </div>
        )}

        {/* Tab 2: Dedicated Trips & Hackathons Section */}
        {activeTab === 'trips' && (
          <div className="space-y-5 sm:space-y-6">
            {/* Real-Time Payment Mode Balances (still visible so user sees their actual accounts) */}
            <PaymentModeBalances />

            {/* Dedicated Trips Section */}
            <TripsSection onOpenAddExpenseForTrip={handleOpenAddForTrip} />

            {/* Transaction Ledger */}
            <TransactionList />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-400">
        <p>
          PaisaPilot &bull; Built with React.js &bull; Supabase &bull; Groq AI &bull; Indian Rupee (₹)
        </p>
      </footer>

      {/* Modals & Dialogs */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={handleCloseAddModal}
        defaultTripId={selectedTripForAdd}
      />

      <BudgetManagerModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />

      {/* Floating AI Financial Advisor */}
      <AiAdvisorWidget key={String(openAiTrigger)} />
    </div>
  );
}

export default function App() {
  return (
    <ExpenseProvider>
      <DashboardContent />
    </ExpenseProvider>
  );
}
