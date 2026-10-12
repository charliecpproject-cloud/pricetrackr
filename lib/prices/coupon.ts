// Coupon helpers. Coupons are an estimate: the real discount is applied at the register.
export const COUPON_PERCENTS = [5, 10, 15] as const;

/** Largest enabled coupon percent, or null when none is enabled. */
export function bestCouponPercent(
  percents: readonly number[] | null | undefined
): number | null {
  if (!percents) return null;
  const valid = percents.filter((p) =>
    (COUPON_PERCENTS as readonly number[]).includes(p)
  );
  return valid.length > 0 ? Math.max(...valid) : null;
}

/** Price after a percent discount. Fractions of a yen are rounded down. */
export function couponPrice(price: number, percent: number): number {
  return Math.floor((price * (100 - percent)) / 100);
}

/** Reads a chain's coupon percents from a nested shops row, whatever shape Supabase returns. */
export function couponPercentsFromShop(shop: unknown): number[] {
  const s = [shop].flat()[0] as { store_chains?: unknown } | undefined;
  const chain = [s?.store_chains].flat()[0] as
    | { coupon_percents?: number[] | null }
    | undefined;
  return chain?.coupon_percents ?? [];
}