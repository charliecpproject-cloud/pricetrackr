import { z } from "zod";
import { parseCategory, type StoreCategory } from "../stores/category";

export type Period = "all" | "week" | "month" | "quarter";
export type SaleFilter = "all" | "regular" | "sale";

export type Filters = {
  q: string;
  chainId: string | null;
  category: StoreCategory | null;
  sale: SaleFilter;
  min: number | null;
  max: number | null;
  period: Period;
  from: string | null; // YYYY-MM-DD (Japan date)
  to: string | null;
};

export type RawParams = Record<string, string | string[] | undefined>;

const PERIOD_DAYS = { week: 7, month: 30, quarter: 90 } as const;

const one = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v) ?? "";

function parseAmount(raw: string): number | null {
  const cleaned = raw.normalize("NFKC").replace(/[¥￥円,\s]/g, "");
  if (cleaned === "" || !/^\d+(\.\d+)?$/.test(cleaned)) return null;
  const n = Number(cleaned);
  return n >= 0 && n <= 1_000_000 ? n : null;
}

function parseDate(raw: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(raw);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const check = new Date(Date.UTC(y, mo - 1, d));
  return check.getUTCFullYear() === y &&
    check.getUTCMonth() === mo - 1 &&
    check.getUTCDate() === d
    ? raw
    : null;
}

/** Reads the price check filters from the URL; anything invalid is ignored. */
export function parseFilters(params: RawParams): Filters {
  const chain = z.string().uuid().safeParse(one(params.chain));
  const saleRaw = one(params.sale);
  const periodRaw = one(params.period);

  let min = parseAmount(one(params.min));
  let max = parseAmount(one(params.max));
  if (min !== null && max !== null && min > max) [min, max] = [max, min];

  let from = parseDate(one(params.from));
  let to = parseDate(one(params.to));
  if (from && to && from > to) [from, to] = [to, from];

  return {
    // Short and free of characters that break the search filter.
    q: one(params.q).trim().slice(0, 50).replace(/[,()%_*\\]/g, ""),
    chainId: chain.success ? chain.data : null,
    category: parseCategory(one(params.cat)),
    sale: saleRaw === "sale" || saleRaw === "regular" ? saleRaw : "all",
    min,
    max,
    period:
      periodRaw === "week" || periodRaw === "month" || periodRaw === "quarter"
        ? periodRaw
        : "all",
    from,
    to,
  };
}

/** Start of the date range, or null. Typed dates replace the quick period. */
export function rangeStart(f: Filters, now: Date = new Date()): string | null {
  if (f.from) return `${f.from}T00:00:00+09:00`;
  if (f.to || f.period === "all") return null;
  return new Date(now.getTime() - PERIOD_DAYS[f.period] * 86_400_000).toISOString();
}

/** End of the date range (end of that day in Japan), or null. */
export function rangeEnd(f: Filters): string | null {
  return f.to ? `${f.to}T23:59:59+09:00` : null;
}

export function inPriceRange(price: number, f: Filters): boolean {
  return (f.min === null || price >= f.min) && (f.max === null || price <= f.max);
}

/** How many filter groups are in use (shown as a number on the 絞り込み button). */
export function countActive(f: Filters): number {
  let n = 0;
  if (f.chainId) n++;
  if (f.category) n++;
  if (f.sale !== "all") n++;
  if (f.min !== null || f.max !== null) n++;
  if (f.from || f.to || f.period !== "all") n++;
  return n;
}