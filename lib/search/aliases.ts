import { matchesSearch, normalizeForSearch } from "./normalize";

export type SearchAlias = { alias: string; canonical: string };

// Same idea as search_products() in the database: when the query contains an alias,
// the same query with the alias replaced by its word is searched too.
export function expandQuery(query: string, aliases: SearchAlias[]): string[] {
  const q = normalizeForSearch(query);
  if (q === "") return [query];
  const out = new Set<string>([q]);
  for (const a of aliases) {
    const alias = normalizeForSearch(a.alias);
    const canonical = normalizeForSearch(a.canonical);
    if (alias === "" || canonical === "") continue;
    if (q.includes(alias)) out.add(q.split(alias).join(canonical));
  }
  return Array.from(out);
}

export function matchesSearchWithAliases(
  haystack: string,
  query: string,
  aliases: SearchAlias[]
): boolean {
  return expandQuery(query, aliases).some((q) => matchesSearch(haystack, q));
}