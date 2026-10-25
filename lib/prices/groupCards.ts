// Groups the 容量 (package) cards of one product by variation, for the chips on 価格確認.
// No imports on purpose: this file has a test, and vitest has no @/ alias.

export type GroupableCard = {
  variationId: string | null;
  variationLabel: string | null;
  sizeValue: number;
  unit: string;
  favorite: string;
};

export type CardGroup<T extends GroupableCard> = {
  key: string;
  label: string;
  items: T[];
};

const NO_VARIATION_LABEL = "バリエーションなし";

function unitKind(unit: string): { rank: number; name: string } {
  if (unit === "ml" || unit === "L") return { rank: 0, name: "ml" };
  if (unit === "g" || unit === "kg") return { rank: 1, name: "g" };
  return { rank: 2, name: unit };
}

function baseSize(size: number, unit: string): number {
  return unit === "L" || unit === "kg" ? size * 1000 : size;
}

/** Small to large: ml and L together, then g and kg together, then counter words. */
export function sortBySize<T extends GroupableCard>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ka = unitKind(a.unit);
    const kb = unitKind(b.unit);
    if (ka.rank !== kb.rank) return ka.rank - kb.rank;
    if (ka.name !== kb.name) return ka.name.localeCompare(kb.name, "ja");
    return baseSize(a.sizeValue, a.unit) - baseSize(b.sizeValue, b.unit);
  });
}

/** One group per variation (by label), packages without a variation last. */
export function groupByVariation<T extends GroupableCard>(
  items: T[],
): CardGroup<T>[] {
  const groups = new Map<string, CardGroup<T>>();
  for (const item of sortBySize(items)) {
    const key = item.variationId ?? "none";
    let group = groups.get(key);
    if (!group) {
      group = {
        key,
        label: item.variationId
          ? item.variationLabel || "バリエーション"
          : NO_VARIATION_LABEL,
        items: [],
      };
      groups.set(key, group);
    }
    group.items.push(item);
  }
  return Array.from(groups.values()).sort((a, b) => {
    if (a.key === "none") return b.key === "none" ? 0 : 1;
    if (b.key === "none") return -1;
    return a.label.localeCompare(b.label, "ja");
  });
}

/** The chip that is selected first: the one with a favorite 容量, otherwise the first. */
export function defaultGroupIndex<T extends GroupableCard>(
  groups: CardGroup<T>[],
): number {
  const index = groups.findIndex((g) =>
    g.items.some((item) => item.favorite === "favorite"),
  );
  return index >= 0 ? index : 0;
}
