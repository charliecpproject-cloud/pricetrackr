"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type State = { error: string | null; message?: string | null };

const schema = z.object({
  product_id: z.string().uuid("商品が正しくありません"),
  memo: z.string().trim().max(1000, "メモは1000文字以内で入力してください"),
});

const SAVE_FAILED = "保存できませんでした。もう一度お試しください。";

export async function updateProductMemo(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const parsed = schema.safeParse({
    product_id: formData.get("product_id") ?? "",
    memo: formData.get("memo") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .update({ memo: parsed.data.memo === "" ? null : parsed.data.memo })
      .eq("id", parsed.data.product_id)
      .select("id");

    if (error) {
      console.error("Memo update error:", error.message, error.code);
      return { error: SAVE_FAILED };
    }
    if (!data || data.length === 0) {
      return { error: "商品が見つかりませんでした" };
    }
  } catch (e) {
    console.error("Memo update failed:", e instanceof Error ? e.message : e);
    return { error: SAVE_FAILED };
  }

  revalidatePath("/products");
  revalidatePath("/check", "layout");
  return { error: null, message: "保存しました" };
}