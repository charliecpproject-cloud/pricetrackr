"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseBarcodes } from "@/lib/products/barcode";
import { BARCODE_TAKEN_HIDDEN, takenBarcodeMessage } from "@/lib/products/barcodeDb";

import {
  duplicateAttributeName,
  normalizeAttributes,
  variationKey,
} from "@/lib/products/variation";

type State = { error: string | null; message?: string | null; productId?: string | null };
type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const SAVE_FAILED = "保存できませんでした。もう一度お試しください。";

const fields = {
  name: z
    .string()
    .trim()
    .min(1, "商品名を入力してください")
    .max(100, "商品名は100文字以内で入力してください"),
  brand: z.string().trim().max(100, "ブランドは100文字以内で入力してください"),
  other_name: z.string().trim().max(100, "英語名・別名は100文字以内で入力してください"),
  category: z.string().trim().max(100, "カテゴリは100文字以内で入力してください"),
};

const createSchema = z.object({
  ...fields,
  memo: z.string().trim().max(1000, "メモは1000文字以内で入力してください"),
});

const updateSchema = z.object({
  ...fields,
  id: z.string().uuid("商品が正しくありません"),
  other_name: z.string().trim().max(100, "別名は100文字以内で入力してください"),
});

// "" means not set. Otherwise 0 to 30 (8 and 10 are the usual rates).
function parseTaxRate(raw: string): { ok: true; value: number | null } | { ok: false } {
  const text = raw.normalize("NFKC").trim();
  if (text === "") return { ok: true, value: null };
  if (!/^\d{1,2}$/.test(text)) return { ok: false };
  const n = Number(text);
  return n >= 0 && n <= 30 ? { ok: true, value: n } : { ok: false };
}

function get(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

const norm = (value: string | null | undefined) =>
  (value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();

// Same brand and the same name in either language counts as the same product.
async function checkDuplicate(
  supabase: Supabase,
  names: { name_ja: string | null; name_en: string | null },
  brand: string | null,
  excludeId?: string
): Promise<"ok" | "duplicate" | "failed"> {
  const { data, error } = await supabase
    .from("products")
    .select("id, name_ja, name_en, brand")
    .limit(5000);
  if (error) {
    console.error("Products fetch error:", error.message, error.code);
    return "failed";
  }
  const duplicate = ((data ?? []) as any[]).some(
    (p) =>
      p.id !== excludeId &&
      norm(p.brand) === norm(brand) &&
      ((names.name_ja && norm(p.name_ja || p.name_en) === norm(names.name_ja)) ||
        false)
  );
  return duplicate ? "duplicate" : "ok";
}

function refresh() {
  revalidatePath("/products");
  revalidatePath("/prices/new");
  revalidatePath("/check", "layout");
}

export async function createProduct(_prevState: State, formData: FormData): Promise<State> {
  const parsed = createSchema.safeParse({
    name: get(formData, "name"),
    brand: get(formData, "brand"),
    category: get(formData, "category"),
    memo: get(formData, "memo"),
    other_name: get(formData, "other_name"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const taxResult = parseTaxRate(get(formData, "tax_rate"));
  if (!taxResult.ok) return { error: "税率が正しくありません" };

  const barcodeResult = parseBarcodes(formData.getAll("barcode"));
  if (!barcodeResult.ok) return { error: barcodeResult.error };
  const codes = barcodeResult.codes;

  const { name, other_name, brand, category, memo } = parsed.data;
  const names = { name_ja: name, name_en: other_name || null };

  const supabase = await createSupabaseServerClient();
  const check = await checkDuplicate(supabase, names, brand || null);
  if (check === "failed") return { error: SAVE_FAILED };
  if (check === "duplicate") return { error: "同じ商品がすでに登録されています" };

  // A barcode belongs to one product only.
  const taken = await takenBarcodeMessage(supabase, codes);
  if (taken) return { error: taken };

  const { data: created, error } = await supabase
    .from("products")
    .insert({
      ...names,
      brand: brand || null,
      category: category || null,
      memo: memo || null,
      tax_rate: taxResult.value,
    })
    .select("id")
    .single();
  if (error || !created) {
    console.error("Product insert error:", error?.message, error?.code);
    return { error: SAVE_FAILED };
  }

  if (codes.length > 0) {
    const { error: codeError } = await supabase
      .from("product_barcodes")
      .insert(codes.map((code) => ({ product_id: created.id, code })));
    if (codeError) {
      console.error("Barcode insert error:", codeError.message, codeError.code);
      // Do not keep a half-saved product.
      await supabase.from("products").delete().eq("id", created.id);
      return { error: codeError.code === "23505" ? BARCODE_TAKEN_HIDDEN : SAVE_FAILED };
    }
  }

  refresh();
  return { error: null, message: "追加しました", productId: created.id as string };
}

export async function updateProduct(_prevState: State, formData: FormData): Promise<State> {
  const parsed = updateSchema.safeParse({
    id: get(formData, "id"),
    name: get(formData, "name"),
    other_name: get(formData, "other_name"),
    brand: get(formData, "brand"),
    category: get(formData, "category"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { id, name, other_name, brand, category } = parsed.data;
  const taxResult = parseTaxRate(get(formData, "tax_rate"));
  if (!taxResult.ok) return { error: "税率が正しくありません" };
  const names = { name_ja: name, name_en: other_name || null };

  const supabase = await createSupabaseServerClient();
  const check = await checkDuplicate(supabase, names, brand || null, id);
  if (check === "failed") return { error: SAVE_FAILED };
  if (check === "duplicate") return { error: "同じ商品がすでに登録されています" };

  const { data, error } = await supabase
    .from("products")
    .update({
      ...names,
      brand: brand || null,
      category: category || null,
      tax_rate: taxResult.value,
    })
    .eq("id", id)
    .select("id");
  if (error) {
    console.error("Product update error:", error.message, error.code);
    return { error: SAVE_FAILED };
  }
  if (!data || data.length === 0) return { error: "商品が見つかりませんでした" };

  refresh();
  return { error: null, message: "保存しました" };
}

export async function updateVariation(_prevState: State, formData: FormData): Promise<State> {
  const id = z
    .string()
    .uuid("バリエーションが正しくありません")
    .safeParse(get(formData, "variation_id"));
  if (!id.success) return { error: id.error.issues[0].message };

  const names = formData.getAll("attr_name");
  const values = formData.getAll("attr_value");
  const attributes = normalizeAttributes(
    names.map((n, i) => ({
      name: typeof n === "string" ? n : "",
      value: typeof values[i] === "string" ? (values[i] as string) : "",
    }))
  );

  if (attributes.length === 0) return { error: "名前と値を1組以上入力してください" };
  if (attributes.length > 8) return { error: "属性は8個までです" };
  if (attributes.some((a) => a.name.length > 30 || a.value.length > 30)) {
    return { error: "名前と値は30文字以内で入力してください" };
  }
  const repeated = duplicateAttributeName(attributes);
  if (repeated) return { error: `同じ名前の属性が重複しています：${repeated}` };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_variations")
    .update({ attributes, attributes_key: variationKey(attributes) })
    .eq("id", id.data)
    .select("id");

  if (error) {
    if (error.code === "23505") return { error: "同じバリエーションがすでに登録されています" };
    console.error("Variation update error:", error.message, error.code);
    return { error: SAVE_FAILED };
  }
  if (!data || data.length === 0) return { error: "バリエーションが見つかりませんでした" };

  refresh();
  return { error: null, message: "保存しました" };
}