import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductForm from "./ProductForm";
import PackageForm from "./PackageForm";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Package = {
  package_size: number;
  package_unit: string;
};

type Product = {
  id: string;
  name_ja: string | null;
  name_en: string | null;
  brand: string | null;
  category: string | null;
  product_packages: Package[] | null;
};

export default async function ProductsPage() {
  const supabase = await createSupabaseServerClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      "id, name_ja, name_en, brand, category, product_packages (package_size, package_unit)",
    )
    .order("name_ja", { ascending: true });

  if (error) {
    console.error("Failed to fetch products:", error);
  }

  const productList: Product[] = (products as any) ?? [];

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

        {/* 容量追加セクション */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">容量を追加</h2>
          <PackageForm products={productList} />
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

                  {/* パッケージバッジ */}
                  {product.product_packages &&
                    product.product_packages.length > 0 && (
                      <CardContent className="pt-2">
                        <div className="flex flex-wrap">
                          {product.product_packages.map((pkg, idx) => (
                            <Badge key={idx} className="mr-2 mb-2">
                              {pkg.package_size} {pkg.package_unit}
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
