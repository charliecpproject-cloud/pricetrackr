import type { createSupabaseServerClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export const LEGACY_BADGE_MONTHS = 6;

export type LegacySummaryRow = {
  product_id: string;
  open_packages: number;
  latest_at: string | null;
};

// Products whose open legacy prices include one newer than 6 months.
export function legacyBadgeIds(rows: LegacySummaryRow[], now: Date = new Date()): Set<string> {
  const since = new Date(now);
  since.setMonth(since.getMonth() - LEGACY_BADGE_MONTHS);
  const ids = new Set<string>();
  for (const r of rows) {
    if (!r.latest_at || r.open_packages <= 0) continue;
    const at = new Date(r.latest_at).getTime();
    if (!Number.isNaN(at) && at >= since.getTime()) ids.add(r.product_id);
  }
  return ids;
}

// One small database call for all products on the page (logged-in users only).
export async function loadLegacyBadgeIds(
  supabase: Supabase,
  productIds: string[]
): Promise<Set<string>> {
  if (productIds.length === 0) return new Set();
  const { data, error } = await supabase.rpc("legacy_summary", { p_product_ids: productIds });
  if (error) {
    console.error("Legacy summary error:", error.message, error.code);
    return new Set();
  }
  return legacyBadgeIds((data ?? []) as LegacySummaryRow[]);
}