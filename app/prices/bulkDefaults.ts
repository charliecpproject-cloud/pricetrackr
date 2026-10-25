"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseStoredTiers, type BulkTier } from "@/lib/prices/bulk";

// The bulk tiers used last at this chain: first for the same product (any of its 容量),
// otherwise the latest bulk price at the chain.
// packageId is a real 容量 id, or "default:<productId>:..." for a product without a 容量.
export async function lookupBulkDefaults(
  chainId: string,
  packageId: string,
): Promise<BulkTier[] | null> {
  const chain = z.string().uuid().safeParse(chainId);
  if (!chain.success) return null;
  const chainUuid = chain.data;

  const supabase = await createSupabaseServerClient();

  async function latest(
    packageIds: string[] | null,
  ): Promise<BulkTier[] | null> {
    let query = supabase
      .from("price_observations")
      .select("bulk_tiers")
      .eq("store_chain_id", chainUuid)
      .not("bulk_tiers", "is", null)
      .order("observed_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);
    if (packageIds) query = query.in("product_package_id", packageIds);

    const { data, error } = await query;
    if (error) {
      console.error("Bulk defaults error:", error.message, error.code);
      return null;
    }
    const row = ((data ?? []) as { bulk_tiers: unknown }[])[0];
    const tiers = row ? parseStoredTiers(row.bulk_tiers) : [];
    return tiers.length > 0 ? tiers : null;
  }

  // Which product is this?
  let productId: string | null = null;
  const defaultMatch = /^default:([0-9a-f-]{36}):/i.exec(packageId);
  if (defaultMatch) {
    const parsed = z.string().uuid().safeParse(defaultMatch[1]);
    if (parsed.success) productId = parsed.data;
  } else {
    const pkg = z.string().uuid().safeParse(packageId);
    if (pkg.success) {
      const { data: pkgRow } = await supabase
        .from("product_packages")
        .select("product_id")
        .eq("id", pkg.data)
        .maybeSingle();
      productId = (pkgRow?.product_id as string | undefined) ?? null;
    }
  }

  if (productId) {
    const { data: siblings } = await supabase
      .from("product_packages")
      .select("id")
      .eq("product_id", productId);
    const ids = ((siblings ?? []) as { id: string }[]).map((s) => s.id);
    if (ids.length > 0) {
      const found = await latest(ids);
      if (found) return found;
    }
  }

  return latest(null);
}
