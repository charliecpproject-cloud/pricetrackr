"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTaxBasis } from "@/lib/prices/tax";
import type { PreviousPrice, PreviousPrices } from "@/lib/prices/previous";

type Row = {
  price: number | string;
  observed_at: string;
  store_chain_id: string;
  tax_basis: unknown;
  store_chains: { name: string } | { name: string }[] | null;
};

// The newest price of a 容量, at any chain and (when a chain is chosen) at that chain.
// A "default:<productId>:..." id has no price yet, so it finds nothing.
export async function lookupPreviousPrices(
  packageId: string,
  chainId: string
): Promise<PreviousPrices> {
  const none: PreviousPrices = { latest: null, atChain: null };
  const pkg = z.string().uuid().safeParse(packageId);
  if (!pkg.success) return none;
  const packageUuid = pkg.data;
  const chain = z.string().uuid().safeParse(chainId);

  const supabase = await createSupabaseServerClient();

  async function newest(chainUuid: string | null): Promise<PreviousPrice | null> {
    let query = supabase
      .from("price_observations")
      .select("price, observed_at, store_chain_id, tax_basis, store_chains (name)")
      .eq("product_package_id", packageUuid)
      .order("observed_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1);
    if (chainUuid) query = query.eq("store_chain_id", chainUuid);

    const { data, error } = await query;
    if (error) {
      console.error("Previous price error:", error.message, error.code);
      return null;
    }
    const row = ((data ?? []) as unknown as Row[])[0];
    if (!row) return null;
    const price = Number(row.price);
    if (!Number.isFinite(price)) return null;
    return {
      price,
      observedAt: row.observed_at,
      chainId: row.store_chain_id,
      chainName: [row.store_chains].flat()[0]?.name ?? "",
      taxBasis: parseTaxBasis(row.tax_basis),
    };
  }

  const [latest, atChain] = await Promise.all([
    newest(null),
    chain.success ? newest(chain.data) : Promise.resolve(null),
  ]);
  return { latest, atChain };
}