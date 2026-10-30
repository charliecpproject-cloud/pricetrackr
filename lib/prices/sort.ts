// Sorting of the 価格確認 cards. No imports on purpose (a file with a test uses relative imports).
export type SortKey = "cheap" | "recent" | "fav";

// How many products are loaded and sorted when a sort is chosen.
export const SORT_FETCH = 100;

/** Reads the sort from the URL; anything else means the standard order (null). */
export function parseSort(raw: unknown): SortKey | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "cheap" || value === "recent" || value === "fav"
    ? value
    : null;
}

export type SortableCard = {
  items: {
    favorite: "favorite" | "related" | "none";
    rows: { effective: number; observedAt: string }[];
  }[];
};

const FAVORITE_RANK = { favorite: 0, related: 1, none: 2 } as const;

function lowestPrice(card: SortableCard): number {
  let lowest = Infinity;
  for (const item of card.items)
    for (const row of item.rows) lowest = Math.min(lowest, row.effective);
  return lowest;
}

function newestTime(card: SortableCard): number {
  let newest = -Infinity;
  for (const item of card.items)
    for (const row of item.rows) {
      const time = Date.parse(row.observedAt);
      if (!Number.isNaN(time)) newest = Math.max(newest, time);
    }
  return newest;
}

function favoriteRank(card: SortableCard): number {
  let best = 2;
  for (const item of card.items)
    best = Math.min(best, FAVORITE_RANK[item.favorite]);
  return best;
}

/**
 * cheap: the lowest price first; recent: the newest price first; fav: favorites, then related
 * sizes, then the rest. Products without a price go last, and equal ones keep their order.
 */
export function sortProductCards<T extends SortableCard>(
  cards: readonly T[],
  sort: SortKey,
): T[] {
  const keyed = cards.map((card, index) => ({ card, index }));
  keyed.sort((a, b) => {
    let diff = 0;
    if (sort === "cheap") {
      const x = lowestPrice(a.card);
      const y = lowestPrice(b.card);
      diff = x === y ? 0 : x < y ? -1 : 1; // Infinity (no price) sorts last
    } else if (sort === "recent") {
      const x = newestTime(a.card);
      const y = newestTime(b.card);
      diff = x === y ? 0 : x > y ? -1 : 1; // -Infinity (no price) sorts last
    } else {
      diff = favoriteRank(a.card) - favoriteRank(b.card);
    }
    return diff !== 0 ? diff : a.index - b.index;
  });
  return keyed.map((entry) => entry.card);
}
