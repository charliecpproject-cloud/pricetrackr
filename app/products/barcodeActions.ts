"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { MAX_BARCODES_PER_PRODUCT, parseBarcodes } from "@/lib/products/barcode";
import { BARCODE_TAKEN_HIDDEN, takenBarcodeMessage } from "@/lib/products/barcodeDb";

type State = { error: string | null; message?: string | null };

const FAILED = "保存できませんでした。もう一度お試しください。";

export async function addBarcode(_prev: State, formData: FormData): Promise<State> {
  const productId = z
    .string()
    .uuid("商品が正しくありません")
    .safeParse(formData.get("product_id"));
  if (!productId.success) return { error: productId.error.issues[0].message };

  const parsed = parseBarcodes([formData.get("code")]);
  if (!parsed.ok) return { error: parsed.error };
  if (parsed.codes.length === 0) return { error: "バーコードを入力してください" };

  const supabase = await createSupabaseServerClient();

  const { count, error: countError } = await supabase
    .from("product_barcodes")
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId.data);
  if (countError) {
    console.error("Barcode count error:", countError.message, countError.code);
    return { error: FAILED };
  }
  if ((count ?? 0) >= MAX_BARCODES_PER_PRODUCT) {
    return { error: `バーコードは${MAX_BARCODES_PER_PRODUCT}個までです` };
  }

  const taken = await takenBarcodeMessage(supabase, parsed.codes);
  if (taken) return { error: taken };

  const { error } = await supabase
    .from("product_barcodes")
    .insert({ product_id: productId.data, code: parsed.codes[0] });
  if (error) {
    if (error.code === "23505") return { error: BARCODE_TAKEN_HIDDEN };
    if (error.code === "23503") return { error: "商品が見つかりませんでした" };
    console.error("Barcode insert error:", error.message, error.code);
    return { error: FAILED };
  }

  revalidatePath("/products");
  return { error: null, message: "追加しました" };
}

export async function deleteBarcode(_prev: State, formData: FormData): Promise<State> {
  const id = z
    .string()
    .uuid("バーコードが正しくありません")
    .safeParse(formData.get("barcode_id"));
  if (!id.success) return { error: id.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_barcodes")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error) {
    console.error("Barcode delete error:", error.message, error.code);
    return { error: "削除できませんでした。もう一度お試しください。" };
  }
  if (!data || data.length === 0) return { error: "バーコードが見つかりませんでした" };

  revalidatePath("/products");
  return { error: null, message: "削除しました" };
}