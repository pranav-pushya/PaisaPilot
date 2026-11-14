import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import { 
  getSupabase, 
  getSupabaseConfig, 
  signInWithEmail, 
  signUpWithEmail, 
  signOutUser, 
  getAuthSession, 
  subscribeToAuthChanges 
} from '../api/supabase';
import { DEFAULT_CATEGORIES, PAYMENT_MODES } from '../utils/formatters';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGETS, INITIAL_TRIPS } from '../utils/initialData';
import { getCurrentMonthStr, getTodayDateStr } from '../utils/dateUtils';
import { advanceRecurringDate } from '../utils/recurrence';
import { getImpulseTimeState } from '../utils/impulseVault';
import { getJarBalanceAfterMove } from '../utils/savings';

// UUID Helpers for Supabase Postgres UUID compatibility
export const isUUID = (str) => {
  if (typeof str !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);
};

export const ensureUUID = (id) => {
  if (id && isUUID(id)) return id;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const parseTransactionRow = (t) => {
  let tripName = t.trip_name || null;
  let cleanDesc = t.description || '';
  let swapId = t.swap_id || null;
  let swapTargetMode = t.swap_target_mode || null;

  // Extract swap_id if embedded in description: e.g. [Swap:uuid]
  if (cleanDesc.includes('[Swap:')) {
    const swapMatch = cleanDesc.match(/\[Swap:([a-zA-Z0-9-]+)\]\s*/);
    if (swapMatch) {
      swapId = swapMatch[1];
      cleanDesc = cleanDesc.replace(swapMatch[0], '').trim();
    }
  }

  // Extract swap direction if present: e.g. [➔ Cash] or [⬅ UPI]
  if (cleanDesc.startsWith('[')) {
    const dirMatch = cleanDesc.match(/^\[(➔|⬅)\s*([^\]]+)\]\s*(.*)$/);
    if (dirMatch) {
      swapTargetMode = dirMatch[2].trim();
      cleanDesc = dirMatch[3].trim();
    }
  }

  if (!tripName && cleanDesc.startsWith('[')) {
    const match = cleanDesc.match(/^\[(.*?)\]\s*(.*)$/);
    if (match) {
      tripName = match[1];
      cleanDesc = match[2];
    }
  }

  return {
    ...t,
    amount: Number(t.amount) || 0,
    description: cleanDesc,
    trip_name: tripName,
    trip_id: t.trip_id || null,
    swap_id: swapId,
    swap_target_mode: swapTargetMode,
  };
};

const DEFAULT_QUICK_ACTIONS = [
  { id: 'chai', label: 'Chai', icon: '☕', amount: 10, category_name: 'Food & Dining', payment_mode: 'UPI' },
  { id: 'xerox', label: 'Xerox / Print', icon: '📄', amount: 20, category_name: 'Education & Supplies', payment_mode: 'Cash' },
  { id: 'auto', label: 'Auto / Metro', icon: '🛺', amount: 30, category_name: 'Transport & Fuel', payment_mode: 'UPI' },
  { id: 'canteen', label: 'Canteen', icon: '🍜', amount: 50, category_name: 'Food & Dining', payment_mode: 'UPI' },
];

const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const currentMonthStr = getCurrentMonthStr();

  // Dark / Light Theme management
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('paisapilot_theme');
    if (saved) return saved;
    if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'dark'; // default to dark theme
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('paisapilot_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Auth State
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // App Data State
  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('paisapilot_transactions');
    return saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
  });

  const [categories, setCategories] = useState(() => {
    const saved = localStorage.getItem('paisapilot_categories');
    return saved ? JSON.parse(saved) : DEFAULT_CATEGORIES;
  });

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [budgetByMonth, setBudgetByMonth] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('paisapilot_budgets') || 'null');
      if (saved && Object.values(saved).some((value) => value && typeof value === 'object')) return saved;
      return { [currentMonthStr]: saved || INITIAL_BUDGETS };
    } catch {
      return { [currentMonthStr]: INITIAL_BUDGETS };
    }
  });

  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('paisapilot_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

  const [recurringRules, setRecurringRules] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('paisapilot_recurring_rules') || '[]');
    } catch {
      return [];
    }
  });

  const readStoredJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
  };
  const [receivables, setReceivables] = useState(() => readStoredJson('paisapilot_receivables', []));
  const [savingsJars, setSavingsJars] = useState(() => readStoredJson('paisapilot_savings_jars', []));
  const [impulseItems, setImpulseItems] = useState(() => readStoredJson('paisapilot_impulse_items', []));
  const [quickActions, setQuickActions] = useState(() => readStoredJson('paisapilot_quick_actions', DEFAULT_QUICK_ACTIONS));
  const [upiId, setUpiId] = useState(() => localStorage.getItem('paisapilot_upi_id') || '');

  const [startingBalances, setStartingBalances] = useState(() => {
    const saved = localStorage.getItem('paisapilot_starting_balances');
    return saved ? JSON.parse(saved) : {
      'UPI': 0,
      'Net Banking': 0,
      'Debit Card': 0,
      'Cash': 0,
      'Credit Card': 0,
    };
  });

  const budgetMonth = selectedMonth === 'all' ? currentMonthStr : selectedMonth;
  const budgets = useMemo(() => budgetByMonth[budgetMonth] || {}, [budgetByMonth, budgetMonth]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMode, setFilterPaymentMode] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterTrip, setFilterTrip] = useState('regular'); // 'regular' (default) | 'all' | trip_id
  const [isSyncing, setIsSyncing] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);
  const syncInFlightRef = useRef(false);
  const loadedCloudUserIdRef = useRef(null);
  const [pendingTransactionDeletes, setPendingTransactionDeletes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('paisapilot_pending_transaction_deletes') || '[]');
    } catch {
      return [];
    }
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('paisapilot_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('paisapilot_budgets', JSON.stringify(budgetByMonth));
  }, [budgetByMonth]);

  useEffect(() => {
    localStorage.setItem('paisapilot_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('paisapilot_starting_balances', JSON.stringify(startingBalances));
  }, [startingBalances]);

  useEffect(() => {
    localStorage.setItem('paisapilot_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('paisapilot_recurring_rules', JSON.stringify(recurringRules));
  }, [recurringRules]);

  useEffect(() => localStorage.setItem('paisapilot_receivables', JSON.stringify(receivables)), [receivables]);
  useEffect(() => localStorage.setItem('paisapilot_savings_jars', JSON.stringify(savingsJars)), [savingsJars]);
  useEffect(() => localStorage.setItem('paisapilot_impulse_items', JSON.stringify(impulseItems)), [impulseItems]);
  useEffect(() => localStorage.setItem('paisapilot_quick_actions', JSON.stringify(quickActions)), [quickActions]);
  useEffect(() => localStorage.setItem('paisapilot_upi_id', upiId), [upiId]);

  const persistProfileFields = async (fields) => {
    if (!user?.id || !supabaseConnected) return;
    const supabase = getSupabase();
    if (!supabase) return;
    const patch = { ...fields, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('user_profiles').update(patch)
      .eq('user_id', user.id).select('user_id').maybeSingle();
    if (error) {
      console.warn('Could not sync profile settings:', error.message);
      return;
    }
    if (!data) {
      const { error: insertError } = await supabase.from('user_profiles').upsert({
        user_id: user.id,
        starting_balances: startingBalances,
        receivables,
        savings_jars: savingsJars,
        impulse_items: impulseItems,
        quick_actions: quickActions,
        upi_id: upiId,
        ...patch,
      });
      if (insertError) console.warn('Could not create profile settings:', insertError.message);
    }
  };

  useEffect(() => {
    localStorage.setItem('paisapilot_pending_transaction_deletes', JSON.stringify(pendingTransactionDeletes));
  }, [pendingTransactionDeletes]);

  const syncPendingTransactions = async (activeUser, sourceTransactions = transactions, sourceDeletes = pendingTransactionDeletes) => {
    const supabase = getSupabase();
    if (!supabase || !activeUser?.id || !navigator.onLine || syncInFlightRef.current) return;

    syncInFlightRef.current = true;
    try {
      const pending = sourceTransactions.filter(
        (tx) => tx._pendingCloudSync && (!tx._pendingOwnerId || tx._pendingOwnerId === activeUser.id)
      );
      for (const tx of pending) {
        const { _pendingCloudSync, _pendingOwnerId, ...payload } = tx;
        const { error } = await supabase.from('transactions').upsert({
          ...payload,
          user_id: activeUser.id,
          trip_id: tx.trip_id || null,
          trip_name: tx.trip_name || null,
        });
        if (error) throw error;
        setTransactions((prev) => prev.map((item) =>
          item.id === tx.id ? { ...item, _pendingCloudSync: false, _pendingOwnerId: undefined } : item
        ));
      }

      const deletes = sourceDeletes.filter((entry) => entry.user_id === activeUser.id);
      for (const entry of deletes) {
        const { error } = await supabase.from('transactions').delete()
          .eq('id', entry.id).eq('user_id', activeUser.id);
        if (error) throw error;
        setPendingTransactionDeletes((prev) => prev.filter((item) => item.id !== entry.id || item.user_id !== activeUser.id));
      }
    } catch (err) {
      console.warn('Some transaction changes are waiting for cloud sync:', err.message || err);
    } finally {
      syncInFlightRef.current = false;
    }
  };

  // Load data from Supabase (scoped to user if authenticated)
  const loadSupabaseData = async (activeUser = user) => {
    const { isConfigured } = getSupabaseConfig();
    if (!isConfigured) {
      setSupabaseConnected(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    // Anonymous visitors use local storage only. Never read shared NULL-owner rows.
    if (!activeUser?.id) {
      setSupabaseConnected(false);
      return;
    }

    if (loadedCloudUserIdRef.current !== activeUser.id) {
      loadedCloudUserIdRef.current = activeUser.id;
      setTransactions((prev) => prev.filter((tx) =>
        tx._pendingCloudSync && (!tx._pendingOwnerId || tx._pendingOwnerId === activeUser.id)
      ));
      setCategories(DEFAULT_CATEGORIES);
      setTrips([]);
      setRecurringRules((prev) => prev.filter((rule) =>
        rule._pendingCloudSync && (!rule._pendingOwnerId || rule._pendingOwnerId === activeUser.id)
      ));
      setReceivables([]);
      setSavingsJars([]);
      setImpulseItems([]);
      setQuickActions(DEFAULT_QUICK_ACTIONS);
      setUpiId('');
      setBudgetByMonth({});
      setStartingBalances({ UPI: 0, 'Net Banking': 0, 'Debit Card': 0, Cash: 0, 'Credit Card': 0 });
    }

    try {
      setIsSyncing(true);

      await syncPendingTransactions(activeUser);

      const storedRules = JSON.parse(localStorage.getItem('paisapilot_recurring_rules') || '[]');
      const pendingRules = storedRules.filter((rule) =>
        rule._pendingCloudSync && (!rule._pendingOwnerId || rule._pendingOwnerId === activeUser.id)
      );
      if (pendingRules.length) {
        const ruleRows = pendingRules.map(({ _pendingCloudSync, _pendingOwnerId, ...rule }) => ({
          ...rule,
          user_id: activeUser.id,
        }));
        const { error: recurringSyncError } = await supabase.from('recurring_rules').upsert(ruleRows);
        if (!recurringSyncError) {
          const syncedIds = new Set(pendingRules.map((rule) => rule.id));
          setRecurringRules((prev) => prev.map((rule) => syncedIds.has(rule.id)
            ? { ...rule, _pendingCloudSync: false, _pendingOwnerId: activeUser.id }
            : rule));
        }
      }

      // 1. Transactions owned by this authenticated user
      const txQuery = supabase.from('transactions').select('*')
        .eq('user_id', activeUser.id).order('date', { ascending: false });
      const { data: txData, error: txError } = await txQuery;
      if (!txError && txData) {
        const parsedData = txData.map(parseTransactionRow);

        // Retain only local items that are truly pending cloud upload
        setTransactions((prev) => {
          const cloudIds = new Set(parsedData.map((item) => item.id));
          const pendingSync = prev.filter((item) => item._pendingCloudSync && !cloudIds.has(item.id));
          return [...pendingSync, ...parsedData];
        });
      }

      // 2. Categories
      const { data: catData, error: catError } = await supabase.from('categories').select('*');
      if (!catError && catData && catData.length > 0) {
        setCategories((prev) => {
          const names = new Set(prev.map((c) => c.name.toLowerCase()));
          const newFromCloud = catData.filter((c) => !names.has(c.name.toLowerCase()));
          return [...prev, ...newFromCloud];
        });
      }

      // 3. User-specific / Shared data (Trips, Budgets, Starting Balances)
      const tripQuery = supabase.from('trips').select('*')
        .eq('user_id', activeUser.id).order('created_at', { ascending: false });
      const { data: tripData } = await tripQuery;
      if (tripData) {
        setTrips(
          tripData.map((t) => ({
            id: t.id,
            name: t.name,
            type: t.type,
            budget: Number(t.budget),
            startDate: t.start_date,
            endDate: t.end_date,
            status: t.status,
            created_at: t.created_at,
          }))
        );
      }

      const budgetQuery = supabase.from('budgets').select('*').eq('user_id', activeUser.id);
      const { data: budgetData } = await budgetQuery;
      if (budgetData) {
        const bMap = {};
        budgetData.forEach((b) => {
          if (!bMap[b.month]) bMap[b.month] = {};
          bMap[b.month][b.category_name] = Number(b.monthly_limit);
        });
        setBudgetByMonth((prev) => ({ ...prev, ...bMap }));
      }

      const { data: recurringData } = await supabase.from('recurring_rules').select('*')
        .eq('user_id', activeUser.id).order('next_due', { ascending: true });
      if (recurringData) {
        const parsedRules = recurringData.map((rule) => ({
          id: rule.id,
          amount: Number(rule.amount),
          type: rule.type,
          category_name: rule.category_name,
          payment_mode: rule.payment_mode,
          description: rule.description || '',
          frequency: rule.frequency,
          next_due: rule.next_due,
          anchor_day: Number(rule.anchor_day) || Number(String(rule.next_due).slice(-2)),
          active: rule.active,
        }));
        setRecurringRules((prev) => {
          const cloudIds = new Set(parsedRules.map((rule) => rule.id));
          const pending = prev.filter((rule) => rule._pendingCloudSync && !cloudIds.has(rule.id));
          return [...pending, ...parsedRules];
        });
      }

      if (activeUser?.id) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', activeUser.id)
          .maybeSingle();
        if (profileData?.starting_balances) {
          setStartingBalances(profileData.starting_balances);
        }
        setReceivables(Array.isArray(profileData?.receivables) ? profileData.receivables : []);
        setSavingsJars(Array.isArray(profileData?.savings_jars) ? profileData.savings_jars : []);
        setImpulseItems(Array.isArray(profileData?.impulse_items) ? profileData.impulse_items : []);
        setQuickActions(Array.isArray(profileData?.quick_actions) && profileData.quick_actions.length
          ? profileData.quick_actions : DEFAULT_QUICK_ACTIONS);
        setUpiId(profileData?.upi_id || '');
      }

      setSupabaseConnected(true);
    } catch (err) {
      console.warn('Could not fetch from Supabase, staying on local store:', err.message);
      setSupabaseConnected(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Auth initialization & listener
  useEffect(() => {
    let subscription = null;

    getAuthSession()
      .then((sess) => {
        setSession(sess);
        const currentUser = sess?.user || null;
        setUser(currentUser);
        setIsAuthLoading(false);
        loadSupabaseData(currentUser);
      })
      .catch((err) => {
        console.warn('Auth session init error:', err);
        setIsAuthLoading(false);
        loadSupabaseData(null);
      });

    subscription = subscribeToAuthChanges((event, newSession) => {
      setSession(newSession);
      const currentUser = newSession?.user || null;
      setUser(currentUser);
      if (currentUser) {
        loadSupabaseData(currentUser);
      }
    });

    return () => {
      if (subscription?.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;
    const retrySync = async () => {
      try {
        const storedTransactions = JSON.parse(localStorage.getItem('paisapilot_transactions') || '[]');
        const storedDeletes = JSON.parse(localStorage.getItem('paisapilot_pending_transaction_deletes') || '[]');
        await syncPendingTransactions(user, storedTransactions, storedDeletes);
      } catch (error) {
        console.warn('Could not retry saved cloud changes:', error.message || error);
      }
      await loadSupabaseData(user);
    };
    window.addEventListener('online', retrySync);
    return () => window.removeEventListener('online', retrySync);
  }, [user]);

  useEffect(() => {
    if (user?.id && supabaseConnected && navigator.onLine) {
      syncPendingTransactions(user, transactions);
    }
  }, [user, supabaseConnected, transactions, pendingTransactionDeletes]);

  // Multi-Device Realtime Sync Subscription
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user?.id) return;

    const channelName = `device-sync-${user.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setTransactions((prev) => prev.filter((t) => t.id !== deletedId));
            }
          } else if (payload.eventType === 'INSERT') {
            if (payload.new) {
              const newTx = parseTransactionRow(payload.new);
              setTransactions((prev) => {
                const exists = prev.some((t) => t.id === newTx.id);
                if (exists) {
                  return prev.map((t) => (t.id === newTx.id ? { ...t, ...newTx, _pendingCloudSync: false } : t));
                }
                return [newTx, ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            if (payload.new) {
              const updatedTx = parseTransactionRow(payload.new);
              setTransactions((prev) =>
                prev.map((t) => (t.id === updatedTx.id ? { ...t, ...updatedTx, _pendingCloudSync: false } : t))
              );
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips' },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setTrips((prev) => prev.filter((t) => t.id !== deletedId));
            }
          } else {
            loadSupabaseData(user);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets' },
        () => {
          loadSupabaseData(user);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles' },
        () => {
          loadSupabaseData(user);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'recurring_rules', filter: `user_id=eq.${user.id}` },
        () => loadSupabaseData(user)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Auth Action Methods
  const login = async (email, password) => {
    const data = await signInWithEmail(email, password);
    setSession(data.session);
    setUser(data.user);
    if (data.user) {
      await loadSupabaseData(data.user);
    }
    return data;
  };

  const signup = async (email, password, fullName) => {
    const data = await signUpWithEmail(email, password, fullName);
    if (data?.session) {
      setSession(data.session);
      setUser(data.user);
      if (data.user) {
        await loadSupabaseData(data.user);
      }
    }
    return data;
  };

  const logout = async () => {
    await signOutUser();
    setUser(null);
    setSession(null);
    loadedCloudUserIdRef.current = null;
    // Reset to local sample data
    setTransactions(INITIAL_TRANSACTIONS);
    setCategories(DEFAULT_CATEGORIES);
    setTrips(INITIAL_TRIPS);
    setRecurringRules([]);
    setReceivables([]);
    setSavingsJars([]);
    setImpulseItems([]);
    setQuickActions(DEFAULT_QUICK_ACTIONS);
    setUpiId('');
    setBudgetByMonth({ [currentMonthStr]: INITIAL_BUDGETS });
    setStartingBalances({
      'UPI': 0,
      'Net Banking': 0,
      'Debit Card': 0,
      'Cash': 0,
      'Credit Card': 0,
    });
  };

  const addRecurringRule = async (input) => {
    const rule = {
      id: ensureUUID(input.id),
      amount: Number(input.amount),
      type: input.type === 'income' ? 'income' : 'expense',
      category_name: input.category_name || (input.type === 'income' ? 'Freelance & Bonus' : 'Rent & Utilities'),
      payment_mode: input.payment_mode || 'UPI',
      description: String(input.description || '').trim(),
      frequency: ['weekly', 'monthly', 'yearly'].includes(input.frequency) ? input.frequency : 'monthly',
      next_due: input.next_due || getTodayDateStr(),
      anchor_day: Number(input.next_due?.slice(-2)) || Number(getTodayDateStr().slice(-2)),
      active: true,
      _pendingCloudSync: true,
      _pendingOwnerId: user?.id || null,
    };
    if (!Number.isFinite(rule.amount) || rule.amount <= 0) return false;
    setRecurringRules((prev) => [rule, ...prev]);
    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      const { _pendingCloudSync, _pendingOwnerId, ...row } = rule;
      const { error } = await supabase.from('recurring_rules').upsert({ ...row, user_id: user.id });
      if (!error) setRecurringRules((prev) => prev.map((item) => item.id === rule.id
        ? { ...item, _pendingCloudSync: false, _pendingOwnerId: user.id }
        : item));
    }
    return true;
  };

  const recordRecurringRule = async (id) => {
    const rule = recurringRules.find((item) => item.id === id && item.active);
    if (!rule) return false;
    await addTransaction({ ...rule, date: rule.next_due });
    const anchorDay = Number(rule.anchor_day) || Number(rule.next_due.slice(-2));
    const updated = { ...rule, anchor_day: anchorDay, next_due: advanceRecurringDate(rule.next_due, rule.frequency, anchorDay) };
    setRecurringRules((prev) => prev.map((item) => item.id === id ? updated : item));
    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      const { error } = await supabase.from('recurring_rules').update({ next_due: updated.next_due })
        .eq('id', id).eq('user_id', user.id);
      if (error) setRecurringRules((prev) => prev.map((item) => item.id === id
        ? { ...updated, _pendingCloudSync: true, _pendingOwnerId: user.id }
        : item));
    }
    return true;
  };

  const toggleRecurringRule = async (id) => {
    const existing = recurringRules.find((item) => item.id === id);
    if (!existing) return;
    const updated = { ...existing, active: !existing.active };
    setRecurringRules((prev) => prev.map((item) => item.id === id ? updated : item));
    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      const { error } = await supabase.from('recurring_rules').update({ active: updated.active })
        .eq('id', id).eq('user_id', user.id);
      if (error) setRecurringRules((prev) => prev.map((item) => item.id === id
        ? { ...updated, _pendingCloudSync: true, _pendingOwnerId: user.id }
        : item));
    }
  };

  const addReceivables = async (items, transactionId, transactionDate, transactionDescription) => {
    const validItems = items.filter((item) => item.name?.trim() && Number(item.amount) > 0);
    if (!validItems.length) return;
    const created = validItems.map((item) => ({
      id: ensureUUID(),
      transaction_id: transactionId || null,
      name: item.name.trim(),
      amount: Number(item.amount),
      description: transactionDescription || 'Shared expense',
      date: transactionDate || getTodayDateStr(),
      status: 'pending',
      created_at: new Date().toISOString(),
    }));
    const next = [...created, ...receivables];
    setReceivables(next);
    await persistProfileFields({ receivables: next });
    return created;
  };

  const markReceivablePaid = async (id) => {
    const next = receivables.map((item) => item.id === id ? { ...item, status: 'paid', paid_at: getTodayDateStr() } : item);
    setReceivables(next);
    await persistProfileFields({ receivables: next });
  };

  const saveUpiId = async (value) => {
    const next = String(value || '').trim();
    setUpiId(next);
    await persistProfileFields({ upi_id: next });
  };

  const addSavingsJar = async ({ name, target }) => {
    const numericTarget = Number(target);
    if (!name?.trim() || !Number.isFinite(numericTarget) || numericTarget <= 0) return false;
    const next = [{ id: ensureUUID(), name: name.trim(), target: numericTarget, saved: 0, created_at: new Date().toISOString() }, ...savingsJars];
    setSavingsJars(next);
    await persistProfileFields({ savings_jars: next });
    return true;
  };

  const updateSavingsJar = async (id, delta) => {
    const jar = savingsJars.find((item) => item.id === id);
    const saved = getJarBalanceAfterMove(jar, delta);
    if (!jar || saved === null) return false;
    if (Number(delta) > 0) {
      const currentlyReserved = savingsJars.reduce((sum, item) => sum + (Number(item.saved) || 0), 0);
      if (Number(delta) > Math.max(0, (Number(totalLiquidFunds) || 0) - currentlyReserved)) return false;
    }
    const next = savingsJars.map((item) => item.id === id
      ? { ...item, saved }
      : item);
    setSavingsJars(next);
    await persistProfileFields({ savings_jars: next });
    return true;
  };

  const deleteSavingsJar = async (id) => {
    const next = savingsJars.filter((jar) => jar.id !== id);
    setSavingsJars(next);
    await persistProfileFields({ savings_jars: next });
  };

  const saveQuickActions = async (next) => {
    setQuickActions(next);
    await persistProfileFields({ quick_actions: next });
  };

  const addImpulseItem = async ({ name, amount, cooldownHours }) => {
    const numericAmount = Number(amount);
    if (!name?.trim() || !Number.isFinite(numericAmount) || numericAmount <= 0) return false;
    const now = Date.now();
    const cooldown = Number(cooldownHours) === 48 ? 48 : 24;
    const next = [{
      id: ensureUUID(), name: name.trim(), amount: numericAmount, cooldown_hours: cooldown,
      created_at: new Date(now).toISOString(), unlock_at: new Date(now + cooldown * 60 * 60 * 1000).toISOString(),
    }, ...impulseItems];
    setImpulseItems(next);
    await persistProfileFields({ impulse_items: next });
    return true;
  };

  const dismissImpulseItem = async (id) => {
    const next = impulseItems.filter((item) => item.id !== id);
    setImpulseItems(next);
    await persistProfileFields({ impulse_items: next });
  };

  const purchaseImpulseItem = async (item) => {
    if (!getImpulseTimeState(item.unlock_at).unlocked) return false;
    const txId = await addTransaction({
      amount: item.amount, type: 'expense', category_name: 'Shopping', payment_mode: 'UPI',
      description: `Wishlist: ${item.name}`, date: getTodayDateStr(),
    });
    if (!txId) return false;
    await dismissImpulseItem(item.id);
    return true;
  };

  // Add Transaction (supports regular and trip transactions)
  const addTransaction = async (newTx) => {
    const txId = ensureUUID(newTx.id);
    const tx = {
      id: txId,
      amount: Number(newTx.amount),
      type: newTx.type || 'expense',
      category_name: newTx.category_name || 'Food & Dining',
      payment_mode: newTx.payment_mode || 'UPI',
      description: newTx.description || '',
      trip_id: newTx.trip_id || null,
      trip_name: newTx.trip_name || null,
      from_mode: newTx.from_mode || null,
      to_mode: newTx.to_mode || null,
      date: newTx.date || getTodayDateStr(),
      created_at: new Date().toISOString(),
      _pendingCloudSync: true,
      _pendingOwnerId: user?.id || null,
    };

    // Update local state immediately
    setTransactions((prev) => [tx, ...prev]);

    // Push to Supabase if connected
    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      await syncPendingTransactions(user, [tx]);
    }
    return txId;
  };

  // Add Cash Swap / Balance Transfer (atomic double-entry between two payment modes)
  const addCashSwap = async ({
    amount,
    fromMode = 'UPI',
    toMode = 'Cash',
    note = '',
    date = getTodayDateStr(),
  }) => {
    const swapId = ensureUUID();
    const cleanNote = note.trim();
    const numAmount = Math.abs(Number(amount));

    if (!numAmount || numAmount <= 0) return;

    const outTxId = ensureUUID();
    const inTxId = ensureUUID();

    const outTx = {
      id: outTxId,
      amount: numAmount,
      type: 'expense',
      category_name: 'Transfer & Cash Swap',
      payment_mode: fromMode,
      description: `[Swap:${swapId}] [➔ ${toMode}] ${cleanNote}`.trim(),
      date: date || getTodayDateStr(),
      created_at: new Date().toISOString(),
      swap_id: swapId,
      swap_target_mode: toMode,
      _pendingCloudSync: true,
      _pendingOwnerId: user?.id || null,
    };

    const inTx = {
      id: inTxId,
      amount: numAmount,
      type: 'income',
      category_name: 'Transfer & Cash Swap',
      payment_mode: toMode,
      description: `[Swap:${swapId}] [⬅ ${fromMode}] ${cleanNote}`.trim(),
      date: date || getTodayDateStr(),
      created_at: new Date().toISOString(),
      swap_id: swapId,
      swap_target_mode: fromMode,
      _pendingCloudSync: true,
      _pendingOwnerId: user?.id || null,
    };

    // Update local state immediately with both legs
    setTransactions((prev) => [outTx, inTx, ...prev]);

    // Push both to Supabase if connected
    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      await syncPendingTransactions(user, [outTx, inTx]);
    }
  };

  const importTransactions = async (rows) => {
    const signature = (tx) => [tx.date, tx.type, Number(tx.amount), tx.category_name, tx.payment_mode, tx.description]
      .map((part) => String(part || '').trim().toLowerCase()).join('|');
    const seen = new Set(transactions.map(signature));
    let added = 0;
    for (const row of rows) {
      const key = signature(row);
      if (seen.has(key)) continue;
      seen.add(key);
      await addTransaction(row);
      added += 1;
    }
    return { added, skipped: rows.length - added };
  };

  const createBackup = () => ({
    format: 'paisapilot-backup',
    version: 1,
    exported_at: new Date().toISOString(),
    transactions,
    categories,
    budgets: budgetByMonth,
    trips,
    recurringRules,
    receivables,
    savings_jars: savingsJars,
    impulse_items: impulseItems,
    quick_actions: quickActions,
    upi_id: upiId,
    starting_balances: startingBalances,
  });

  const restoreBackup = async (backup) => {
    if (backup?.format !== 'paisapilot-backup' || backup?.version !== 1 || !Array.isArray(backup.transactions)) {
      throw new Error('This file is not a supported PaisaPilot backup.');
    }

    if (Array.isArray(backup.categories)) {
      const existingNames = new Set(categories.map((item) => item.name.toLowerCase()));
      for (const category of backup.categories) {
        if (category?.name && !existingNames.has(category.name.toLowerCase())) {
          existingNames.add(category.name.toLowerCase());
          await addCategory(category);
        }
      }
    }

    if (Array.isArray(backup.trips)) {
      const existingIds = new Set(trips.map((item) => item.id));
      for (const trip of backup.trips) {
        if (trip?.id && trip?.name && !existingIds.has(trip.id)) {
          existingIds.add(trip.id);
          await addTrip(trip);
        }
      }
    }

    if (Array.isArray(backup.recurringRules)) {
      const existingIds = new Set(recurringRules.map((rule) => rule.id));
      for (const rule of backup.recurringRules) {
        if (rule?.id && rule?.next_due && !existingIds.has(rule.id)) {
          existingIds.add(rule.id);
          await addRecurringRule(rule);
        }
      }
    }

    if (Array.isArray(backup.receivables)) {
      const known = new Set(receivables.map((item) => item.id));
      const imported = backup.receivables.filter((item) => item?.name && Number(item.amount) > 0 && !known.has(item.id));
      if (imported.length) {
        const next = [...imported, ...receivables];
        setReceivables(next);
        await persistProfileFields({ receivables: next });
      }
    }
    if (Array.isArray(backup.savings_jars)) {
      const known = new Set(savingsJars.map((jar) => jar.id));
      const imported = backup.savings_jars.filter((jar) => jar?.name && Number(jar.target) > 0 && !known.has(jar.id))
        .map((jar) => ({ ...jar, id: jar.id || ensureUUID(), target: Number(jar.target), saved: Math.min(Number(jar.target), Math.max(0, Number(jar.saved) || 0)) }));
      if (imported.length) {
        const next = [...imported, ...savingsJars];
        setSavingsJars(next);
        await persistProfileFields({ savings_jars: next });
      }
    }
    if (Array.isArray(backup.impulse_items)) {
      const known = new Set(impulseItems.map((item) => item.id));
      const imported = backup.impulse_items.filter((item) => item?.name && Number(item.amount) > 0 && item.unlock_at && !known.has(item.id));
      if (imported.length) {
        const next = [...imported, ...impulseItems];
        setImpulseItems(next);
        await persistProfileFields({ impulse_items: next });
      }
    }
    if (Array.isArray(backup.quick_actions) && backup.quick_actions.length) await saveQuickActions(backup.quick_actions);
    if (typeof backup.upi_id === 'string') await saveUpiId(backup.upi_id);

    const result = await importTransactions(backup.transactions);
    if (backup.budgets && typeof backup.budgets === 'object') {
      setBudgetByMonth((prev) => ({ ...prev, ...backup.budgets }));
      if (supabaseConnected && user?.id) {
        const budgetRows = Object.entries(backup.budgets).flatMap(([month, limits]) =>
          Object.entries(limits || {}).map(([category_name, monthly_limit]) => ({
            user_id: user.id,
            month,
            category_name,
            monthly_limit: Number(monthly_limit) || 0,
          }))
        );
        if (budgetRows.length) await getSupabase().from('budgets').upsert(budgetRows);
      }
    }

    if (backup.starting_balances && typeof backup.starting_balances === 'object') {
      await updateStartingBalances(backup.starting_balances);
    }
    return result;
  };

  // Add Category
  const addCategory = async (newCat) => {
    const category = {
      id: newCat.id || `cat-${Date.now()}`,
      name: newCat.name.trim(),
      icon: newCat.icon || 'Tag',
      color: newCat.color || '#6366f1',
      type: newCat.type || 'expense',
    };

    setCategories((prev) => {
      const exists = prev.some((c) => c.name.toLowerCase() === category.name.toLowerCase());
      if (exists) return prev;
      return [...prev, category];
    });

    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      try {
        const payload = {
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: category.type,
        };
        if (user?.id) {
          payload.user_id = user.id;
        }
        await supabase.from('categories').insert([payload]);
      } catch (err) {
        console.error('Failed to sync category to Supabase:', err);
      }
    }
  };

  // Trip Management with Supabase multi-device sync
  const addTrip = async (newTrip) => {
    const trip = {
      id: newTrip.id || `trip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: newTrip.name.trim(),
      type: newTrip.type || 'hackathon',
      budget: Number(newTrip.budget) || 0,
      startDate: newTrip.startDate || getTodayDateStr(),
      endDate: newTrip.endDate || getTodayDateStr(),
      status: newTrip.status || 'active',
      created_at: new Date().toISOString(),
    };
    setTrips((prev) => [trip, ...prev]);

    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      try {
        await supabase.from('trips').upsert([
          {
            id: trip.id,
            user_id: user.id,
            name: trip.name,
            type: trip.type,
            budget: trip.budget,
            start_date: trip.startDate,
            end_date: trip.endDate,
            status: trip.status,
          },
        ]);
      } catch (err) {
        console.error('Failed to sync trip to Supabase:', err);
      }
    }
  };

  const updateTrip = async (id, updatedFields) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)));

    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      try {
        const payload = {};
        if (updatedFields.name !== undefined) payload.name = updatedFields.name;
        if (updatedFields.type !== undefined) payload.type = updatedFields.type;
        if (updatedFields.budget !== undefined) payload.budget = Number(updatedFields.budget);
        if (updatedFields.startDate !== undefined) payload.start_date = updatedFields.startDate;
        if (updatedFields.endDate !== undefined) payload.end_date = updatedFields.endDate;
        if (updatedFields.status !== undefined) payload.status = updatedFields.status;

        await supabase.from('trips').update(payload).eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.error('Failed to update trip on Supabase:', err);
      }
    }
  };

  const deleteTrip = async (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));

    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      try {
        await supabase.from('trips').delete().eq('id', id);
      } catch (err) {
        console.error('Failed to delete trip from Supabase:', err);
      }
    }
  };

  // Update Transaction
  const updateTransaction = async (id, updatedFields) => {
    const validId = ensureUUID(id);
    const updated = {
      amount: Number(updatedFields.amount),
      type: updatedFields.type || 'expense',
      category_name: updatedFields.category_name || 'Food & Dining',
      payment_mode: updatedFields.payment_mode || 'UPI',
      description: updatedFields.description || '',
      trip_id: updatedFields.trip_id || null,
      trip_name: updatedFields.trip_name || null,
      from_mode: updatedFields.from_mode || null,
      to_mode: updatedFields.to_mode || null,
      date: updatedFields.date || getTodayDateStr(),
      _pendingCloudSync: true,
      _pendingOwnerId: user?.id || null,
    };

    // Update local state immediately
    setTransactions((prev) =>
      prev.map((t) => (t.id === id || t.id === validId ? { ...t, ...updated, id: validId } : t))
    );

    // Sync to Supabase if connected
    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      await syncPendingTransactions(user, [{ ...updated, id: validId, _pendingCloudSync: true, _pendingOwnerId: user.id }]);
    }
  };

  // Delete Transaction (handles single transaction or paired cash swap)
  const deleteTransaction = async (id) => {
    const deletedTx = transactions.find((t) => t.id === id);
    const swapId = deletedTx?.swap_id || null;

    const idsToDelete = swapId
      ? transactions.filter((t) => t.swap_id === swapId).map((t) => t.id)
      : [id];

    setTransactions((prev) => prev.filter((t) => !idsToDelete.includes(t.id)));

    for (const delId of idsToDelete) {
      const txObj = transactions.find((t) => t.id === delId);
      if (txObj && isUUID(delId) && user?.id && !txObj._pendingCloudSync) {
        setPendingTransactionDeletes((prev) => [
          ...prev.filter((entry) => entry.id !== delId || entry.user_id !== user.id),
          { id: delId, user_id: user.id },
        ]);
      }

      const supabase = getSupabase();
      if (supabase && supabaseConnected && user?.id) {
        try {
          if (isUUID(delId)) {
            const { error } = await supabase.from('transactions').delete().eq('id', delId).eq('user_id', user.id);
            if (error) {
              console.error('Failed to delete transaction from Supabase:', error.message || error);
            } else {
              setPendingTransactionDeletes((prev) => prev.filter((entry) => entry.id !== delId || entry.user_id !== user.id));
            }
          }
        } catch (err) {
          console.error('Failed to delete from Supabase:', err);
        }
      }
    }
  };

  // Delete All Transactions
  const clearAllTransactions = async () => {
    const idsToDelete = transactions.filter((tx) => isUUID(tx.id) && !tx._pendingCloudSync);
    if (user?.id && idsToDelete.length) {
      setPendingTransactionDeletes((prev) => [
        ...prev.filter((entry) => entry.user_id !== user.id),
        ...idsToDelete.map((tx) => ({ id: tx.id, user_id: user.id })),
      ]);
    }
    setTransactions([]);
    localStorage.removeItem('paisapilot_transactions');

    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id && navigator.onLine) {
      try {
        for (const tx of idsToDelete) {
          const { error } = await supabase.from('transactions').delete().eq('id', tx.id).eq('user_id', user.id);
          if (error) throw error;
        }
        setPendingTransactionDeletes((prev) => prev.filter((entry) => entry.user_id !== user.id));
      } catch (err) {
        console.error('Failed to clear transactions from Supabase:', err);
      }
    }
  };

  // Update Budget limit with multi-device sync
  const setCategoryBudget = async (categoryName, limit) => {
    const month = selectedMonth === 'all' ? currentMonthStr : selectedMonth;
    setBudgetByMonth((prev) => ({
      ...prev,
      [month]: { ...(prev[month] || {}), [categoryName]: Number(limit) },
    }));

    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      try {
        await supabase.from('budgets').upsert([
          {
            user_id: user.id,
            category_name: categoryName,
            monthly_limit: Number(limit),
            month,
          },
        ]);
      } catch (err) {
        console.error('Failed to sync budget to Supabase:', err);
      }
    }
  };

  // Update Initial Balances with multi-device sync
  const updateStartingBalances = async (newBalances) => {
    setStartingBalances(newBalances);

    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      try {
        await supabase.from('user_profiles').upsert([
          {
            user_id: user.id,
            starting_balances: newBalances,
            updated_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        console.error('Failed to sync starting balances to Supabase:', err);
      }
    }
  };

  // Clear or reset demo data
  const resetToSampleData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgetByMonth({ [currentMonthStr]: INITIAL_BUDGETS });
    setCategories(DEFAULT_CATEGORIES);
    setTrips(INITIAL_TRIPS);
    setRecurringRules([]);
    setReceivables([]);
    setSavingsJars([]);
    setImpulseItems([]);
    setQuickActions(DEFAULT_QUICK_ACTIONS);
    setUpiId('');
    setStartingBalances({
      'UPI': 0,
      'Net Banking': 0,
      'Debit Card': 0,
      'Cash': 0,
      'Credit Card': 0,
    });
    localStorage.removeItem('paisapilot_transactions');
    localStorage.removeItem('paisapilot_budgets');
    localStorage.removeItem('paisapilot_categories');
    localStorage.removeItem('paisapilot_trips');
    localStorage.removeItem('paisapilot_starting_balances');
    setSelectedMonth(getCurrentMonthStr());
  };

  // 1. Transactions for the chosen month (or all)
  const monthlyTransactions = useMemo(() => {
    if (!selectedMonth || selectedMonth === 'all') {
      return transactions;
    }
    return transactions.filter((t) => t.date && t.date.startsWith(selectedMonth));
  }, [transactions, selectedMonth]);

  // 2. Filtered transactions for the ledger view
  const filteredTransactions = useMemo(() => {
    return monthlyTransactions.filter((t) => {
      const matchesSearch =
        searchQuery === '' ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        t.category_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.trip_name && t.trip_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (t.swap_target_mode && t.swap_target_mode.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = filterCategory === 'all' || t.category_name === filterCategory;
      const matchesMode = filterPaymentMode === 'all' || t.payment_mode === filterPaymentMode ||
        (t.type === 'transfer' && (t.from_mode === filterPaymentMode || t.to_mode === filterPaymentMode));
      const isTransfer = t.category_name === 'Transfer & Cash Swap' || Boolean(t.swap_id);
      const matchesType =
        filterType === 'all'
          ? true
          : filterType === 'transfer'
          ? isTransfer
          : filterType === 'expense'
          ? t.type === 'expense' && !isTransfer
          : filterType === 'income'
          ? t.type === 'income' && !isTransfer
          : t.type === filterType;

      const matchesTrip =
        filterTrip === 'all'
          ? true
          : filterTrip === 'regular'
          ? !t.trip_id
          : t.trip_id === filterTrip;

      return matchesSearch && matchesCat && matchesMode && matchesType && matchesTrip;
    });
  }, [monthlyTransactions, searchQuery, filterCategory, filterPaymentMode, filterType, filterTrip]);

  // 3. All-time Payment Mode Balances (Unified account balances)
  const { paymentModeBalances, totalLiquidFunds } = useMemo(() => {
    const map = {};
    PAYMENT_MODES.forEach((mode) => {
      const startAmt = Number(startingBalances[mode]) || 0;
      map[mode] = {
        mode,
        income: 0,
        expense: 0,
        transferIn: 0,
        transferOut: 0,
        balance: startAmt,
        startingBalance: startAmt,
        count: 0,
      };
    });

    transactions.forEach((t) => {
      const mode = t.payment_mode || 'UPI';
      if (!map[mode]) {
        const startAmt = Number(startingBalances[mode]) || 0;
        map[mode] = {
          mode,
          income: 0,
          expense: 0,
          transferIn: 0,
          transferOut: 0,
          balance: startAmt,
          startingBalance: startAmt,
          count: 0,
        };
      }
      const amt = Number(t.amount) || 0;
      if (t.type === 'transfer') {
        const from = t.from_mode || t.payment_mode || 'UPI';
        const to = t.to_mode || 'Net Banking';
        [from, to].forEach((accountMode) => {
          if (!map[accountMode]) {
            const startAmt = Number(startingBalances[accountMode]) || 0;
            map[accountMode] = { mode: accountMode, income: 0, expense: 0, transferIn: 0, transferOut: 0, balance: startAmt, startingBalance: startAmt, count: 0 };
          }
        });
        map[from].count += 1;
        map[to].count += 1;
        map[from].transferOut += amt;
        map[to].transferIn += amt;
        map[from].balance -= amt;
        map[to].balance += amt;
      } else if (t.type === 'income') {
        map[mode].count += 1;
        map[mode].income += amt;
        map[mode].balance += amt;
      } else {
        map[mode].count += 1;
        map[mode].expense += amt;
        map[mode].balance -= amt;
      }
    });

    const balances = Object.values(map);

    // Liquid funds = bank + upi + cash + debit (excluding credit card debt)
    let liquid = 0;
    balances.forEach((b) => {
      if (b.mode !== 'Credit Card') {
        liquid += b.balance;
      }
    });

    return {
      paymentModeBalances: balances,
      totalLiquidFunds: liquid,
    };
  }, [transactions, startingBalances]);

  const reservedSavings = useMemo(
    () => savingsJars.reduce((sum, jar) => sum + (Number(jar.saved) || 0), 0),
    [savingsJars]
  );

  // 4. Trip Stats & Progress
  const tripStats = useMemo(() => {
    return trips.map((trip) => {
      const tripTxns = transactions.filter((t) => t.trip_id === trip.id);
      let totalSpent = 0;
      tripTxns.forEach((t) => {
        if (t.type === 'expense') totalSpent += Number(t.amount) || 0;
      });
      const remaining = trip.budget - totalSpent;
      const percentage = trip.budget > 0 ? Math.round((totalSpent / trip.budget) * 100) : 0;
      const isOverBudget = trip.budget > 0 && totalSpent > trip.budget;

      return {
        ...trip,
        totalSpent,
        remaining,
        percentage,
        isOverBudget,
        transactions: tripTxns,
        transactionCount: tripTxns.length,
      };
    });
  }, [trips, transactions]);

  // 5. Computed Financial Stats for selected period
  const financialStats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const catMap = {};
    const modeMap = {};

    monthlyTransactions.forEach((t) => {
      // Exclude transfers & cash swaps from income and expense metrics so budgets remain 100% accurate
      const isTransfer = t.category_name === 'Transfer & Cash Swap' || Boolean(t.swap_id);
      if (isTransfer) return;

      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else if (t.type === 'expense') {
        expense += amt;

        // Group by category
        if (!catMap[t.category_name]) {
          catMap[t.category_name] = { amount: 0, count: 0 };
        }
        catMap[t.category_name].amount += amt;
        catMap[t.category_name].count += 1;

        // Group by payment mode
        if (!modeMap[t.payment_mode]) {
          modeMap[t.payment_mode] = 0;
        }
        modeMap[t.payment_mode] += amt;
      }
    });

    const balance = income - expense;
    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : 0;

    // Convert category map into sorted array
    const categoryBreakdown = Object.keys(catMap)
      .map((name) => {
        const catObj = categories.find((c) => c.name === name) || {};
        const amt = catMap[name].amount;
        const budgetLimit = budgets[name] || 0;
        const percentage = expense > 0 ? Math.round((amt / expense) * 100) : 0;

        return {
          name,
          amount: amt,
          count: catMap[name].count,
          percentage,
          color: catObj.color || '#6366f1',
          icon: catObj.icon || 'Tag',
          budgetLimit,
          isOverBudget: budgetLimit > 0 && amt > budgetLimit,
        };
      })
      .sort((a, b) => b.amount - a.amount);

    // Convert payment mode map into sorted array
    const paymentModeBreakdown = Object.keys(modeMap)
      .map((mode) => ({
        mode,
        amount: modeMap[mode],
        percentage: expense > 0 ? Math.round((modeMap[mode] / expense) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    const today = new Date();
    const currentDay = today.getDate();
    const dailyAverage = currentDay > 0 ? Math.round(expense / currentDay) : expense;

    return {
      totalIncome: income,
      totalExpense: expense,
      balance,
      savingsRate,
      categoryBreakdown,
      paymentModeBreakdown,
      topCategory,
      dailyAverage,
      transactionCount: monthlyTransactions.length,
    };
  }, [monthlyTransactions, categories, budgets]);

  const value = {
    theme,
    toggleTheme,
    // Auth & User
    user,
    session,
    isAuthLoading,
    isAuthModalOpen,
    setIsAuthModalOpen,
    login,
    signup,
    logout,
    // Transactions & Trips
    transactions,
    categories,
    budgets,
    trips,
    recurringRules,
    addRecurringRule,
    recordRecurringRule,
    toggleRecurringRule,
    receivables,
    addReceivables,
    markReceivablePaid,
    upiId,
    saveUpiId,
    savingsJars,
    addSavingsJar,
    updateSavingsJar,
    deleteSavingsJar,
    impulseItems,
    addImpulseItem,
    dismissImpulseItem,
    purchaseImpulseItem,
    quickActions,
    saveQuickActions,
    tripStats,
    addTrip,
    updateTrip,
    deleteTrip,
    startingBalances,
    updateStartingBalances,
    selectedMonth,
    setSelectedMonth,
    searchQuery,
    setSearchQuery,
    filterCategory,
    setFilterCategory,
    filterPaymentMode,
    setFilterPaymentMode,
    filterType,
    setFilterType,
    filterTrip,
    setFilterTrip,
    addTransaction,
    addCashSwap,
    importTransactions,
    createBackup,
    restoreBackup,
    updateTransaction,
    addCategory,
    deleteTransaction,
    clearAllTransactions,
    setCategoryBudget,
    resetToSampleData,
    supabaseConnected,
    isSyncing,
    refreshData: () => loadSupabaseData(user),
    filteredTransactions,
    monthlyTransactions,
    paymentModeBalances,
    totalLiquidFunds,
    reservedSavings,
    ...financialStats,
  };

  return <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>;
};

export const useExpense = () => {
  const context = useContext(ExpenseContext);
  if (!context) {
    throw new Error('useExpense must be used within an ExpenseProvider');
  }
  return context;
};
