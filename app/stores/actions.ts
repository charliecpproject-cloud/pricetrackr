"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* ---------- 既存の StoreChain 追加アクション ---------- */
export async function addStoreChain(
  _prevState: { error: string | null },
  formData: FormData
) {
  // ---- バリデーション ----
  const nameRaw = formData.get("name");
  const schema = z.string().trim().min(1).max(100);
  const parseResult = schema.safeParse(nameRaw);

  if (!parseResult.success) {
    return { error: "名前は1〜100文字で入力してください。" };
  }

  // ---- DB 挿入 ----
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from("store_chains")
    .insert({ name: parseResult.data });

  if (error) {
    console.error("Supabase insert error:", error);
    return { error: "データベースエラー: " + error.message };
  }

  // ---- 再検証 ----
  revalidatePath("/stores");

  // 成功時はエラーなし
  return { error: null };
}

/* ---------- 新規ショップ追加アクション ---------- */
export async function addShop(
  _prevState: { error: string | null },
  formData: FormData
) {
  // ---- バリデーション ----
  const schema = z.object({
    store_chain_id: z.string().uuid(),
    name: z.string().trim().min(1).max(100),
    address: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
    region: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((val) => (val === "" ? undefined : val)),
  });

  const parseResult = schema.safeParse({
    store_chain_id: formData.get("store_chain_id"),
    name: formData.get("name"),
    address: formData.get("address"),
    region: formData.get("region"),
  });

  if (!parseResult.success) {
    return { error: "入力内容が正しくありません。" };
  }

  // ---- DB 挿入 ----
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("shops").insert({
    store_chain_id: parseResult.data.store_chain_id,
    name: parseResult.data.name,
    address: parseResult.data.address,
    region: parseResult.data.region,
  });

  if (error) {
    console.error("Supabase insert shop error:", error);
    return { error: "データベースエラー: " + error.message };
  }

  // ---- 再検証 ----
  revalidatePath("/stores");

  // 成功時はエラーなし
  return { error: null };
}
