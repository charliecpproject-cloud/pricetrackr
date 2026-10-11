import { createSupabaseServerClient } from "@/lib/supabase/server";
import PriceForm from "./PriceForm";

export default async function PricesNewPage() {
  const supabase = await createSupabaseServerClient();

  // ----- 商品とパッケージ情報を取得 -----
  const { data: products, error: prodError } = await supabase
    .from("products")
    .select(`
      id,
      name_en,
      name_ja,
      brand,
      product_packages (
        id,
        package_size,
        package_unit
      )
    `);

  // ----- 店舗情報を取得（チェーン名も含む） -----
  const { data: shops, error: shopError } = await supabase
    .from("shops")
    .select(`
      id,
      name,
      store_chain:store_chains (
        name
      )
    `);

  if (prodError) {
    console.error("Failed to load products:", prodError);
    throw prodError;
  }
  if (shopError) {
    console.error("Failed to load shops:", shopError);
    throw shopError;
  }

  // ----- パッケージ選択肢の作成 -----
  const packages = (products ?? []).flatMap((product) => {
    const baseName = product.name_en || product.name_ja || "";
    const brandPart = product.brand ? ` (${product.brand})` : "";
    return (product.product_packages ?? []).map((pkg) => ({
      id: pkg.id,
      label: `${baseName}${brandPart} — ${pkg.package_size} ${pkg.package_unit}`,
    }));
  });

  // ----- 店舗選択肢の作成 -----
  const shopOptions = (shops ?? []).map((shop) => ({
    id: shop.id,
    label: `${shop.store_chain?.name ?? ""} — ${shop.name}`,
  }));

  return <PriceForm packages={packages} shops={shopOptions} />;
}
