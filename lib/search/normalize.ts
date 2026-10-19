// Same rules as the database function search_normalize():
// full/half width (NFKC), lower case, hiragana folded to katakana.

function foldKana(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0) ?? 0;
    out += code >= 0x3041 && code <= 0x3096 ? String.fromCodePoint(code + 0x60) : ch;
  }
  return out;
}

export function normalizeForSearch(text: string): string {
  return foldKana(text.normalize("NFKC").toLowerCase()).replace(/\s+/g, " ").trim();
}

export function searchTokens(query: string): string[] {
  const normalised = normalizeForSearch(query);
  return normalised === "" ? [] : Array.from(new Set(normalised.split(" ")));
}

/** True when every word of the query appears somewhere in the text. */
export function matchesSearch(haystack: string, query: string): boolean {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;
  const text = normalizeForSearch(haystack);
  return tokens.every((token) => text.includes(token));
}