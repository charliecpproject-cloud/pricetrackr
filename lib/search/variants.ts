import { searchTokens } from "./normalize";

// Looser search words for a search that found nothing: every word of the query on its own,
// plus the first 3 characters of each word that is longer than that,
// so a small typo at the end of a word still finds the product. At most 6.
export function similarSearchVariants(term: string): string[] {
  const tokens = searchTokens(term)
    .slice(0, 4)
    .filter((token) => token.length >= 2);
  const out: string[] = [];
  const add = (value: string) => {
    if (!out.includes(value)) out.push(value);
  };
  if (tokens.length > 1) tokens.forEach(add);
  for (const token of tokens) {
    const keep = 3;
    if (token.length > keep) add(token.slice(0, keep));
  }
  return out.slice(0, 6);
}