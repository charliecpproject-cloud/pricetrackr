"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  priceEntrySchema,
  parsePriceYen,
  toObservedAt,
} from "@/lib/prices/schema";

/**
 * 価格観測データを追加するアクション
 *
 * @param _prevState 前回の状態（未使用）
 * @param formData   フォームから送信されたデータ
 * @returns エラー情報と成功メッセージ
 */
export async function addPriceObservation(
  _prevState: { error: string | null; message?: string | null },
  formData: FormData,
): Promise<{ error: string | null; message?: string | null }> {
  // ----- フィールド取得 -----
  const raw = {
    product_package_id: formData.get("product_package_id"),
    shop_id: formData.get("shop_id"),
    price: formData.get("price"),
    observed_at: formData.get("observed_at"),
    is_sale: formData.get("is_sale"),
    notes: formData.get("notes"),
  };

  // ----- is_sale のチェックボックス処理 -----
  const isSale = raw.is_sale === "on";

  // ----- Zod スキーマで基本項目を検証 -----
  const schemaResult = priceEntrySchema.safeParse({
    product_package_id: raw.product_package_id,
    shop_id: raw.shop_id,
    is_sale: isSale,
    notes: raw.notes,
  });

  if (!schemaResult.success) {
    const firstMsg = schemaResult.error.issues[0].message;
    return { error: firstMsg };
  }

  // ----- 価格のパース -----
  const price = parsePriceYen(String(raw.price ?? ""));
  if (price === null) {
    return { error: "価格が無効です。" };
  }

  // ----- 日付のパース -----
  const observedAt = toObservedAt(String(raw.observed_at ?? ""));
  if (observedAt === null) {
    return { error: "観測日時が無効です。" };
  }

  // ----- notes のトリムと null 化 -----
  let notes: string | null = null;
  if (typeof raw.notes === "string") {
    const trimmed = raw.notes.trim();
    notes = trimmed === "" ? null : trimmed;
  }

  // ----- Supabase へ挿入 -----
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from("price_observations").insert({
    product_package_id: schemaResult.data.product_package_id,
    shop_id: schemaResult.data.shop_id,
    price,
    observed_at: observedAt,
    is_sale: schemaResult.data.is_sale,
    notes, // トリム後、空なら null が入ります
  });

  if (error) {
    console.error("Supabase insert price observation error:", error);
    return { error: "データベースエラー: " + error.message };
  }

  // ----- 再検証 -----
  revalidatePath("/prices/new");
  return { error: null, message: "Saved" };
}
