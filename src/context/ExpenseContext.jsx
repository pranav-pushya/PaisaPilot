import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { getSupabase, getSupabaseConfig } from '../api/supabase';
import { DEFAULT_CATEGORIES } from '../utils/formatters';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGETS } from '../utils/initialData';
import { getCurrentMonthStr, getTodayDateStr } from '../utils/dateUtils';

const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const currentMonthStr = getCurrentMonthStr();

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

  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPaymentMode, setFilterPaymentMode] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [isSyncing, setIsSyncing] = useState(false);
  const [supabaseConnected, setSupabaseConnected] = useState(false);

  // Sync to localStorage as backup / default mode
  useEffect(() => {
    localStorage.setItem('paisapilot_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('paisapilot_budgets', JSON.stringify(budgets));
  }, [budgets]);

  useEffect(() => {
    localStorage.setItem('paisapilot_categories', JSON.stringify(categories));
  }, [categories]);

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

  // Add Transaction
  const addTransaction = async (newTx) => {
    const tx = {
      id: newTx.id || `tx-${Date.now()}`,
      amount: Number(newTx.amount),
      type: newTx.type || 'expense',
      category_name: newTx.category_name || 'Food & Dining',
      payment_mode: newTx.payment_mode || 'UPI',
      description: newTx.description || '',
      date: newTx.date || getTodayDateStr(),
      created_at: new Date().toISOString(),
    };

    // Update local state immediately
    setTransactions((prev) => [tx, ...prev]);

    // Push to Supabase if connected
    const supabase = getSupabase();
    if (supabase && supabaseConnected) {
      try {
        await supabase.from('transactions').insert([
          {
            amount: tx.amount,
            type: tx.type,
            category_name: tx.category_name,
            payment_mode: tx.payment_mode,
            description: tx.description,
            date: tx.date,
          },
        ]);
      } catch (err) {
        console.error('Failed to sync transaction to Supabase:', err);
      }
    }
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

  // Update Budget limit
  const setCategoryBudget = (categoryName, limit) => {
    setBudgets((prev) => ({
      ...prev,
      [categoryName]: Number(limit),
    }));
  };

  // Clear or reset demo data
  const resetToSampleData = () => {
    setTransactions(INITIAL_TRANSACTIONS);
    setBudgets(INITIAL_BUDGETS);
    setCategories(DEFAULT_CATEGORIES);
    localStorage.removeItem('paisapilot_transactions');
    localStorage.removeItem('paisapilot_budgets');
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
        t.category_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = filterCategory === 'all' || t.category_name === filterCategory;
      const matchesMode = filterPaymentMode === 'all' || t.payment_mode === filterPaymentMode;
      const matchesType = filterType === 'all' || t.type === filterType;

      return matchesSearch && matchesCat && matchesMode && matchesType;
    });
  }, [monthlyTransactions, searchQuery, filterCategory, filterPaymentMode, filterType]);

  // 3. Computed Financial Stats
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
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;

    // Calculate days passed in selected month
    const todayMonth = getCurrentMonthStr();
    const isCurrent = todayMonth === selectedMonth;
    const daysPassed = isCurrent ? Math.max(1, new Date().getDate()) : 30;
    const dailyAverage = Math.round(expense / daysPassed);

    // Format category breakdown
    const categoryBreakdown = Object.keys(catMap).map((catName) => {
      const catObj = categories.find((c) => c.name === catName) || {
        color: '#94a3b8',
        icon: 'Tag',
      };
      const catAmt = catMap[catName].amount;
      const budgetLimit = budgets[catName] || null;
      return {
        name: catName,
        amount: catAmt,
        count: catMap[catName].count,
        color: catObj.color,
        icon: catObj.icon,
        percentage: expense > 0 ? Math.round((catAmt / expense) * 100) : 0,
        budget: budgetLimit,
        isOverBudget: budgetLimit ? catAmt > budgetLimit : false,
      };
    }).sort((a, b) => b.amount - a.amount);

    const topCategory = categoryBreakdown[0] || null;

    // Format payment mode breakdown
    const paymentModeBreakdown = Object.keys(modeMap).map((mode) => ({
      name: mode,
      amount: modeMap[mode],
      percentage: expense > 0 ? Math.round((modeMap[mode] / expense) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    return {
      totalIncome: income,
      totalExpense: expense,
      balance,
      savingsRate,
      dailyAverage,
      categoryBreakdown,
      topCategory,
      paymentModeBreakdown,
      transactionCount: monthlyTransactions.length,
      currentMonth: selectedMonth,
      recentTransactions: monthlyTransactions.slice(0, 8),
    };
  }, [monthlyTransactions, categories, budgets, selectedMonth]);

  const value = {
    transactions,
    categories,
    budgets,
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
    addTransaction,
    deleteTransaction,
    setCategoryBudget,
    resetToSampleData,
    supabaseConnected,
    isSyncing,
    refreshData: loadSupabaseData,
    filteredTransactions,
    monthlyTransactions,
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
