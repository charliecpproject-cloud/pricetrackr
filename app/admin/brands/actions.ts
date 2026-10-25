"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import { normalize } from "@/lib/products/category";
import { resolveBrand } from "@/lib/products/brand";
import { loadBrandContext } from "@/lib/products/loadBrands";

type State = { error: string | null; message?: string | null };

const NOT_ADMIN = "この操作は管理者のみ行えます";
const FAILED = "保存できませんでした。もう一度お試しください。";
const MAX_ALIASES_AT_ONCE = 10;

function refresh() {
  revalidatePath("/admin/brands");
  revalidatePath("/products");
  revalidatePath("/prices/new");
  revalidatePath("/check", "layout");
}

const brandSchema = z
  .string()
  .trim()
  .min(1, "ブランド名を入力してください")
  .max(100, "ブランド名は100文字以内で入力してください");

// Gives every product of the brand "from" the brand "to". The old spelling becomes an alias.
export async function mergeBrands(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };

  const from = brandSchema.safeParse(String(formData.get("from") ?? ""));
  if (!from.success) return { error: "まとめるブランドを選んでください" };
  const to = brandSchema.safeParse(String(formData.get("to") ?? ""));
  if (!to.success) return { error: "残すブランドを入力してください" };

  const supabase = await createSupabaseServerClient();

  // A different brand: use the spelling that already exists (or the brand of an alias).
  // The same brand (only the spelling differs): the typed spelling is used for all of them.
  let target = to.data;
  if (normalize(from.data) !== normalize(to.data)) {
    const { brands, aliases } = await loadBrandContext(supabase);
    target = resolveBrand(to.data, brands, aliases);
    if (normalize(target) === normalize(from.data))
      return { error: "同じブランドです" };
  }

  const { data, error } = await supabase.rpc("merge_brand", {
    p_from: from.data,
    p_to: target,
  });
  if (error) {
    console.error("Brand merge error:", error.message, error.code);
    return { error: error.code === "42501" ? NOT_ADMIN : FAILED };
  }

  refresh();
  const count = typeof data === "number" ? data : 0;
  return {
    error: null,
    message: `${count}件の商品のブランドを「${target}」にしました`,
  };
}

// Several aliases can be added at once, separated by commas or line breaks.
export async function addBrandAliases(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };

  const brand = brandSchema.safeParse(String(formData.get("brand") ?? ""));
  if (!brand.success) return { error: brand.error.issues[0].message };

  const typed = String(formData.get("aliases") ?? "")
    .split(/[,，、\n\r]+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const aliases: string[] = [];
  for (const a of typed) {
    if (a.length > 100)
      return {
        error: `別名は100文字以内で入力してください：${a.slice(0, 20)}…`,
      };
    if (normalize(a) === normalize(brand.data)) continue;
    if (!aliases.some((x) => normalize(x) === normalize(a))) aliases.push(a);
  }
  if (aliases.length === 0) return { error: "別名を入力してください" };
  if (aliases.length > MAX_ALIASES_AT_ONCE) {
    return { error: `一度に追加できる別名は${MAX_ALIASES_AT_ONCE}個までです` };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("brand_aliases")
    .insert(aliases.map((alias) => ({ brand: brand.data, alias })));
  if (error) {
    console.error("Brand alias insert error:", error.message, error.code);
    if (error.code === "23505")
      return { error: "その別名はすでに登録されています" };
    return { error: error.code === "42501" ? NOT_ADMIN : FAILED };
  }

  refresh();
  return { error: null, message: `別名を${aliases.length}件追加しました` };
}

export async function deleteBrandAlias(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };
  const id = z
    .string()
    .uuid("別名が正しくありません")
    .safeParse(formData.get("id"));
  if (!id.success) return { error: id.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("brand_aliases")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error || !data || data.length === 0) {
    console.error("Brand alias delete error:", error?.message, error?.code);
    return { error: "削除できませんでした。もう一度お試しください。" };
  }

  refresh();
  return { error: null, message: "削除しました" };
}
