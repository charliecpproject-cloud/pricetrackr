// What a search looks at. "all" (the default) looks at every field.
export const SEARCH_SCOPES = [
  { key: "all", label: "すべて" },
  { key: "name", label: "商品名" },
  { key: "brand", label: "ブランド" },
  { key: "category", label: "カテゴリ" },
  { key: "barcode", label: "バーコード" },
] as const;

export type SearchScope = (typeof SEARCH_SCOPES)[number]["key"];

// An unknown or missing value means "all".
export function parseSearchScope(value: unknown): SearchScope {
  const first = Array.isArray(value) ? value[0] : value;
  return SEARCH_SCOPES.find((s) => s.key === first)?.key ?? "all";
}

export function searchPlaceholder(scope: SearchScope): string {
  switch (scope) {
    case "name":
      return "商品名・英語名・別名で検索";
    case "brand":
      return "ブランドで検索";
    case "category":
      return "カテゴリで検索";
    case "barcode":
      return "バーコード番号で検索";
    default:
      return "商品名・ブランド・カテゴリ・バーコードなどで検索";
  }
}