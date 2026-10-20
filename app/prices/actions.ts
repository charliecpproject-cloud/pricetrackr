"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parsePriceYen, toObservedAt } from "@/lib/prices/schema";
import { TAX_BASES } from "@/lib/prices/tax";
import { parseBarcodes } from "@/lib/products/barcode";
import { parseBulkTiers, type BulkTier } from "@/lib/prices/bulk";

type State = {
  error: string | null;
  message?: string | null;
  packageId?: string | null;
};
type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const SAVE_FAILED = "保存できませんでした。もう一度お試しください。";
const UNITS = ["ml", "L", "g", "kg", "count", "sheet", "bag"] as const;

const baseSchema = z.object({
  store_chain_id: z.string().uuid("チェーンを選んでください"),
  shop_id: z.string().uuid("支店が正しくありません").nullable(),
  new_shop_name: z
    .string()
    .trim()
    .max(100, "支店名は100文字以内で入力してください")
    .nullable(),
  notes: z.string().trim().max(200, "メモは200文字以内で入力してください").nullable(),
});

const newPackageSchema = z.object({
  product_id: z.string().uuid("商品が正しくありません").nullable(),
  variation_id: z.string().uuid("バリエーションが正しくありません").nullable(),
  name: z.string().trim().max(100, "商品名は100文字以内で入力してください").nullable(),
  
  brand: z.string().trim().max(100, "ブランドは100文字以内で入力してください").nullable(),
  other_name: z.string().trim().max(100, "英語名・別名は100文字以内で入力してください").nullable(),
  category: z.string().trim().max(100, "カテゴリは100文字以内で入力してください").nullable(),
  memo: z.string().trim().max(1000, "メモは1000文字以内で入力してください").nullable(),
  tax_rate: z
    .string()
    .regex(/^(?:\d|[12]\d|30)$/, "税率が正しくありません")
    .nullable(),
  unit: z.enum(UNITS, { error: "単位を選んでください" }),
});

// Returns the trimmed text value, or null when missing or empty.
function text(formData: FormData, key: string): string | null {
  const value = formData.get(key);
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

function parseSize(raw: string | null): number | null {
  if (raw === null) return null;
  const n = Number(raw.normalize("NFKC").replace(/[,\s]/g, ""));
  return Number.isFinite(n) && n > 0 && n <= 1_000_000 ? n : null;
}

const norm = (value: string | null | undefined) =>
  (value ?? "").normalize("NFKC").replace(/\s+/g, " ").trim().toLowerCase();

// Finds or creates the package entered in the "新規" panel.
async function resolveNewPackage(
  supabase: Supabase,
  formData: FormData
): Promise<{ packageId: string } | { error: string }> {
  const parsed = newPackageSchema.safeParse({
    product_id: text(formData, "np_product_id"),
    variation_id: text(formData, "np_variation_id"),
    name: text(formData, "np_name"),
    
    brand: text(formData, "np_brand"),
    other_name: text(formData, "np_other_name"),
    category: text(formData, "np_category"),
    memo: text(formData, "np_memo"),
    tax_rate: text(formData, "np_tax_rate"),
    unit: text(formData, "np_unit") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const barcodeResult = parseBarcodes(formData.getAll("np_barcode"));
  if (!barcodeResult.ok) return { error: barcodeResult.error };
  const barcodes = barcodeResult.codes;

  const size = parseSize(text(formData, "np_size"));
  if (size === null) return { error: "容量は0より大きい数値で入力してください" };

  const { name, brand, unit, other_name, category, memo, tax_rate } = parsed.data;
  const name_ja = name;
  const name_en: string | null = other_name;
  let productId = parsed.data.product_id;
  let variationId = parsed.data.variation_id;

  if (productId) {
    // Existing product: a variation is needed when the product has variations.
    const { data: variations, error } = await supabase
      .from("product_variations")
      .select("id")
      .eq("product_id", productId);
    if (error) {
      console.error("Variation fetch error:", error.message, error.code);
      return { error: SAVE_FAILED };
    }
    if ((variations ?? []).length === 0) {
      variationId = null;
    } else if (!variationId) {
      return { error: "バリエーションを選んでください" };
    }
  } else {
    if (!name_ja) {
      return { error: "商品名を入力してください" };
    }

    // Refuse an exact duplicate instead of merging products silently.
    const { data: existing, error: listError } = await supabase
      .from("products")
      .select("name_ja, name_en, brand")
      .limit(5000);
    if (listError) {
      console.error("Products fetch error:", listError.message, listError.code);
      return { error: SAVE_FAILED };
    }
    const duplicate = ((existing ?? []) as any[]).some(
      (p) =>
        norm(p.brand) === norm(brand) &&
        ((name_ja && norm(p.name_ja) === norm(name_ja)) ||
          false)
    );
    if (duplicate) {
      return {
        error: "同じ商品がすでに登録されています。上の「商品」から選んでください",
      };
    }

    const { data: created, error: productError } = await supabase
      .from("products")
      .insert({
        name_ja,
        name_en,
        brand,
        category,
        memo,
        tax_rate: tax_rate === null ? null : Number(tax_rate),
      })
      .select("id")
      .single();
    if (productError || !created) {
      console.error("Product insert error:", productError?.message, productError?.code);
      return { error: "商品を追加できませんでした" };
    }
    productId = created.id as string;
    if (barcodes.length > 0) {
      const { error: codeError } = await supabase
        .from("product_barcodes")
        .insert(barcodes.map((code) => ({ product_id: created.id, code })));
      if (codeError) {
        console.error("Barcode insert error:", codeError.message, codeError.code);
        // Do not keep a half-saved product.
        await supabase.from("products").delete().eq("id", created.id);
        return {
          error:
            codeError.code === "23505"
              ? "このバーコードはすでに登録されています"
              : SAVE_FAILED,
        };
      }
    }
    variationId = null;
  }

  // Reuse the exact same package when it already exists.
  let lookup = supabase
    .from("product_packages")
    .select("id")
    .eq("product_id", productId)
    .eq("package_size", size)
    .eq("package_unit", unit);
  lookup = variationId ? lookup.eq("variation_id", variationId) : lookup.is("variation_id", null);
  const { data: found } = await lookup.limit(1);
  if (found && found.length > 0) return { packageId: found[0].id as string };

  const { data: pkg, error: pkgError } = await supabase
    .from("product_packages")
    .insert({
      product_id: productId,
      variation_id: variationId,
      package_size: size,
      package_unit: unit,
    })
    .select("id")
    .single();
  if (pkgError || !pkg) {
    console.error("Package insert error:", pkgError?.message, pkgError?.code);
    return {
      error:
        pkgError?.code === "23503"
          ? "選んだバリエーションはこの商品のものではありません"
          : "容量を追加できませんでした",
    };
  }
  if (barcodes.length > 0) {
    const { error: linkError } = await supabase
      .from("product_barcodes")
      .update({ package_id: pkg.id })
      .in("code", barcodes);
    if (linkError) console.error("Barcode package link error:", linkError.message, linkError.code);
  }
  return { packageId: pkg.id as string };
}

// The price entry list offers 一個 (count 1) for a product or variation that has no 容量 yet.
// The list value is: default:<productId>:<variationId, or - when there are no variations>.
const DEFAULT_PACKAGE_PLACEHOLDER = "00000000-0000-0000-0000-000000000000";

function parseDefaultPackageRef(
  raw: string | null
): { productId: string; variationId: string | null } | null {
  if (!raw) return null;
  const match = /^default:([0-9a-f-]{36}):([0-9a-f-]{36}|-)$/i.exec(raw);
  if (!match) return null;
  const productId = z.string().uuid().safeParse(match[1]);
  if (!productId.success) return null;
  if (match[2] === "-") return { productId: productId.data, variationId: null };
  const variationId = z.string().uuid().safeParse(match[2]);
  return variationId.success
    ? { productId: productId.data, variationId: variationId.data }
    : null;
}

// Finds the 1個 容量 of the product (or variation), or creates it.
async function resolveDefaultPackage(
  supabase: Supabase,
  productId: string,
  variationId: string | null
): Promise<{ packageId: string } | { error: string }> {
  const { data: variations, error: variationError } = await supabase
    .from("product_variations")
    .select("id")
    .eq("product_id", productId);
  if (variationError) {
    console.error("Variation fetch error:", variationError.message, variationError.code);
    return { error: SAVE_FAILED };
  }
  const list = (variations ?? []) as { id: string }[];
  if (list.length > 0 && !variationId) return { error: "バリエーションを選んでください" };
  if (variationId && !list.some((v) => v.id === variationId)) {
    return { error: "選んだバリエーションはこの商品のものではありません" };
  }

  let lookup = supabase
    .from("product_packages")
    .select("id")
    .eq("product_id", productId)
    .eq("package_size", 1)
    .eq("package_unit", "count");
  lookup = variationId ? lookup.eq("variation_id", variationId) : lookup.is("variation_id", null);
  const { data: found } = await lookup.limit(1);
  if (found && found.length > 0) return { packageId: found[0].id as string };

  const { data: created, error } = await supabase
    .from("product_packages")
    .insert({
      product_id: productId,
      variation_id: variationId,
      package_size: 1,
      package_unit: "count",
    })
    .select("id")
    .single();
  if (error || !created) {
    console.error("Default package insert error:", error?.message, error?.code);
    return { error: "容量を追加できませんでした" };
  }
  return { packageId: created.id as string };
}

export async function addPriceObservation(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const isNewPackage = text(formData, "new_package") === "1";
  const defaultRef = parseDefaultPackageRef(text(formData, "product_package_id"));

  const parsed = baseSchema.safeParse({
    store_chain_id: text(formData, "store_chain_id") ?? "",
    shop_id: text(formData, "shop_id"),
    new_shop_name: text(formData, "new_shop_name"),
    notes: text(formData, "notes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let packageId: string | null = null;
  if (!isNewPackage) {
    const check = z
      .string()
      .uuid("商品・容量を選んでください")
      .safeParse(defaultRef ? DEFAULT_PACKAGE_PLACEHOLDER : (text(formData, "product_package_id") ?? ""));
    if (!check.success) return { error: check.error.issues[0].message };
    packageId = check.data;
  }

  const price = parsePriceYen(text(formData, "price") ?? "");
  if (price === null) return { error: "価格は1円以上で正しく入力してください" };
  const observedAt = toObservedAt(text(formData, "observed_at") ?? "");
  if (observedAt === null) return { error: "日時が正しくありません" };
  const taxRaw = text(formData, "tax_basis");
  const taxBasis = TAX_BASES.find((b) => b === taxRaw);
  if (!taxBasis) return { error: "税抜き・税込み・不明のどれかを選んでください" };

  const { store_chain_id, new_shop_name, notes } = parsed.data;
  let shopId = parsed.data.shop_id;
  const isSale = formData.get("is_sale") === "on";

  const supabase = await createSupabaseServerClient();

  // 一個: create the 1個 容量 for a product or variation that has none yet.
  if (defaultRef) {
    const resolvedDefault = await resolveDefaultPackage(
      supabase,
      defaultRef.productId,
      defaultRef.variationId
    );
    if ("error" in resolvedDefault) return { error: resolvedDefault.error };
    packageId = resolvedDefault.packageId;
  }

  // Read the chain's options on the server; never trust the browser for these.
  const { data: chainRow, error: chainError } = await supabase
    .from("store_chains")
    .select("member_discount_percent, has_bonus_points, bulk_enabled")
    .eq("id", store_chain_id)
    .single();
  if (chainError || !chainRow) {
    console.error("Chain fetch error:", chainError?.message, chainError?.code);
    return { error: "チェーンが見つかりません" };
  }

  const isMemberPrice =
    formData.get("is_member_price") === "on" && chainRow.member_discount_percent !== null;

  let bonusPoints: number | null = null;
  const rawPoints = text(formData, "bonus_points");
  if (chainRow.has_bonus_points && rawPoints !== null) {
    const asciiPoints = rawPoints.replace(/[０-９]/g, (d) =>
      String(d.charCodeAt(0) - 0xff10)
    );
    const n = Number(asciiPoints);
    if (!Number.isInteger(n) || n < 0 || n > 100000) {
      return { error: "ポイントは0以上の整数で入力してください" };
    }
    bonusPoints = n;
  }

  // Bulk discount tiers: rows of quantity and percent. The entered price is the regular price.
  let bulkTiers: BulkTier[] | null = null;
  if (formData.get("is_bulk_price") === "on" && chainRow.bulk_enabled === true) {
    const quantities = formData.getAll("bulk_quantity").map((v) => (typeof v === "string" ? v : ""));
    const percents = formData.getAll("bulk_percent").map((v) => (typeof v === "string" ? v : ""));
    const rows = quantities.map((quantity, i) => ({ quantity, percent: percents[i] ?? "" }));
    const parsedTiers = parseBulkTiers(rows);
    if (!parsedTiers.ok) return { error: parsedTiers.error };
    bulkTiers = parsedTiers.tiers;
  }

  // Find or create the product and package typed into the "新規" panel.
  if (isNewPackage) {
    const resolved = await resolveNewPackage(supabase, formData);
    if ("error" in resolved) return { error: resolved.error };
    packageId = resolved.packageId;
  }
  if (!packageId) return { error: "商品・容量を選んでください" };

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
    product_package_id: packageId,
    store_chain_id,
    shop_id: shopId,
    price,
    observed_at: observedAt,
    is_sale: isSale,
    is_member_price: isMemberPrice,
    tax_basis: taxBasis,
    bonus_points: bonusPoints,
    bulk_tiers: bulkTiers,

    notes,
  });

  if (error) {
    console.error("Price insert error:", error.message, error.code);
    return {
      error:
        error.code === "23503"
          ? "選んだ支店はこのチェーンのものではありません"
          : SAVE_FAILED,
    };
  }

  revalidatePath("/check", "layout");
  revalidatePath("/prices/new");
  revalidatePath("/products");
  return { error: null, message: "保存しました", packageId };
}