// Sample initial data populated for demo / first-run state

const getRecentDate = (daysAgo) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const INITIAL_TRIPS = [
  {
    id: 'trip-hackindia',
    name: 'HackIndia 2026 Hackathon',
    type: 'hackathon',
    budget: 8000,
    startDate: getRecentDate(4),
    endDate: getRecentDate(2),
    status: 'active',
  },
  {
    id: 'trip-goa',
    name: 'Goa Weekend Trip',
    type: 'trip',
    budget: 15000,
    startDate: getRecentDate(20),
    endDate: getRecentDate(17),
    status: 'completed',
  },
];

export const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    amount: 85000,
    type: 'income',
    category_name: 'Salary & Income',
    payment_mode: 'Net Banking',
    description: 'Monthly Salary Credit',
    date: getRecentDate(12),
  },
  {
    id: 'tx-2',
    amount: 22000,
    type: 'expense',
    category_name: 'Rent & Utilities',
    payment_mode: 'Net Banking',
    description: 'House Rent & Maintenance',
    date: getRecentDate(11),
  },
  {
    id: 'tx-3',
    amount: 1450,
    type: 'expense',
    category_name: 'Groceries',
    payment_mode: 'UPI',
    description: 'Blinkit weekly groceries & fruits',
    date: getRecentDate(9),
  },
  {
    id: 'tx-4',
    amount: 580,
    type: 'expense',
    category_name: 'Food & Dining',
    payment_mode: 'UPI',
    description: 'Dinner with friends at Social',
    date: getRecentDate(7),
  },
  {
    id: 'tx-5',
    amount: 320,
    type: 'expense',
    category_name: 'Transport & Fuel',
    payment_mode: 'UPI',
    description: 'Uber Auto to hackathon venue',
    trip_id: 'trip-hackindia',
    trip_name: 'HackIndia 2026 Hackathon',
    date: getRecentDate(5),
  },
  {
    id: 'tx-6',
    amount: 649,
    type: 'expense',
    category_name: 'Entertainment & OTT',
    payment_mode: 'Credit Card',
    description: 'Netflix Premium Monthly',
    date: getRecentDate(4),
  },
  {
    id: 'tx-7',
    amount: 820,
    type: 'expense',
    category_name: 'Food & Dining',
    payment_mode: 'UPI',
    description: 'Midnight Pizza & Red Bull for team',
    trip_id: 'trip-hackindia',
    trip_name: 'HackIndia 2026 Hackathon',
    date: getRecentDate(2),
  },
  {
    id: 'tx-8',
    amount: 1250,
    type: 'expense',
    category_name: 'Healthcare',
    payment_mode: 'Credit Card',
    description: 'Apollo Pharmacy medicines & vitamins',
    date: getRecentDate(1),
  },
  {
    id: 'tx-9',
    amount: 4500,
    type: 'income',
    category_name: 'Freelance & Bonus',
    payment_mode: 'UPI',
    description: 'Freelance UI design gig',
    date: getRecentDate(0),
  },
];

export const INITIAL_BUDGETS = {
  'Food & Dining': 8000,
  'Groceries': 10000,
  'Rent & Utilities': 25000,
  'Shopping': 5000,
  'Transport & Fuel': 4000,
  'Entertainment & OTT': 2000,
};
