export const TAX_BASES = ["excl", "incl", "unknown"] as const;
export type TaxBasis = (typeof TAX_BASES)[number];

export const TAX_RADIO_LABEL: Record<TaxBasis, string> = {
  excl: "税抜き",
  incl: "税込み",
  unknown: "不明",
};

export const TAX_BADGE_LABEL: Record<TaxBasis, string> = {
  excl: "税抜",
  incl: "税込",
  unknown: "税不明",
};

// Reads a value from the database; anything unexpected counts as unknown.
export function parseTaxBasis(value: unknown): TaxBasis {
  return TAX_BASES.find((b) => b === value) ?? "unknown";
}

// True only when there are 2+ prices and all share the same known basis.
export function canCompare(bases: TaxBasis[]): boolean {
  return (
    bases.length > 1 &&
    bases[0] !== "unknown" &&
    bases.every((b) => b === bases[0])
  );
}

// True when the timestamp is no older than `months` months before `now`.
export function isWithinMonths(
  iso: string,
  months: number,
  now: Date = new Date(),
): boolean {
  const limit = new Date(now);
  limit.setMonth(limit.getMonth() - months);
  return new Date(iso).getTime() >= limit.getTime();
}

type Comparable = { observedAt: string; taxBasis: TaxBasis; effective: number };

// True when `row` is the cheapest of the prices from the last 6 months,
// and those prices (at least two) all share the same known tax basis.
export function isCheapest(
  row: Comparable,
  rows: Comparable[],
  now: Date = new Date(),
): boolean {
  const recent = rows.filter((r) => isWithinMonths(r.observedAt, 6, now));
  if (!recent.includes(row)) return false;
  if (!canCompare(recent.map((r) => r.taxBasis))) return false;
  return row.effective === Math.min(...recent.map((r) => r.effective));
}
