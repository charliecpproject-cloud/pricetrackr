import { normalize, suggestCategories, type CategoryCount } from "./category";

export type BrandAlias = { brand: string; alias: string };

// Brand suggestions: the same matching as the category suggestions, plus every brand
// that has an alias containing what was typed (パス → PASCO). Brands found through an
// alias come first. Up to `limit` results.
export function suggestBrands(
  term: string,
  brands: CategoryCount[],
  aliases: BrandAlias[],
  limit = 10,
): CategoryCount[] {
  const t = normalize(term);
  const base = suggestCategories(term, brands, limit);
  if (t === "") return base;

  const result: CategoryCount[] = [];
  const seen = new Set<string>();
  const add = (c: CategoryCount) => {
    const key = normalize(c.name);
    if (seen.has(key)) return;
    seen.add(key);
    result.push(c);
  };

  for (const a of aliases) {
    const n = normalize(a.alias);
    if (n === "" || !n.includes(t)) continue;
    const hit = brands.find((b) => normalize(b.name) === normalize(a.brand));
    add(hit ?? { name: a.brand, count: 0 });
  }
  for (const c of base) add(c);
  return result.slice(0, limit);
}

// The brand text to save for what was typed: an alias becomes its brand, another
// spelling of an existing brand (width, case) becomes the existing spelling,
// anything else stays as typed.
export function resolveBrand(
  input: string,
  brands: CategoryCount[],
  aliases: BrandAlias[],
): string {
  const text = input.replace(/\s+/g, " ").trim();
  if (text === "") return "";
  const key = normalize(text);
  const alias = aliases.find((a) => normalize(a.alias) === key);
  if (alias) return alias.brand;
  const existing = brands.find((b) => normalize(b.name) === key);
  return existing ? existing.name : text;
}
