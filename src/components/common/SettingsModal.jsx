import React, { useState, useEffect } from 'react';
import { useExpense } from '../../context/ExpenseContext';
import { getSupabaseConfig, resetSupabaseClient } from '../../api/supabase';
import { getGeminiApiKey } from '../../api/gemini';
import { 
  X, 
  Database, 
  Key, 
  Sparkles, 
  Check, 
  RotateCcw, 
  ExternalLink,
  ShieldCheck,
  HardDrive
} from 'lucide-react';

export const SettingsModal = ({ isOpen, onClose }) => {
  const { 
    supabaseConnected, 
    refreshData, 
    resetToSampleData 
  } = useExpense();

  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const { url, key } = getSupabaseConfig();
      setSupabaseUrl(localStorage.getItem('paisapilot_supabase_url') || url || '');
      setSupabaseKey(localStorage.getItem('paisapilot_supabase_key') || key || '');
      setGeminiKey(getGeminiApiKey());
      setIsSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (supabaseUrl.trim()) {
      localStorage.setItem('paisapilot_supabase_url', supabaseUrl.trim());
    } else {
      localStorage.removeItem('paisapilot_supabase_url');
    }

    if (supabaseKey.trim()) {
      localStorage.setItem('paisapilot_supabase_key', supabaseKey.trim());
    } else {
      localStorage.removeItem('paisapilot_supabase_key');
    }

    if (geminiKey.trim()) {
      localStorage.setItem('paisapilot_gemini_key', geminiKey.trim());
    } else {
      localStorage.removeItem('paisapilot_gemini_key');
    }

    resetSupabaseClient();
    refreshData();
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  const handleClearCloud = () => {
    localStorage.removeItem('paisapilot_supabase_url');
    localStorage.removeItem('paisapilot_supabase_key');
    setSupabaseUrl('');
    setSupabaseKey('');
    resetSupabaseClient();
    refreshData();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                App & Cloud Settings
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure Supabase Database & Google Gemini AI Key
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Active Mode Banner */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs font-semibold ${
            supabaseConnected
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
          }`}>
            <div className="flex items-center space-x-2">
              {supabaseConnected ? <ShieldCheck className="w-4 h-4 text-emerald-600" /> : <HardDrive className="w-4 h-4 text-slate-500" />}
              <span>Current Storage: {supabaseConnected ? 'Supabase PostgreSQL Cloud' : 'Local Storage Mode'}</span>
            </div>
            {supabaseConnected && (
              <button 
                onClick={handleClearCloud}
                className="text-[11px] underline text-emerald-700 dark:text-emerald-400 hover:text-rose-600"
              >
                Disconnect
              </button>
            )}
          </div>

          {/* 1. Supabase Credentials */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
                Supabase URL
              </label>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center hover:underline"
              >
                Get from Supabase <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <input
              type="text"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xyzcompany.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide block pt-1">
              Supabase Anon Key
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              * Remember to run the SQL migration script from <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-indigo-500 font-mono">supabase_schema.sql</code> in your Supabase SQL editor!
            </p>
          </div>

          {/* 2. Google Gemini API Key */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>Google Gemini API Key</span>
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center hover:underline"
              >
                Free Key from AI Studio <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <input
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-[11px] text-slate-400">
              Powers real-time natural language query answering and AI transaction extraction. If left blank, PaisaPilot runs on its built-in offline advisor.
            </p>
          </div>

          {/* 3. Demo / Reset Options */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Reset Sample Data</span>
              <span className="text-[11px] text-slate-400">Restore default demo transactions & budgets</span>
            </div>
            <button
              type="button"
              onClick={() => {
                resetToSampleData();
                onClose();
              }}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-750 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md shadow-indigo-600/20 transition"
          >
            {isSaved ? (
              <>
                <Check className="w-4 h-4 text-emerald-300" />
                <span>Saved!</span>
              </>
            ) : (
              <span>Save & Connect</span>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
