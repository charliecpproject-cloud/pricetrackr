"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseCategory } from "@/lib/stores/category";

type State = { error: string | null; message: string | null };

const SAVE_FAILED = "保存できませんでした。もう一度お試しください。";

const nameSchema = z
  .string()
  .trim()
  .min(1, "名前を入力してください")
  .max(100, "名前は100文字以内で入力してください");

const norm = (value: string | null | undefined) =>
  (value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();

const optionalText = (max: number, label: string) =>
  z
    .string()
    .trim()
    .max(max, `${label}は${max}文字以内で入力してください`)
    .transform((v) => (v === "" ? null : v));

function refreshPages() {
  revalidatePath("/stores");
  revalidatePath("/prices/new");
  revalidatePath("/check", "layout");
}

export async function updateStoreChain(
  _prevState: State,
  formData: FormData,
): Promise<State> {
  const parsed = z
    .object({
      id: z.string().uuid("チェーンが正しくありません"),
      name: nameSchema,
    })
    .safeParse({ id: formData.get("id"), name: formData.get("name") });
  if (!parsed.success)
    return { error: parsed.error.issues[0].message, message: null };

  const categoryRaw = formData.get("category");
  const category = parseCategory(categoryRaw);
  if (
    typeof categoryRaw === "string" &&
    categoryRaw !== "" &&
    category === null
  ) {
    return { error: "カテゴリが正しくありません", message: null };
  }

  const supabase = await createSupabaseServerClient();

  const { data: others, error: listError } = await supabase
    .from("store_chains")
    .select("id, name")
    .neq("id", parsed.data.id);
  if (listError) {
    console.error("Chains fetch error:", listError.message, listError.code);
    return { error: SAVE_FAILED, message: null };
  }
  if ((others ?? []).some((o) => norm(o.name) === norm(parsed.data.name))) {
    return { error: "同じ名前のチェーンがすでにあります", message: null };
  }

  const { error } = await supabase
    .from("store_chains")
    .update({ name: parsed.data.name, category })
    .eq("id", parsed.data.id);
  if (error) {
    console.error("Chain update error:", error.message, error.code);
    return { error: SAVE_FAILED, message: null };
  }

  refreshPages();
  return { error: null, message: "保存しました" };
}

export async function deleteStoreChain(
  _prevState: State,
  formData: FormData,
): Promise<State> {
  const parsed = z
    .string()
    .uuid("チェーンが正しくありません")
    .safeParse(formData.get("id"));
  if (!parsed.success)
    return { error: parsed.error.issues[0].message, message: null };
  const id = parsed.data;

  const supabase = await createSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from("price_observations")
    .select("id", { count: "exact", head: true })
    .eq("store_chain_id", id);
  if (countError) {
    console.error("Price count error:", countError.message, countError.code);
    return { error: SAVE_FAILED, message: null };
  }
  if ((count ?? 0) > 0) {
    return {
      error: `このチェーンには価格が${count}件あるため削除できません。名前やカテゴリは変更できます。`,
      message: null,
    };
  }

  // No prices at all, so its branches have no prices either.
  const { error: shopsError } = await supabase
    .from("shops")
    .delete()
    .eq("store_chain_id", id);
  if (shopsError) {
    console.error("Shops delete error:", shopsError.message, shopsError.code);
    return { error: "削除できませんでした。", message: null };
  }

  const { error } = await supabase.from("store_chains").delete().eq("id", id);
  if (error) {
    console.error("Chain delete error:", error.message, error.code);
    return { error: "削除できませんでした。", message: null };
  }

  refreshPages();
  redirect("/stores");
}

export async function updateShop(
  _prevState: State,
  formData: FormData,
): Promise<State> {
  const parsed = z
    .object({
      id: z.string().uuid("支店が正しくありません"),
      name: nameSchema,
      address: optionalText(200, "住所"),
      region: optionalText(200, "地域"),
    })
    .safeParse({
      id: formData.get("id"),
      name: formData.get("name"),
      address: String(formData.get("address") ?? ""),
      region: String(formData.get("region") ?? ""),
    });
  if (!parsed.success)
    return { error: parsed.error.issues[0].message, message: null };

  const supabase = await createSupabaseServerClient();

  const { data: shop, error: shopError } = await supabase
    .from("shops")
    .select("store_chain_id")
    .eq("id", parsed.data.id)
    .single();
  if (shopError || !shop) {
    console.error("Shop fetch error:", shopError?.message, shopError?.code);
    return { error: SAVE_FAILED, message: null };
  }

  const { data: others, error: listError } = await supabase
    .from("shops")
    .select("id, name")
    .eq("store_chain_id", shop.store_chain_id)
    .neq("id", parsed.data.id);
  if (listError) {
    console.error("Shops fetch error:", listError.message, listError.code);
    return { error: SAVE_FAILED, message: null };
  }
  if ((others ?? []).some((o) => norm(o.name) === norm(parsed.data.name))) {
    return { error: "同じ名前の支店がすでにあります", message: null };
  }

  const { error } = await supabase
    .from("shops")
    .update({
      name: parsed.data.name,
      address: parsed.data.address,
      region: parsed.data.region,
    })
    .eq("id", parsed.data.id);
  if (error) {
    console.error("Shop update error:", error.message, error.code);
    return { error: SAVE_FAILED, message: null };
  }

  refreshPages();
  return { error: null, message: "保存しました" };
}

export async function deleteShop(
  _prevState: State,
  formData: FormData,
): Promise<State> {
  const parsed = z
    .string()
    .uuid("支店が正しくありません")
    .safeParse(formData.get("id"));
  if (!parsed.success)
    return { error: parsed.error.issues[0].message, message: null };

  const supabase = await createSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from("price_observations")
    .select("id", { count: "exact", head: true })
    .eq("shop_id", parsed.data);
  if (countError) {
    console.error("Price count error:", countError.message, countError.code);
    return { error: SAVE_FAILED, message: null };
  }
  if ((count ?? 0) > 0) {
    return {
      error: `この支店には価格が${count}件あるため削除できません。名前や地域は変更できます。`,
      message: null,
    };
  }

  const { error } = await supabase.from("shops").delete().eq("id", parsed.data);
  if (error) {
    console.error("Shop delete error:", error.message, error.code);
    return { error: "削除できませんでした。", message: null };
  }

  refreshPages();
  return { error: null, message: "削除しました" };
}
