import { bestBulkTier, bulkItemPrice, type BulkTier } from "./bulk";
import { bestDiscount, couponPrice } from "./coupon";
import { formatYen } from "./format";
import { unitPriceText } from "./unit";
import { isCounterUnit } from "./unitWords";

export type UnitLine = { label: string | null; text: string };

/** True for one single piece (1個, 1枚, 1袋, 1本, ...): the unit price would only repeat the price. */
export function isSinglePiece(size: number, unit: string): boolean {
  return size === 1 && isCounterUnit(unit);
}

function bulkLabel(tier: BulkTier): string {
  return tier.kind === "total"
    ? `まとめ買い${tier.quantity}個で${formatYen(tier.total)}`
    : `まとめ買い${tier.percent}%引`;
}

/**
 * The unit price lines of one price, all calculated from the entered (regular) price:
 * - 通常: the entered price, without any coupon (when the entered price is already a member
 *   price it is labeled 会員価格);
 * - the best coupon or membership percent of the chain applied, when there is one;
 * - まとめ買い: the tier with the lowest price per item, when the price has tiers.
 * With neither a discount nor tiers there is a single unlabeled line. The discounts never stack.
 */
export function unitPriceLines(options: {
  enteredPrice: number;
  couponPercents?: readonly number[] | null;
  memberPercent?: number | null;
  isMemberPrice?: boolean;
  bulkTiers: BulkTier[];
  size: number;
  unit: string;
  hideSinglePiece?: boolean;
}): UnitLine[] {
  const {
    enteredPrice,
    couponPercents,
    memberPercent,
    isMemberPrice = false,
    bulkTiers,
    size,
    unit,
    hideSinglePiece = false,
  } = options;
  if (hideSinglePiece && isSinglePiece(size, unit)) return [];

  const regular = unitPriceText(enteredPrice, size, unit);
  if (regular === null) return [];

  const discount = isMemberPrice ? null : bestDiscount(couponPercents, memberPercent);
  const discountText = discount
    ? unitPriceText(couponPrice(enteredPrice, discount.percent), size, unit)
    : null;

  const bestTier = bestBulkTier(enteredPrice, bulkTiers);
  const bulkText = bestTier
    ? unitPriceText(bulkItemPrice(enteredPrice, bestTier), size, unit)
    : null;

  if (discountText === null && bulkText === null) return [{ label: null, text: regular }];

  const lines: UnitLine[] = [{ label: isMemberPrice ? "会員価格" : "通常", text: regular }];
  if (discount && discountText !== null) {
    lines.push({
      label: discount.kind === "coupon" ? `${discount.percent}%クーポン` : `会員${discount.percent}%引`,
      text: discountText,
    });
  }
  if (bestTier && bulkText !== null) lines.push({ label: bulkLabel(bestTier), text: bulkText });
  return lines;
}