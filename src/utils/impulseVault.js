export const getImpulseTimeState = (unlockAt, now = Date.now()) => {
  const remainingMs = Math.max(0, new Date(unlockAt).getTime() - now);
  if (!remainingMs) return { unlocked: true, label: 'Ready to review', remainingMs: 0 };
  const hours = Math.floor(remainingMs / 3600000);
  const minutes = Math.ceil((remainingMs % 3600000) / 60000);
  return { unlocked: false, remainingMs, label: hours ? `Locked · ${hours}h ${minutes}m left` : `Locked · ${minutes}m left` };
};

export const getFundsAfterPurchase = (availableFunds, purchaseAmount) =>
  (Number(availableFunds) || 0) - (Number(purchaseAmount) || 0);
