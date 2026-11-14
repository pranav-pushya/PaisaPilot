import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { AppLockScreen } from '../components/common/AppLockScreen';
import { AppLockSettingsModal } from '../components/common/AppLockSettingsModal';
import { createAppLockConfig, isValidAppPin, readAppLockConfig, removeAppLockConfig, saveAppLockConfig, shouldAutoLock, verifyAppPin } from '../utils/appLock';

const AppLockContext = createContext(null);

export function AppLockProvider({ children }) {
  const [config, setConfig] = useState(() => readAppLockConfig());
  const [isAppLocked, setIsAppLocked] = useState(() => Boolean(readAppLockConfig()));
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const lockApp = useCallback(() => { if (config) setIsAppLocked(true); }, [config]);

  const unlockApp = useCallback(async (pin) => {
    if (!config || Date.now() < cooldownUntil) return false;
    const valid = await verifyAppPin(pin, config);
    if (!valid) {
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts >= 5 ? 0 : attempts);
      if (attempts >= 5) setCooldownUntil(Date.now() + 30_000);
      return false;
    }
    setFailedAttempts(0);
    setCooldownUntil(0);
    setIsAppLocked(false);
    return true;
  }, [config, cooldownUntil, failedAttempts]);

  const saveSettings = useCallback(async ({ currentPin, newPin, confirmPin, idleMinutes }) => {
    if (config && !(await verifyAppPin(currentPin, config))) throw new Error('Enter your current PIN to change these settings.');
    let nextConfig;
    if (newPin) {
      if (!isValidAppPin(newPin)) throw new Error('PIN must contain exactly 6 digits.');
      if (newPin !== confirmPin) throw new Error('The new PINs do not match.');
      nextConfig = await createAppLockConfig(newPin, idleMinutes);
    } else if (config) {
      nextConfig = { ...config, idleMinutes: Number(idleMinutes), updatedAt: new Date().toISOString() };
    } else {
      throw new Error('Enter and confirm a 6-digit PIN.');
    }
    saveAppLockConfig(nextConfig);
    setConfig(nextConfig);
    setIsSettingsOpen(false);
    setIsAppLocked(false);
  }, [config]);

  const disableLock = useCallback(async (currentPin) => {
    if (!config || !(await verifyAppPin(currentPin, config))) throw new Error('Enter your current PIN to turn off app lock.');
    removeAppLockConfig();
    setConfig(null);
    setIsAppLocked(false);
    setIsSettingsOpen(false);
    setCooldownUntil(0);
  }, [config]);

  useEffect(() => {
    if (!config || isAppLocked) return undefined;
    let lastActivity = Date.now();
    const markActivity = () => { lastActivity = Date.now(); };
    const checkAutoLock = () => {
      if (shouldAutoLock(lastActivity, Date.now(), config.idleMinutes, document.visibilityState)) setIsAppLocked(true);
    };
    const lockWhenHidden = () => { if (document.visibilityState === 'hidden') setIsAppLocked(true); };
    const activityEvents = ['pointerdown', 'touchstart', 'keydown'];
    activityEvents.forEach((eventName) => window.addEventListener(eventName, markActivity, { passive: true }));
    document.addEventListener('visibilitychange', lockWhenHidden);
    window.addEventListener('pagehide', lockApp);
    const timer = window.setInterval(checkAutoLock, 10_000);
    return () => {
      activityEvents.forEach((eventName) => window.removeEventListener(eventName, markActivity));
      document.removeEventListener('visibilitychange', lockWhenHidden);
      window.removeEventListener('pagehide', lockApp);
      window.clearInterval(timer);
    };
  }, [config, isAppLocked, lockApp]);

  const value = { appLockEnabled: Boolean(config), lockApp, openAppLockSettings: () => setIsSettingsOpen(true) };
  return (
    <AppLockContext.Provider value={value}>
      {children}
      {isSettingsOpen && <AppLockSettingsModal config={config} onSave={saveSettings} onDisable={disableLock} onClose={() => setIsSettingsOpen(false)} />}
      {isAppLocked && config && <AppLockScreen unlockApp={unlockApp} cooldownUntil={cooldownUntil} />}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (!context) throw new Error('useAppLock must be used within AppLockProvider.');
  return context;
}
