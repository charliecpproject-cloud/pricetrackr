import type { createSupabaseServerClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export const BARCODE_TAKEN_HIDDEN =
  "このバーコードはすでに登録されています（削除済みの商品の可能性があります）";

/** A message when one of the codes already belongs to a product, otherwise null. */
export async function takenBarcodeMessage(
  supabase: Supabase,
  codes: string[]
): Promise<string | null> {
  if (codes.length === 0) return null;
  const { data, error } = await supabase
    .from("product_barcodes")
    .select("code, products (name_ja, name_en)")
    .in("code", codes);
  if (error) {
    console.error("Barcode check error:", error.message, error.code);
    return "バーコードを確認できませんでした。もう一度お試しください。";
  }
  const row = ((data ?? []) as any[])[0];
  if (!row) return null;
  const product = [row.products].flat()[0];
  const name = product?.name_ja || product?.name_en || "別の商品";
  return `バーコード ${row.code} は「${name}」にすでに登録されています`;
}