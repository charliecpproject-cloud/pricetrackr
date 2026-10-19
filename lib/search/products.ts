import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SearchScope } from "./scope";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

/** Ids of the products that match the search words, best match first. */
export async function searchProductIds(
  supabase: Supabase,
  term: string,
  limit = 50,
  scope: SearchScope = "all"
): Promise<string[]> {
  const { data, error } = await supabase.rpc("search_products", {
    p_query: term,
    p_limit: limit,
    p_scope: scope,
  });
  if (error) {
    console.error("Product search error:", error.message, error.code);
    return [];
  }
  return ((data ?? []) as { product_id: string }[]).map((row) => row.product_id);
}