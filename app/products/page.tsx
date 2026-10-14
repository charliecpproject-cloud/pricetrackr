import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductForm from "./ProductForm";
import PackageForm from "./PackageForm";
import VariationForm from "./VariationForm";
import ProductMemoEditor from "./ProductMemoEditor";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  parseAttributes,
  variationLabel,
} from "@/lib/products/variation";

type Package = {
  id: string;
  variation_id?: string | null;
  package_size: number;
  package_unit: string;
};

type Variation = {
  id: string;
  attributes: unknown;
};

type Product = {
  id: string;
  name_ja: string | null;
  name_en: string | null;
  brand: string | null;
  category: string | null;
  memo: string | null;
  product_variations: Variation[] | null;
  product_packages: Package[] | null;
};

/** パッケージを「サイズ 単位」の文字列に変換 */
const packageLabel = (pkg: { package_size: number; package_unit: string }) =>
  `${pkg.package_size} ${pkg.package_unit}`;

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name_ja, name_en, brand, category, memo, product_variations (id, attributes), product_packages (id, variation_id, package_size, package_unit)",
    )
    .order("name_ja", { ascending: true });

  if (error) {
    console.error("Failed to fetch products:", error);
  }

  const productList: Product[] = (products as any) ?? [];

  /** Variation の一覧（PackageForm 用） */
  const variationList = productList.flatMap((p) =>
    (p.product_variations ?? []).map((v) => ({
      id: v.id,
      productId: p.id,
      label: variationLabel(parseAttributes(v.attributes)),
    }))
  );

  /** 商品一覧（VariationForm 用） */
  const productOptions = productList.map((p) => ({
    id: p.id,
    label: p.name_ja || p.name_en || "商品名なし",
  }));

  /** 全バリエーションで使用されている属性名の集合 */
  const attributeNameSet = new Set<string>();
  productList.forEach((p) => {
    (p.product_variations ?? []).forEach((v) => {
      const attrs = parseAttributes(v.attributes);
      attrs.forEach((a) => attributeNameSet.add(a.name));
    });
  });
  const attributeNames = Array.from(attributeNameSet).sort();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-xl mx-auto px-4 py-6">
        {/* ページ見出し */}
        <h1 className="text-2xl font-bold mb-6">商品</h1>

        {/* 商品追加セクション */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">商品を追加</h2>
          <ProductForm />
        </section>

        {/* バリエーション追加セクション */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">バリエーションを追加</h2>
          <VariationForm
            products={productOptions}
            attributeNames={attributeNames}
          />
        </section>

        {/* 容量追加セクション */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">容量を追加</h2>
          <PackageForm products={productList} variations={variationList} />
        </section>

        {/* 商品一覧 */}
        <section>
          {productList.length === 0 ? (
            <p className="text-center text-gray-500">まだ商品がありません。</p>
          ) : (
            <div className="space-y-4">
              {productList.map((product) => (
                <Card
                  key={product.id}
                  className="border rounded-2xl shadow-sm bg-white"
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-semibold">
                      {/* 商品名（日本語が優先、英語はサブテキスト） */}
                      <div>
                        {product.name_ja ||
                          product.name_en ||
                          "商品名なし"}
                      </div>
                      {product.name_ja && product.name_en && (
                        <p className="text-sm text-gray-500">
                          {product.name_en}
                        </p>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {product.brand ?? "ブランドなし"} -{" "}
                      {product.category ?? "カテゴリなし"}
                    </p>
                  </CardHeader>

                  {/* メモ表示とエディタ */}
                  {product.memo && (
                    <CardContent className="pt-2">
                      <p className="text-sm text-gray-500 whitespace-pre-wrap">
                        {product.memo}
                      </p>
                    </CardContent>
                  )}
                  <CardContent className="pt-2">
                    <ProductMemoEditor
                      productId={product.id}
                      memo={product.memo ?? null}
                    />
                  </CardContent>

                  {/* バリエーションとそのパッケージ */}
                  {product.product_variations &&
                    product.product_variations.length > 0 && (
                      <CardContent className="pt-2">
                        <div className="space-y-2">
                          {product.product_variations.map((variation) => {
                            const attrs = parseAttributes(
                              variation.attributes
                            );
                            const label = variationLabel(attrs);
                            const packagesForVariation =
                              product.product_packages?.filter(
                                (pkg) => pkg.variation_id === variation.id
                              ) ?? [];

                            return (
                              <div key={variation.id} className="space-y-1">
                                <p className="font-medium">{label}</p>
                                {packagesForVariation.length > 0 && (
                                  <div className="flex flex-wrap">
                                    {packagesForVariation.map((pkg) => (
                                      <Badge
                                        key={pkg.id}
                                        className="mr-2 mb-2"
                                      >
                                        {packageLabel(pkg)}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </CardContent>
                    )}

                  {/* バリエーションなしパッケージ */}
                  {product.product_packages &&
                    product.product_packages.some(
                      (pkg) => !pkg.variation_id
                    ) && (
                      <CardContent className="pt-2">
                        <p className="font-medium mb-1">バリエーションなし</p>
                        <div className="flex flex-wrap">
                          {product.product_packages
                            .filter((pkg) => !pkg.variation_id)
                            .map((pkg) => (
                              <Badge
                                key={pkg.id}
                                className="mr-2 mb-2"
                              >
                                {packageLabel(pkg)}
                              </Badge>
                            ))}
                        </div>
                      </CardContent>
                    )}
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
