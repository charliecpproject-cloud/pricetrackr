// Discount helpers. Discounts are an estimate: the real discount is applied at the register.
export const COUPON_PERCENTS = [5, 10, 15] as const;

export type Discount = { kind: "coupon" | "member"; percent: number };

/** Largest enabled coupon percent, or null when none is enabled. */
export function bestCouponPercent(
  percents: readonly number[] | null | undefined,
): number | null {
  if (!percents) return null;
  const valid = percents.filter((p) =>
    (COUPON_PERCENTS as readonly number[]).includes(p),
  );
  return valid.length > 0 ? Math.max(...valid) : null;
}

/** Price after a percent discount. Fractions of a yen are rounded down. */
export function couponPrice(price: number, percent: number): number {
  return Math.floor((price * (100 - percent)) / 100);
}

/** The single best discount: the larger of the best coupon and the membership percent. They never stack. */
export function bestDiscount(
  couponPercents: readonly number[] | null | undefined,
  memberPercent: number | null | undefined,
): Discount | null {
  const coupon = bestCouponPercent(couponPercents);
  const member =
    typeof memberPercent === "number" && memberPercent > 0
      ? memberPercent
      : null;
  if (coupon !== null && (member === null || coupon >= member)) {
    return { kind: "coupon", percent: coupon };
  }
  if (member !== null) return { kind: "member", percent: member };
  return null;
}

/**
 * Every discount a chain offers, for display: each enabled coupon percent, and the membership
 * percent unless a coupon has the same percent. Smallest first, so the best one is the last.
 * They never stack: only one applies (see bestDiscount).
 */
export function allDiscounts(
  couponPercents: readonly number[] | null | undefined,
  memberPercent: number | null | undefined,
): Discount[] {
  const coupons = Array.from(
    new Set(
      (couponPercents ?? []).filter((p) =>
        (COUPON_PERCENTS as readonly number[]).includes(p),
      ),
    ),
  );
  const list = coupons.map((percent): Discount => ({
    kind: "coupon",
    percent,
  }));
  if (
    typeof memberPercent === "number" &&
    memberPercent > 0 &&
    !coupons.includes(memberPercent)
  ) {
    list.push({ kind: "member", percent: memberPercent });
  }
  return list.sort((a, b) => a.percent - b.percent);
}

/** The price used to compare chains (cheapest first). */
export function effectivePrice(
  price: number,
  options: {
    couponPercents?: readonly number[] | null;
    memberPercent?: number | null;
    isMemberPrice?: boolean;
  },
): number {
  if (options.isMemberPrice) return price;
  const discount = bestDiscount(options.couponPercents, options.memberPercent);
  return discount ? couponPrice(price, discount.percent) : price;
}

/** Reads a chain's coupon percents from a nested shops row, whatever shape Supabase returns. */
export function couponPercentsFromShop(shop: unknown): number[] {
  const s = [shop].flat()[0] as { store_chains?: unknown } | undefined;
  const chain = [s?.store_chains].flat()[0] as
    { coupon_percents?: number[] | null } | undefined;
  return chain?.coupon_percents ?? [];
}
