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
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Products</h1>

      {/* 商品追加フォーム */}
      <ProductForm />

      {/* パッケージ追加フォーム */}
      <PackageForm products={productList} />

      {/* 商品一覧 */}
      <div className="mt-8 space-y-4">
        {productList.map((product) => (
          <Card
            key={product.id}
            className="border rounded-xl shadow-sm bg-white"
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-semibold">
                {product.name_ja || product.name_en || "Unnamed Product"}
              </CardTitle>
              <p className="text-sm text-gray-600">
                {product.brand ?? "No brand"} -{" "}
                {product.category ?? "No category"}
              </p>
            </CardHeader>
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
    </div>
  );
}
