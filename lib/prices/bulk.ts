// まとめ買い (bulk discount): tiers applied on top of the regular price.
import { couponPrice } from "./coupon";

export const BULK_MIN_PERCENT = 1;
export const BULK_MAX_PERCENT = 99; // 100% could not be reversed
export const BULK_MIN_QUANTITY = 2;
export const BULK_MAX_QUANTITY = 999;
export const BULK_MAX_TIERS = 3;

export type BulkTier = { quantity: number; percent: number };

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
 * Reads the tier rows of the form. A row with both fields empty is skipped; a half-filled
 * or invalid row is an error. At least one and at most 3 tiers, no repeated quantity.
 * The result is sorted by quantity.
 */
export function parseBulkTiers(
  rows: { quantity: string | null | undefined; percent: string | null | undefined }[]
): { ok: true; tiers: BulkTier[] } | { ok: false; error: string } {
  const tiers: BulkTier[] = [];
  for (const row of rows) {
    const rawQuantity = (row.quantity ?? "").trim();
    const rawPercent = (row.percent ?? "").trim();
    if (rawQuantity === "" && rawPercent === "") continue;
    const quantity = parseBulkQuantity(rawQuantity);
    if (quantity === null) {
      return {
        ok: false,
        error: `個数は${BULK_MIN_QUANTITY}〜${BULK_MAX_QUANTITY}の整数で入力してください`,
      };
    }
    const percent = parseBulkPercent(rawPercent);
    if (percent === null) {
      return {
        ok: false,
        error: `割引率は${BULK_MIN_PERCENT}〜${BULK_MAX_PERCENT}の整数で入力してください`,
      };
    }
    tiers.push({ quantity, percent });
  }
  if (tiers.length === 0) {
    return { ok: false, error: "まとめ買いの個数と割引率を入力してください" };
  }
  if (tiers.length > BULK_MAX_TIERS) {
    return { ok: false, error: `まとめ買いは${BULK_MAX_TIERS}段階までです` };
  }
  if (new Set(tiers.map((t) => t.quantity)).size !== tiers.length) {
    return { ok: false, error: "同じ個数が重複しています" };
  }
  return { ok: true, tiers: tiers.sort((a, b) => a.quantity - b.quantity) };
}

/** Reads tiers from the database (jsonb); anything unexpected is dropped. Sorted by quantity. */
export function parseStoredTiers(value: unknown): BulkTier[] {
  if (!Array.isArray(value)) return [];
  const tiers: BulkTier[] = [];
  for (const item of value) {
    const row = item as { quantity?: unknown; percent?: unknown } | null;
    const quantity = row?.quantity;
    const percent = row?.percent;
    if (
      typeof quantity === "number" &&
      Number.isInteger(quantity) &&
      quantity >= BULK_MIN_QUANTITY &&
      quantity <= BULK_MAX_QUANTITY &&
      typeof percent === "number" &&
      Number.isInteger(percent) &&
      percent >= BULK_MIN_PERCENT &&
      percent <= BULK_MAX_PERCENT
    ) {
      tiers.push({ quantity, percent });
    }
  }
  return tiers.slice(0, BULK_MAX_TIERS).sort((a, b) => a.quantity - b.quantity);
}

/** Price of one item when buying a tier's quantity: the same rounding as coupons (down). */
export function bulkTierPrice(price: number, percent: number): number {
  return couponPrice(price, percent);
}
