"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  countCategories,
  suggestCategories,
  type CategoryCount,
} from "@/lib/products/category";

export async function suggestCategoryNames(
  term: string,
): Promise<CategoryCount[]> {
  const text = typeof term === "string" ? term.slice(0, 100) : "";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("category")
    .not("category", "is", null)
    .limit(5000);
  if (error) {
    console.error("Category fetch error:", error.message, error.code);
    return [];
  }
  const values = ((data ?? []) as { category: string | null }[]).map(
    (r) => r.category,
  );
  return suggestCategories(text, countCategories(values), 10);
}
