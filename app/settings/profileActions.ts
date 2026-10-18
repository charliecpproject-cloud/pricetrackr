"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type State = { error: string | null; message?: string | null };

const nameSchema = z.string().trim().max(30, "表示名は30文字以内で入力してください");

// An empty name clears it. Names do not need to be unique.
export async function setDisplayName(_prev: State, formData: FormData): Promise<State> {
  const raw = String(formData.get("display_name") ?? "").replace(/\s+/g, " ");
  const parsed = nameSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // The database lets a user change only the theme and display_name columns of their own row.
  const { data, error } = await supabase
    .from("profiles")
    .update({ display_name: parsed.data === "" ? null : parsed.data })
    .eq("id", user.id)
    .select("display_name");
  if (error || !data || data.length === 0) {
    console.error("Display name update error:", error?.message, error?.code);
    return { error: "保存できませんでした。もう一度お試しください。" };
  }

  revalidatePath("/", "layout");
  return {
    error: null,
    message: parsed.data === "" ? "表示名を削除しました" : "表示名を保存しました",
  };
}