import { bestBulkTier, bulkItemPrice, type BulkTier } from "./bulk";
import { bestDiscount, couponPrice } from "./coupon";
import { formatYen } from "./format";
import { unitPrice } from "./unit";
import { isCounterUnit } from "./unitWords";

export type UnitSummaryItem = { label: string | null; amount: string };
// per = "100mlあたり", "100gあたり", "1個あたり" ...; items = one or more prices per that amount.
export type UnitSummary = { per: string; items: UnitSummaryItem[] };

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
 * One compact unit price summary, all calculated from the entered (regular) price:
 * - 通常: the entered price without any coupon (会員価格 when the entered price is already a
 *   member price);
 * - the best coupon or membership percent of the chain, when there is one;
 * - まとめ買い: the tier with the lowest price per item, when the price has tiers.
 * With neither a discount nor tiers there is a single unlabeled item. Discounts never stack.
 * Returns null when there is nothing to show (unknown unit, or a single piece when hidden).
 */
export function unitPriceSummary(options: {
  enteredPrice: number;
  couponPercents?: readonly number[] | null;
  memberPercent?: number | null;
  isMemberPrice?: boolean;
  bulkTiers: BulkTier[];
  size: number;
  unit: string;
  hideSinglePiece?: boolean;
}): UnitSummary | null {
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
  if (hideSinglePiece && isSinglePiece(size, unit)) return null;

  const regular = unitPrice(enteredPrice, size, unit);
  if (regular === null) return null;
  const per = isCounterUnit(unit) ? `1${regular.label}あたり` : `${regular.label}あたり`;

  const discount = isMemberPrice ? null : bestDiscount(couponPercents, memberPercent);
  const discounted = discount ? unitPrice(couponPrice(enteredPrice, discount.percent), size, unit) : null;

  const bestTier = bestBulkTier(enteredPrice, bulkTiers);
  const bulk = bestTier ? unitPrice(bulkItemPrice(enteredPrice, bestTier), size, unit) : null;

  if (discounted === null && bulk === null) {
    return { per, items: [{ label: null, amount: formatYen(regular.amount) }] };
  }

  const items: UnitSummaryItem[] = [
    { label: isMemberPrice ? "会員価格" : "通常", amount: formatYen(regular.amount) },
  ];
  if (discount && discounted !== null) {
    items.push({
      label: discount.kind === "coupon" ? `${discount.percent}%クーポン` : `会員${discount.percent}%引`,
      amount: formatYen(discounted.amount),
    });
  }
  if (bestTier && bulk !== null) items.push({ label: bulkLabel(bestTier), amount: formatYen(bulk.amount) });
  return { per, items };
}