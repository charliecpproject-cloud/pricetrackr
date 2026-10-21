import { allDiscounts, bestDiscount, couponPrice } from "@/lib/prices/coupon";
import type { BulkTier } from "@/lib/prices/bulk";
import BulkTierLine from "@/components/BulkTierLine";
import { formatYen } from "@/lib/prices/format";
import { pointsNeeded } from "@/lib/prices/points";
import { TAX_BADGE_LABEL, type TaxBasis } from "@/lib/prices/tax";
import TaxHint from "@/components/TaxHint";

type Props = {
  price: number | string;
  couponPercents?: number[] | null;
  memberPercent?: number | null;
  isMemberPrice?: boolean;
  // まとめ買い: tiers applied on top of the entered (regular, 1-item) price.
  bulkTiers?: BulkTier[] | null;
  // ウェル活: on the point-use day 1 point is worth this many yen. null = not enabled.
  pointUseMultiplier?: number | null;
  // Tax rate (%) of the product: for 税抜き / 税不明 prices an icon suggests the tax-included price.
  taxRate?: number | null;
  size?: "md" | "lg";
  taxBasis?: TaxBasis;
  // Where the block leans: "end" (right, the price rows) or "start" (left, the detail header).
  align?: "start" | "end";
  className?: string;
};

// One block per price: a strip with a small label above each price (the regular price once,
// then every coupon of the chain side by side), the tax badge once, and under it the まとめ買い
// tiers and the ウェル活 points, which do not repeat the regular price or the tax badge.
export default function PriceDisplay({
  taxBasis,
  taxRate,
  pointUseMultiplier,
  bulkTiers,
  align = "end",
  className = "",
  ...rest
}: Props) {
  const end = align === "end";
  const price = Number(rest.price);
  const points = pointUseMultiplier ? pointsNeeded(price, pointUseMultiplier) : null;
  const showTaxHint =
    !!taxBasis && taxBasis !== "incl" && taxRate !== null && taxRate !== undefined;
  const tiers = Number.isFinite(price) ? (bulkTiers ?? []) : [];

  const main = (
    <span
      className={`inline-flex flex-wrap items-end gap-x-2 gap-y-1 ${
        end ? "justify-end" : "justify-start"
      } ${points === null && tiers.length === 0 ? className : ""}`}
    >
      <PriceStrip {...rest} end={end} />
      {taxBasis && <TaxBadge basis={taxBasis} />}
      {showTaxHint && (
        <TaxHint price={price} rate={taxRate as number} basis={taxBasis as TaxBasis} />
      )}
    </span>
  );

  if (points === null && tiers.length === 0) return main;

  // Extra lines, not a replacement: the main price stays the regular (or coupon) price, so bulk
  // tiers and points never change the cheapest badge, sorting or the unit price.
  const side = end ? "items-end" : "items-start";
  return (
    <span className={`inline-flex flex-col gap-1.5 ${side} ${className}`}>
      {main}
      {tiers.length > 0 && (
        <span className={`inline-flex flex-col gap-0.5 ${side}`}>
          <span className="inline-flex items-center rounded-md bg-rose-100 px-1.5 py-0.5 text-xs font-bold text-rose-700">
            まとめ買い
          </span>
          {tiers.map((tier) => (
            <BulkTierLine key={tier.quantity} tier={tier} price={price} />
          ))}
        </span>
      )}
      {points !== null && (
        <span className="inline-flex items-baseline gap-2">
          <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
            ウェル活
          </span>
          <span className="text-sm font-bold tabular-nums text-amber-700">
            {points.toLocaleString("ja-JP")}ポイント
          </span>
        </span>
      )}
    </span>
  );
}

function TaxBadge({ basis }: { basis: TaxBasis }) {
  const cls =
    basis === "unknown"
      ? "bg-chip text-stone-600"
      : "bg-sky-100 text-sky-700";
  return (
    <span
      className={`mb-1 inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold ${cls}`}
    >
      {TAX_BADGE_LABEL[basis]}
    </span>
  );
}

function PriceStrip({
  price,
  couponPercents,
  memberPercent,
  isMemberPrice,
  size = "md",
  end,
}: {
  price: number | string;
  couponPercents?: number[] | null;
  memberPercent?: number | null;
  isMemberPrice?: boolean;
  size?: "md" | "lg";
  end: boolean;
}) {
  const normal = Number(price);
  const big = size === "lg" ? "text-4xl" : "text-2xl";
  const small = size === "lg" ? "text-xl" : "text-base";
  const cell = `inline-flex flex-col ${end ? "items-end text-right" : "items-start text-left"}`;

  // The entered price is already the membership price: show it as it is.
  if (isMemberPrice) {
    return (
      <span className={cell}>
        <span className="text-[11px] font-bold leading-tight text-indigo-600">会員価格</span>
        <span className={`${big} font-bold tabular-nums text-indigo-600`}>{formatYen(price)}</span>
      </span>
    );
  }

  const discounts = allDiscounts(couponPercents, memberPercent);
  if (discounts.length === 0 || Number.isNaN(normal)) {
    return (
      <span className={`${big} font-bold tabular-nums text-stone-900`}>{formatYen(price)}</span>
    );
  }

  // The best (largest) discount is the big one; it is the price used for ranking.
  const best = bestDiscount(couponPercents, memberPercent);
  return (
    <span
      className={`inline-flex flex-wrap items-end gap-x-3 gap-y-1 ${
        end ? "justify-end" : "justify-start"
      }`}
    >
      <span className={cell}>
        <span className="text-[11px] leading-tight text-stone-500">通常</span>
        <span className={`${small} tabular-nums text-stone-500`}>{formatYen(normal)}</span>
      </span>
      {discounts.map((d) => {
        const isBest = best !== null && d.kind === best.kind && d.percent === best.percent;
        const tone = d.kind === "coupon" ? "text-rose-600" : "text-indigo-600";
        return (
          <span key={`${d.kind}-${d.percent}`} className={cell}>
            <span
              className={`text-[11px] leading-tight ${isBest ? `font-bold ${tone}` : "text-stone-500"}`}
            >
              {d.kind === "coupon" ? `${d.percent}%クーポン` : `会員${d.percent}%引`}
            </span>
            <span
              className={`tabular-nums ${
                isBest ? `${big} font-bold ${tone}` : `${small} font-semibold text-stone-700`
              }`}
            >
              {formatYen(couponPrice(normal, d.percent))}
            </span>
          </span>
        );
      })}
    </span>
  );
}