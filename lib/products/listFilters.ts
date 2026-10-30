// Filters and sorting of the 商品 page (read from the URL). No imports on purpose.
export type RawParams = Record<string, string | string[] | undefined>;

export type PresenceFilter = "all" | "with" | "without";
export type ProductSort = "name" | "new" | "price";

export type ProductFilters = {
  category: string | null; // exact text of products.category
  brand: string | null; // exact text of products.brand
  prices: PresenceFilter; // has price entries?
  variations: PresenceFilter; // has variations?
  sort: ProductSort | null; // null = the default order
};

const one = (v: string | string[] | undefined): string =>
  (Array.isArray(v) ? v[0] : v) ?? "";

function text(raw: string): string | null {
  const t = raw.trim().slice(0, 100);
  return t === "" ? null : t;
}

function presence(raw: string): PresenceFilter {
  return raw === "with" || raw === "without" ? raw : "all";
}

/** Reads the filters from the URL; anything invalid is ignored. */
export function parseProductFilters(params: RawParams): ProductFilters {
  const sortRaw = one(params.sort);
  return {
    category: text(one(params.cat)),
    brand: text(one(params.brand)),
    prices: presence(one(params.pr)),
    variations: presence(one(params.var)),
    sort:
      sortRaw === "name" || sortRaw === "new" || sortRaw === "price"
        ? sortRaw
        : null,
  };
}

/** How many conditions are in use (shown as a number on the 絞り込み button). */
export function countActiveProductFilters(f: ProductFilters): number {
  let n = 0;
  if (f.category) n++;
  if (f.brand) n++;
  if (f.prices !== "all") n++;
  if (f.variations !== "all") n++;
  if (f.sort !== null) n++;
  return n;
}

export type ValueCount = { value: string; count: number };

/**
 * The most used values (with how many products use each), shown in name order.
 * `keep` is a value from the URL: it is listed even when it is not among the most used.
 * total = how many different values exist.
 */
export function topValues(
  values: readonly (string | null | undefined)[],
  max = 30,
  keep: string | null = null,
): { options: ValueCount[]; total: number } {
  const counts = new Map<string, number>();
  for (const raw of values) {
    const value = (raw ?? "").trim();
    if (value === "") continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  const all = Array.from(counts, ([value, count]) => ({ value, count }));
  all.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, "ja"));
  const options = all.slice(0, max);
  if (keep && !options.some((o) => o.value === keep)) {
    options.push({ value: keep, count: counts.get(keep) ?? 0 });
  }
  options.sort((a, b) => a.value.localeCompare(b.value, "ja"));
  return { options, total: all.length };
}

export type ListItem = {
  name: string;
  createdAt: string;
  variationCount: number;
  hasPrices: boolean | null; // null = not known (visitors): the price filter is skipped
  latestPriceAt: string | null;
};

export function filterList<T extends ListItem>(
  items: readonly T[],
  f: Pick<ProductFilters, "prices" | "variations">,
): T[] {
  return items.filter((item) => {
    if (f.variations === "with" && item.variationCount === 0) return false;
    if (f.variations === "without" && item.variationCount > 0) return false;
    if (item.hasPrices !== null) {
      if (f.prices === "with" && !item.hasPrices) return false;
      if (f.prices === "without" && item.hasPrices) return false;
    }
    return true;
  });
}

/** null keeps the order as it is. Ties keep their order. */
export function sortList<T extends ListItem>(
  items: readonly T[],
  sort: ProductSort | null,
): T[] {
  const copy = [...items];
  if (sort === "name") {
    copy.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  } else if (sort === "new") {
    copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } else if (sort === "price") {
    copy.sort((a, b) =>
      (b.latestPriceAt ?? "").localeCompare(a.latestPriceAt ?? ""),
    );
  }
  return copy;
}
