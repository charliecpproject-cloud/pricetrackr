// The variations and 容量 typed into a "new product" form, checked before anything is saved.
// Plain arrays in, plain data out (no FormData), so it can be tested on its own.
import {
  duplicateAttributeName,
  variationKey,
  type Attribute,
} from "./variation";

export const MAX_VARIATIONS = 5;
export const MAX_PACKAGES_PER_GROUP = 6;
export const MAX_ATTRIBUTES = 8;
const MAX_ATTRIBUTE_TEXT = 30;

export type PackageRow = { size: string; unit: string };
export type StructureInput = {
  variations: { attributes: Attribute[]; packages: PackageRow[] }[];
  // 容量 of a product without variations
  loose: PackageRow[];
};

export type ParsedPackage = { size: number; unit: string };
export type ParsedVariation = {
  attributes: Attribute[];
  key: string;
  packages: ParsedPackage[];
};
export type StructureResult =
  | { ok: true; variations: ParsedVariation[]; loose: ParsedPackage[] }
  | { ok: false; error: string };

const clean = (text: string) =>
  text.normalize("NFKC").replace(/\s+/g, " ").trim();

const fail = (error: string): { ok: false; error: string } => ({
  ok: false,
  error,
});

/** A size above 0 and up to 1,000,000 (full-width digits and commas are accepted), else null. */
export function parseSize(raw: string): number | null {
  const text = raw.normalize("NFKC").replace(/[,\s]/g, "");
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) && n > 0 && n <= 1_000_000 ? n : null;
}

function parsePackageRows(
  rows: readonly PackageRow[],
  allowedUnits: readonly string[],
): { ok: true; packages: ParsedPackage[] } | { ok: false; error: string } {
  const packages: ParsedPackage[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    const rawSize = row.size.trim();
    const unit = row.unit.trim();
    if (rawSize === "" && unit === "") continue;
    if (rawSize === "") return fail("容量を入力してください");
    const size = parseSize(rawSize);
    if (size === null) return fail("容量は0より大きい数値で入力してください");
    if (unit === "" || !allowedUnits.includes(unit))
      return fail("単位を選んでください");
    const key = `${size}|${unit}`;
    if (seen.has(key)) return fail("同じ容量が重複しています");
    seen.add(key);
    packages.push({ size, unit });
  }
  if (packages.length > MAX_PACKAGES_PER_GROUP)
    return fail(`容量は${MAX_PACKAGES_PER_GROUP}個までです`);
  return { ok: true, packages };
}

export function parseStructure(
  input: StructureInput,
  allowedUnits: readonly string[],
): StructureResult {
  const variations: ParsedVariation[] = [];
  const keys = new Set<string>();

  for (const v of input.variations) {
    const rows = v.attributes.map((a) => ({
      name: clean(a.name),
      value: clean(a.value),
    }));
    if (rows.some((r) => (r.name === "") !== (r.value === "")))
      return fail("バリエーションの名前と値は両方入力してください");
    const attributes = rows.filter((r) => r.name !== "");

    const parsedPackages = parsePackageRows(v.packages, allowedUnits);
    if (!parsedPackages.ok) return parsedPackages;

    if (attributes.length === 0) {
      if (parsedPackages.packages.length > 0)
        return fail("バリエーションの名前と値を入力してください");
      continue; // an empty group is ignored
    }
    if (attributes.length > MAX_ATTRIBUTES)
      return fail(`属性は${MAX_ATTRIBUTES}個までです`);
    if (
      attributes.some(
        (a) =>
          a.name.length > MAX_ATTRIBUTE_TEXT ||
          a.value.length > MAX_ATTRIBUTE_TEXT,
      )
    )
      return fail("名前と値は30文字以内で入力してください");
    const repeated = duplicateAttributeName(attributes);
    if (repeated) return fail(`同じ名前の属性が重複しています：${repeated}`);

    const key = variationKey(attributes);
    if (keys.has(key)) return fail("同じバリエーションが重複しています");
    keys.add(key);
    variations.push({ attributes, key, packages: parsedPackages.packages });
  }
  if (variations.length > MAX_VARIATIONS)
    return fail(`バリエーションは${MAX_VARIATIONS}個までです`);

  const loose = parsePackageRows(input.loose, allowedUnits);
  if (!loose.ok) return loose;
  if (variations.length > 0 && loose.packages.length > 0)
    return fail(
      "バリエーションがある商品では、容量はバリエーションごとに入力してください",
    );

  return { ok: true, variations, loose: loose.packages };
}
