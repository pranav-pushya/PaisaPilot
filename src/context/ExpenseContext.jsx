import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getSupabase, getSupabaseConfig } from '../api/supabase';
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

  // Load from Supabase if configured
  const loadSupabaseData = async () => {
    const { isConfigured } = getSupabaseConfig();
    if (!isConfigured) {
      setSupabaseConnected(false);
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    try {
      setIsSyncing(true);
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (txError) throw txError;

      if (txData && txData.length > 0) {
        setTransactions(txData);
      }

      // Also load categories from Supabase
      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('*');

      if (!catError && catData && catData.length > 0) {
        setCategories((prev) => {
          const names = new Set(prev.map((c) => c.name.toLowerCase()));
          const newFromCloud = catData.filter((c) => !names.has(c.name.toLowerCase()));
          return [...prev, ...newFromCloud];
        });
      }

      setSupabaseConnected(true);
    } catch (err) {
      console.warn('Could not fetch from Supabase, staying on local store:', err.message);
      setSupabaseConnected(false);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadSupabaseData();
  }, []);

  // Add Transaction (supports regular and trip transactions)
  const addTransaction = async (newTx) => {
    const tx = {
      id: newTx.id || `tx-${Date.now()}`,
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
        const descText = tx.trip_name ? `[${tx.trip_name}] ${tx.description}` : tx.description;
        await supabase.from('transactions').insert([
          {
            amount: tx.amount,
            type: tx.type,
            category_name: tx.category_name,
            payment_mode: tx.payment_mode,
            description: descText,
            date: tx.date,
          },
        ]);
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
        await supabase.from('categories').insert([{
          name: category.name,
          icon: category.icon,
          color: category.color,
          type: category.type,
        }]);
      } catch (err) {
        console.error('Failed to sync category to Supabase:', err);
      }
    }
  };

  // Trip Management
  const addTrip = (newTrip) => {
    const trip = {
      id: newTrip.id || `trip-${Date.now()}`,
      name: newTrip.name.trim(),
      type: newTrip.type || 'hackathon',
      budget: Number(newTrip.budget) || 0,
      startDate: newTrip.startDate || getTodayDateStr(),
      endDate: newTrip.endDate || getTodayDateStr(),
      status: newTrip.status || 'active',
      created_at: new Date().toISOString(),
    };
    setTrips((prev) => [trip, ...prev]);
  };

  const updateTrip = (id, updatedFields) => {
    setTrips((prev) => prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)));
  };

  const deleteTrip = (id) => {
    setTrips((prev) => prev.filter((t) => t.id !== id));
  };

  // Delete Transaction
  const deleteTransaction = async (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const supabase = getSupabase();
    if (supabase && supabaseConnected) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
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
        await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.error('Failed to clear transactions from Supabase:', err);
      }
    }
  };

  // Update Budget limit
  const setCategoryBudget = (categoryName, limit) => {
    setBudgets((prev) => ({
      ...prev,
      [categoryName]: Number(limit),
    }));
  };

  // Update Initial Balances
  const updateStartingBalances = (newBalances) => {
    setStartingBalances(newBalances);
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
        count: 0
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
          count: 0
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

    // Top category
    const topCategory = categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    // Daily average based on days elapsed in month
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
    refreshData: loadSupabaseData,
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
