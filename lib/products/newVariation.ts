// The optional variation typed into the 新規 panel of 価格入力: one variation with one 容量.
import { parseStructure, type ParsedVariation } from "./structure";

export const VARIATION_AND_CHOICE_ERROR =
  "バリエーションは、選ぶか新しく入力するかのどちらかにしてください";

export type NewVariationResult =
  | { ok: true; variation: ParsedVariation | null }
  | { ok: false; error: string };

/** Reads the attribute rows of the panel. Empty rows only: variation null (nothing to create). */
export function parseNewVariation(input: {
  names: readonly unknown[];
  values: readonly unknown[];
  size: string;
  unit: string;
  allowedUnits: readonly string[];
  selectedVariationId: string | null;
}): NewVariationResult {
  const rows = input.names.map((name, i) => ({
    name: typeof name === "string" ? name : "",
    value:
      typeof input.values[i] === "string" ? (input.values[i] as string) : "",
  }));
  if (rows.every((r) => r.name.trim() === "" && r.value.trim() === ""))
    return { ok: true, variation: null };
  if (input.selectedVariationId)
    return { ok: false, error: VARIATION_AND_CHOICE_ERROR };

  const result = parseStructure(
    {
      variations: [
        {
          attributes: rows,
          packages: [{ size: input.size, unit: input.unit }],
        },
      ],
      loose: [],
    },
    input.allowedUnits,
  );
  if (!result.ok) return result;
  return { ok: true, variation: result.variations[0] ?? null };
}

/** The message when the variation could not be saved. */
export function variationInsertMessage(
  code: string | undefined,
  productCreated: boolean,
): string {
  if (code === "23505") return "同じバリエーションがすでに登録されています";
  return productCreated
    ? "商品は追加しましたが、バリエーションを追加できませんでした。商品ページから追加してください"
    : "バリエーションを追加できませんでした";
}
