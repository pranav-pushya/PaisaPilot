import React, { useState, useEffect } from 'react';
import { ExpenseProvider } from './context/ExpenseContext';
import { Navbar } from './components/common/Navbar';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { SpendingCharts } from './components/dashboard/SpendingCharts';
import { SmartBudgetAlert } from './components/dashboard/SmartBudgetAlert';
import { TransactionList } from './components/transactions/TransactionList';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';
import { SettingsModal } from './components/common/SettingsModal';
import { BudgetManagerModal } from './components/budget/BudgetManagerModal';
import { AiAdvisorWidget } from './components/ai-advisor/AiAdvisorWidget';

function DashboardContent() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [openAiTrigger, setOpenAiTrigger] = useState(false);

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

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenBudgetModal={() => setIsBudgetModalOpen(true)}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Proactive AI Insight & Alerts */}
        <SmartBudgetAlert onOpenAiChat={() => setOpenAiTrigger((prev) => !prev)} />

        {/* Financial KPI Summary Cards */}
        <SummaryCards />

        {/* Visual Charts & Payment Breakdown */}
        <SpendingCharts onOpenBudgetModal={() => setIsBudgetModalOpen(true)} />

        {/* Searchable Transaction Ledger */}
        <TransactionList />

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200/80 dark:border-slate-800/80 text-center text-xs text-slate-400">
        <p>
          PaisaPilot &bull; Built with React.js &bull; Supabase &bull; Google Gemini AI &bull; Indian Rupee (₹)
        </p>
      </footer>

      {/* Modals & Dialogs */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <BudgetManagerModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
      />

      {/* Floating AI Financial Advisor */}
      <AiAdvisorWidget
        key={String(openAiTrigger)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
      />
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
