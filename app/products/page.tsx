import { createSupabaseServerClient } from "@/lib/supabase/server";
import ProductForm from "./ProductForm";
import PackageForm from "./PackageForm";

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
      "id, name_ja, name_en, brand, category, product_packages (package_size, package_unit)"
    )
    .order("name_ja", { ascending: true });

  if (error) {
    console.error("Failed to fetch products:", error);
  }

  const productList: Product[] = (products as any) ?? [];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Products</h1>

      {/* 商品追加フォーム */}
      <ProductForm />

      {/* パッケージ追加フォーム */}
      <PackageForm products={productList} />

      {/* 商品一覧 */}
      <div className="mt-6 space-y-6">
        {productList.map((product) => (
          <div key={product.id} className="border-b pb-4">
            <h2 className="text-lg font-semibold">
              {product.name_ja || product.name_en || "Unnamed Product"}
            </h2>
            <p className="text-sm text-gray-600">
              {product.brand ?? "No brand"} - {product.category ?? "No category"}
            </p>

            {product.product_packages && product.product_packages.length > 0 && (
              <ul className="ml-4 list-disc text-sm mt-2">
                {product.product_packages.map((pkg, idx) => (
                  <li key={idx}>
                    {pkg.package_size} {pkg.package_unit}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
