import { formatYen } from "./format";

// How each package unit is normalized: how many base units one package unit
// is (L = 1000 ml), how many base units the price is shown "per", and the
// label after the slash.
const UNITS: Record<string, { factor: number; per: number; label: string }> = {
  ml: { factor: 1, per: 100, label: "100ml" },
  L: { factor: 1000, per: 100, label: "100ml" },
  g: { factor: 1, per: 100, label: "100g" },
  kg: { factor: 1000, per: 100, label: "100g" },
  count: { factor: 1, per: 1, label: "個" },
  sheet: { factor: 1, per: 1, label: "枚" },
  bag: { factor: 1, per: 1, label: "袋" },
};

/** Price per normalized unit, rounded to one decimal; null when it can't be computed. */
export function unitPrice(
  price: number,
  size: number,
  unit: string
): { amount: number; label: string } | null {
  if (!Object.prototype.hasOwnProperty.call(UNITS, unit)) return null;
  const rule = UNITS[unit];
  if (!Number.isFinite(price) || !Number.isFinite(size) || size <= 0 || price < 0) {
    return null;
  }
  const amount = (price / (size * rule.factor)) * rule.per;
  return { amount: Math.round(amount * 10) / 10, label: rule.label };
}

/** Text such as "¥39.6 / 100ml", or null when there is nothing to show. */
export function unitPriceText(price: number, size: number, unit: string): string | null {
  const result = unitPrice(price, size, unit);
  return result ? `${formatYen(result.amount)} / ${result.label}` : null;
}