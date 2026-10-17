"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { THEMES } from "@/lib/themes/themes";

export async function setTheme(
  _prevState: { error: string | null; message?: string | null },
  formData: FormData
): Promise<{ error: string | null; message?: string | null }> {
  const theme = THEMES.find((t) => t.id === formData.get("theme"));
  if (!theme) return { error: "不正な選択です" };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // The database lets a user change only the theme column of their own row.
  const { data, error } = await supabase
    .from("profiles")
    .update({ theme: theme.id })
    .eq("id", user.id)
    .select("theme");

  if (error || !data || data.length === 0) {
    return { error: "テーマを変更できませんでした" };
  }

  revalidatePath("/", "layout");
  return { error: null, message: `テーマを「${theme.label}」に変更しました` };
}