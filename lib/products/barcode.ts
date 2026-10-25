export const MAX_BARCODES_PER_PRODUCT = 10;

/** The stored form of a barcode, or null when it is not a usable code. */
export function normalizeBarcode(raw: string): string | null {
  const text = raw.normalize("NFKC").replace(/[\s-]/g, "").toUpperCase();
  if (!/^[A-Z0-9]{6,32}$/.test(text)) return null;
  // A 12-digit UPC-A is the same code as the 13-digit EAN with a leading 0.
  return /^\d{12}$/.test(text) ? `0${text}` : text;
}

type ParsedBarcodes =
  { ok: true; codes: string[] } | { ok: false; error: string };

/** Cleans a list of typed codes: empty ones are skipped, duplicates removed. */
export function parseBarcodes(values: unknown[]): ParsedBarcodes {
  const codes: string[] = [];
  for (const value of values) {
    if (typeof value !== "string" || value.trim() === "") continue;
    const code = normalizeBarcode(value);
    if (!code) {
      return {
        ok: false,
        error: `バーコードの形式が正しくありません：${value.trim().slice(0, 40)}`,
      };
    }
    if (!codes.includes(code)) codes.push(code);
  }
  if (codes.length > MAX_BARCODES_PER_PRODUCT) {
    return {
      ok: false,
      error: `バーコードは${MAX_BARCODES_PER_PRODUCT}個までです`,
    };
  }
  return { ok: true, codes };
}
