import { useEffect, useMemo, useState } from 'react';
import { Hourglass, ShoppingBag, Trash2 } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR } from '../../utils/formatters';
import { getFundsAfterPurchase, getImpulseTimeState } from '../../utils/impulseVault';

export function ImpulseVault() {
  const { impulseItems, addImpulseItem, dismissImpulseItem, purchaseImpulseItem, totalLiquidFunds, reservedSavings } = useExpense();
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [cooldownHours, setCooldownHours] = useState(24);
  const [now, setNow] = useState(Date.now());
  const [busyId, setBusyId] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const available = Math.max(0, (Number(totalLiquidFunds) || 0) - (Number(reservedSavings) || 0));
  const sortedItems = useMemo(() => [...impulseItems].sort((a, b) => new Date(a.unlock_at) - new Date(b.unlock_at)), [impulseItems]);

  const submitWish = async (event) => {
    event.preventDefault();
    const added = await addImpulseItem({ name, amount, cooldownHours });
    if (added) {
      setName('');
      setAmount('');
      setMessage('Added to your cool-off list. Give it some time.');
    }
  };

  const buyItem = async (item) => {
    setBusyId(item.id);
    setMessage('');
    try {
      const purchased = await purchaseImpulseItem(item);
      setMessage(purchased ? `${item.name} was logged as an expense.` : 'This item is still in its cool-off period.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <header className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-amber-100 p-2 text-amber-700 dark:bg-amber-950 dark:text-amber-300"><Hourglass className="h-5 w-5" /></div>
        <div><h2 className="font-extrabold text-slate-900 dark:text-white">Impulse Vault</h2><p className="text-xs text-slate-500 dark:text-slate-400">Give non-essential buys a little breathing room</p></div>
      </header>

      <form onSubmit={submitWish} className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr,130px,125px,auto]">
        <input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="What are you thinking of buying?" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
        <input required type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Price (₹)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
        <select value={cooldownHours} onChange={(event) => setCooldownHours(Number(event.target.value))} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950"><option value="24">Wait 24 hours</option><option value="48">Wait 48 hours</option></select>
        <button className="rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-600">Add to vault</button>
      </form>
      {message && <p aria-live="polite" className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{message}</p>}

      {sortedItems.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-slate-300 py-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Nothing waiting in your vault. Add a purchase you’re considering.</p> : <div className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
        {sortedItems.map((item) => {
          const cooldown = getImpulseTimeState(item.unlock_at, now);
          const afterPurchase = getFundsAfterPurchase(available, item.amount);
          return <article key={item.id} className="py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1"><h3 className="font-bold text-slate-800 dark:text-slate-100">{item.name}</h3><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{formatINR(item.amount)} · {cooldown.label}</p></div>
              <button type="button" onClick={() => dismissImpulseItem(item.id)} aria-label={`Remove ${item.name} from vault`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"><Trash2 className="h-4 w-4" /></button>
            </div>
            {cooldown.unlocked && <div className={`mt-3 rounded-xl p-3 text-xs ${afterPurchase < 0 ? 'bg-rose-50 text-rose-800 dark:bg-rose-950/50 dark:text-rose-200' : 'bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'}`}>
              <p className="font-semibold">You have {formatINR(available)} available for the rest of this month. Buying this leaves {formatINR(afterPurchase)}. Do you still want it?</p>
              <div className="mt-2 flex flex-wrap gap-2"><button type="button" disabled={busyId === item.id} onClick={() => buyItem(item)} className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 font-bold text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-white dark:text-slate-900"><ShoppingBag className="h-3.5 w-3.5" /> {busyId === item.id ? 'Logging…' : 'Still want it · log buy'}</button><button type="button" onClick={() => dismissImpulseItem(item.id)} className="rounded-lg border border-current/20 px-3 py-2 font-bold">Skip it</button></div>
            </div>}
          </article>;
        })}
      </div>}
    </section>
  );
}
