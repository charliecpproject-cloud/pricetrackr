export type CategoryCount = { name: string; count: number };

export const normalize = (s: string) =>
  s.normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();

function isHan(ch: string): boolean {
  const c = ch.codePointAt(0) ?? 0;
  return (
    (c >= 0x4e00 && c <= 0x9fff) ||
    (c >= 0x3400 && c <= 0x4dbf) ||
    (c >= 0xf900 && c <= 0xfaff) ||
    (c >= 0x20000 && c <= 0x2a6df)
  );
}

function hanChars(s: string): Set<string> {
  return new Set(Array.from(s).filter(isHan));
}

// Groups the category texts of all products into name + number of products.
// Spellings that normalise to the same text (full/half width, case) are merged.
export function countCategories(
  values: (string | null | undefined)[],
): CategoryCount[] {
  const groups = new Map<string, Map<string, number>>();
  for (const raw of values) {
    const name = (raw ?? "").trim();
    if (!name) continue;
    const key = normalize(name);
    const spellings = groups.get(key) ?? new Map<string, number>();
    spellings.set(name, (spellings.get(name) ?? 0) + 1);
    groups.set(key, spellings);
  }
  return Array.from(groups.values()).map((spellings) => {
    let best = "";
    let bestCount = -1;
    let total = 0;
    for (const [name, n] of spellings) {
      total += n;
      if (n > bestCount) {
        best = name;
        bestCount = n;
      }
    }
    return { name: best, count: total };
  });
}

const byCount = (a: CategoryCount, b: CategoryCount) =>
  b.count - a.count || a.name.localeCompare(b.name, "ja");

// A suggestion list, not an exact search: whole-term matches (either way round)
// plus every kanji the typed text shares with a category. Up to `limit` results.
export function suggestCategories(
  term: string,
  categories: CategoryCount[],
  limit = 10,
): CategoryCount[] {
  const t = normalize(term);
  if (t === "") return [...categories].sort(byCount).slice(0, limit);

  const termHan = hanChars(t);
  const scored = categories
    .map((c) => {
      const n = normalize(c.name);
      let score = 0;
      if (n === t) score += 1000;
      else if (n.includes(t) || t.includes(n)) score += 500;
      for (const ch of hanChars(n)) if (termHan.has(ch)) score += 100;
      return { c, score };
    })
    .filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score || byCount(a.c, b.c));
  return scored.slice(0, limit).map((x) => x.c);
}
