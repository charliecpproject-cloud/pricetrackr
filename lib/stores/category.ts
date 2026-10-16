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