import { BarChart3, LayoutDashboard, List, Wallet } from 'lucide-react';

const links = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: List },
  { id: 'trips', label: 'Trips & events', icon: BarChart3 },
];

export function AppSidebar({ activeView, onNavigate }) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav aria-label="Main sidebar" className="sticky top-24 space-y-1 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 px-2 pt-1 text-[10px] font-extrabold uppercase tracking-[.16em] text-slate-400"><Wallet className="h-3.5 w-3.5" /> PaisaPilot</div>
        {links.map(({ id, label, icon: Icon }) => <button key={id} type="button" aria-current={activeView === id ? 'page' : undefined} onClick={() => onNavigate(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-bold transition ${activeView === id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'}`}><Icon className="h-4 w-4 shrink-0" />{label}</button>)}
      </nav>
    </aside>
  );
}
