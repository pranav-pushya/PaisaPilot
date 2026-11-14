export const getJarBalanceAfterMove = (jar, delta) => {
  const amount = Number(delta);
  const saved = Number(jar?.saved) || 0;
  const target = Number(jar?.target) || 0;
  if (!Number.isFinite(amount) || amount === 0 || !target) return null;
  const next = saved + amount;
  if (next < 0 || next > target) return null;
  return next;
};
