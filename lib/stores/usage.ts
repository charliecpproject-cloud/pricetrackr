import type { createSupabaseServerClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function readUsage(supabase: Supabase) {
  return supabase
    .from("store_chain_usage")
    .select("store_chain_id, entries_last_month, updated_at");
}

/**
 * Entries per chain over the last month, from the lookup table.
 * When the table is empty or older than 7 days, it is recounted first.
 */
export async function getChainUsage(
  supabase: Supabase,
  canRefresh = true,
): Promise<Map<string, number>> {
  const first = await readUsage(supabase);
  if (first.error) {
    console.error("Usage fetch error:", first.error.message, first.error.code);
    return new Map();
  }

  let rows: any[] = first.data ?? [];
  const newest = Math.max(
    0,
    ...rows.map((r) => new Date(r.updated_at).getTime()),
  );

  if (canRefresh && (rows.length === 0 || Date.now() - newest > MAX_AGE_MS)) {
    const { error } = await supabase.rpc("refresh_store_chain_usage");
    if (error) {
      console.error("Usage refresh error:", error.message, error.code);
    } else {
      const again = await readUsage(supabase);
      if (!again.error) rows = again.data ?? [];
    }
  }

  return new Map(
    rows.map((r) => [
      r.store_chain_id as string,
      r.entries_last_month as number,
    ]),
  );
}
