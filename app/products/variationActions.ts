"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  normalizeAttributes,
  duplicateAttributeName,
  variationKey,
} from "@/lib/products/variation";
import { z } from "zod";
import { revalidatePath } from "next/cache";

export async function addVariation(
  prevState: { error: string | null; message?: string | null },
  formData: FormData,
): Promise<{ error: string | null; message?: string | null }> {
  // product_id の取得とバリデーション
  const rawProductId = formData.get("product_id");
  const productIdParse = z.string().uuid().safeParse(rawProductId);
  if (!productIdParse.success) {
    return { error: "商品を選んでください", message: null };
  }
  const productId = productIdParse.data;

  // 属性名・属性値の取得
  const rawNames = formData.getAll("attr_name");
  const rawValues = formData.getAll("attr_value");

  const rows: { name: string; value: string }[] = [];
  const limit = Math.min(rawNames.length, rawValues.length);
  for (let i = 0; i < limit; i++) {
    const name = rawNames[i];
    const value = rawValues[i];
    if (typeof name === "string" && typeof value === "string") {
      rows.push({ name, value });
    }
  }

  // 正規化
  const normalized = normalizeAttributes(rows);

  // バリデーション
  if (normalized.length === 0) {
    return { error: "名前と値を1組以上入力してください", message: null };
  }
  if (normalized.length > 8) {
    return { error: "属性は8個までです", message: null };
  }
  if (normalized.some((r) => r.name.length > 30 || r.value.length > 30)) {
    return { error: "名前と値は30文字以内で入力してください", message: null };
  }
  const duplicate = duplicateAttributeName(normalized);
  if (duplicate) {
    return {
      error: `同じ名前の属性が重複しています：${duplicate}`,
      message: null,
    };
  }

  const attributesKey = variationKey(normalized);

  // Supabase へ挿入
  const supabase = await createSupabaseServerClient();
  const { error: insertError } = await supabase
    .from("product_variations")
    .insert([
      {
        product_id: productId,
        attributes: normalized,
        attributes_key: attributesKey,
      },
    ]);

  if (insertError) {
    if (insertError.code === "23505") {
      return {
        error: "同じバリエーションがすでに登録されています",
        message: null,
      };
    }
    console.error(insertError.message, insertError.code);
    return {
      error: "保存できませんでした。もう一度お試しください。",
      message: null,
    };
  }

  // 成功時はパスを再検証
  await revalidatePath("/products");
  await revalidatePath("/prices/new");

  return { error: null, message: "追加しました" };
}
