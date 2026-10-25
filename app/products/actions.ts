"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadAllowedUnits } from "@/lib/prices/counterUnits";

/* ---------- パッケージ追加アクション ---------- */
export async function addPackage(
  _prevState: { error: string | null },
  formData: FormData,
) {
  // ---- バリデーション ----
  const schema = z.object({
    product_id: z.string().uuid(),
    package_size: z.preprocess(
      (val) => (typeof val === "string" ? parseFloat(val) : val),
      z
        .number()
        .gt(0, { message: "サイズは0より大きい数値で入力してください。" }),
    ),
    package_unit: z
      .string()
      .trim()
      .min(1, { message: "単位は1文字以上で入力してください。" })
      .max(20, { message: "単位は20文字以内で入力してください。" }),
    // variation_id は空文字列を null とみなす
    variation_id: z.preprocess(
      (val) => (val === "" ? undefined : val),
      z.string().uuid({ message: "バリエーションが正しくありません" }).optional(),
    ),
  });

  const parseResult = schema.safeParse({
    product_id: formData.get("product_id"),
    package_size: formData.get("package_size"),
    package_unit: formData.get("package_unit"),
    variation_id: (formData.get("variation_id") ?? ""),
  });

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0].message };
  }

  const supabase = await createSupabaseServerClient();

  // ---- 単位が使える言葉か確認 ----
  if (!(await loadAllowedUnits(supabase)).includes(parseResult.data.package_unit)) {
    return { error: "単位を選んでください" };
  }

  // ---- バリエーションが必要かチェック ----
  // 対象商品にバリエーションが存在するか確認
  const { count: variationCount, error: countError } = await supabase
    .from("product_variations")
    .select("*", { count: "exact", head: true })
    .eq("product_id", parseResult.data.product_id);

  if (countError) {
    console.error("Supabase count variations error:", countError);
    // カウント取得に失敗した場合は続行させずエラー返却
    return { error: "バリエーション情報の取得に失敗しました。" };
  }

  // 商品にバリエーションがあるのに variation_id が未指定ならエラー
  if (variationCount && variationCount > 0 && !parseResult.data.variation_id) {
    return { error: "バリエーションを選んでください" };
  }

  // ---- DB 挿入 ----
  const { error } = await supabase.from("product_packages").insert({
    product_id: parseResult.data.product_id,
    package_size: parseResult.data.package_size,
    package_unit: parseResult.data.package_unit,
    variation_id: parseResult.data.variation_id ?? null,
  });

  if (error) {
    console.error("Supabase insert package error:", error);
    if (error.code === "23505") {
      // unique_violation
      return {
        error: "この商品に対して同じパッケージはすでに登録されています。",
      };
    }
    if (error.code === "23503") {
      // foreign_key_violation (variation_id が商品に紐付かない)
      return {
        error: "選んだバリエーションはこの商品のものではありません",
      };
    }
    return { error: "データベースエラー: " + error.message };
  }

  // ---- 再検証 ----
  revalidatePath("/products");
  return { error: null };
}
