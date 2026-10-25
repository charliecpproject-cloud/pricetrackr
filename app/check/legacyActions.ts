"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";

type State = { error: string | null; message?: string | null };

const NOT_ADMIN = "この操作は管理者のみ行えます";
const FAILED = "処理できませんでした。もう一度お試しください。";
const idSchema = z.string().uuid("容量が正しくありません");

function refresh() {
  revalidatePath("/check", "layout");
  revalidatePath("/products");
}

// Moves the price entries of one legacy 容量 to the matching 容量 of the new product.
export async function moveLegacyPackage(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };
  const id = idSchema.safeParse(formData.get("package_id"));
  if (!id.success) return { error: id.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("move_legacy_package", {
    p_package: id.data,
  });
  if (error) {
    console.error("Legacy move error:", error.message, error.code);
    return { error: FAILED };
  }

  const result = (data ?? {}) as { status?: string; moved?: number };
  switch (result.status) {
    case "ok":
      refresh();
      return {
        error: null,
        message: `新しい商品に移しました（価格の記録${result.moved ?? 0}件）`,
      };
    case "not_admin":
      return { error: NOT_ADMIN };
    case "not_legacy":
      return { error: "この容量は旧価格ではありません" };
    case "already_archived":
      return { error: "この容量はすでにアーカイブされています" };
    case "winner_hidden":
      return { error: "移し先の商品が非表示になっています" };
    case "winner_variation_hidden":
      return { error: "移し先のバリエーションが非表示になっています" };
    case "winner_package_hidden":
      return { error: "移し先の容量が非表示（削除済み）になっています" };
    case "not_found":
      return { error: "容量が見つかりませんでした" };
    default:
      return { error: FAILED };
  }
}

// Hides one legacy 容量. The price entries stay in the database.
export async function archiveLegacyPackage(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };
  const id = idSchema.safeParse(formData.get("package_id"));
  if (!id.success) return { error: id.error.issues[0].message };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("archive_legacy_package", {
    p_package: id.data,
  });
  if (error) {
    console.error("Legacy archive error:", error.message, error.code);
    return { error: FAILED };
  }

  const result = (data ?? {}) as { status?: string; archived?: number };
  switch (result.status) {
    case "ok":
      refresh();
      return {
        error: null,
        message: `アーカイブしました（価格の記録${result.archived ?? 0}件）`,
      };
    case "not_admin":
      return { error: NOT_ADMIN };
    case "not_legacy":
      return { error: "この容量は旧価格ではありません" };
    case "already_archived":
      return { error: "この容量はすでにアーカイブされています" };
    case "not_found":
      return { error: "容量が見つかりませんでした" };
    default:
      return { error: FAILED };
  }
}
