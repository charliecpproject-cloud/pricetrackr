import { createSupabaseServerClient } from "@/lib/supabase/server";
import { packageLabel } from "@/lib/prices/format";
import PriceForm from "./PriceForm"; 

export default async function NewPricePage() {
  const supabase = await createSupabaseServerClient();

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      "id, name_en, name_ja, brand, product_packages (id, package_size, package_unit)"
    )
    .order("name_en", { ascending: true });

  const { data: shops, error: shopsError } = await supabase
    .from("shops")
    .select("id, name, store_chains (name)")
    .order("name", { ascending: true });

  if (productsError) {
    console.error("Products fetch error:", productsError.message, productsError.code);
  }
  if (shopsError) {
    console.error("Shops fetch error:", shopsError.message, shopsError.code);
  }

  const packages = (products ?? []).flatMap((product: any) => {
    const productName = product.name_ja || product.name_en || "名称未設定";
    const brand = product.brand ? `（${product.brand}）` : "";
    const search = [product.name_ja, product.name_en, product.brand]
      .filter(Boolean)
      .join(" ");
    const pkgs = [product.product_packages].flat().filter(Boolean) as any[];
    return pkgs.map((pkg) => ({
      id: pkg.id as string,
      label: `${productName}${brand} — ${packageLabel(pkg.package_size, pkg.package_unit)}`,
      search,
    }));
  });

  const shopOptions = (shops ?? []).map((shop: any) => {
    const chain = [shop.store_chains].flat()[0];
    return {
      id: shop.id as string,
      label: `${chain?.name ?? ""} — ${shop.name}`,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">価格入力</h1>
        <p className="mt-1 text-sm text-stone-500">店で見た価格を記録します</p>
      </div>
      <PriceForm packages={packages} shops={shopOptions} />
    </div>
  );
}