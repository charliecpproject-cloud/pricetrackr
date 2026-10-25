import { bestBulkTier, bulkItemPrice, type BulkTier } from "../prices/bulk";

export type BulkFeedSummary = { text: string; more: number };

const yen = (n: number) => `¥${n.toLocaleString("ja-JP")}`;

/**
 * One short line for the home feed: the best まとめ買い tier (lowest price per item) and how many
 * other tiers there are. Examples: "10個以上 20%引 ¥800" or "5個で¥550". null when there are no tiers.
 */
export function bulkFeedSummary(
  price: number,
  tiers: readonly BulkTier[],
): BulkFeedSummary | null {
  if (!Number.isFinite(price) || tiers.length === 0) return null;
  const best = bestBulkTier(price, tiers);
  if (!best) return null;
  const more = tiers.length - 1;
  if (best.kind === "total") {
    return { text: `${best.quantity}個で${yen(best.total)}`, more };
  }
  return {
    text: `${best.quantity}個以上 ${best.percent}%引 ${yen(bulkItemPrice(price, best))}`,
    more,
  };
}
