// What a search looks at. "all" (the default) looks at every field.
// hint = a short explanation shown under the buttons in the 絞り込み panel.
export const SEARCH_SCOPES = [
  {
    key: "all",
    label: "すべて",
    hint: "名前・ブランド・カテゴリなど全体を検索",
  },
  { key: "name", label: "商品名", hint: "商品名・英語名・別名だけを検索" },
  { key: "category", label: "カテゴリ", hint: "カテゴリだけを検索" },
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
    case "category":
      return "カテゴリで検索";
    default:
      return "商品名・ブランド・カテゴリ・バーコードなどで検索";
  }
}
