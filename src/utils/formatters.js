/**
 * Formats a number to Indian Rupee currency format (e.g., ₹1,23,456.00)
 */
export const formatINR = (amount, includeDecimals = false) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '₹0';
  
  const num = Number(amount);
  const isNegative = num < 0;
  const absNum = Math.abs(num);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(absNum);

  return isNegative ? `-${formatted}` : formatted;
};

/**
 * Returns a friendly date string (e.g., "Today", "Yesterday", or "12 Nov, 2026")
 */
export const formatFriendlyDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Default categories with icons and color themes
 */
export const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Food & Dining', icon: 'Utensils', color: '#f97316', type: 'expense' },
  { id: 'cat-2', name: 'Groceries', icon: 'ShoppingCart', color: '#10b981', type: 'expense' },
  { id: 'cat-3', name: 'Transport & Fuel', icon: 'Car', color: '#3b82f6', type: 'expense' },
  { id: 'cat-4', name: 'Rent & Utilities', icon: 'Home', color: '#8b5cf6', type: 'expense' },
  { id: 'cat-5', name: 'Shopping', icon: 'ShoppingBag', color: '#ec4899', type: 'expense' },
  { id: 'cat-6', name: 'Entertainment & OTT', icon: 'Film', color: '#06b6d4', type: 'expense' },
  { id: 'cat-7', name: 'Healthcare', icon: 'HeartPulse', color: '#ef4444', type: 'expense' },
  { id: 'cat-8', name: 'Personal Care', icon: 'Smile', color: '#f59e0b', type: 'expense' },
  { id: 'cat-9', name: 'Salary & Income', icon: 'Briefcase', color: '#22c55e', type: 'income' },
  { id: 'cat-10', name: 'Investments & Returns', icon: 'TrendingUp', color: '#14b8a6', type: 'income' },
  { id: 'cat-11', name: 'Freelance & Bonus', icon: 'Laptop', color: '#84cc16', type: 'income' },
];

/**
 * Payment modes popular in India
 */
export const PAYMENT_MODES = [
  'UPI',
  'Credit Card',
  'Debit Card',
  'Cash',
  'Net Banking',
];
