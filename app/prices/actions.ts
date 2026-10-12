"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePriceYen, toObservedAt } from "@/lib/prices/schema";

type State = { error: string | null; message?: string | null };

const schema = z.object({
  product_package_id: z.string().uuid("商品・容量を選んでください"),
  store_chain_id: z.string().uuid("チェーンを選んでください"),
  shop_id: z.string().uuid("支店が正しくありません").nullable(),
  new_shop_name: z
    .string()
    .trim()
    .max(100, "支店名は100文字以内で入力してください")
    .nullable(),
  notes: z.string().trim().max(200, "メモは200文字以内で入力してください").nullable(),
});

// Returns the trimmed text value, or null when missing or empty.
function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export async function addPriceObservation(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const parsed = schema.safeParse({
    product_package_id: text(formData, "product_package_id"),
    store_chain_id: text(formData, "store_chain_id"),
    shop_id: text(formData, "shop_id"),
    new_shop_name: text(formData, "new_shop_name"),
    notes: text(formData, "notes"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const price = parsePriceYen(text(formData, "price") ?? "");
  if (price === null) {
    return { error: "価格は1円以上で正しく入力してください" };
  }
  const observedAt = toObservedAt(text(formData, "observed_at") ?? "");
  if (observedAt === null) {
    return { error: "日時が正しくありません" };
  }

  const { product_package_id, store_chain_id, new_shop_name, notes } = parsed.data;
  let shopId = parsed.data.shop_id;
  const isSale = formData.get("is_sale") === "on";

  const supabase = await createSupabaseServerClient();

  // A new branch name: reuse the branch if it already exists in this chain.
  if (new_shop_name) {
    const { data: existing } = await supabase
      .from("shops")
      .select("id")
      .eq("store_chain_id", store_chain_id)
      .eq("name", new_shop_name)
      .limit(1);

    if (existing && existing.length > 0) {
      shopId = existing[0].id;
    } else {
      const { data: created, error: shopError } = await supabase
        .from("shops")
        .insert({ store_chain_id, name: new_shop_name })
        .select("id")
        .single();
      if (shopError || !created) {
        console.error("Shop insert error:", shopError?.message, shopError?.code);
        return { error: "支店を追加できませんでした" };
      }
      shopId = created.id;
    }
  }

  const { error } = await supabase.from("price_observations").insert({
    product_package_id,
    store_chain_id,
    shop_id: shopId,
    price,
    observed_at: observedAt,
    is_sale: isSale,
    notes,
  });

  if (error) {
    console.error("Price insert error:", error.message, error.code);
    return {
      error:
        error.code === "23503"
          ? "選んだ支店はこのチェーンのものではありません"
          : "保存できませんでした。もう一度お試しください。",
    };
  }

  revalidatePath("/check", "layout");
  revalidatePath("/prices/new");
  return { error: null, message: "保存しました" };
}