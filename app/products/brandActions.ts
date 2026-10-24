"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { suggestBrands } from "@/lib/products/brand";
import { loadBrandContext } from "@/lib/products/loadBrands";
import type { CategoryCount } from "@/lib/products/category";

export async function suggestBrandNames(term: string): Promise<CategoryCount[]> {
  const text = typeof term === "string" ? term.slice(0, 100) : "";
  const supabase = await createSupabaseServerClient();
  const { brands, aliases } = await loadBrandContext(supabase);
  return suggestBrands(text, brands, aliases, 10);
}