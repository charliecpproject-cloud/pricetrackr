import { bulkEquivalentPercent, bulkItemPrice, type BulkTier } from "@/lib/prices/bulk";
import { formatYen } from "@/lib/prices/format";

// One まとめ買い tier: "10個以上 20%引 ¥800（1個あたり）" for a percent tier, or
// "5個で ¥550（1個あたり ¥110・約8%引）" for a bundle price. price = the entered regular price.
export default function BulkTierLine({ tier, price }: { tier: BulkTier; price: number }) {
  const item = bulkItemPrice(price, tier);

  if (tier.kind === "total") {
    const percent = bulkEquivalentPercent(price, tier);
    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="text-sm text-stone-600">{tier.quantity}個で</span>
        <span className="text-xl font-bold tabular-nums text-rose-600">
          {formatYen(tier.total)}
        </span>
        <span className="text-xs text-stone-500">
          （1個あたり {formatYen(item)}
          {percent !== null ? `・約${percent}%引` : ""}）
        </span>
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="text-sm text-stone-600">
        {tier.quantity}個以上 {tier.percent}%引
      </span>
      <span className="text-xl font-bold tabular-nums text-rose-600">{formatYen(item)}</span>
      <span className="text-xs text-stone-500">（1個あたり）</span>
    </span>
  );
}