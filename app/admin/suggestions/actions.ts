"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import {
  parseDisplayCount,
  parseSuggestionTerms,
} from "@/lib/search/suggestions";

type State = { error: string | null; message?: string | null };

const NOT_ADMIN = "この操作は管理者のみ行えます";
const FAILED = "保存できませんでした。もう一度お試しください。";

export async function saveSuggestions(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };

  const count = parseDisplayCount(String(formData.get("display_count") ?? ""));
  if (count === null) return { error: "表示する数は1〜10から選んでください" };

  const parsed = parseSuggestionTerms(String(formData.get("terms") ?? ""));
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("search_suggestions")
    .update({
      display_count: count,
      terms: parsed.terms,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true)
    .select("id");
  if (error || !data || data.length === 0) {
    console.error(
      "Search suggestions update error:",
      error?.message,
      error?.code,
    );
    return { error: error?.code === "42501" ? NOT_ADMIN : FAILED };
  }

  revalidatePath("/admin/suggestions");
  revalidatePath("/check");
  return {
    error: null,
    message:
      parsed.terms.length === 0 ? "おすすめを空にしました" : "保存しました",
  };
}
