"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import { searchProductIds } from "@/lib/search/products";
import { MAX_BARCODES_PER_PRODUCT } from "@/lib/products/barcode";
import type { MergePreview, MergeProduct } from "./types";

type State = { error: string | null; message?: string | null };

const NOT_ADMIN = "この操作は管理者のみ行えます";
const FAILED = "統合できませんでした。もう一度お試しください。";
const idSchema = z.string().uuid();

// Products matching the typed text (the same search as 価格確認), for the two pickers.
export async function searchMergeProducts(
  term: string,
): Promise<MergeProduct[]> {
  if (!(await getViewer()).isAdmin) return [];
  const text = typeof term === "string" ? term.trim().slice(0, 100) : "";
  if (text === "") return [];

  const supabase = await createSupabaseServerClient();
  const ids = (await searchProductIds(supabase, text, 20)) as string[];
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from("products")
    .select("id, name_ja, name_en, brand, category")
    .in("id", ids);
  if (error) {
    console.error("Merge product search error:", error.message, error.code);
    return [];
  }
  const byId = new Map(((data ?? []) as any[]).map((p) => [p.id as string, p]));
  return ids.flatMap((id) => {
    const p = byId.get(id);
    if (!p) return [];
    return [
      {
        id,
        name: (p.name_ja || p.name_en || "名称未設定") as string,
        brand: (p.brand as string | null) ?? null,
        category: (p.category as string | null) ?? null,
      },
    ];
  });
}

// What a merge would do (nothing is changed here).
export async function loadMergePreview(
  loserId: string,
  winnerId: string,
): Promise<MergePreview | null> {
  if (!(await getViewer()).isAdmin) return null;
  const loser = idSchema.safeParse(loserId);
  const winner = idSchema.safeParse(winnerId);
  if (!loser.success || !winner.success || loser.data === winner.data)
    return null;

  const supabase = await createSupabaseServerClient();

  const countBarcodes = async (productId: string): Promise<number | null> => {
    const { count, error } = await supabase
      .from("product_barcodes")
      .select("code", { count: "exact", head: true })
      .eq("product_id", productId);
    if (error) {
      console.error("Barcode count error:", error.message, error.code);
      return null;
    }
    return count ?? 0;
  };

  const [pkgResult, loserCodes, winnerCodes] = await Promise.all([
    supabase.from("product_packages").select("id").eq("product_id", loser.data),
    countBarcodes(loser.data),
    countBarcodes(winner.data),
  ]);
  if (pkgResult.error || loserCodes === null || winnerCodes === null) {
    if (pkgResult.error) {
      console.error(
        "Package fetch error:",
        pkgResult.error.message,
        pkgResult.error.code,
      );
    }
    return null;
  }

  const packageIds = ((pkgResult.data ?? []) as { id: string }[]).map(
    (p) => p.id,
  );
  let entries = 0;
  if (packageIds.length > 0) {
    const { count, error } = await supabase
      .from("price_observations")
      .select("id", { count: "exact", head: true })
      .in("product_package_id", packageIds);
    if (error) {
      console.error("Price count error:", error.message, error.code);
      return null;
    }
    entries = count ?? 0;
  }

  const moved = Math.min(
    loserCodes,
    Math.max(0, MAX_BARCODES_PER_PRODUCT - winnerCodes),
  );
  return {
    loserPackages: packageIds.length,
    loserEntries: entries,
    loserBarcodes: loserCodes,
    winnerBarcodes: winnerCodes,
    barcodesMoved: moved,
    barcodesStay: loserCodes - moved,
  };
}

export async function mergeProducts(
  _prev: State,
  formData: FormData,
): Promise<State> {
  if (!(await getViewer()).isAdmin) return { error: NOT_ADMIN };

  const loser = idSchema.safeParse(formData.get("loser_id"));
  const winner = idSchema.safeParse(formData.get("winner_id"));
  if (!loser.success) return { error: "なくす商品を選んでください" };
  if (!winner.success) return { error: "残す商品を選んでください" };
  if (loser.data === winner.data) return { error: "同じ商品は選べません" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("merge_products", {
    p_loser: loser.data,
    p_winner: winner.data,
  });
  if (error) {
    console.error("Product merge error:", error.message, error.code);
    return { error: FAILED };
  }

  const result = (data ?? {}) as {
    status?: string;
    barcodes_moved?: number;
    barcodes_left?: number;
  };
  switch (result.status) {
    case "ok":
      break;
    case "not_admin":
      return { error: NOT_ADMIN };
    case "same":
      return { error: "同じ商品は選べません" };
    case "loser_not_found":
      return { error: "なくす商品が見つかりませんでした" };
    case "winner_not_found":
      return { error: "残す商品が見つかりませんでした" };
    default:
      return { error: FAILED };
  }

  revalidatePath("/admin/merge");
  revalidatePath("/admin/brands");
  revalidatePath("/products");
  revalidatePath("/prices/new");
  revalidatePath("/check", "layout");

  const moved = result.barcodes_moved ?? 0;
  const left = result.barcodes_left ?? 0;
  return {
    error: null,
    message: `統合しました（バーコード${moved}件を移動${left > 0 ? `、${left}件は旧商品に残りました` : ""}）`,
  };
}
