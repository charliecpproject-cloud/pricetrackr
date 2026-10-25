"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";

type Result = { error: string | null };

// Adds or removes a favorite for the logged-in account. RLS makes sure only its own rows change.
export async function setFavorite(
  packageId: string,
  favorite: boolean,
): Promise<Result> {
  const id = z.string().uuid().safeParse(packageId);
  if (!id.success) return { error: "容量が正しくありません" };
  if (!(await getViewer()).loggedIn) return { error: "ログインしてください" };

  const supabase = await createSupabaseServerClient();

  if (favorite) {
    const { error } = await supabase
      .from("favorite_packages")
      .insert({ package_id: id.data });
    // 23505: already a favorite, which is what was asked for.
    if (error && error.code !== "23505") {
      console.error("Favorite insert error:", error.message, error.code);
      return { error: "お気に入りに追加できませんでした" };
    }
  } else {
    const { error } = await supabase
      .from("favorite_packages")
      .delete()
      .eq("package_id", id.data);
    if (error) {
      console.error("Favorite delete error:", error.message, error.code);
      return { error: "お気に入りを解除できませんでした" };
    }
  }

  revalidatePath("/check", "layout");
  return { error: null };
}
