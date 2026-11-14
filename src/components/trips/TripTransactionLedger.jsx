import React, { useState, useMemo } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR, formatFriendlyDate, PAYMENT_MODES } from '../../utils/formatters';
import { CategoryIcon, PaymentModeIcon } from '../common/CategoryIcon';
import { EditTransactionModal } from '../transactions/EditTransactionModal';
import { 
  Compass, 
  Search, 
  Trash2, 
  Download, 
  ListFilter, 
  Pencil, 
  Plus, 
  AlertTriangle, 
  Calendar,
  Laptop,
  Plane,
  Receipt,
  Tag,
  CreditCard
} from 'lucide-react';

export const TripTransactionLedger = ({ onOpenAddExpenseForTrip }) => {
  const {
    transactions,
    trips,
    categories,
    deleteTransaction,
  } = useExpense();

  const [selectedTripId, setSelectedTripId] = useState('all'); // 'all' or specific trip.id
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMode, setFilterPaymentMode] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [isConfirmingClearTrip, setIsConfirmingClearTrip] = useState(false);
  const [editingTx, setEditingTx] = useState(null);

  // All trip-tagged transactions
  const allTripTransactions = useMemo(() => {
    return transactions.filter((t) => Boolean(t.trip_id));
  }, [transactions]);

  // Filtered by selected trip, search, category, and payment mode
  const filteredTripTransactions = useMemo(() => {
    return allTripTransactions.filter((tx) => {
      // 1. Trip filter
      if (selectedTripId !== 'all' && tx.trip_id !== selectedTripId) {
        return false;
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = (tx.description || '').toLowerCase().includes(query);
        const matchesCat = (tx.category_name || '').toLowerCase().includes(query);
        const matchesTrip = (tx.trip_name || '').toLowerCase().includes(query);
        if (!matchesDesc && !matchesCat && !matchesTrip) return false;
      }

      // 3. Category filter
      if (filterCategory !== 'all' && tx.category_name !== filterCategory) {
        return false;
      }

      // 4. Payment mode filter
      if (filterPaymentMode !== 'all' && tx.payment_mode !== filterPaymentMode) {
        return false;
      }

      return true;
    });
  }, [allTripTransactions, selectedTripId, searchQuery, filterCategory, filterPaymentMode]);

  // Active trip object if a specific one is selected
  const activeTrip = useMemo(() => {
    if (selectedTripId === 'all') return null;
    return trips.find((t) => t.id === selectedTripId) || null;
  }, [trips, selectedTripId]);

  // Total spend for current filter view
  const totalViewSpend = useMemo(() => {
    return filteredTripTransactions.reduce((acc, t) => {
      return t.type === 'expense' ? acc + Number(t.amount || 0) : acc;
    }, 0);
  }, [filteredTripTransactions]);

  // Export current trip ledger to CSV
  const handleExportCSV = () => {
    if (filteredTripTransactions.length === 0) return;

    const tripLabel = activeTrip ? activeTrip.name.replace(/\s+/g, '_') : 'All_Trips_Hackathons';
    const headers = ['Date', 'Event / Trip', 'Category', 'Description', 'Payment Mode', 'Amount (INR)'];
    const quote = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = filteredTripTransactions.map((t) => [
      t.date,
      quote(t.trip_name || 'Trip Expense'),
      quote(t.category_name),
      quote(t.description),
      t.payment_mode,
      t.amount,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `PaisaPilot_${tripLabel}_Expenses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Delete all transactions for the currently viewed trip(s)
  const handleClearTripExpenses = async () => {
    const toDelete = filteredTripTransactions.map((t) => t.id);
    for (const id of toDelete) {
      await deleteTransaction(id);
    }
    setIsConfirmingClearTrip(false);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4 sm:space-y-5">
      
      {/* Ledger Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Trips & Hackathons Ledger
              </h3>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300">
                {filteredTripTransactions.length} expenses
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Dedicated transaction log separated from your regular daily living expenses
            </p>
          </div>
        </div>

        {/* Action Buttons: Add, Export, Clear */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Add Expense Button */}
          <button
            onClick={() => {
              if (onOpenAddExpenseForTrip) {
                onOpenAddExpenseForTrip(activeTrip || trips[0] || null);
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-600/20 active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event Expense</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            disabled={filteredTripTransactions.length === 0}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition"
            title="Download CSV for reimbursement or splitting"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Event CSV</span>
          </button>

          {/* Delete All for this Trip */}
          {filteredTripTransactions.length > 0 && (
            <button
              onClick={() => setIsConfirmingClearTrip(true)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 transition"
              title="Delete all transactions in current view"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Event Switcher Tabs / Filter Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {/* All Events Pill */}
        <button
          onClick={() => setSelectedTripId('all')}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 shrink-0 ${
            selectedTripId === 'all'
              ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>All Events ({allTripTransactions.length})</span>
        </button>

        {/* Individual Trip Pills */}
        {trips.map((trip) => {
          const tripTxCount = allTripTransactions.filter((t) => t.trip_id === trip.id).length;
          const isSelected = selectedTripId === trip.id;
          const isHackathon = trip.type === 'hackathon';

          return (
            <button
              key={trip.id}
              onClick={() => setSelectedTripId(trip.id)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition active:scale-95 shrink-0 ${
                isSelected
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/25 ring-2 ring-violet-400/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-700 border border-slate-200/60 dark:border-slate-700/60'
              }`}
            >
              {isHackathon ? (
                <Laptop className="w-3.5 h-3.5 text-indigo-400" />
              ) : (
                <Plane className="w-3.5 h-3.5 text-violet-400" />
              )}
              <span>{trip.name}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                isSelected ? 'bg-violet-800 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}>
                {tripTxCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Trip Banner if a single trip is picked */}
      {activeTrip && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-violet-50/70 to-indigo-50/50 dark:from-violet-950/30 dark:to-indigo-950/20 border border-violet-100 dark:border-violet-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                {activeTrip.name}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300">
                {activeTrip.type}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center space-x-2">
              <Calendar className="w-3 h-3 text-slate-400" />
              <span>{activeTrip.startDate} &rarr; {activeTrip.endDate}</span>
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Allotted Budget</span>
              <span className="text-slate-900 dark:text-white font-bold">{formatINR(activeTrip.budget)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Total Spent</span>
              <span className="text-violet-600 dark:text-violet-400 font-extrabold">{formatINR(totalViewSpend)}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px] uppercase">Buffer</span>
              <span className={`font-extrabold ${activeTrip.budget - totalViewSpend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                {formatINR(activeTrip.budget - totalViewSpend)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 pb-1">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event expenses..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        {/* Category Filter */}
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id || c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>

        {/* Payment Mode Filter */}
        <select
          value={filterPaymentMode}
          onChange={(e) => setFilterPaymentMode(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-2 focus:ring-violet-500"
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
      {filteredTripTransactions.length === 0 ? (
        <div className="py-10 text-center rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
          <Compass className="w-8 h-8 text-violet-400 dark:text-violet-600 mx-auto mb-2 opacity-80" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            No expenses logged for this event
          </p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {allTripTransactions.length === 0 
              ? 'Trip expenses logged here deduct from your payment balances but are tracked against your event budget.'
              : 'Try clearing your search query or selecting another event above.'}
          </p>
          <button
            onClick={() => {
              if (onOpenAddExpenseForTrip) {
                onOpenAddExpenseForTrip(activeTrip || trips[0] || null);
              }
            }}
            className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/60 hover:bg-violet-100 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Expense Now</span>
          </button>
        </div>
      ) : (
        <>
          {/* Mobile Card View (visible on < md screens) */}
          <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredTripTransactions.map((tx) => {
              const categoryObj = categories.find((c) => c.name === tx.category_name) || {
                color: '#8b5cf6',
                icon: 'Tag',
              };

              return (
                <div key={tx.id} className="py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <div 
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                        style={{ backgroundColor: categoryObj.color || '#8b5cf6' }}
                      >
                        <CategoryIcon iconName={categoryObj.icon} className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {tx.category_name}
                          </h4>
                          {tx.trip_name && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60 truncate max-w-[110px]">
                              {tx.trip_name}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {formatFriendlyDate(tx.date)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                        - {formatINR(tx.amount)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pl-10.5 text-xs text-slate-500 dark:text-slate-400">
                    <span className="truncate max-w-[180px] text-slate-700 dark:text-slate-300">
                      {tx.description || '-'}
                    </span>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        <PaymentModeIcon mode={tx.payment_mode} className="w-3 h-3" />
                        <span>{tx.payment_mode}</span>
                      </span>

                      {/* Edit Button */}
                      <button
                        onClick={() => setEditingTx(tx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition"
                        title="Edit trip transaction"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
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
                          title="Delete trip transaction"
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
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Event / Trip</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {filteredTripTransactions.map((tx) => {
                  const categoryObj = categories.find((c) => c.name === tx.category_name) || {
                    color: '#8b5cf6',
                    icon: 'Tag',
                  };

                  return (
                    <tr 
                      key={tx.id} 
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Date */}
                      <td className="py-3.5 px-3 whitespace-nowrap text-slate-500 dark:text-slate-400 font-medium">
                        {formatFriendlyDate(tx.date)}
                      </td>

                      {/* Event / Trip Badge */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/60">
                          <Compass className="w-3 h-3 text-violet-500" />
                          <span>{tx.trip_name || 'Event'}</span>
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: categoryObj.color || '#8b5cf6' }}
                          >
                            <CategoryIcon iconName={categoryObj.icon} className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {tx.category_name}
                          </span>
                        </div>
                      </td>

                      {/* Description */}
                      <td className="py-3.5 px-3 max-w-[200px] truncate text-slate-700 dark:text-slate-300 font-medium">
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
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          - {formatINR(tx.amount)}
                        </span>
                      </td>

                      {/* Action: Edit & Delete */}
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
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => setEditingTx(tx)}
                              className="p-1.5 rounded-lg text-slate-300 group-hover:text-slate-500 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition"
                              title="Edit Transaction"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(tx.id)}
                              className="p-1.5 rounded-lg text-slate-300 group-hover:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="Delete Transaction"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* Confirmation Modal for Clear Trip Expenses */}
      {isConfirmingClearTrip && (
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
                Clear Event Expenses?
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              This will permanently delete all {filteredTripTransactions.length} expenses tagged to {activeTrip ? `"${activeTrip.name}"` : 'your trips & hackathons'}. This action cannot be undone.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setIsConfirmingClearTrip(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleClearTripExpenses}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 transition"
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTx && (
        <EditTransactionModal
          isOpen={Boolean(editingTx)}
          transaction={editingTx}
          onClose={() => setEditingTx(null)}
        />
      )}
    </div>
  );
};
