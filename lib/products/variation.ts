// Product variations: user-defined attributes such as タイプ：パンツ, サイズ：M.
export type Attribute = { name: string; value: string };

const clean = (text: string) => text.normalize("NFKC").replace(/\s+/g, " ").trim();

/** Cleans every row (full-width to normal width, trimmed, single spaces) and drops incomplete rows. */
export function normalizeAttributes(rows: readonly Attribute[]): Attribute[] {
  return rows
    .map((row) => ({ name: clean(row.name), value: clean(row.value) }))
    .filter((row) => row.name !== "" && row.value !== "");
}

/** The first attribute name used twice (ignoring letter case), or null. */
export function duplicateAttributeName(rows: readonly Attribute[]): string | null {
  const seen = new Set<string>();
  for (const row of normalizeAttributes(rows)) {
    const key = row.name.toLowerCase();
    if (seen.has(key)) return row.name;
    seen.add(key);
  }
  return null;
}

/** Canonical text that identifies a variation: row order and letter case do not matter. */
export function variationKey(rows: readonly Attribute[]): string {
  const pairs = normalizeAttributes(rows).map(
    (row) => [row.name.toLowerCase(), row.value.toLowerCase()] as const
  );
  pairs.sort((a, b) =>
    a[0] === b[0] ? (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0) : a[0] < b[0] ? -1 : 1
  );
  return JSON.stringify(pairs);
}

/** Text shown to the user, in the order entered: タイプ：パンツ / サイズ：M */
export function variationLabel(rows: readonly Attribute[]): string {
  return normalizeAttributes(rows)
    .map((row) => `${row.name}：${row.value}`)
    .join(" / ");
}

/** Reads the `attributes` column (jsonb) safely. */
export function parseAttributes(value: unknown): Attribute[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    const row = item as { name?: unknown; value?: unknown } | null;
    return typeof row?.name === "string" && typeof row?.value === "string"
      ? [{ name: row.name, value: row.value }]
      : [];
  });
}