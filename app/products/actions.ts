"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadAllowedUnits } from "@/lib/prices/counterUnits";

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
      memo: z
        .string()
        .trim()
        .max(1000, { message: "メモは1000文字以内で入力してください" })
        .optional(),
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
    memo: formData.get("memo"),
  });

  if (!parseResult.success) {
    return { error: parseResult.error.issues[0].message };
  }

  // ---- 重複チェック ----
  const supabase = await createSupabaseServerClient();

  // 既存商品を取得
  const { data: existingProducts, error: fetchError } = await supabase
    .from("products")
    .select("name_ja,name_en,brand");

  if (fetchError) {
    console.error("Supabase fetch products error:", fetchError);
    return { error: "データベースエラー: " + fetchError.message };
  }

  // 正規化ヘルパー
  const normalize = (str: string | null | undefined) =>
    (str ?? "")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

  const newBrandNorm = normalize(parseResult.data.brand);
  const newNameJaNorm = normalize(parseResult.data.name_ja);
  const newNameEnNorm = normalize(parseResult.data.name_en);

  const duplicate = existingProducts?.some((p) => {
    const existingBrandNorm = normalize(p.brand);
    // ブランドが両方空（または空文字）か、正規化後に一致する場合のみ比較対象
    const brandMatches =
      (newBrandNorm === "" && existingBrandNorm === "") ||
      newBrandNorm === existingBrandNorm;

    if (!brandMatches) return false;

    const existingNameJaNorm = normalize(p.name_ja);
    const existingNameEnNorm = normalize(p.name_en);

    // name_ja が両方非空で一致、または name_en が両方非空で一致したら重複
    if (
      newNameJaNorm !== "" &&
      existingNameJaNorm !== "" &&
      newNameJaNorm === existingNameJaNorm
    ) {
      return true;
    }
    if (
      newNameEnNorm !== "" &&
      existingNameEnNorm !== "" &&
      newNameEnNorm === existingNameEnNorm
    ) {
      return true;
    }
    return false;
  });

  if (duplicate) {
    return { error: "同じ商品がすでに登録されています" };
  }

  // ---- DB 挿入 ----
  // memo が空文字列または未入力の場合は null に変換
  const memoToInsert =
    parseResult.data.memo && parseResult.data.memo.length > 0
      ? parseResult.data.memo
      : null;

  const { error } = await supabase.from("products").insert({
    name_ja: parseResult.data.name_ja,
    name_en: parseResult.data.name_en,
    brand: parseResult.data.brand,
    category: parseResult.data.category,
    memo: memoToInsert,
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
