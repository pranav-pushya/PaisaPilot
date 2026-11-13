import React, { useState } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR, formatFriendlyDate } from '../../utils/formatters';
import { CategoryIcon, PaymentModeIcon } from '../common/CategoryIcon';
import { AddTripModal } from './AddTripModal';
import { EditTransactionModal } from '../transactions/EditTransactionModal';
import { 
  Compass, 
  Laptop, 
  Plane, 
  Ticket, 
  Plus, 
  Trash2, 
  ChevronDown, 
  AlertTriangle, 
  CheckCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  Pencil
} from 'lucide-react';

export const TripsSection = ({ onOpenAddExpenseForTrip }) => {
  const { tripStats, deleteTrip, updateTrip, deleteTransaction } = useExpense();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [expandedTripId, setExpandedTripId] = useState(null);
  const [editingTx, setEditingTx] = useState(null);

  const toggleExpand = (id) => {
    setExpandedTripId((prev) => (prev === id ? null : id));
  };

  // Aggregated totals across all trips
  let totalAllotted = 0;
  let totalSpent = 0;
  tripStats.forEach((t) => {
    totalAllotted += Number(t.budget) || 0;
    totalSpent += Number(t.totalSpent) || 0;
  });
  const totalRemaining = totalAllotted - totalSpent;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Trips & Hackathons
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60">
                Separate Event Budgets
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Allot dedicated budgets for travel & hackathons while keeping bank balances unified
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="self-start sm:self-auto flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 shadow-md shadow-violet-600/20 active:scale-95 transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Trip / Hackathon</span>
        </button>
      </div>

      {/* Aggregate KPI Strip */}
      {tripStats.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40">
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Allotted
            </span>
            <h4 className="text-sm sm:text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
              {formatINR(totalAllotted)}
            </h4>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Total Spent
            </span>
            <h4 className="text-sm sm:text-lg font-extrabold text-violet-600 dark:text-violet-400 mt-0.5">
              {formatINR(totalSpent)}
            </h4>
          </div>
          <div>
            <span className="text-[10px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Remaining Buffer
            </span>
            <h4 className={`text-sm sm:text-lg font-extrabold mt-0.5 ${
              totalRemaining >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatINR(totalRemaining)}
            </h4>
          </div>
        </div>
      )}

      {/* Trip Cards List */}
      {tripStats.length === 0 ? (
        <div className="py-12 text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            No active trips or hackathons yet
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Planning a weekend getaway, college fest, or hackathon? Allot a separate budget so your daily living budget stays clean!
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="mt-2 inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Your First Trip Budget</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tripStats.map((trip) => {
            const isHackathon = trip.type === 'hackathon';
            const isTrip = trip.type === 'trip';
            const isExpanded = expandedTripId === trip.id;

            return (
              <div
                key={trip.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-violet-300 dark:hover:border-violet-800/60 transition group"
              >
                {/* Card Top: Type Badge & Status & Delete */}
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                        isHackathon
                          ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300'
                          : isTrip
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {isHackathon ? <Laptop className="w-3 h-3" /> : isTrip ? <Plane className="w-3 h-3" /> : <Ticket className="w-3 h-3" />}
                        <span className="capitalize">{trip.type}</span>
                      </span>

                      <button
                        onClick={() => updateTrip(trip.id, { status: trip.status === 'active' ? 'completed' : 'active' })}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition ${
                          trip.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                        title="Click to toggle status"
                      >
                        {trip.status === 'active' ? 'Active' : 'Completed'}
                      </button>
                    </div>

                    <button
                      onClick={() => deleteTrip(trip.id)}
                      className="p-1 rounded-lg text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete Trip"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Trip Name & Date */}
                  <div className="mt-2.5">
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {trip.name}
                    </h4>
                    <span className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>{trip.startDate} &mdash; {trip.endDate}</span>
                    </span>
                  </div>

                  {/* Budget Meter */}
                  <div className="mt-3.5 space-y-1.5">
                    <div className="flex items-baseline justify-between text-xs">
                      <div>
                        <span className="text-slate-400">Spent: </span>
                        <strong className="text-slate-900 dark:text-white">{formatINR(trip.totalSpent)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400">Allotted: </span>
                        <strong className="text-violet-600 dark:text-violet-400">{formatINR(trip.budget)}</strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          trip.isOverBudget
                            ? 'bg-rose-500'
                            : trip.percentage > 75
                            ? 'bg-amber-500'
                            : 'bg-gradient-to-r from-violet-500 to-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, trip.percentage)}%` }}
                      />
                    </div>

                    {/* Remaining Status Note */}
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={trip.isOverBudget ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}>
                        {trip.isOverBudget
                          ? `Over allotted budget by ${formatINR(Math.abs(trip.remaining))}`
                          : `${formatINR(trip.remaining)} buffer remaining`}
                      </span>
                      <span className="font-semibold text-slate-400">
                        {trip.percentage}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(trip.id)}
                    className="flex items-center space-x-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition"
                  >
                    <span>{trip.transactionCount} Expenses</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenAddExpenseForTrip) {
                        onOpenAddExpenseForTrip(trip);
                      }
                    }}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-100/70 dark:bg-violet-950/60 hover:bg-violet-200/70 dark:hover:bg-violet-900/60 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Expense</span>
                  </button>
                </div>

                {/* Expanded Transactions List */}
                {isExpanded && (
                  <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800 space-y-2 animate-fadeIn">
                    {trip.transactions.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-2">
                        No expenses logged for this event yet.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-200/50 dark:divide-slate-800/60 max-h-48 overflow-y-auto">
                        {trip.transactions.map((tx) => (
                          <div key={tx.id} className="py-2 flex items-center justify-between text-xs">
                            <div className="min-w-0 pr-2">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block truncate">
                                {tx.description || tx.category_name}
                              </span>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-400">
                                <span>{formatFriendlyDate(tx.date)}</span>
                                <span>&bull;</span>
                                <span className="flex items-center space-x-0.5">
                                  <PaymentModeIcon mode={tx.payment_mode} className="w-2.5 h-2.5" />
                                  <span>{tx.payment_mode}</span>
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 shrink-0">
                              <span className="font-bold text-slate-900 dark:text-white">
                                {formatINR(tx.amount)}
                              </span>
                              <button
                                onClick={() => setEditingTx(tx)}
                                className="p-1 rounded text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Edit"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteTransaction(tx.id)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddTripModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

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
