import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  DEFAULT_DISPLAY_COUNT,
  MAX_DISPLAY_COUNT,
  visibleSuggestions,
} from "./suggestions";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type SuggestionSettings = { count: number; terms: string[] };

/** The saved settings; if they cannot be read, no terms and the default count. */
export async function loadSuggestionSettings(
  supabase: Supabase,
): Promise<SuggestionSettings> {
  const { data, error } = await supabase
    .from("search_suggestions")
    .select("display_count, terms")
    .eq("id", true)
    .maybeSingle();
  if (error || !data) {
    if (error)
      console.error(
        "Search suggestions fetch error:",
        error.message,
        error.code,
      );
    return { count: DEFAULT_DISPLAY_COUNT, terms: [] };
  }

  const terms = Array.isArray(data.terms)
    ? (data.terms as unknown[]).filter(
        (t): t is string => typeof t === "string" && t !== "",
      )
    : [];
  const count = Number(data.display_count);
  return {
    count:
      Number.isInteger(count) && count >= 1 && count <= MAX_DISPLAY_COUNT
        ? count
        : DEFAULT_DISPLAY_COUNT,
    terms,
  };
}

/** The suggestions to show on 価格確認. */
export async function loadVisibleSuggestions(
  supabase: Supabase,
): Promise<string[]> {
  const settings = await loadSuggestionSettings(supabase);
  return visibleSuggestions(settings.terms, settings.count);
}
