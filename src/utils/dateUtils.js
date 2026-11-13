/**
 * Timezone-safe local date utilities for PaisaPilot
 */

// Returns 'YYYY-MM' using user's local timezone (not UTC)
export const getCurrentMonthStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Returns 'YYYY-MM-DD' using user's local timezone
export const getTodayDateStr = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Shifts a 'YYYY-MM' string by an offset (+1 or -1) cleanly using math
export const shiftMonthStr = (monthStr, offset) => {
  if (!monthStr || monthStr === 'all') {
    return getCurrentMonthStr();
  }

  const [yearStr, mStr] = monthStr.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(mStr, 10);

  if (isNaN(year) || isNaN(month)) {
    return getCurrentMonthStr();
  }

  month += offset;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
};

// Formats 'YYYY-MM' to 'September 2025' or 'All Time'
export const formatMonthTitle = (monthStr) => {
  if (!monthStr || monthStr === 'all') {
    return 'All Transactions';
  }

  const parts = monthStr.split('-');
  if (parts.length < 2) return monthStr;

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);

  if (isNaN(year) || isNaN(month)) return monthStr;

  // Use the 15th at noon to prevent any timezone bleed
  const date = new Date(year, month - 1, 15, 12, 0, 0);
  return date.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
};

// Month Names for month picker
export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
