import React, { useState, useEffect } from 'react';
import { usePwaInstall } from '../../hooks/usePwaInstall';
import { Download, X, Smartphone, ArrowUpRight } from 'lucide-react';

export const MobileInstallPrompt = () => {
  const { isInstallable, isInstalled, installWebApp } = usePwaInstall();
  const [isDismissed, setIsDismissed] = useState(() => {
    return sessionStorage.getItem('paisapilot_install_dismissed') === 'true';
  });
  const [isInstalling, setIsInstalling] = useState(false);
  const [showIosTip, setShowIosTip] = useState(false);
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
      const res = await installWebApp();
      if (!res?.success && res?.reason === 'no-prompt') {
        // Show gentle iOS / browser fallback tip
        setShowIosTip(true);
        setTimeout(() => setShowIosTip(false), 5000);
      }
    } finally {
      setIsInstalling(false);
    }
  };

  // Only show on mobile devices, when not already installed and not dismissed
  if (!isMobile || isInstalled || isDismissed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-3 z-40 max-w-[205px] md:hidden animate-slideUp pointer-events-auto">
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-indigo-200/90 dark:border-indigo-800/90 rounded-2xl p-2.5 shadow-2xl shadow-indigo-950/30 relative">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-1.5 right-1.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Dismiss install notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center space-x-2 pr-4">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <span className="font-extrabold text-xs">₹</span>
          </div>
          <div className="min-w-0">
            <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white truncate leading-tight">
              Download App
            </h4>
            <p className="text-[9px] text-slate-500 dark:text-slate-400 truncate">
              Native mobile feel
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="w-full flex items-center justify-center space-x-1.5 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold py-1.5 px-2 rounded-xl text-[11px] shadow-sm shadow-indigo-600/30 active:scale-95 transition"
          >
            <Download className="w-3 h-3" />
            <span>{isInstalling ? 'Installing...' : 'Install App'}</span>
          </button>
        </div>

        {/* iOS / Fallback Tip */}
        {showIosTip && (
          <div className="mt-1.5 p-1.5 bg-indigo-50 dark:bg-indigo-950/70 rounded-lg text-[9px] text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 leading-tight animate-fadeIn">
            Tap browser menu or Share &gt; <b>Add to Home Screen</b>
          </div>
        )}
      </div>
    </div>
  );
};
