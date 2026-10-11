import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatYen, formatJst, packageLabel } from "@/lib/prices/format";
import { z } from "zod";

/**
 * Server Component: 詳細ページ for a specific product package.
 * パラメータは Promise<{ packageId: string }> で渡されます。
 */
export default async function Page({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  // ----- 1. パラメータ取得 & バリデーション -----
  const { packageId } = await params;

  const uuidSchema = z.string().uuid();
  const validation = uuidSchema.safeParse(packageId);
  if (!validation.success) {
    // バリデーションエラーは 404 と同等に扱う
    notFound();
  }

  // ----- 2. Supabase クライアント作成 -----
  const supabase = await createSupabaseServerClient();

  // ----- 3. パッケージ情報取得 -----
  const { data: pkgData, error: pkgError } = await supabase
    .from("product_packages")
    .select(
      "id, package_size, package_unit, products (name_en, name_ja, brand)"
    )
    .eq("id", packageId)
    .single();

  if (pkgError) console.error("Package fetch error:", pkgError.message, pkgError.code);
  if (pkgError || !pkgData) {
    notFound();
  }

  // product は配列として返ってくるので、最初の要素を取得
  const product: any = [pkgData.products].flat()[0] ?? {};

  // ----- 4. 価格観測データ取得 (最新 20 件) -----
  const { data: observations, error: obsError } = await supabase
    .from("price_observations")
    .select(
      "price, observed_at, created_at, is_sale, notes, shops (name, store_chains (name))"
    )
    .eq("product_package_id", packageId)
    .order("observed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);

  // エラーはコンソールに出すだけでページは表示させる
  if (obsError) {
    console.error("Observations fetch error:", obsError);
  }

  // ----- 5. UI 描画 -----
  const productName = product.name_en || product.name_ja || "Unnamed";
  const brand = product.brand || "";

  const latestObs = observations?.[0];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* 戻るリンク */}
      <div className="mb-4">
        <Link href="/check" className="text-blue-600 hover:underline">
          ← Back to search
        </Link>
      </div>

      {/* 商品・パッケージ情報 */}
      <div className="border rounded p-4 mb-6">
        <h1 className="text-2xl font-bold">{productName}</h1>
        {brand && <p className="text-gray-600">{brand}</p>}
        <p className="mt-2 text-sm text-gray-700">
          {packageLabel(pkgData.package_size, pkgData.package_unit)}
        </p>
        {latestObs && (
          <p className="mt-4 text-3xl font-semibold">{formatYen(latestObs.price)}</p>
        )}
      </div>

      {/* 価格観測リスト */}
      <div>
        {(!observations || observations.length === 0) ? (
          <p className="text-gray-500">No prices yet</p>
        ) : (
          <ul className="space-y-4">
            {observations.map((obs: any, idx: number) => {
              const shopRow = [obs.shops].flat()[0];
              const shopChain = [shopRow?.store_chains].flat()[0]?.name ?? "";
              const shopBranch = shopRow?.name ?? "";
              const shopLabel = shopChain
                ? `${shopChain} — ${shopBranch}`
                : shopBranch;

              return (
                <li
                  key={idx}
                  className="border rounded p-3 hover:shadow-sm transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-500">
                        {formatJst(obs.observed_at)}
                      </p>
                      <p className="text-lg font-medium">{formatYen(obs.price)}</p>
                      {obs.notes && (
                        <p className="mt-1 text-sm text-gray-700">{obs.notes}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{shopLabel}</p>
                      {obs.is_sale && (
                        <span className="inline-block mt-1 bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded">
                          Sale
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
