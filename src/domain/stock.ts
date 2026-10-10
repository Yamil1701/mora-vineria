export type StockAlert = { level: 'ok' | 'low' | 'critical'; needsReplenishment: boolean };

/** Read-only policy for individual products; quantities and objectives are whole units. */
export function stockAlert(current: number, objective: number | null): StockAlert {
  if (objective === null || !Number.isSafeInteger(objective) || objective <= 0 || !Number.isSafeInteger(current)) {
    return { level: 'ok', needsReplenishment: false };
  }
  // Dividing avoids overflow and rounds down to whole units (24 -> 4 low, 2 critical).
  const level = current <= Math.floor(objective / 10) ? 'critical'
    : current <= Math.floor(objective / 5) ? 'low' : 'ok';
  return { level, needsReplenishment: level !== 'ok' };
}
