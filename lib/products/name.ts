// Product names are typed in ONE field. The app stores them in two columns
// (name_ja, name_en) so both languages stay supported in the background.
const JAPANESE = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uff66-\uff9f]/;

export function hasJapanese(text: string): boolean {
  return JAPANESE.test(text);
}

const same = (a: string, b: string) =>
  a.normalize("NFKC").trim().toLowerCase() === b.normalize("NFKC").trim().toLowerCase();

/** Saves the main name in the column that matches its language; `other` goes in the opposite column. */
export function splitProductName(
  main: string,
  other: string | null
): { name_ja: string | null; name_en: string | null } {
  const name = main.trim();
  const extra = other && other.trim() !== "" && !same(other, name) ? other.trim() : null;
  return hasJapanese(name)
    ? { name_ja: name, name_en: extra }
    : { name_ja: extra, name_en: name };
}

/** The name shown in the app: Japanese first, then English. */
export function displayName(product: {
  name_ja?: string | null;
  name_en?: string | null;
}): string {
  return product.name_ja || product.name_en || "名称未設定";
}