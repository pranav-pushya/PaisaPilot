import { useMemo } from 'react';
import { AlertTriangle, Gauge, ShieldCheck } from 'lucide-react';
import { useExpense } from '../../context/ExpenseContext';
import { formatINR } from '../../utils/formatters';
import { getTodayDateStr } from '../../utils/dateUtils';
import { calculateSurvivalBudget } from '../../utils/survival';

export function SurvivalMeter() {
  const { totalLiquidFunds, reservedSavings, transactions } = useExpense();
  const today = getTodayDateStr();
  const { available, daysLeft, safeDaily, spentToday, overPace } = useMemo(() => {
    const { availableFunds: funds, daysLeft: daysRemaining, safeDailySpend } = calculateSurvivalBudget(totalLiquidFunds, reservedSavings, today);
    const todayExpenses = transactions.reduce((sum, transaction) => {
      const isTransfer = transaction.type === 'transfer' || transaction.category_name === 'Transfer & Cash Swap' || transaction.swap_id;
      return transaction.date === today && transaction.type === 'expense' && !isTransfer
        ? sum + (Number(transaction.amount) || 0)
        : sum;
    }, 0);
    return { available: funds, daysLeft: daysRemaining, safeDaily: safeDailySpend, spentToday: todayExpenses, overPace: todayExpenses > safeDailySpend };
  }, [totalLiquidFunds, reservedSavings, transactions, today]);

  const progress = safeDaily > 0 ? Math.min(100, Math.max(0, (spentToday / safeDaily) * 100)) : (spentToday > 0 ? 100 : 0);

  return (
    <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-4 shadow-sm dark:border-emerald-900/70 dark:from-emerald-950/50 dark:via-slate-900 dark:to-teal-950/30 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600 p-2.5 text-white shadow-sm"><Gauge className="h-5 w-5" /></div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white">Survival Meter</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">A daily pace for the rest of this month</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">Safe daily spend</p>
          <p className="text-2xl font-black tracking-tight text-emerald-700 dark:text-emerald-300">{formatINR(safeDaily)}<span className="ml-1 text-xs font-bold">/ day</span></p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs">
        <p className="font-semibold text-slate-700 dark:text-slate-200">{formatINR(available)} available for {daysLeft} day{daysLeft === 1 ? '' : 's'}</p>
        <p className="text-slate-500 dark:text-slate-400">{formatINR(spentToday)} spent today</p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-emerald-100 dark:bg-slate-800" role="progressbar" aria-label="Today's daily spend pace" aria-valuenow={Math.round(progress)} aria-valuemin="0" aria-valuemax="100">
        <div className={`h-full rounded-full transition-all duration-500 ${overPace ? 'bg-amber-500' : 'bg-gradient-to-r from-emerald-500 to-teal-500'}`} style={{ width: `${progress}%` }} />
      </div>
      <p className={`mt-3 flex items-center gap-1.5 text-xs font-semibold ${overPace ? 'text-amber-700 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
        {overPace ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <ShieldCheck className="h-4 w-4 shrink-0" />}
        {overPace
          ? `A little over today’s pace. Your daily guide will adjust to ${formatINR(safeDaily)} for the days ahead.`
          : 'You’re on track. Log spending as it happens to keep this guide current.'}
      </p>
    </section>
  );
}
