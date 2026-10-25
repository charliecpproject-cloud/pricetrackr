import type { PreviousPrice } from "./previous";
import type { TaxBasis } from "./tax";

export const JUMP_FACTOR = 5;
const TAX_RATES = [1.08, 1.1] as const;
const TAX_TOLERANCE = 0.015;

export type PriceWarning =
  | { kind: "jump"; ratio: number } // 5x or more the previous price
  | { kind: "drop"; ratio: number } // 1/5 or less of the previous price (ratio < 1)
  | { kind: "tax"; rate: 8 | 10 }; // the difference looks like consumption tax

// The change is about the consumption tax rate, and the tax choice does not explain it.
function taxMixup(
  ratio: number,
  currentBasis: TaxBasis,
  previousBasis: TaxBasis,
): PriceWarning | null {
  for (const rate of TAX_RATES) {
    const up = Math.abs(ratio / rate - 1) <= TAX_TOLERANCE;
    const down = Math.abs(ratio * rate - 1) <= TAX_TOLERANCE;
    if (!up && !down) continue;

    const bothKnown = currentBasis !== "unknown" && previousBasis !== "unknown";
    // Same known basis: it is just a price change.
    if (bothKnown && currentBasis === previousBasis) return null;
    // 税抜 then 税込 (higher), or 税込 then 税抜 (lower): exactly what a correct entry looks like.
    if (up && previousBasis === "excl" && currentBasis === "incl") return null;
    if (down && previousBasis === "incl" && currentBasis === "excl")
      return null;

    return { kind: "tax", rate: rate === 1.08 ? 8 : 10 };
  }
  return null;
}

/**
 * Advice for a typed price compared with the previous one (never blocks saving):
 * 5x or more, 1/5 or less, or a likely 税抜/税込 mix-up. Empty list = nothing to say.
 */
export function suspiciousPrice(
  current: number,
  currentBasis: TaxBasis,
  previous: Pick<PreviousPrice, "price" | "taxBasis"> | null,
): PriceWarning[] {
  if (!previous) return [];
  if (!Number.isFinite(current) || current <= 0) return [];
  if (!Number.isFinite(previous.price) || previous.price <= 0) return [];

  const ratio = current / previous.price;
  const out: PriceWarning[] = [];
  if (current >= previous.price * JUMP_FACTOR)
    out.push({ kind: "jump", ratio });
  else if (current * JUMP_FACTOR <= previous.price)
    out.push({ kind: "drop", ratio });

  const tax = taxMixup(ratio, currentBasis, previous.taxBasis);
  if (tax) out.push(tax);
  return out;
}
