import { useMemo, useState } from 'react';
import { CalendarClock, Check, Plus, RefreshCw } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { PAYMENT_MODES } from '../../utils/formatters';
import { formatINR } from '../../utils/formatters';
import { getTodayDateStr } from '../../utils/dateUtils';
import { daysUntilDate } from '../../utils/recurrence';

const todayString = () => getTodayDateStr();

export function RecurringBills() {
  const { recurringRules, categories, addRecurringRule, recordRecurringRule, toggleRecurringRule } = useExpense();
  const [isAdding, setIsAdding] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [form, setForm] = useState({
    description: '', amount: '', type: 'expense', category_name: 'Rent & Utilities',
    payment_mode: 'UPI', frequency: 'monthly', next_due: todayString(),
  });
  const categoryOptions = useMemo(() => categories.filter((category) => category.type === form.type), [categories, form.type]);
  const sortedRules = useMemo(() => [...recurringRules].sort((a, b) => a.next_due.localeCompare(b.next_due)), [recurringRules]);

  const handleTypeChange = (type) => {
    const nextCategory = categories.find((category) => category.type === type)?.name || '';
    setForm((current) => ({ ...current, type, category_name: nextCategory }));
  };

  const handleAdd = async (event) => {
    event.preventDefault();
    const added = await addRecurringRule(form);
    if (added) {
      setForm({ description: '', amount: '', type: 'expense', category_name: 'Rent & Utilities', payment_mode: 'UPI', frequency: 'monthly', next_due: todayString() });
      setIsAdding(false);
    }
  };

  const handleRecord = async (rule) => {
    setBusyId(rule.id);
    try {
      await recordRecurringRule(rule.id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"><CalendarClock className="h-5 w-5" /></div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white">Recurring bills & income</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Keep regular payments on schedule</p>
          </div>
        </div>
        <button type="button" onClick={() => setIsAdding((open) => !open)} className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> Add
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950 sm:grid-cols-2 lg:grid-cols-4">
          <input required maxLength={100} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Bill or income name" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input required min="0.01" step="0.01" type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} placeholder="Amount (₹)" className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          <select value={form.type} onChange={(event) => handleTypeChange(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="expense">Bill / expense</option><option value="income">Regular income</option>
          </select>
          <select value={form.category_name} onChange={(event) => setForm({ ...form, category_name: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            {categoryOptions.map((category) => <option key={category.id || category.name} value={category.name}>{category.name}</option>)}
          </select>
          <select value={form.payment_mode} onChange={(event) => setForm({ ...form, payment_mode: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            {PAYMENT_MODES.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
          <select value={form.frequency} onChange={(event) => setForm({ ...form, frequency: event.target.value })} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900">
            <option value="weekly">Weekly</option><option value="monthly">Monthly</option><option value="yearly">Yearly</option>
          </select>
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Next due
            <input required type="date" value={form.next_due} onChange={(event) => setForm({ ...form, next_due: event.target.value })} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
          </label>
          <button type="submit" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700">Save reminder</button>
        </form>
      )}

      {sortedRules.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-7 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          No recurring items yet. Add rent, subscriptions, or regular income.
        </div>
      ) : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {sortedRules.map((rule) => {
            const dueIn = daysUntilDate(rule.next_due, todayString());
            const dueLabel = dueIn < 0 ? `${Math.abs(dueIn)} days overdue` : dueIn === 0 ? 'Due today' : `Due in ${dueIn} day${dueIn === 1 ? '' : 's'}`;
            return (
              <div key={rule.id} className={`flex flex-wrap items-center justify-between gap-3 py-3 ${rule.active ? '' : 'opacity-55'}`}>
                <div className="min-w-[150px] flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{rule.description || rule.category_name}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${rule.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'}`}>{rule.type}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {rule.category_name} · {rule.payment_mode} · {rule.frequency} · {rule.active ? dueLabel : 'Paused'}
                  </p>
                </div>
                <strong className="text-sm text-slate-900 dark:text-white">{formatINR(rule.amount)}</strong>
                {rule.active && (
                  <button type="button" disabled={busyId === rule.id} onClick={() => handleRecord(rule)} className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-950">
                    {busyId === rule.id ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Log payment
                  </button>
                )}
                <button type="button" onClick={() => toggleRecurringRule(rule.id)} className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white">{rule.active ? 'Pause' : 'Resume'}</button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
