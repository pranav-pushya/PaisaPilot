import { useMemo, useState } from 'react';
import { Check, MessageCircle, WalletCards } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR } from '../../utils/formatters';
import { buildWhatsAppReminderUrl } from '../../utils/udhaar';

export function ReceivablesLedger() {
  const { receivables, markReceivablePaid, upiId, saveUpiId } = useExpense();
  const [upiDraft, setUpiDraft] = useState(upiId);
  const [editingUpi, setEditingUpi] = useState(false);
  const pending = useMemo(() => receivables.filter((item) => item.status === 'pending'), [receivables]);
  const pendingTotal = pending.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const saveUpi = async (event) => {
    event.preventDefault();
    await saveUpiId(upiDraft);
    setEditingUpi(false);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-100 p-2 text-violet-700 dark:bg-violet-950 dark:text-violet-300"><WalletCards className="h-5 w-5" /></div>
          <div><h2 className="font-extrabold text-slate-900 dark:text-white">Quick Udhaar ledger</h2><p className="text-xs text-slate-500 dark:text-slate-400">{pending.length} pending · {formatINR(pendingTotal)} coming back</p></div>
        </div>
        {editingUpi ? <form onSubmit={saveUpi} className="flex w-full gap-2 sm:w-auto">
          <input aria-label="Your UPI ID" value={upiDraft} onChange={(event) => setUpiDraft(event.target.value)} placeholder="yourname@upi" className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs dark:border-slate-700 dark:bg-slate-950 sm:w-40" />
          <button className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-bold text-white">Save UPI</button>
        </form> : <button type="button" onClick={() => { setUpiDraft(upiId); setEditingUpi(true); }} className="text-xs font-bold text-violet-700 hover:underline dark:text-violet-300">{upiId ? `UPI: ${upiId}` : 'Add your UPI ID'}</button>}
      </header>

      {pending.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">No one owes you right now. Add a split when you record a shared expense.</div> : (
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {pending.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-3 py-3">
            <div className="min-w-0 flex-1"><p className="font-bold text-slate-800 dark:text-slate-100">{item.name} <span className="font-normal text-slate-500">owes</span> {formatINR(item.amount)}</p><p className="truncate text-xs text-slate-500 dark:text-slate-400">{item.description} · {item.date}</p></div>
            <a href={buildWhatsAppReminderUrl(item, upiId)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 px-2.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-950"><MessageCircle className="h-3.5 w-3.5" /> WhatsApp</a>
            <button type="button" onClick={() => markReceivablePaid(item.id)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"><Check className="h-3.5 w-3.5" /> Paid</button>
          </div>)}
        </div>
      )}
    </section>
  );
}
