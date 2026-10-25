// ウェル活 (point-use day): on that day 1 point is worth `multiplier` yen.
// Only an estimate for one item. The app does not check the date.

/** Points needed to pay `price` yen. Rounded up: you need whole points. */
export function pointsNeeded(price: number, multiplier: number): number | null {
  if (!Number.isFinite(price) || price <= 0) return null;
  if (!Number.isFinite(multiplier) || multiplier < 1) return null;
  // The small offset keeps 1200 / 1.2 from becoming 1001 through float error.
  return Math.ceil(price / multiplier - 1e-9);
}

/** The multiplier of a chain, or null when the chain does not have ウェル活 enabled. */
export function pointUseMultiplierOf(
  enabled: unknown,
  multiplier: unknown,
): number | null {
  if (enabled !== true) return null;
  const m = Number(multiplier);
  return Number.isFinite(m) && m >= 1 ? m : null;
}
