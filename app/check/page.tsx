import React from "react";
import Link from "next/link";
import { createSupabaseServerClient } from "../../lib/supabase/server";
import {
  formatYen,
  formatJst,
  packageLabel,
} from "../../lib/prices/format";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type SearchParams = Promise<{
  q?: string;
}>;

export default async function Page({ searchParams }: { searchParams: SearchParams }) {
  // ----- 1. 取得・サニタイズ検索クエリ -----
  const { q: rawQ = "" } = await searchParams;
  const sanitizedQ = rawQ
    .trim()
    .slice(0, 50)
    .replace(/[,\(\)%_\*\\]/g, "");

  // ----- 2. Supabase クライアント作成 -----
  const supabase = await createSupabaseServerClient();

  // ----- 3. 商品とパッケージ取得 -----
  let productQuery = supabase
    .from("products")
    .select(
      "id, name_en, name_ja, brand, product_packages(id, package_size, package_unit)"
    );

  if (sanitizedQ) {
    const orFilter = `name_en.ilike.%${sanitizedQ}%,name_ja.ilike.%${sanitizedQ}%,brand.ilike.%${sanitizedQ}%`;
    productQuery = productQuery.or(orFilter);
  }

  const { data: products, error: productError } = await productQuery
    .order("name_en", { ascending: true })
    .limit(20);

  if (productError) {
    console.error("Product fetch error:", productError);
    return <div className="p-4 text-red-600">エラーが発生しました。</div>;
  }

  // ----- 4. パッケージ ID を抽出 -----
  const packageIds: number[] = (products ?? [])
    .flatMap((p) => (p.product_packages ?? []).map((pp: any) => pp.id));

  // ----- 5. 価格観測データ取得 -----
  let observationsMap = new Map<number, any>();

  if (packageIds.length > 0) {
    const { data: observations, error: obsError } = await supabase
      .from("price_observations")
      .select(
        "product_package_id, price, observed_at, created_at, is_sale, shops ( name, store_chains ( name ) )"
      )
      .in("product_package_id", packageIds)
      .order("observed_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(300);

    if (obsError) {
      console.error(
        "Observations fetch error:",
        obsError.message,
        obsError.code,
        obsError.details,
        obsError.hint
      );
    } else if (observations) {
      // 最新の1件だけをパッケージごとに保持
      for (const obs of observations) {
        const pid = obs.product_package_id;
        if (!observationsMap.has(pid)) {
          observationsMap.set(pid, obs);
        }
      }
    }
  }

  // ----- 6. UI 描画 -----
  return (
    <div className="p-4 max-w-xl mx-auto">
      {/* 検索フォーム */}
      <form method="GET" className="mb-6 flex items-center gap-2">
        <Label htmlFor="q" className="font-medium">
          Search product
        </Label>
        <Input
          type="text"
          name="q"
          id="q"
          defaultValue={sanitizedQ}
          className="flex-1 h-12"
        />
        <Button type="submit" className="h-12">
          Search
        </Button>
      </form>

      {/* 結果表示 */}
      {(!products || products.length === 0) && (
        <div className="text-gray-600">No results</div>
      )}

      <div className="grid gap-4">
        {products?.map((product: any) => {
          const productName = product.name_en || product.name_ja || "Unnamed";
          return product.product_packages?.map((pkg: any) => {
            const latest = observationsMap.get(pkg.id);
            const shopInfo = latest
              ? `${latest.shops?.store_chains?.name ?? ""} — ${latest.shops?.name ?? ""}`
              : "";

            return (
              <Link key={pkg.id} href={`/check/${pkg.id}`} className="block">
                <Card className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4">
                    <div>
                      <h2 className="text-lg font-semibold">{productName}</h2>
                      <p className="text-sm text-gray-500">{product.brand}</p>
                      <p className="mt-2 text-sm text-gray-700">
                        {packageLabel(pkg.package_size, pkg.package_unit)}
                      </p>
                    </div>
                    <div className="text-right mt-4 sm:mt-0">
                      {latest ? (
                        <>
                          <p className="text-3xl font-bold tabular-nums">{formatYen(latest.price)}</p>
                          <p className="text-sm text-gray-600">{shopInfo}</p>
                          <p className="text-xs text-gray-500">{formatJst(latest.observed_at)}</p>
                          {latest.is_sale && (
                            <Badge className="mt-1 bg-red-200 text-red-800 text-xs px-2 py-0.5 rounded">
                              Sale
                            </Badge>
                          )}
                        </>
                      ) : (
                        <p className="text-gray-500">No prices yet</p>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent />
                </Card>
              </Link>
            );
          });
        })}
      </div>
    </div>
  );
}
