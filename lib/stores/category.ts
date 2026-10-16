// Store chain categories. Stored as the key; shown with the Japanese label.
// Add a category by adding a key here and a label below (no migration needed).
export const STORE_CATEGORIES = [
  "supermarket",
  "drugstore",
  "convenience",
  "discount",
  "hundred_yen",
  "apparel",
  "other",
] as const;

export type StoreCategory = (typeof STORE_CATEGORIES)[number];

export const CATEGORY_LABEL: Record<StoreCategory, string> = {
  supermarket: "スーパー",
  drugstore: "薬局・ドラッグストア",
  convenience: "コンビニ",
  discount: "ディスカウント・ホームセンター",
  hundred_yen: "100円ショップ",
  apparel: "アパレル",
  other: "その他",
};

// Reads a value from a form or the database; anything unexpected is "no category".
export function parseCategory(value: unknown): StoreCategory | null {
  return STORE_CATEGORIES.find((c) => c === value) ?? null;
}

// "特売" at supermarkets and drugstores, "セール" everywhere else. Same meaning.
export function saleLabel(category: StoreCategory | null | undefined): string {
  return category === "supermarket" || category === "drugstore" ? "特売" : "セール";
}

// Groups items by category, in the list order above; uncategorized last.
export function groupByCategory<T extends { category: StoreCategory | null }>(
  items: T[]
): { key: string; label: string; items: T[] }[] {
  const groups: { key: string; label: string; items: T[] }[] = [];
  for (const category of [...STORE_CATEGORIES, null]) {
    const members = items.filter((i) => i.category === category);
    if (members.length > 0) {
      groups.push({
        key: category ?? "none",
        label: category ? CATEGORY_LABEL[category] : "未分類",
        items: members,
      });
    }
  }
  return groups;
}