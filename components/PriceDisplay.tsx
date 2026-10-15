import { bestDiscount, couponPrice } from "@/lib/prices/coupon";
import { formatYen } from "@/lib/prices/format";
import { TAX_BADGE_LABEL, type TaxBasis } from "@/lib/prices/tax";

type Props = {
  price: number | string;
  couponPercents?: number[] | null;
  memberPercent?: number | null;
  isMemberPrice?: boolean;
  size?: "md" | "lg";
  taxBasis?: TaxBasis;
};

export default function PriceDisplay({ taxBasis, ...rest }: Props) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <PriceCore {...rest} />
      {taxBasis && <TaxBadge basis={taxBasis} />}
    </span>
  );
}

function TaxBadge({ basis }: { basis: TaxBasis }) {
  const cls =
    basis === "unknown"
      ? "bg-stone-100 text-stone-600"
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
  size = "md",
}: Props) {
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