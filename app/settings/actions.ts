"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function setDemoMode(
  _prevState: { error: string | null; message?: string | null },
  formData: FormData,
): Promise<{ error: string | null; message?: string | null }> {
  const value = formData.get("demo_mode");
  if (value !== "on" && value !== "off") {
    return { error: "不正な操作です" };
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  // The database only allows admins to update this row (RLS).
  const { data, error } = await supabase
    .from("app_settings")
    .update({ demo_mode: value === "on", updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("demo_mode");

  if (error || !data || data.length === 0) {
    return {
      error: "変更できませんでした。管理者アカウントでログインしてください",
    };
  }

  revalidatePath("/settings");
  return {
    error: null,
    message:
      value === "on"
        ? "デモモードをオンにしました"
        : "デモモードをオフにしました",
  };
}
