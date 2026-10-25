import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { countCategories, type CategoryCount } from "@/lib/products/category";
import { resolveBrand, type BrandAlias } from "@/lib/products/brand";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// Every brand in use (with the number of products) and every brand alias.
export async function loadBrandContext(
  supabase: Supabase,
): Promise<{ brands: CategoryCount[]; aliases: BrandAlias[] }> {
  const [productsResult, aliasesResult] = await Promise.all([
    supabase
      .from("products")
      .select("brand")
      .not("brand", "is", null)
      .limit(5000),
    supabase.from("brand_aliases").select("brand, alias").limit(2000),
  ]);
  if (productsResult.error) {
    console.error(
      "Brand fetch error:",
      productsResult.error.message,
      productsResult.error.code,
    );
  }
  if (aliasesResult.error) {
    console.error(
      "Brand alias fetch error:",
      aliasesResult.error.message,
      aliasesResult.error.code,
    );
  }
  const brands = countCategories(
    ((productsResult.data ?? []) as { brand: string | null }[]).map(
      (r) => r.brand,
    ),
  );
  const aliases = (aliasesResult.data ?? []) as BrandAlias[];
  return { brands, aliases };
}

// The brand text to save: an alias becomes its brand, another spelling of a known brand
// becomes the known spelling. An empty input stays empty (no database call).
export async function resolveBrandText(
  supabase: Supabase,
  input: string | null,
): Promise<string> {
  const text = (input ?? "").trim();
  if (text === "") return "";
  const { brands, aliases } = await loadBrandContext(supabase);
  return resolveBrand(text, brands, aliases);
}
