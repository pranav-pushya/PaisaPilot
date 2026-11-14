import { useMemo, useState } from 'react';
import { LockKeyhole, Plus, Target, Trash2 } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR } from '../../utils/formatters';

export function SavingsJars() {
  const { savingsJars, addSavingsJar, updateSavingsJar, deleteSavingsJar, reservedSavings, totalLiquidFunds } = useExpense();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [contribution, setContribution] = useState({});
  const [error, setError] = useState('');
  const available = Math.max(0, (Number(totalLiquidFunds) || 0) - (Number(reservedSavings) || 0));
  const progressFor = useMemo(() => Object.fromEntries(savingsJars.map((jar) => [jar.id, jar.target > 0 ? Math.min(100, Math.round((jar.saved / jar.target) * 100)) : 0])), [savingsJars]);

  const createJar = async (event) => {
    event.preventDefault();
    const added = await addSavingsJar({ name, target });
    if (added) { setName(''); setTarget(''); setError(''); }
    else setError('Add a jar name and a target greater than zero.');
  };

  const moveMoney = async (jar, direction) => {
    const amount = Number(contribution[jar.id] || 100);
    if (!Number.isFinite(amount) || amount <= 0) { setError('Enter an amount greater than zero.'); return; }
    if (direction > 0 && amount > available) { setError(`Only ${formatINR(available)} is available to reserve right now.`); return; }
    if (direction > 0 && amount > jar.target - jar.saved) { setError(`This jar needs only ${formatINR(jar.target - jar.saved)} more to reach its target.`); return; }
    if (direction < 0 && amount > jar.saved) { setError(`You have only ${formatINR(jar.saved)} in this jar.`); return; }
    const moved = await updateSavingsJar(jar.id, direction * amount);
    setError(moved ? '' : 'Could not update this jar.');
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <header className="mb-4 flex items-center gap-3">
        <div className="rounded-xl bg-sky-100 p-2 text-sky-700 dark:bg-sky-950 dark:text-sky-300"><Target className="h-5 w-5" /></div>
        <div><h2 className="font-extrabold text-slate-900 dark:text-white">Micro-Savings Jars</h2><p className="text-xs text-slate-500 dark:text-slate-400">{formatINR(reservedSavings)} set aside · {formatINR(available)} still available</p></div>
      </header>

      <form onSubmit={createJar} className="grid grid-cols-1 gap-2.5 sm:grid-cols-[1fr,150px,auto]">
        <input required maxLength={50} value={name} onChange={(event) => setName(event.target.value)} placeholder="Jar name · Goa trip, earbuds…" className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
        <input required type="number" min="1" step="1" value={target} onChange={(event) => setTarget(event.target.value)} placeholder="Target (₹)" className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-950" />
        <button className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-sky-700"><Plus className="h-4 w-4" /> Create jar</button>
      </form>
      {error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-600 dark:text-rose-300">{error}</p>}

      {savingsJars.length === 0 ? <p className="mt-4 rounded-xl border border-dashed border-slate-300 py-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">Create a jar to start setting aside a little at a time.</p> : <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        {savingsJars.map((jar) => <article key={jar.id} className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-950/60">
          <div className="flex items-start justify-between gap-2"><div className="flex min-w-0 items-center gap-2"><LockKeyhole className="h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300" /><h3 className="truncate text-sm font-bold text-slate-800 dark:text-slate-100">{jar.name}</h3></div><button type="button" onClick={() => jar.saved === 0 && deleteSavingsJar(jar.id)} disabled={jar.saved > 0} aria-label={`Delete ${jar.name}`} title={jar.saved > 0 ? 'Withdraw the saved amount before removing this jar' : 'Remove jar'} className="rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-30 dark:hover:bg-rose-950"><Trash2 className="h-4 w-4" /></button></div>
          <div className="mt-2 flex items-baseline justify-between"><strong className="text-lg font-black text-slate-900 dark:text-white">{formatINR(jar.saved)}</strong><span className="text-xs text-slate-500 dark:text-slate-400">of {formatINR(jar.target)}</span></div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800" role="progressbar" aria-label={`${jar.name} progress`} aria-valuenow={progressFor[jar.id]} aria-valuemin="0" aria-valuemax="100"><div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all" style={{ width: `${progressFor[jar.id]}%` }} /></div>
          <div className="mt-3 flex flex-wrap items-center gap-2"><input aria-label={`Amount for ${jar.name}`} type="number" min="1" step="1" value={contribution[jar.id] ?? 100} onChange={(event) => setContribution((prev) => ({ ...prev, [jar.id]: event.target.value }))} className="w-24 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-900" /><button type="button" onClick={() => moveMoney(jar, 1)} disabled={jar.saved >= jar.target || available <= 0} className="rounded-lg bg-sky-600 px-2.5 py-1.5 text-xs font-bold text-white disabled:opacity-40">Set aside</button>{jar.saved > 0 && <button type="button" onClick={() => moveMoney(jar, -1)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">Take back</button>}</div>
        </article>)}
      </div>}
      <p className="mt-3 text-[11px] text-slate-500 dark:text-slate-400">Jar amounts are earmarked from your available funds and reduce your Survival Meter. Your bank balance changes only when you record an actual transaction.</p>
    </section>
  );
}
