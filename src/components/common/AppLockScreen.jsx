import React, { useEffect, useRef, useState } from 'react';
import { LockKeyhole } from 'lucide-react';

export function AppLockScreen({ unlockApp, cooldownUntil }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef(null);
  const coolingDown = cooldownUntil > now;

  useEffect(() => {
    inputRef.current?.focus();
    if (!coolingDown) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [coolingDown]);

  const submit = async (event) => {
    event.preventDefault();
    if (coolingDown || pin.length !== 6) return;
    const valid = await unlockApp(pin);
    if (!valid) {
      setError('That PIN did not match. Try again.');
      setPin('');
      inputRef.current?.focus();
      return;
    }
    setError('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center bg-slate-950 px-5 py-8 text-white" role="dialog" aria-modal="true" aria-labelledby="app-lock-title">
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-300">
          <LockKeyhole className="h-7 w-7" aria-hidden="true" />
        </div>
        <h1 id="app-lock-title" className="text-center text-2xl font-extrabold">PaisaPilot is locked</h1>
        <p className="mt-2 text-center text-sm text-slate-400">Enter your 6-digit PIN to view this device’s app.</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <label htmlFor="app-lock-pin" className="sr-only">6-digit app PIN</label>
          <input
            ref={inputRef}
            id="app-lock-pin"
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={(event) => { setPin(event.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            placeholder="••••••"
            aria-describedby="app-lock-message"
            className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-4 text-center text-2xl tracking-[0.6em] text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
          />
          <p id="app-lock-message" role="status" className="min-h-5 text-center text-sm text-rose-300">
            {coolingDown ? `Too many attempts. Try again in ${Math.ceil((cooldownUntil - now) / 1000)} seconds.` : error}
          </p>
          <button type="submit" disabled={pin.length !== 6 || coolingDown} className="w-full rounded-2xl bg-indigo-600 px-4 py-3.5 font-bold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
            Unlock app
          </button>
        </form>
        <p className="mt-5 text-center text-xs leading-relaxed text-slate-500">This PIN lock protects the app screen on this device. It does not encrypt locally saved data.</p>
      </div>
    </div>
  );
}
