import { bestDiscount, couponPrice } from "@/lib/prices/coupon";
import { originalPrice } from "@/lib/prices/bulk";
import { formatYen } from "@/lib/prices/format";
import { pointsNeeded } from "@/lib/prices/points";
import { TAX_BADGE_LABEL, type TaxBasis } from "@/lib/prices/tax";
import TaxHint from "@/components/TaxHint";

type Props = {
  price: number | string;
  couponPercents?: number[] | null;
  memberPercent?: number | null;
  isMemberPrice?: boolean;
  // まとめ買い: the entered price already includes this discount (set together).
  bulkPercent?: number | null;
  bulkQuantity?: number | null;
  // ウェル活: on the point-use day 1 point is worth this many yen. null = not enabled.
  pointUseMultiplier?: number | null;
  // Tax rate (%) of the product: for 税抜き / 税不明 prices an icon suggests the tax-included price.
  taxRate?: number | null;
  size?: "md" | "lg";
  taxBasis?: TaxBasis;
};

export default function PriceDisplay({
  taxBasis,
  taxRate,
  pointUseMultiplier,
  ...rest
}: Props) {
  const points = pointUseMultiplier
    ? pointsNeeded(Number(rest.price), pointUseMultiplier)
    : null;
  const showTaxHint =
    !!taxBasis && taxBasis !== "incl" && taxRate !== null && taxRate !== undefined;

  const main = (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <PriceCore {...rest} />
      {taxBasis && <TaxBadge basis={taxBasis} />}
      {showTaxHint && (
        <TaxHint
          price={Number(rest.price)}
          rate={taxRate as number}
          basis={taxBasis as TaxBasis}
        />
      )}
    </span>
  );

  if (points === null) return main;

  // An extra line, not a replacement: points are not yen and only work on that day,
  // so it never changes the main price, the cheapest badge or the unit price.
  return (
    <span className="inline-flex flex-col items-start gap-1">
      {main}
      <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
          ウェル活
        </span>
        <span className="text-xl font-bold tabular-nums text-amber-700">
          {points.toLocaleString("ja-JP")}ポイント
        </span>
        <span className="text-sm tabular-nums text-stone-500">
          （{rest.isMemberPrice ? "会員価格" : "通常価格"} {formatYen(rest.price)}）
        </span>
        {taxBasis && <TaxBadge basis={taxBasis} />}
      </span>
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
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold ${cls}`}
    >
      {TAX_BADGE_LABEL[basis]}
    </span>
  );
}

function PriceCore({
  price,
  couponPercents,
  memberPercent,
  isMemberPrice,
  bulkPercent,
  bulkQuantity,
  size = "md",
}: Omit<Props, "taxBasis" | "taxRate" | "pointUseMultiplier">) {
  const normal = Number(price);
  const big = size === "lg" ? "text-4xl" : "text-2xl";
  const wrap = "inline-flex flex-wrap items-baseline gap-x-2 gap-y-1";

  // The entered price is already the membership price: show it as it is.
  if (isMemberPrice) {
    return (
      <span className={wrap}>
        <span className="inline-flex items-center rounded-md bg-indigo-100 px-1.5 py-0.5 text-xs font-bold text-indigo-700">
          会員価格
        </span>
        <span className={`${big} font-bold tabular-nums text-indigo-600`}>
          {formatYen(price)}
        </span>
      </span>
    );
  }

  // The entered price already includes a bulk discount: show it as entered, with the
  // normal price calculated back (an estimate) and the quantity condition.
  if (bulkPercent !== null && bulkPercent !== undefined) {
    const original = originalPrice(normal, bulkPercent);
    return (
      <span className={wrap}>
        <span className="inline-flex items-center rounded-md bg-rose-100 px-1.5 py-0.5 text-xs font-bold text-rose-700">
          まとめ買い{bulkPercent}%引
        </span>
        <span className={`${big} font-bold tabular-nums text-rose-600`}>
          {formatYen(price)}
        </span>
        {original !== null && (
          <span className="text-sm tabular-nums text-stone-500">
            （通常価格 {formatYen(original)}）
          </span>
        )}
        {bulkQuantity ? (
          <span className="basis-full text-xs text-stone-500">{bulkQuantity}個以上のとき</span>
        ) : null}
      </span>
    );
  }

  const discount = bestDiscount(couponPercents, memberPercent);
  if (discount === null || Number.isNaN(normal)) {
    return (
      <span className={`${big} font-bold tabular-nums text-stone-900`}>
        {formatYen(price)}
      </span>
    );
  }

  const isCoupon = discount.kind === "coupon";
  const badgeCls = isCoupon ? "bg-rose-100 text-rose-700" : "bg-indigo-100 text-indigo-700";
  const priceCls = isCoupon ? "text-rose-600" : "text-indigo-600";

  return (
    <span className={wrap}>
      <span
        className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-bold ${badgeCls}`}
      >
        {isCoupon ? `${discount.percent}%クーポン` : `会員${discount.percent}%引`}
      </span>
      <span className={`${big} font-bold tabular-nums ${priceCls}`}>
        {formatYen(couponPrice(normal, discount.percent))}
      </span>
      <span className="text-sm tabular-nums text-stone-500">
        （通常価格 {formatYen(normal)}）
      </span>
    </span>
  );
}