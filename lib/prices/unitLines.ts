import { bulkTierPrice, type BulkTier } from "./bulk";
import { unitPriceText } from "./unit";
import { isCounterUnit } from "./unitWords";

export type UnitLine = { label: string | null; text: string };

// Every unit that is not a measure (ml, L, g, kg) is a counter word: see unitWords.ts.

/** True for one single piece (1個, 1枚, 1袋): the unit price would only repeat the price. */
export function isSinglePiece(size: number, unit: string): boolean {
  return size === 1 && isCounterUnit(unit);
}

/**
 * The unit price lines of one price. Without bulk tiers: one line from the displayed price
 * (coupon or membership applied). With tiers: a regular line and a second line for the tier
 * with the biggest discount, applied to the entered regular price (the same as the tier
 * prices shown by PriceDisplay).
 */
export function unitPriceLines(options: {
  displayPrice: number;
  enteredPrice: number;
  bulkTiers: BulkTier[];
  size: number;
  unit: string;
  hideSinglePiece?: boolean;
}): UnitLine[] {
  const { displayPrice, enteredPrice, bulkTiers, size, unit, hideSinglePiece = false } = options;
  if (hideSinglePiece && isSinglePiece(size, unit)) return [];

  const regular = unitPriceText(displayPrice, size, unit);
  if (regular === null) return [];
  if (bulkTiers.length === 0) return [{ label: null, text: regular }];

  const best = bulkTiers.reduce((a, b) => (b.percent > a.percent ? b : a));
  const bulk = unitPriceText(bulkTierPrice(enteredPrice, best.percent), size, unit);
  if (bulk === null) return [{ label: null, text: regular }];

  return [
    { label: "通常", text: regular },
    { label: `まとめ買い${best.percent}%引`, text: bulk },
  ];
}