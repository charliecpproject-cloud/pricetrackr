"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Defaults = { percent: number; quantity: number };

// The bulk percent and quantity used last at this chain: first for the same product
// (any of its 容量), otherwise the latest bulk price at the chain.
// packageId is a real 容量 id, or "default:<productId>:..." for a product without a 容量.
export async function lookupBulkDefaults(
  chainId: string,
  packageId: string
): Promise<Defaults | null> {
  const chain = z.string().uuid().safeParse(chainId);
  if (!chain.success) return null;
  const chainUuid = chain.data;

  const supabase = await createSupabaseServerClient();

  async function latest(packageIds: string[] | null): Promise<Defaults | null> {
    let query = supabase
      .from("price_observations")
      .select("bulk_percent, bulk_quantity")
      .eq("store_chain_id", chainUuid)
      .not("bulk_percent", "is", null)
      .order("observed_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);
    if (packageIds) query = query.in("product_package_id", packageIds);

    const { data, error } = await query;
    if (error) {
      console.error("Bulk defaults error:", error.message, error.code);
      return null;
    }
    const row = ((data ?? []) as { bulk_percent: number | null; bulk_quantity: number | null }[])[0];
    return row && row.bulk_percent != null && row.bulk_quantity != null
      ? { percent: row.bulk_percent, quantity: row.bulk_quantity }
      : null;
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