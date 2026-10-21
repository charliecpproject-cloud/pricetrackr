// Search suggestions: quick-search words shown on 価格確認, managed by admins.

export const DEFAULT_DISPLAY_COUNT = 3;
export const MAX_DISPLAY_COUNT = 10;
export const MAX_TERMS = 30;
export const MAX_TERM_LENGTH = 30;

// The search box removes these characters, so a chip containing one would search for something else.
const FORBIDDEN = /[()%_*\\]/;

/** How many suggestions to show: a whole number from 1 to 10 (full-width digits are fine). */
export function parseDisplayCount(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const text = raw.normalize("NFKC").trim();
  if (!/^\d{1,2}$/.test(text)) return null;
  const n = Number(text);
  return n >= 1 && n <= MAX_DISPLAY_COUNT ? n : null;
}

/**
 * Reads the list typed by an admin: terms separated by commas (also full-width), 、 or line breaks.
 * Spaces are tidied, empty parts and repeats (ignoring case and full-width letters) are dropped,
 * and the order is kept. An empty list is fine: it hides the suggestions.
 */
export function parseSuggestionTerms(
  raw: string
): { ok: true; terms: string[] } | { ok: false; error: string } {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const part of raw.split(/[,，、\n\r]+/)) {
    const term = part.replace(/\s+/g, " ").trim();
    if (term === "") continue;
    if ([...term].length > MAX_TERM_LENGTH) {
      return {
        ok: false,
        error: `言葉は${MAX_TERM_LENGTH}文字以内で入力してください：${[...term].slice(0, 10).join("")}…`,
      };
    }
    if (FORBIDDEN.test(term)) {
      return { ok: false, error: `次の文字は使えません：( ) % _ * \\（${term}）` };
    }
    const key = term.normalize("NFKC").toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    terms.push(term);
  }
  if (terms.length > MAX_TERMS) {
    return { ok: false, error: `言葉は${MAX_TERMS}個までです` };
  }
  return { ok: true, terms };
}

/** The terms that are shown: the first `count` of the list. */
export function visibleSuggestions(terms: readonly string[], count: number): string[] {
  if (!Number.isInteger(count) || count < 1) return [];
  return terms.slice(0, count);
}