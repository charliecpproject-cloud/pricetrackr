"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";

type State = { error: string | null; message?: string | null };

const MAX_PER_WORD = 30;
const NOT_ADMIN = "この操作は管理者のみ行えます";
const FAILED = "保存できませんでした。もう一度お試しください。";

function refresh() {
  revalidatePath("/admin/aliases");
  revalidatePath("/prices/new");
}

const wordSchema = z
  .string()
  .trim()
  .min(1, "検索される言葉を入力してください")
  .max(50, "言葉は50文字以内で入力してください");

// Several aliases can be added at once, separated by commas or line breaks.
export async function addAliases(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };

  const word = wordSchema.safeParse(
    String(formData.get("canonical") ?? "").replace(/\s+/g, " "),
  );
  if (!word.success) return { error: word.error.issues[0].message };

  const typed = String(formData.get("aliases") ?? "")
    .split(/[,，、\n\r]+/)
    .map((s) => s.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const aliases: string[] = [];
  for (const a of typed) {
    if (a.length > 50)
      return {
        error: `別名は50文字以内で入力してください：${a.slice(0, 20)}…`,
      };
    if (a.toLowerCase() === word.data.toLowerCase()) continue;
    if (!aliases.some((x) => x.toLowerCase() === a.toLowerCase()))
      aliases.push(a);
  }
  if (aliases.length === 0) return { error: "別名を入力してください" };
  if (aliases.length > 20)
    return { error: "一度に追加できる別名は20個までです" };

  const supabase = await createSupabaseServerClient();
  const { data: existing, error: existingError } = await supabase
    .from("search_aliases")
    .select("alias")
    .eq("canonical", word.data);
  if (existingError) {
    console.error(
      "Alias fetch error:",
      existingError.message,
      existingError.code,
    );
    return { error: FAILED };
  }
  const have = new Set(
    ((existing ?? []) as { alias: string }[]).map((r) => r.alias.toLowerCase()),
  );
  const fresh = aliases.filter((a) => !have.has(a.toLowerCase()));
  if (fresh.length === 0)
    return { error: "入力した別名はすでに登録されています" };
  if (have.size + fresh.length > MAX_PER_WORD) {
    return { error: `ひとつの言葉につき別名は${MAX_PER_WORD}個までです` };
  }

  const { error } = await supabase
    .from("search_aliases")
    .insert(fresh.map((alias) => ({ canonical: word.data, alias })));
  if (error) {
    console.error("Alias insert error:", error.message, error.code);
    return { error: error.code === "42501" ? NOT_ADMIN : FAILED };
  }

  refresh();
  return { error: null, message: `別名を${fresh.length}件追加しました` };
}

export async function setAliasEnabled(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };
  const id = z
    .string()
    .uuid("別名が正しくありません")
    .safeParse(formData.get("id"));
  if (!id.success) return { error: id.error.issues[0].message };
  const enabled = formData.get("enabled") === "on";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("search_aliases")
    .update({ enabled })
    .eq("id", id.data)
    .select("id");
  if (error || !data || data.length === 0) {
    console.error("Alias update error:", error?.message, error?.code);
    return { error: FAILED };
  }

  refresh();
  return {
    error: null,
    message: enabled ? "別名を有効にしました" : "別名を無効にしました",
  };
}

export async function deleteAlias(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };
  const id = z
    .string()
    .uuid("別名が正しくありません")
    .safeParse(formData.get("id"));
  if (!id.success) return { error: id.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("search_aliases")
    .delete()
    .eq("id", id.data)
    .select("id");
  if (error || !data || data.length === 0) {
    console.error("Alias delete error:", error?.message, error?.code);
    return { error: "削除できませんでした。もう一度お試しください。" };
  }

  refresh();
  return { error: null, message: "削除しました" };
}
