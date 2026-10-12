import { bestCouponPercent, couponPrice } from "@/lib/prices/coupon";
import { formatYen } from "@/lib/prices/format";

type Props = {
  price: number | string;
  couponPercents?: number[] | null;
  size?: "md" | "lg";
};

export default function PriceDisplay({ price, couponPercents, size = "md" }: Props) {
  const normal = Number(price);
  const percent = bestCouponPercent(couponPercents);
  const big = size === "lg" ? "text-4xl" : "text-2xl";

  if (percent === null || Number.isNaN(normal)) {
    return (
      <span className={`${big} font-bold tabular-nums text-stone-900`}>
        {formatYen(price)}
      </span>
    );
  }

  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span className="inline-flex items-center rounded-md bg-rose-100 px-1.5 py-0.5 text-xs font-bold text-rose-700">
        {percent}%クーポン
      </span>
      <span className={`${big} font-bold tabular-nums text-rose-600`}>
        {formatYen(couponPrice(normal, percent))}
      </span>
      <span className="text-sm tabular-nums text-stone-500">
        （通常価格 {formatYen(normal)}）
      </span>
    </span>
  );
}