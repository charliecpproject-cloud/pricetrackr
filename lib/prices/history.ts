import type { TaxBasis } from "./tax";

export type HistoryRow = {
  observedAt: string;
  price: number;
  taxBasis: TaxBasis;
  chainId: string | null;
  chainName: string;
};

export type HistoryView = {
  // Oldest first. Only prices that share the tax basis of the newest price.
  points: HistoryRow[];
  taxBasis: TaxBasis;
  // How many prices were left out because they have another tax basis.
  leftOut: number;
  latest: HistoryRow;
  min: number;
  max: number;
  // Average of the points, in whole yen.
  average: number;
  // The newest price compared with the average, in whole percent (positive =
  // higher). null when it cannot be told: fewer than 3 prices, or the tax
  // basis is unknown.
  percentVsAverage: number | null;
};

// Builds the numbers behind a price history chart. With a chainId only that
// chain's prices are used. Returns null when there is nothing to draw (fewer
// than 2 prices with the same tax basis as the newest one).
export function buildHistory(
  rows: HistoryRow[],
  options: { chainId?: string } = {},
): HistoryView | null {
  const scoped =
    options.chainId === undefined
      ? rows
      : rows.filter((r) => r.chainId === options.chainId);
  const sorted = [...scoped].sort(
    (a, b) =>
      new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime(),
  );
  if (sorted.length === 0) return null;

  const latest = sorted[sorted.length - 1];
  const points = sorted.filter((r) => r.taxBasis === latest.taxBasis);
  if (points.length < 2) return null;

  const prices = points.map((p) => p.price);
  const mean = prices.reduce((total, p) => total + p, 0) / prices.length;

  let percentVsAverage: number | null = null;
  if (latest.taxBasis !== "unknown" && points.length >= 3 && mean > 0) {
    const percent = Math.round(((latest.price - mean) / mean) * 100);
    percentVsAverage = percent === 0 ? 0 : percent;
  }

  return {
    points,
    taxBasis: latest.taxBasis,
    leftOut: sorted.length - points.length,
    latest,
    min: Math.min(...prices),
    max: Math.max(...prices),
    average: Math.round(mean),
    percentVsAverage,
  };
}
