import type { TaxBasis } from "./tax";

export type PreviousPrice = {
  price: number;
  observedAt: string;
  chainId: string;
  chainName: string;
  taxBasis: TaxBasis;
};

// latest: the newest price of this 容量 at any chain; atChain: the newest at the chosen chain.
export type PreviousPrices = { latest: PreviousPrice | null; atChain: PreviousPrice | null };

export type PriceChange =
  | { kind: "none" } // nothing (valid) typed yet
  | { kind: "mismatch" } // the tax basis differs, a percent would mislead
  | { kind: "same" }
  | { kind: "up"; percent: number }
  | { kind: "down"; percent: number };

/** Reads the price field: full-width digits, commas, ¥ and 円 are accepted. NaN when empty or invalid. */
export function parsePriceInput(text: string): number {
  const cleaned = text.normalize("NFKC").replace(/[,¥円\s]/g, "");
  if (cleaned === "") return NaN;
  return Number(cleaned);
}

/** How the typed price compares with the previous one (percent has one decimal). */
export function priceChange(
  current: number,
  currentBasis: TaxBasis,
  previous: { price: number; taxBasis: TaxBasis }
): PriceChange {
  if (!Number.isFinite(current) || current <= 0) return { kind: "none" };
  if (!Number.isFinite(previous.price) || previous.price <= 0) return { kind: "none" };
  if (currentBasis !== previous.taxBasis) return { kind: "mismatch" };
  const percent = Math.round(((current - previous.price) / previous.price) * 1000) / 10;
  if (percent === 0) return { kind: "same" };
  return { kind: percent > 0 ? "up" : "down", percent: Math.abs(percent) };
}