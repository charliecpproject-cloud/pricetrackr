// Reads the variation and 容量 fields of the 商品を追加 form (components/StructureFields.tsx).
// Field names: st_v<slot>_attr_name / st_v<slot>_attr_value / st_v<slot>_size / st_v<slot>_unit
// for each variation card (slot 0 to 4), st_loose_size / st_loose_unit for a product without variations.
import type { SaveStructureResult } from "./saveStructure";
import {
  MAX_VARIATIONS,
  type PackageRow,
  type StructureInput,
} from "./structure";

const str = (value: FormDataEntryValue | undefined): string =>
  typeof value === "string" ? value : "";

function pairs(
  sizes: FormDataEntryValue[],
  units: FormDataEntryValue[],
): PackageRow[] {
  const count = Math.max(sizes.length, units.length);
  return Array.from({ length: count }, (_, i) => ({
    size: str(sizes[i]),
    unit: str(units[i]),
  }));
}

export function readStructureForm(formData: FormData): StructureInput {
  const variations: StructureInput["variations"] = [];
  for (let slot = 0; slot < MAX_VARIATIONS; slot++) {
    const names = formData.getAll(`st_v${slot}_attr_name`);
    const values = formData.getAll(`st_v${slot}_attr_value`);
    const sizes = formData.getAll(`st_v${slot}_size`);
    const units = formData.getAll(`st_v${slot}_unit`);
    // A card that is not on the screen sends nothing.
    if (names.length === 0 && sizes.length === 0) continue;
    variations.push({
      attributes: names.map((name, i) => ({
        name: str(name),
        value: str(values[i]),
      })),
      packages: pairs(sizes, units),
    });
  }
  return {
    variations,
    loose: pairs(
      formData.getAll("st_loose_size"),
      formData.getAll("st_loose_unit"),
    ),
  };
}

/** What to tell the user when the product was saved but its variations or 容量 were not. */
export function structureSaveMessage(
  failure: Extract<SaveStructureResult, { ok: false }>,
): string {
  return failure.stage === "variations"
    ? "商品は追加しましたが、バリエーションと容量を追加できませんでした。「商品」で検索して追加してください"
    : "商品とバリエーションは追加しましたが、容量を追加できませんでした。「商品」で検索して追加してください";
}
