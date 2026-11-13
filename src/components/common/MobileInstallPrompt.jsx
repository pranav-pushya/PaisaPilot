import React, { useState, useEffect } from 'react';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { Download, X, Smartphone, Sparkles } from 'lucide-react';

export const MobileInstallPrompt = () => {
  const { isInstallable, isInstalled, installWebApp } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('paisapilot_install_dismissed') === 'true';
  });
  const [isInstalling, setIsInstalling] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.innerWidth < 768 ||
      /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(
        window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      );
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('paisapilot_install_dismissed', 'true');
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await installWebApp();
    } finally {
      setIsInstalling(false);
    }
  };

  // Only show on mobile, when not installed, and not dismissed
  if (!isMobile || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-[300px] w-[calc(100vw-32px)] sm:w-auto md:hidden animate-slideUp">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl p-3.5 shadow-2xl shadow-indigo-900/20 relative">
        {/* Close / Dismiss Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Dismiss install notification"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-3 pr-5">
          {/* App Icon / Badge */}
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
            <span className="font-extrabold text-base">₹</span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white leading-tight">
                Install PaisaPilot
              </h4>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
              Fast 1-tap mobile access & offline support.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3 flex items-center space-x-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 flex items-center justify-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md shadow-indigo-600/25 active:scale-95 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isInstalling ? 'Installing...' : 'Install Web App'}</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="px-2.5 py-2 rounded-xl text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
};
