import React, { useState } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { getTodayDateStr } from '../../utils/dateUtils';
import { X, Plus, Compass, Laptop, Plane, Ticket, Calendar, Check } from 'lucide-react';

export const AddTripModal = ({ isOpen, onClose, onCreated }) => {
  const { addTrip } = useExpense();

  const [name, setName] = useState('');
  const [type, setType] = useState('hackathon'); // 'hackathon' | 'trip' | 'event'
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(getTodayDateStr());
  const [endDate, setEndDate] = useState(getTodayDateStr());
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a name for this trip or hackathon');
      return;
    }
    if (!budget || Number(budget) <= 0) {
      setError('Please set an allotted budget amount');
      return;
    }

    const newTrip = {
      name: name.trim(),
      type,
      budget: parseFloat(budget),
      startDate,
      endDate,
      status: 'active',
    };

    addTrip(newTrip);
    if (onCreated) onCreated(newTrip);

    setName('');
    setBudget('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Allot Budget for Trip / Hackathon
              </h3>
              <p className="text-[11px] text-slate-400">
                Track event spending separately while unified with your accounts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Type Selector */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
            <button
              type="button"
              onClick={() => setType('hackathon')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center space-y-1 transition ${
                type === 'hackathon'
                  ? 'bg-white dark:bg-slate-900 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span>Hackathon</span>
            </button>
            <button
              type="button"
              onClick={() => setType('trip')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center space-y-1 transition ${
                type === 'trip'
                  ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Plane className="w-4 h-4" />
              <span>Trip / Tour</span>
            </button>
            <button
              type="button"
              onClick={() => setType('event')}
              className={`py-2 px-2 rounded-xl text-xs font-bold flex flex-col items-center space-y-1 transition ${
                type === 'event'
                  ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Ticket className="w-4 h-4" />
              <span>Event / Fest</span>
            </button>
          </div>

          {/* Event Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Event or Trip Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError('');
              }}
              placeholder={type === 'hackathon' ? 'e.g. Smart India Hackathon, ETHIndia' : 'e.g. Goa Trip, Manali Trek, College Fest'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              autoFocus
            />
          </div>

          {/* Allotted Budget Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Allotted Budget (₹)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center font-bold text-slate-400 text-base">
                ₹
              </span>
              <input
                type="number"
                min="0"
                step="100"
                required
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  if (error) setError('');
                }}
                placeholder="e.g. 8000"
                className="w-full pl-8 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              How much total money do you plan to spend specifically on this {type}?
            </p>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
          </div>

          {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}

          {/* Footer Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-600/25 active:scale-95 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Event Budget</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
