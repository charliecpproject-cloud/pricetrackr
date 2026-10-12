"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/* ---------- 商品追加アクション ---------- */
export async function addProduct(
  _prevState: { error: string | null },
  formData: FormData,
) {
  // ---- バリデーション ----
  const schema = z
    .object({
      name_ja: z.string().trim().max(100).optional(),
      name_en: z.string().trim().max(100).optional(),
      brand: z.string().trim().max(100).optional(),
      category: z.string().trim().max(100).optional(),
    })
    .refine(
      (data) =>
        (data.name_ja && data.name_ja.length > 0) ||
        (data.name_en && data.name_en.length > 0),
      {
        message: "名前（日本語または英語）のいずれかを入力してください。",
        path: ["name_ja"],
      },
    );

  const parseResult = schema.safeParse({
    name_ja: formData.get("name_ja"),
    name_en: formData.get("name_en"),
    brand: formData.get("brand"),
    category: formData.get("category"),
  });

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0].message };
  }

  // ---- DB 挿入 ----
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("products").insert({
    name_ja: parseResult.data.name_ja,
    name_en: parseResult.data.name_en,
    brand: parseResult.data.brand,
    category: parseResult.data.category,
  });

  if (error) {
    console.error("Supabase insert product error:", error);
    return { error: "データベースエラー: " + error.message };
  }

  // ---- 再検証 ----
  revalidatePath("/products");
  return { error: null };
}

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
  });

  const parseResult = schema.safeParse({
    product_id: formData.get("product_id"),
    package_size: formData.get("package_size"),
    package_unit: formData.get("package_unit"),
  });

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0].message };
  }

  // ---- DB 挿入 ----
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("product_packages").insert({
    product_id: parseResult.data.product_id,
    package_size: parseResult.data.package_size,
    package_unit: parseResult.data.package_unit,
  });

  if (error) {
    console.error("Supabase insert package error:", error);
    if (error.code === "23505") {
      // unique_violation
      return { error: "この商品に対して同じパッケージはすでに登録されています。" };
    }
    return { error: "データベースエラー: " + error.message };
  }

  // ---- 再検証 ----
  revalidatePath("/products");
  return { error: null };
}
