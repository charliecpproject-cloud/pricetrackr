"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeBarcode } from "@/lib/products/barcode";

type LookupResult =
  | { status: "found"; productId: string; packageId: string | null }
  | { status: "not_found"; code: string }
  | { status: "invalid"; message: string };

// Looks a scanned (or typed) code up. Only the code text arrives here, never an image.
export async function lookupBarcode(raw: string): Promise<LookupResult> {
  const code = normalizeBarcode(typeof raw === "string" ? raw : "");
  if (!code) {
    return {
      status: "invalid",
      message: "バーコードとして読み取れませんでした。もう一度お試しください。",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("product_barcodes")
    .select("product_id, package_id")
    .eq("code", code)
    .limit(1);
  if (error) {
    console.error("Barcode lookup error:", error.message, error.code);
    return { status: "invalid", message: "検索できませんでした。もう一度お試しください。" };
  }

  if (data && data.length > 0) {
    return {
      status: "found",
      productId: data[0].product_id as string,
      packageId: (data[0].package_id as string | null) ?? null,
    };
  }
  return { status: "not_found", code };
}