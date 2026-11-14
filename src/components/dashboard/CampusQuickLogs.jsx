import { useState } from 'react';
import { LoaderCircle, Plus, Settings2, X } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { PAYMENT_MODES, formatINR } from '../../utils/formatters';
import { getTodayDateStr } from '../../utils/dateUtils';

export function CampusQuickLogs() {
  const { quickActions, saveQuickActions, addTransaction } = useExpense();
  const [customizing, setCustomizing] = useState(false);
  const [draft, setDraft] = useState(quickActions);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');

  const logAction = async (action) => {
    if (busyId) return;
    setBusyId(action.id);
    setMessage('');
    try {
      await addTransaction({
        amount: action.amount,
        type: 'expense',
        category_name: action.category_name,
        payment_mode: action.payment_mode,
        description: `${action.label} · quick log`,
        date: getTodayDateStr(),
      });
      setMessage(`${action.label} logged`);
    } catch (error) {
      setMessage(`Couldn’t log ${action.label}. Try again.`);
      console.error('Quick log failed:', error);
    } finally {
      setBusyId(null);
    }
  };

  const updateDraft = (id, field, value) => setDraft((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const addDraft = () => setDraft((items) => [...items, { id: `quick-${Date.now()}`, icon: '✨', label: '', amount: '', category_name: 'Food & Dining', payment_mode: 'UPI' }]);
  const saveDraft = async () => {
    const valid = draft.filter((item) => item.label.trim() && Number(item.amount) > 0)
      .map((item) => ({ ...item, label: item.label.trim(), amount: Number(item.amount) }));
    if (!valid.length) return;
    await saveQuickActions(valid);
    setDraft(valid);
    setCustomizing(false);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <header className="mb-3 flex items-center justify-between gap-3">
        <div><h2 className="font-extrabold text-slate-900 dark:text-white">Campus Quick Logs</h2><p className="text-xs text-slate-500 dark:text-slate-400">Tap once to record a small expense</p></div>
        <button type="button" onClick={() => { setDraft(quickActions); setCustomizing((open) => !open); }} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"><Settings2 className="h-3.5 w-3.5" /> Customize</button>
      </header>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1" aria-label="Quick expense actions">
        {quickActions.map((action) => <button key={action.id} type="button" disabled={Boolean(busyId)} onClick={() => logAction(action)} className="flex min-w-[120px] shrink-0 flex-col items-start rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50 active:scale-[.98] disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-indigo-700 dark:hover:bg-indigo-950/40">
          <span className="text-xl leading-none">{busyId === action.id ? <LoaderCircle className="h-5 w-5 animate-spin text-indigo-600" /> : action.icon}</span>
          <span className="mt-2 max-w-full truncate text-xs font-bold text-slate-800 dark:text-slate-100">{action.label}</span>
          <span className="mt-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">{formatINR(action.amount)} · {action.payment_mode}</span>
        </button>)}
        <button type="button" onClick={() => { setCustomizing(true); addDraft(); }} className="flex min-w-[92px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-indigo-300 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/30"><Plus className="mb-1 h-4 w-4" /> Add log</button>
      </div>
      {message && <p aria-live="polite" className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{message}</p>}

      {customizing && <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-950">
        <div className="flex items-center justify-between"><p className="text-xs font-bold text-slate-700 dark:text-slate-200">Edit your quick actions</p><button type="button" onClick={() => setCustomizing(false)} aria-label="Close quick log editor" className="rounded-md p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"><X className="h-4 w-4" /></button></div>
        {draft.map((item) => <div key={item.id} className="grid grid-cols-2 gap-2 sm:grid-cols-[54px,1.3fr,90px,1fr,1fr,32px]">
          <input aria-label="Icon" maxLength={4} value={item.icon} onChange={(event) => updateDraft(item.id, 'icon', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-center text-sm dark:border-slate-700 dark:bg-slate-900" />
          <input aria-label="Quick log name" maxLength={32} value={item.label} onChange={(event) => updateDraft(item.id, 'label', event.target.value)} placeholder="Name" className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900" />
          <input aria-label="Quick log amount" type="number" min="1" step="1" value={item.amount} onChange={(event) => updateDraft(item.id, 'amount', event.target.value)} placeholder="₹ amount" className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900" />
          <select aria-label="Quick log category" value={item.category_name} onChange={(event) => updateDraft(item.id, 'category_name', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900"><option>Food & Dining</option><option>Education & Supplies</option><option>Transport & Fuel</option><option>Shopping</option><option>Personal Care</option></select>
          <select aria-label="Quick log payment mode" value={item.payment_mode} onChange={(event) => updateDraft(item.id, 'payment_mode', event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-xs dark:border-slate-700 dark:bg-slate-900">{PAYMENT_MODES.map((mode) => <option key={mode}>{mode}</option>)}</select>
          <button type="button" aria-label={`Remove ${item.label || 'quick action'}`} onClick={() => setDraft((items) => items.filter((action) => action.id !== item.id))} className="rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"><X className="mx-auto h-4 w-4" /></button>
        </div>)}
        <div className="flex flex-wrap justify-between gap-2"><button type="button" onClick={addDraft} className="text-xs font-bold text-indigo-700 hover:underline dark:text-indigo-300">+ Add another</button><button type="button" onClick={saveDraft} disabled={!draft.some((item) => item.label.trim() && Number(item.amount) > 0)} className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save actions</button></div>
      </div>}
    </section>
  );
}
