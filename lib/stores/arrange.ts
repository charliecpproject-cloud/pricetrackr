import { STORE_CATEGORIES, type StoreCategory } from "./category";

export type ChainForList = {
  id: string;
  name: string;
  category: StoreCategory | null;
  entries: number;
  createdAt: string;
};

const byUsage = (a: ChainForList, b: ChainForList) =>
  b.entries - a.entries || a.name.localeCompare(b.name, "ja");

/**
 * Sorts chains for the price entry dropdown and picks the short list.
 * - Categories: busiest first (by total entries), uncategorized last.
 * - Within a category: most entries first, then by name.
 * - Short list: the most used chains; if fewer than `topCount` have entries,
 *   it is filled with the newest chains.
 */
export function arrangeChains<T extends ChainForList>(
  chains: T[],
  topCount = 10
): { sorted: T[]; topIds: string[] } {
  const total = new Map<StoreCategory | null, number>();
  for (const c of chains) {
    total.set(c.category, (total.get(c.category) ?? 0) + c.entries);
  }

  const sorted = [...chains].sort((a, b) => {
    if (a.category !== b.category) {
      if (a.category === null) return 1;
      if (b.category === null) return -1;
      const diff = (total.get(b.category) ?? 0) - (total.get(a.category) ?? 0);
      return diff !== 0
        ? diff
        : STORE_CATEGORIES.indexOf(a.category) - STORE_CATEGORIES.indexOf(b.category);
    }
    return byUsage(a, b);
  });

  const top = chains.filter((c) => c.entries > 0).sort(byUsage).slice(0, topCount);
  if (top.length < topCount) {
    const rest = chains
      .filter((c) => c.entries === 0)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    top.push(...rest.slice(0, topCount - top.length));
  }

  return { sorted, topIds: top.map((c) => c.id) };
}