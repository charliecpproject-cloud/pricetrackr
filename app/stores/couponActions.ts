"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Saves all of a chain's options: coupons, membership discount, bonus points.
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

  let memberPercent: number | null = null;
  if (formData.get("member_enabled") === "on") {
    const n = Number(formData.get("member_discount_percent"));
    if (!Number.isInteger(n) || n < 1 || n > 30) {
      return {
        error: "会員価格の割引率は1〜30の整数で入力してください",
        message: null,
      };
    }
    memberPercent = n;
  }

  const hasBonusPoints = formData.get("has_bonus_points") === "on";

  const pointUseEnabled = formData.get("point_use_enabled") === "on";
  let pointUseMultiplier: number | null = null;
  if (pointUseEnabled) {
    const m = Number(String(formData.get("point_use_multiplier") ?? "").normalize("NFKC").trim());
    if (!Number.isFinite(m) || m < 1 || m > 10) {
      return { error: "倍率は1〜10の数値で入力してください", message: null };
    }
    pointUseMultiplier = Math.round(m * 100) / 100;
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("store_chains")
    .update({
      coupon_percents: percents,
      member_discount_percent: memberPercent,
      has_bonus_points: hasBonusPoints,
      point_use_enabled: pointUseEnabled,
      bulk_enabled: formData.get("bulk_enabled") === "on",
      ...(pointUseMultiplier !== null ? { point_use_multiplier: pointUseMultiplier } : {}),
    })
    .eq("id", parsed.data.chainId);

  if (error) {
    console.error("Chain options update error:", error.message, error.code);
    return { error: "保存できませんでした。もう一度お試しください。", message: null };
  }

  revalidatePath("/stores");
  revalidatePath("/check", "layout");
  revalidatePath("/prices/new");
  return { error: null, message: "保存しました" };
}