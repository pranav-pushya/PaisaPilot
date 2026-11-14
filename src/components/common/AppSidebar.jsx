import { Wallet, CalendarClock, HandCoins, Coffee, Hourglass, PiggyBank } from 'lucide-react';

const financeLinks = [
  { id: 'feature-recurring', label: 'Recurring bills & income', icon: CalendarClock },
  { id: 'feature-udhaar', label: 'Quick Udhaar ledger', icon: HandCoins },
  { id: 'feature-quick-logs', label: 'Campus Quick Logs', icon: Coffee },
  { id: 'feature-impulse', label: 'Impulse Vault', icon: Hourglass },
  { id: 'feature-savings', label: 'Micro-Savings Jars', icon: PiggyBank },
];

export function AppSidebar({ activeView, onNavigate }) {
  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <nav aria-label="Main sidebar" className="sticky top-24 max-h-[calc(100dvh-7rem)] space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 px-2 pt-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400"><Wallet className="h-3.5 w-3.5" /> PaisaPilot</div>
        <div className="my-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <p className="mb-2 px-3 text-[10px] font-extrabold uppercase tracking-[.14em] text-slate-400">Finance tools</p>
          {financeLinks.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={activeView === id ? 'page' : undefined} onClick={() => onNavigate(id)} className={`flex w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-bold leading-snug transition ${activeView === id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700 dark:text-slate-300 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-300'}`}><Icon className={`mt-0.5 h-4 w-4 shrink-0 ${activeView === id ? 'text-white' : ''}`} />{label}</button>)}
        </div>
      </nav>
    </aside>
  );
}
