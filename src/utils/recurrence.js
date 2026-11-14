export const advanceRecurringDate = (dateString, frequency, anchorDay = null) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const targetDay = Number(anchorDay) || day;
  const date = new Date(Date.UTC(year, month - 1, day));

  if (frequency === 'weekly') {
    date.setUTCDate(date.getUTCDate() + 7);
  } else if (frequency === 'yearly') {
    const nextYear = date.getUTCFullYear() + 1;
    const monthIndex = date.getUTCMonth();
    const maxDay = new Date(Date.UTC(nextYear, monthIndex + 1, 0)).getUTCDate();
    date.setUTCFullYear(nextYear, monthIndex, Math.min(targetDay, maxDay));
  } else {
    const nextMonth = date.getUTCMonth() + 1;
    const nextYear = date.getUTCFullYear() + Math.floor(nextMonth / 12);
    const monthIndex = nextMonth % 12;
    const maxDay = new Date(Date.UTC(nextYear, monthIndex + 1, 0)).getUTCDate();
    date.setUTCFullYear(nextYear, monthIndex, Math.min(targetDay, maxDay));
  }

  return date.toISOString().slice(0, 10);
};

export const daysUntilDate = (dateString, todayString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const [todayYear, todayMonth, todayDay] = todayString.split('-').map(Number);
  const due = Date.UTC(year, month - 1, day);
  const today = Date.UTC(todayYear, todayMonth - 1, todayDay);
  return Math.round((due - today) / 86400000);
};
