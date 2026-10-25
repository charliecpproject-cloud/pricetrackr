// まとめ買い (bulk discount): up to 3 tiers applied on top of the regular (1-item) price.
// A tier is either a percent off ("10個以上 20%引") or a bundle price ("5個で550円").
import { couponPrice } from "./coupon";

export const BULK_MIN_PERCENT = 1;
export const BULK_MAX_PERCENT = 99; // 100% could not be reversed
export const BULK_MIN_QUANTITY = 2;
export const BULK_MAX_QUANTITY = 999;
export const BULK_MAX_TOTAL = 1_000_000;
export const BULK_MAX_TIERS = 3;

export type BulkMode = "percent" | "total";

export type BulkTier =
  | { kind: "percent"; quantity: number; percent: number }
  | { kind: "total"; quantity: number; total: number };

function parseInteger(
  raw: string | null | undefined,
  min: number,
  max: number,
): number | null {
  if (raw === null || raw === undefined) return null;
  const text = raw.normalize("NFKC").replace(/\s+/g, "");
  if (!/^\d{1,4}$/.test(text)) return null;
  const n = Number(text);
  return n >= min && n <= max ? n : null;
}

export function parseBulkPercent(
  raw: string | null | undefined,
): number | null {
  return parseInteger(raw, BULK_MIN_PERCENT, BULK_MAX_PERCENT);
}

export function parseBulkQuantity(
  raw: string | null | undefined,
): number | null {
  return parseInteger(raw, BULK_MIN_QUANTITY, BULK_MAX_QUANTITY);
}

/** A bundle price in whole yen (1 to 1,000,000); a yen sign, 円 and commas are allowed. */
export function parseBulkTotal(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const text = raw.normalize("NFKC").replace(/[¥￥円,\s]/g, "");
  if (!/^\d{1,7}$/.test(text)) return null;
  const n = Number(text);
  return n >= 1 && n <= BULK_MAX_TOTAL ? n : null;
}

export type BulkRowInput = {
  quantity: string | null | undefined;
  mode: string | null | undefined; // "percent" or "total"; anything else counts as percent
  percent: string | null | undefined;
  total: string | null | undefined;
};

/**
 * Reads the tier rows of the form. Only the field of the row's mode counts. A row whose quantity
 * and value are both empty is skipped; a half-filled or invalid row is an error. At least one
 * and at most 3 tiers, no repeated quantity. The result is sorted by quantity.
 */
export function parseBulkTiers(
  rows: BulkRowInput[],
): { ok: true; tiers: BulkTier[] } | { ok: false; error: string } {
  const tiers: BulkTier[] = [];
  for (const row of rows) {
    const mode: BulkMode = row.mode === "total" ? "total" : "percent";
    const rawQuantity = (row.quantity ?? "").trim();
    const rawValue = (
      (mode === "total" ? row.total : row.percent) ?? ""
    ).trim();
    if (rawQuantity === "" && rawValue === "") continue;

    const quantity = parseBulkQuantity(rawQuantity);
    if (quantity === null) {
      return {
        ok: false,
        error: `個数は${BULK_MIN_QUANTITY}〜${BULK_MAX_QUANTITY}の整数で入力してください`,
      };
    }
    if (mode === "total") {
      const total = parseBulkTotal(rawValue);
      if (total === null) {
        return {
          ok: false,
          error: `合計金額は1〜${BULK_MAX_TOTAL.toLocaleString("ja-JP")}円の整数で入力してください`,
        };
      }
      tiers.push({ kind: "total", quantity, total });
    } else {
      const percent = parseBulkPercent(rawValue);
      if (percent === null) {
        return {
          ok: false,
          error: `割引率は${BULK_MIN_PERCENT}〜${BULK_MAX_PERCENT}の整数で入力してください`,
        };
      }
      tiers.push({ kind: "percent", quantity, percent });
    }
  }
  if (tiers.length === 0) {
    return {
      ok: false,
      error: "まとめ買いの個数と、割引率または合計金額を入力してください",
    };
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
    const row = item as {
      quantity?: unknown;
      percent?: unknown;
      total?: unknown;
    } | null;
    const quantity = row?.quantity;
    if (
      typeof quantity !== "number" ||
      !Number.isInteger(quantity) ||
      quantity < BULK_MIN_QUANTITY ||
      quantity > BULK_MAX_QUANTITY
    ) {
      continue;
    }
    const percent = row?.percent;
    const total = row?.total;
    if (
      typeof percent === "number" &&
      Number.isInteger(percent) &&
      percent >= BULK_MIN_PERCENT &&
      percent <= BULK_MAX_PERCENT
    ) {
      tiers.push({ kind: "percent", quantity, percent });
    } else if (
      typeof total === "number" &&
      Number.isInteger(total) &&
      total >= 1 &&
      total <= BULK_MAX_TOTAL
    ) {
      tiers.push({ kind: "total", quantity, total });
    }
  }
  return tiers.slice(0, BULK_MAX_TIERS).sort((a, b) => a.quantity - b.quantity);
}

/** What is stored in bulk_tiers: {quantity, percent} or {quantity, total}. */
export function bulkTiersToJson(
  tiers: readonly BulkTier[],
): { quantity: number; percent?: number; total?: number }[] {
  return tiers.map((t) =>
    t.kind === "total"
      ? { quantity: t.quantity, total: t.total }
      : { quantity: t.quantity, percent: t.percent },
  );
}

/** Price of one item with a percent off: the same rounding as coupons (down). */
export function bulkTierPrice(price: number, percent: number): number {
  return couponPrice(price, percent);
}

/** Price per item of a tier: a percent tier rounds down to the yen, a bundle price is total / quantity (one decimal). */
export function bulkItemPrice(price: number, tier: BulkTier): number {
  if (tier.kind === "total")
    return Math.round((tier.total / tier.quantity) * 10) / 10;
  return bulkTierPrice(price, tier.percent);
}

/** The discount of a tier in whole percent (rounded down, so it never promises more); null when it is no discount. */
export function bulkEquivalentPercent(
  price: number,
  tier: BulkTier,
): number | null {
  if (tier.kind === "percent") return tier.percent;
  const regularTotal = price * tier.quantity;
  if (!Number.isFinite(regularTotal) || regularTotal <= 0) return null;
  const percent = Math.floor(
    ((regularTotal - tier.total) / regularTotal) * 100 + 1e-9,
  );
  return percent >= 1 ? percent : null;
}

/** The tier with the lowest price per item, or null when there are no tiers. */
export function bestBulkTier(
  price: number,
  tiers: readonly BulkTier[],
): BulkTier | null {
  let best: BulkTier | null = null;
  for (const tier of tiers) {
    if (
      best === null ||
      bulkItemPrice(price, tier) < bulkItemPrice(price, best)
    )
      best = tier;
  }
  return best;
}
