import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SearchScope } from "./scope";
import { searchProductIds } from "./products";
import { similarSearchVariants } from "./variants";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type SimilarProduct = { id: string; name: string };

/** Product names that are close to a search that found nothing (see similarSearchVariants). */
export async function findSimilarProducts(
  supabase: Supabase,
  term: string,
  scope: SearchScope = "all",
  max = 5,
): Promise<SimilarProduct[]> {
  const variants = similarSearchVariants(term);
  if (variants.length === 0) return [];

  const results = await Promise.all(
    variants.map((variant) => searchProductIds(supabase, variant, 10, scope)),
  );
  // A product found by more of the tries, and higher in each result, ranks first.
  const score = new Map<string, number>();
  for (const ids of results) {
    ids.forEach((id, index) =>
      score.set(id, (score.get(id) ?? 0) + 100 - index),
    );
  }
  const ranked = Array.from(score.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, max * 2)
    .map(([id]) => id);
  if (ranked.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id, name_ja, name_en")
    .in("id", ranked);
  if (error) {
    console.error("Similar products error:", error.message, error.code);
    return [];
  }
  const byId = new Map(
    (
      (data ?? []) as {
        id: string;
        name_ja: string | null;
        name_en: string | null;
      }[]
    ).map((p) => [p.id, p.name_ja || p.name_en || ""]),
  );
  const out: SimilarProduct[] = [];
  for (const id of ranked) {
    const name = byId.get(id);
    if (!name || out.some((item) => item.name === name)) continue;
    out.push({ id, name });
    if (out.length >= max) break;
  }
  return out;
}
