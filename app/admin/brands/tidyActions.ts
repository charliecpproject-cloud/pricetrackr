"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import { countCategories, normalize } from "@/lib/products/category";
import { resolveBrand } from "@/lib/products/brand";
import { loadBrandContext } from "@/lib/products/loadBrands";

type State = { error: string | null; message?: string | null };

const NOT_ADMIN = "この操作は管理者のみ行えます";
const FAILED = "保存できませんでした。もう一度お試しください。";
const MAX_PRODUCTS = 500;
const FIELD_LABEL = { brand: "ブランド", category: "カテゴリ" } as const;

const schema = z.object({
  field: z.enum(["brand", "category"], { error: "項目を選んでください" }),
  value: z
    .string()
    .trim()
    .min(1, "新しい値を入力してください")
    .max(100, "100文字以内で入力してください"),
  ids: z
    .array(z.string().uuid("商品が正しくありません"))
    .min(1, "商品を選んでください")
    .max(MAX_PRODUCTS, `一度に変更できる商品は${MAX_PRODUCTS}件までです`),
});

// Sets the brand or the category of the chosen products. Prices are not touched: they are
// linked to the product by id, not by brand or category text.
export async function setProductField(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };

  const parsed = schema.safeParse({
    field: formData.get("field"),
    value: String(formData.get("value") ?? "").replace(/\s+/g, " "),
    ids: formData.getAll("ids").map(String),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { field, ids } = parsed.data;

  const supabase = await createSupabaseServerClient();

  // Use the spelling that already exists: an alias becomes its brand; another way of writing
  // an existing brand or category (width, case) becomes the existing spelling.
  let target = parsed.data.value;
  if (field === "brand") {
    const { brands, aliases } = await loadBrandContext(supabase);
    target = resolveBrand(target, brands, aliases);
  } else {
    const { data } = await supabase
      .from("products")
      .select("category")
      .not("category", "is", null)
      .limit(5000);
    const existing = countCategories(
      ((data ?? []) as { category: string | null }[]).map((r) => r.category),
    ).find((c) => normalize(c.name) === normalize(target));
    if (existing) target = existing.name;
  }

  const { data, error } = await supabase.rpc("set_product_field", {
    p_field: field,
    p_value: target,
    p_ids: ids,
    p_keep_alias: formData.get("keep_alias") === "1",
  });
  if (error) {
    console.error("Set product field error:", error.message, error.code);
    return { error: error.code === "42501" ? NOT_ADMIN : FAILED };
  }

  revalidatePath("/admin/brands");
  revalidatePath("/products");
  revalidatePath("/prices/new");
  revalidatePath("/check", "layout");

  const count = typeof data === "number" ? data : 0;
  return {
    error: null,
    message: `${count}件の商品の${FIELD_LABEL[field]}を「${target}」にしました`,
  };
}
