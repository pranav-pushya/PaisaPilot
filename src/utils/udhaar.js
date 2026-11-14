export const validateUdhaarSplits = (rows, expenseAmount) => {
  const enteredRows = rows.filter((row) => String(row.name || '').trim() || String(row.amount || '').trim());
  const invalid = enteredRows.some((row) => !String(row.name || '').trim() || !Number.isFinite(Number(row.amount)) || Number(row.amount) <= 0);
  const entries = enteredRows.filter((row) => String(row.name || '').trim() && Number(row.amount) > 0)
    .map((row) => ({ name: String(row.name).trim(), amount: Number(row.amount) }));
  const total = entries.reduce((sum, row) => sum + row.amount, 0);
  if (invalid || !entries.length) return { valid: false, reason: 'Add a friend and the amount they owe.', entries, total };
  if (total > Number(expenseAmount)) return { valid: false, reason: 'The amounts owed can’t exceed the expense total.', entries, total };
  return { valid: true, entries, total };
};

export const buildUdhaarReminder = (item, upiId = '') => {
  const date = new Date(`${item.date}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const paymentLine = upiId ? ` Send it to ${upiId} on UPI.` : ' You can send it on UPI when convenient.';
  return `Hey ${item.name}! ₹${Number(item.amount).toLocaleString('en-IN')} is pending for ${item.description} from ${date}.${paymentLine} Thanks!`;
};

export const buildWhatsAppReminderUrl = (item, upiId = '') =>
  `https://wa.me/?text=${encodeURIComponent(buildUdhaarReminder(item, upiId))}`;
