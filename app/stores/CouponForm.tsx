import { createSupabaseServerClient } from "@/lib/supabase/server";
import ChainOptionsForm from "./ChainOptionsForm";

type Options = {
  coupon_percents?: number[] | null;
  member_discount_percent?: number | null;
  has_bonus_points?: boolean | null;
} | null;

// Loads one chain's options and shows the settings form.
// `current` is still passed by the stores page but is no longer needed.
export default async function CouponForm({
  chainId,
}: {
  chainId: string;
  current?: number[];
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("store_chains")
    .select("coupon_percents, member_discount_percent, has_bonus_points")
    .eq("id", chainId)
    .single();
  if (error) {
    console.error("Chain options fetch error:", error.message, error.code);
  }

  const options = data as Options;

  return (
    <ChainOptionsForm
      key={JSON.stringify(options ?? {})}
      chainId={chainId}
      couponPercents={options?.coupon_percents ?? []}
      memberPercent={options?.member_discount_percent ?? null}
      hasBonusPoints={options?.has_bonus_points ?? false}
    />
  );
}