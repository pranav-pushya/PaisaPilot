import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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

  const [budgets, setBudgets] = useState(() => {
    const saved = localStorage.getItem('paisapilot_budgets');
    return saved ? JSON.parse(saved) : INITIAL_BUDGETS;
  });

  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('paisapilot_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

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

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMode, setFilterPaymentMode] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterTrip, setFilterTrip] = useState('all'); // 'all' | 'regular' | trip_id
  const [isSyncing, setIsSyncing] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('paisapilot_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('paisapilot_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('paisapilot_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('paisapilot_starting_balances', JSON.stringify(startingBalances));
  }, [startingBalances]);

  useEffect(() => {
    localStorage.setItem('paisapilot_trips', JSON.stringify(trips));
  }, [trips]);

  // Load data from Supabase (scoped to user if authenticated)
  const loadSupabaseData = async (activeUser = user) => {
    const { isConfigured } = getSupabaseConfig();
    if (!isConfigured) {
      setSupabaseConnected(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setIsSyncing(true);

      // 1. Transactions
      let txQuery = supabase.from('transactions').select('*').order('date', { ascending: false });
      if (activeUser?.id) {
        txQuery = txQuery.eq('user_id', activeUser.id);
      }
      const { data: txData, error: txError } = await txQuery;
      if (!txError && txData) {
        setTransactions(txData);
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

      // 3. User-specific data (Trips, Budgets, Starting Balances)
      if (activeUser?.id) {
        // Trips
        const { data: tripData, error: tripError } = await supabase
          .from('trips')
          .select('*')
          .eq('user_id', activeUser.id)
          .order('created_at', { ascending: false });
        if (!tripError && tripData) {
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

        // Budgets
        const { data: budgetData, error: budgetError } = await supabase
          .from('budgets')
          .select('*')
          .eq('user_id', activeUser.id);
        if (!budgetError && budgetData && budgetData.length > 0) {
          const bMap = {};
          budgetData.forEach((b) => {
            bMap[b.category_name] = Number(b.monthly_limit);
          });
          setBudgets((prev) => ({ ...prev, ...bMap }));
        }

        // User Account Balances
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', activeUser.id)
          .maybeSingle();
        if (!profileError && profileData?.starting_balances) {
          setStartingBalances(profileData.starting_balances);
        }
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

  // Multi-Device Realtime Sync Subscription
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !supabaseConnected || !user?.id) return;

    const channel = supabase
      .channel(`device-sync-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${user.id}` },
        () => {
          loadSupabaseData(user);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips', filter: `user_id=eq.${user.id}` },
        () => {
          loadSupabaseData(user);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${user.id}` },
        () => {
          loadSupabaseData(user);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_profiles', filter: `user_id=eq.${user.id}` },
        () => {
          loadSupabaseData(user);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabaseConnected]);

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
    // Reset to local sample data
    setTransactions(INITIAL_TRANSACTIONS);
    setTrips(INITIAL_TRIPS);
    setBudgets(INITIAL_BUDGETS);
    setStartingBalances({
      'UPI': 0,
      'Net Banking': 0,
      'Debit Card': 0,
      'Cash': 0,
      'Credit Card': 0,
    });
  };

  // Add Transaction (supports regular and trip transactions)
  const addTransaction = async (newTx) => {
    const tx = {
      id: newTx.id || `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      amount: Number(newTx.amount),
      type: newTx.type || 'expense',
      category_name: newTx.category_name || 'Food & Dining',
      payment_mode: newTx.payment_mode || 'UPI',
      description: newTx.description || '',
      trip_id: newTx.trip_id || null,
      trip_name: newTx.trip_name || null,
      date: newTx.date || getTodayDateStr(),
      created_at: new Date().toISOString(),
    };

    // Update local state immediately
    setTransactions((prev) => [tx, ...prev]);

    // Push to Supabase if connected
    const supabase = getSupabase();
    if (supabase && supabaseConnected) {
      try {
        const payload = {
          id: tx.id,
          amount: tx.amount,
          type: tx.type,
          category_name: tx.category_name,
          payment_mode: tx.payment_mode,
          description: tx.description,
          trip_id: tx.trip_id,
          trip_name: tx.trip_name,
          date: tx.date,
        };
        if (user?.id) {
          payload.user_id = user.id;
        }
        await supabase.from('transactions').upsert([payload]);
      } catch (err) {
        console.error('Failed to sync transaction to Supabase:', err);
      }
    }
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
    if (supabase && supabaseConnected) {
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
        await supabase.from('trips').delete().eq('id', id).eq('user_id', user.id);
      } catch (err) {
        console.error('Failed to delete trip from Supabase:', err);
      }
    }
  };

  // Delete Transaction
  const deleteTransaction = async (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const supabase = getSupabase();
    if (supabase && supabaseConnected) {
      try {
        let query = supabase.from('transactions').delete().eq('id', id);
        if (user?.id) {
          query = query.eq('user_id', user.id);
        }
        await query;
      } catch (err) {
        console.error('Failed to delete from Supabase:', err);
      }
    }
  };

  // Delete All Transactions
  const clearAllTransactions = async () => {
    setTransactions([]);
    localStorage.removeItem('paisapilot_transactions');

    const supabase = getSupabase();
    if (supabase && supabaseConnected) {
      try {
        let query = supabase.from('transactions').delete();
        if (user?.id) {
          query = query.eq('user_id', user.id);
        } else {
          query = query.neq('id', '00000000-0000-0000-0000-000000000000');
        }
        await query;
      } catch (err) {
        console.error('Failed to clear transactions from Supabase:', err);
      }
    }
  };

  // Update Budget limit with multi-device sync
  const setCategoryBudget = async (categoryName, limit) => {
    setBudgets((prev) => ({
      ...prev,
      [categoryName]: Number(limit),
    }));

    const supabase = getSupabase();
    if (supabase && supabaseConnected && user?.id) {
      try {
        await supabase.from('budgets').upsert([
          {
            user_id: user.id,
            category_name: categoryName,
            monthly_limit: Number(limit),
            month: selectedMonth || getCurrentMonthStr(),
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
    setBudgets(INITIAL_BUDGETS);
    setCategories(DEFAULT_CATEGORIES);
    setTrips(INITIAL_TRIPS);
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
        (t.trip_name && t.trip_name.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = filterCategory === 'all' || t.category_name === filterCategory;
      const matchesMode = filterPaymentMode === 'all' || t.payment_mode === filterPaymentMode;
      const matchesType = filterType === 'all' || t.type === filterType;

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
          balance: startAmt,
          startingBalance: startAmt,
          count: 0,
        };
      }
      const amt = Number(t.amount) || 0;
      map[mode].count += 1;
      if (t.type === 'income') {
        map[mode].income += amt;
        map[mode].balance += amt;
      } else {
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
      const amt = Number(t.amount) || 0;
      if (t.type === 'income') {
        income += amt;
      } else {
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
