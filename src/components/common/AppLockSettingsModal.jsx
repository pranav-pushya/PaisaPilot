import React, { useState } from 'react';
import { LockKeyhole, ShieldCheck } from 'lucide-react';

const pinField = (label, value, onChange, name) => (
  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
    {label}
    <input name={name} type="password" inputMode="numeric" pattern="[0-9]*" autoComplete="new-password" maxLength={6} value={value} onChange={(event) => onChange(event.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-base tracking-[0.35em] text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-950 dark:text-white" />
  </label>
);

export function AppLockSettingsModal({ config, onSave, onDisable, onClose }) {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [idleMinutes, setIdleMinutes] = useState(config?.idleMinutes || 1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSave = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await onSave({ currentPin, newPin, confirmPin, idleMinutes });
    } catch (saveError) {
      setError(saveError.message || 'Could not save app lock settings.');
    } finally {
      setBusy(false);
    }
  };

  const handleDisable = async () => {
    setError('');
    setBusy(true);
    try {
      await onDisable(currentPin);
    } catch (disableError) {
      setError(disableError.message || 'Could not turn off app lock.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/60 p-0 backdrop-blur-sm sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="app-lock-settings-title" className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:rounded-3xl sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-300"><LockKeyhole className="h-5 w-5" /></div>
          <div className="flex-1">
            <h2 id="app-lock-settings-title" className="text-lg font-extrabold text-slate-900 dark:text-white">{config ? 'App lock settings' : 'Set up app lock'}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your PIN stays on this device. Choose when the app locks after inactivity.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close app lock settings" className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">✕</button>
        </div>

        <form onSubmit={handleSave} className="mt-5 space-y-4">
          {config && pinField('Current PIN', currentPin, setCurrentPin, 'current-pin')}
          {pinField(config ? 'New PIN (optional)' : 'Create 6-digit PIN', newPin, setNewPin, 'new-pin')}
          {(!config || newPin) && pinField('Confirm PIN', confirmPin, setConfirmPin, 'confirm-pin')}
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Lock after inactivity
            <select value={idleMinutes} onChange={(event) => setIdleMinutes(Number(event.target.value))} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white">
              <option value={1}>1 minute</option><option value={5}>5 minutes</option><option value={15}>15 minutes</option>
            </select>
          </label>
          <div className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"><ShieldCheck className="mr-1 inline h-3.5 w-3.5" />App lock is a privacy screen. Your saved finance data is not encrypted by this PIN.</div>
          <p role="alert" className="min-h-5 text-sm text-rose-600 dark:text-rose-400">{error}</p>
          <div className="flex gap-2 pb-[env(safe-area-inset-bottom)]">
            {config && <button type="button" onClick={handleDisable} disabled={busy} className="rounded-xl border border-rose-200 px-3 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/40">Turn off</button>}
            <button type="submit" disabled={busy} className="flex-1 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:opacity-50">{busy ? 'Saving…' : config ? 'Save settings' : 'Set PIN'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
