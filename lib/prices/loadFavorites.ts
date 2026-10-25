import { createSupabaseServerClient } from "@/lib/supabase/server";
import { favoriteGroupKey } from "./favorites";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type FavoriteSets = {
  ids: Set<string>; // favorite package ids
  groups: Set<string>; // product + variation of every favorite (see favoriteGroupKey)
};

/** The logged-in account's favorites (RLS returns only its own, visible rows). */
export async function loadFavorites(supabase: Supabase): Promise<FavoriteSets> {
  const ids = new Set<string>();
  const groups = new Set<string>();

  const { data, error } = await supabase
    .from("favorite_packages")
    .select("package_id, product_packages (product_id, variation_id)")
    .limit(1000);
  if (error) {
    console.error("Favorites fetch error:", error.message, error.code);
    return { ids, groups };
  }

  for (const row of (data ?? []) as {
    package_id: string;
    product_packages: unknown;
  }[]) {
    ids.add(row.package_id);
    const pkg = [row.product_packages].flat()[0] as
      { product_id?: string; variation_id?: string | null } | undefined;
    if (pkg?.product_id)
      groups.add(favoriteGroupKey(pkg.product_id, pkg.variation_id));
  }
  return { ids, groups };
}
