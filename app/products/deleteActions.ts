"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type State = { error: string | null; message?: string | null };

const FAILED = "削除できませんでした。もう一度お試しください。";
const HAS_PRICES = "価格の記録があるため削除できません";

function refresh() {
  revalidatePath("/products");
  revalidatePath("/prices/new");
  revalidatePath("/check", "layout");
}

function readId(formData: FormData, key: string, message: string) {
  return z.string().uuid(message).safeParse(formData.get(key));
}

// Any user: only without price entries. Admin: also with price entries (archived).
export async function deletePackage(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const id = readId(formData, "package_id", "容量が正しくありません");
  if (!id.success) return { error: id.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("delete_package", {
    p_id: id.data,
  });
  if (error) {
    console.error("Package delete error:", error.message, error.code);
    return { error: FAILED };
  }
  if (data === "has_prices") return { error: HAS_PRICES };
  if (data === "not_found") return { error: "容量が見つかりませんでした" };
  if (data !== "ok" && data !== "archived") return { error: FAILED };

  refresh();
  return { error: null, message: "削除しました" };
}

// Same rule for a variation (and its packages).
export async function deleteVariation(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const id = readId(
    formData,
    "variation_id",
    "バリエーションが正しくありません",
  );
  if (!id.success) return { error: id.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("delete_variation", {
    p_variation_id: id.data,
  });
  if (error) {
    console.error("Variation delete error:", error.message, error.code);
    return { error: FAILED };
  }
  if (data === "has_prices") return { error: HAS_PRICES };
  if (data === "not_found")
    return { error: "バリエーションが見つかりませんでした" };
  if (data !== "ok" && data !== "archived") return { error: FAILED };

  refresh();
  return { error: null, message: "削除しました" };
}

// Admin only. The database function checks the role again.
export async function deleteProduct(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const id = readId(formData, "id", "商品が正しくありません");
  if (!id.success) return { error: id.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("delete_product", {
    p_id: id.data,
  });
  if (error) {
    console.error("Product delete error:", error.message, error.code);
    return { error: FAILED };
  }
  if (data === "not_admin") return { error: "この操作は管理者のみ行えます" };
  if (data === "not_found") return { error: "商品が見つかりませんでした" };
  if (data !== "ok") return { error: FAILED };

  refresh();
  return { error: null, message: "削除しました" };
}
