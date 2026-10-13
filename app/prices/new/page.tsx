import { createSupabaseServerClient } from "@/lib/supabase/server";
import { packageLabel } from "@/lib/prices/format";
import { parseAttributes, variationLabel } from "@/lib/products/variation";
import PriceForm from "./PriceForm";

export default async function NewPricePage() {
  const supabase = await createSupabaseServerClient();

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      "id, name_en, name_ja, brand, product_variations (id, attributes), product_packages (id, variation_id, package_size, package_unit)"
    )
    .order("name_en", { ascending: true });

  const { data: chains, error: chainsError } = await supabase
    .from("store_chains")
    .select("id, name, member_discount_percent, has_bonus_points")
    .order("name", { ascending: true });

  const { data: shops, error: shopsError } = await supabase
    .from("shops")
    .select("id, store_chain_id, name")
    .order("name", { ascending: true });

  if (productsError) console.error("Products fetch error:", productsError.message, productsError.code);
  if (chainsError) console.error("Chains fetch error:", chainsError.message, chainsError.code);
  if (shopsError) console.error("Shops fetch error:", shopsError.message, shopsError.code);

  const packages = (products ?? []).flatMap((product: any) => {
    const productName = product.name_ja || product.name_en || "名称未設定";
    const brand = product.brand ? `（${product.brand}）` : "";
    const baseSearch = [product.name_ja, product.name_en, product.brand].filter(Boolean).join(" ");

    const variations: readonly any[] = product.product_variations ?? [];
    const pkgs: readonly any[] = product.product_packages ?? [];

    return pkgs.map((pkg) => {
      // Find the variation that matches the package's variation_id (if any)
      const variation = variations.find((v) => v.id === pkg.variation_id);
      let variationText = "";
      let variationSearch = "";

      if (variation) {
        const attrs = parseAttributes(variation.attributes);
        variationText = variationLabel(attrs);
        // Add attribute values to the search string
        variationSearch = attrs.map((a) => a.value).join(" ");
      }

      // Build label: productName + brand [+ variation] + packageLabel
      const labelParts = [`${productName}${brand}`];
      if (variationText) {
        labelParts.push(variationText);
      }
      labelParts.push(packageLabel(pkg.package_size, pkg.package_unit));
      const label = labelParts.join(" — ");

      // Build search string: base product info + variation attribute values (if any)
      const search = [baseSearch, variationSearch].filter(Boolean).join(" ");

      return {
        id: pkg.id as string,
        label,
        search,
      };
    });
  });

  const chainOptions = (chains ?? []).map((chain: any) => ({
    id: chain.id as string,
    name: chain.name as string,
    memberPercent: (chain.member_discount_percent ?? null) as number | null,
    hasBonusPoints: !!chain.has_bonus_points,
  }));

  const branchOptions = (shops ?? []).map((shop: any) => ({
    id: shop.id as string,
    chainId: shop.store_chain_id as string,
    name: shop.name as string,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">価格入力</h1>
        <p className="mt-1 text-sm text-stone-500">店で見た価格を記録します</p>
      </div>
      <PriceForm packages={packages} chains={chainOptions} branches={branchOptions} />
    </div>
  );
}
