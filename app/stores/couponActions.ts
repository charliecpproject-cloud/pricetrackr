"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const schema = z.object({
  chainId: z.string().uuid("チェーンが正しくありません"),
  percents: z.array(
    z.coerce
      .number()
      .int()
      .refine((n) => [5, 10, 15].includes(n), "クーポンの割合が正しくありません")
  ),
});

type State = { error: string | null; message: string | null };

export async function updateChainCoupons(
  _prevState: State,
  formData: FormData
): Promise<State> {
  const parsed = schema.safeParse({
    chainId: formData.get("chainId"),
    percents: formData.getAll("coupon_percents"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, message: null };
  }

  const percents = Array.from(new Set(parsed.data.percents)).sort((a, b) => a - b);

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("store_chains")
    .update({ coupon_percents: percents })
    .eq("id", parsed.data.chainId);

  if (error) {
    console.error("Coupon update error:", error.message, error.code);
    return { error: "保存できませんでした。もう一度お試しください。", message: null };
  }

  revalidatePath("/stores");
  revalidatePath("/check", "layout");
  return { error: null, message: "保存しました" };
}