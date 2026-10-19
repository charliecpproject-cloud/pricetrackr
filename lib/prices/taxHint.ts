import { formatYen } from "./format";
import type { TaxBasis } from "./tax";

/** Tax-included price estimate. Rounded down to the yen, like coupon prices. */
export function taxIncludedEstimate(price: number, ratePercent: number): number | null {
  if (!Number.isFinite(price) || price < 0) return null;
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 30) return null;
  return Math.floor((price * (100 + ratePercent)) / 100 + 1e-9);
}

/** The tooltip text for a 税抜 or 税不明 price, or null when there is nothing to suggest. */
export function taxHintMessage(
  price: number,
  ratePercent: number,
  basis: TaxBasis
): string | null {
  if (basis === "incl") return null;
  if (ratePercent === 0) return null;
  const estimate = taxIncludedEstimate(price, ratePercent);
  if (estimate === null) return null;
  const yen = formatYen(estimate);
  if (basis === "excl") {
    return `税抜の価格に${ratePercent}%の税を足すと、税込の目安は${yen}です（未確認）`;
  }
  return `税込か税抜か不明です。税抜だとすると、${ratePercent}%の税を足して${yen}になります（未確認）`;
}