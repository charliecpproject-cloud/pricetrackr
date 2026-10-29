// Saves the variations and 容量 of a product that was just created: the variations in one
// statement, then all 容量 in one statement. The parsing and all checks happen before this
// (lib/products/structure.ts). Nothing is deleted when a step fails: the product stays valid.
import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ParsedPackage, ParsedVariation } from "./structure";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type SaveStructureResult =
  | { ok: true; firstPackageId: string | null }
  | { ok: false; stage: "variations" | "packages"; error: string };

type PlanRow = { variationId: string | null; size: number; unit: string };

export async function saveStructure(
  supabase: Supabase,
  productId: string,
  structure: { variations: ParsedVariation[]; loose: ParsedPackage[] },
): Promise<SaveStructureResult> {
  const variationIdByKey = new Map<string, string>();

  if (structure.variations.length > 0) {
    const { data, error } = await supabase
      .from("product_variations")
      .insert(
        structure.variations.map((v) => ({
          product_id: productId,
          attributes: v.attributes,
          attributes_key: v.key,
        })),
      )
      .select("id, attributes_key");
    if (error || !data) {
      console.error("Variation insert error:", error?.message, error?.code);
      return {
        ok: false,
        stage: "variations",
        error:
          error?.code === "23505"
            ? "同じバリエーションがすでに登録されています"
            : "バリエーションを追加できませんでした",
      };
    }
    for (const row of data as { id: string; attributes_key: string }[]) {
      variationIdByKey.set(row.attributes_key, row.id);
    }
  }

  // The 容量 to create, in the order typed: the first one gets the price on 価格入力.
  const plan: PlanRow[] = [];
  for (const v of structure.variations) {
    const variationId = variationIdByKey.get(v.key);
    if (!variationId) {
      return {
        ok: false,
        stage: "variations",
        error: "バリエーションを追加できませんでした",
      };
    }
    for (const p of v.packages)
      plan.push({ variationId, size: p.size, unit: p.unit });
  }
  for (const p of structure.loose)
    plan.push({ variationId: null, size: p.size, unit: p.unit });

  if (plan.length === 0) return { ok: true, firstPackageId: null };

  const { data, error } = await supabase
    .from("product_packages")
    .insert(
      plan.map((row) => ({
        product_id: productId,
        variation_id: row.variationId,
        package_size: row.size,
        package_unit: row.unit,
      })),
    )
    .select("id, variation_id, package_size, package_unit");
  if (error || !data) {
    console.error("Package insert error:", error?.message, error?.code);
    return {
      ok: false,
      stage: "packages",
      error:
        error?.code === "23505"
          ? "同じ容量が重複しています"
          : error?.code === "23503"
            ? "選んだバリエーションはこの商品のものではありません"
            : "容量を追加できませんでした",
    };
  }

  const first = plan[0];
  const found = (
    data as {
      id: string;
      variation_id: string | null;
      package_size: number | string;
      package_unit: string;
    }[]
  ).find(
    (row) =>
      row.variation_id === first.variationId &&
      Number(row.package_size) === first.size &&
      row.package_unit === first.unit,
  );
  return { ok: true, firstPackageId: found?.id ?? null };
}
