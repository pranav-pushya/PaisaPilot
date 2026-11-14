export const calculateSurvivalBudget = (liquidFunds, reservedSavings, todayString) => {
  const [year, month, day] = todayString.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const daysLeft = Math.max(1, daysInMonth - day + 1);
  const availableFunds = Math.max(0, (Number(liquidFunds) || 0) - (Number(reservedSavings) || 0));
  return {
    availableFunds,
    daysLeft,
    safeDailySpend: Math.floor(availableFunds / daysLeft),
  };
};
