// まとめ買い (bulk discount): the entered price already includes the discount.

export const BULK_MIN_PERCENT = 1;
export const BULK_MAX_PERCENT = 99; // 100% could not be reversed
export const BULK_MIN_QUANTITY = 2;
export const BULK_MAX_QUANTITY = 999;

function parseInteger(raw: string | null | undefined, min: number, max: number): number | null {
  if (raw === null || raw === undefined) return null;
  const text = raw.normalize("NFKC").replace(/\s+/g, "");
  if (!/^\d{1,4}$/.test(text)) return null;
  const n = Number(text);
  return n >= min && n <= max ? n : null;
}

export function parseBulkPercent(raw: string | null | undefined): number | null {
  return parseInteger(raw, BULK_MIN_PERCENT, BULK_MAX_PERCENT);
}

export function parseBulkQuantity(raw: string | null | undefined): number | null {
  return parseInteger(raw, BULK_MIN_QUANTITY, BULK_MAX_QUANTITY);
}

/**
 * The normal price, calculated back from the discounted price. Rounded up, which is
 * the smallest price that gives the entered price when the discount is rounded down
 * (the same way coupon prices are rounded). An estimate.
 */
export function originalPrice(discounted: number, percent: number): number | null {
  if (!Number.isFinite(discounted) || discounted < 0) return null;
  if (!Number.isInteger(percent) || percent < BULK_MIN_PERCENT || percent > BULK_MAX_PERCENT) {
    return null;
  }
  return Math.ceil((discounted * 100) / (100 - percent) - 1e-9);
}