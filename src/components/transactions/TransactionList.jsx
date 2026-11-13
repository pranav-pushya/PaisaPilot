import React, { useState } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR, formatFriendlyDate, PAYMENT_MODES } from '../../utils/formatters';
import { CategoryIcon, PaymentModeIcon } from '../common/CategoryIcon';
import { 
  Search, 
  Trash2, 
  Download, 
  ListFilter,
  AlertTriangle,
  X,
  Check
} from 'lucide-react';

export const TransactionList = () => {
  const {
    filteredTransactions,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterPaymentMode,
    setFilterPaymentMode,
    filterType,
    setFilterType,
    categories,
    deleteTransaction,
    clearAllTransactions,
    selectedMonth,
  } = useExpense();

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isConfirmingClearAll, setIsConfirmingClearAll] = useState(false);

  // Export current filtered list to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = ['Date', 'Type', 'Category', 'Description', 'Payment Mode', 'Amount (INR)'];
    const rows = filteredTransactions.map((t) => [
      t.date,
      t.type,
      `"${t.category_name}"`,
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.payment_mode,
      t.amount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PaisaPilot_Transactions_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearAll = async () => {
    await clearAllTransactions();
    setIsConfirmingClearAll(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm">
      
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Transaction Ledger</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {filteredTransactions.length}
            </span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            History of expenses and income for this period
          </p>
        </div>

        {/* Action Buttons: Export & Delete All */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Delete All Button */}
          <button
            onClick={() => setIsConfirmingClearAll(true)}
            disabled={filteredTransactions.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 disabled:opacity-40 transition"
            title="Delete all transactions"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All</span>
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            disabled={filteredTransactions.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-4 pb-4">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search description or category..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Type Filter */}
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Types (Income & Expense)</option>
          <option value="expense">Expense Only</option>
          <option value="income">Income Only</option>
        </select>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Payment Mode Filter */}
        <select
          value={filterPaymentMode}
          onChange={(e) => setFilterPaymentMode(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Payment Modes</option>
          {PAYMENT_MODES.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>

      </div>

      {/* Empty State */}
      {filteredTransactions.length === 0 ? (
        <div className="py-12 text-center">
          <ListFilter className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            No transactions match your criteria
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Try adjusting your search query or filters.
          </p>
        </div>
      ) : (
        <>
          {/* Mobile Card View (visible on < md screens) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-slate-800/60">
            {filteredTransactions.map((tx) => {
              const categoryObj = categories.find((c) => c.name === tx.category_name) || {
                color: '#94a3b8',
                icon: 'Tag',
              };
              const isExpense = tx.type === 'expense';

              return (
                <div key={tx.id} className="py-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: categoryObj.color || '#6366f1' }}
                      >
                        <CategoryIcon iconName={categoryObj.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          {tx.category_name}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {formatFriendlyDate(tx.date)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`font-black text-sm ${
                        isExpense ? 'text-slate-900 dark:text-slate-100' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isExpense ? '-' : '+'} {formatINR(tx.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pl-10.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[200px] text-slate-700 dark:text-slate-300">
                      {tx.description || '-'}
                    </span>

                    <div className="flex items-center space-x-2 shrink-0">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <PaymentModeIcon mode={tx.payment_mode} className="w-3 h-3" />
                        <span>{tx.payment_mode}</span>
                      </span>

                      {confirmDeleteId === tx.id ? (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => {
                              deleteTransaction(tx.id);
                              setConfirmDeleteId(null);
                            }}
                            className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setConfirmDeleteId(tx.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                          title="Delete transaction"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (visible on >= md screens) */}
          <div className="hidden md:block overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredTransactions.map((tx) => {
                  const categoryObj = categories.find((c) => c.name === tx.category_name) || {
                    color: '#94a3b8',
                    icon: 'Tag',
                  };
                  const isExpense = tx.type === 'expense';

                  return (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">
                        {formatFriendlyDate(tx.date)}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: categoryObj.color || '#6366f1' }}
                          >
                            <CategoryIcon iconName={categoryObj.icon} className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {tx.category_name}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-3 max-w-[220px] truncate text-slate-700 dark:text-slate-300 font-medium">
                        {tx.description || '-'}
                      </td>

                      {/* Payment Mode */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          <PaymentModeIcon mode={tx.payment_mode} className="w-3 h-3" />
                          <span>{tx.payment_mode}</span>
                        </span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-right">
                        <span className={`font-bold text-sm ${
                          isExpense ? 'text-slate-900 dark:text-slate-100' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isExpense ? '-' : '+'} {formatINR(tx.amount)}
                        </span>
                      </td>

                      {/* Delete action */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-center">
                        {confirmDeleteId === tx.id ? (
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => {
                                deleteTransaction(tx.id);
                                setConfirmDeleteId(null);
                              }}
                              className="p-1 rounded bg-rose-600 text-white text-[10px] px-1.5 font-bold hover:bg-rose-700"
                              title="Confirm Delete"
                            >
                              Delete
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-[10px] px-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(tx.id)}
                            className="p-1.5 rounded-lg text-slate-300 group-hover:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete Transaction"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Confirmation Modal for Delete All */}
      {isConfirmingClearAll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div 
            className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 text-rose-600 dark:text-rose-400">
              <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Delete All Transactions?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              This will permanently delete all {filteredTransactions.length} transactions from your ledger and connected database. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsConfirmingClearAll(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAll}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition"
              >
                Yes, Delete All
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
