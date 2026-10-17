import { createSupabaseServerClient } from "@/lib/supabase/server";
import { packageLabel } from "@/lib/prices/format";
import { parseAttributes, variationLabel } from "@/lib/products/variation";
import PriceForm from "./PriceForm";
import { getViewer } from "@/lib/auth/viewer";
import { getChainUsage } from "@/lib/stores/usage";
import { arrangeChains } from "@/lib/stores/arrange";
import { parseCategory } from "@/lib/stores/category";

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
    .select("id, name, category, created_at, member_discount_percent, has_bonus_points")
    .order("name", { ascending: true });

  const { data: shops, error: shopsError } = await supabase
    .from("shops")
    .select("id, store_chain_id, name")
    .order("name", { ascending: true });

  if (productsError) console.error("Products fetch error:", productsError.message, productsError.code);
  if (chainsError) console.error("Chains fetch error:", chainsError.message, chainsError.code);
  if (shopsError) console.error("Shops fetch error:", shopsError.message, shopsError.code);

  const packages: { id: string; label: string; search: string }[] = [];
  const productOptions: {
    id: string;
    label: string;
    variations: { id: string; label: string }[];
  }[] = [];

  for (const product of (products ?? []) as any[]) {
    const productName = product.name_ja || product.name_en || "名称未設定";
    const title = `${productName}${product.brand ? `（${product.brand}）` : ""}`;
    const variations = ([product.product_variations].flat().filter(Boolean) as any[]).map(
      (v) => ({ id: v.id as string, label: variationLabel(parseAttributes(v.attributes)) })
    );

    productOptions.push({ id: product.id as string, label: title, variations });

    for (const pkg of ([product.product_packages].flat().filter(Boolean) as any[])) {
      const variation = variations.find((v) => v.id === pkg.variation_id);
      packages.push({
        id: pkg.id as string,
        label: [title, variation?.label, packageLabel(pkg.package_size, pkg.package_unit)]
          .filter(Boolean)
          .join(" — "),
        search: [product.name_ja, product.name_en, product.brand, variation?.label]
          .filter(Boolean)
          .join(" "),
      });
    }
  }

  const readOnly = !(await getViewer()).loggedIn;
  const usage = await getChainUsage(supabase, !readOnly);
  const { sorted, topIds } = arrangeChains(
    (chains ?? []).map((chain: any) => ({
      id: chain.id as string,
      name: chain.name as string,
      category: parseCategory(chain.category),
      entries: usage.get(chain.id) ?? 0,
      createdAt: chain.created_at as string,
      memberPercent: (chain.member_discount_percent ?? null) as number | null,
      hasBonusPoints: !!chain.has_bonus_points,
    }))
  );
  const topSet = new Set(topIds);
  const chainOptions = sorted.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    isTop: topSet.has(c.id),
    memberPercent: c.memberPercent,
    hasBonusPoints: c.hasBonusPoints,
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
      <PriceForm
        packages={packages}
        products={productOptions}
        chains={chainOptions}
        branches={branchOptions}
        readOnly={readOnly}
      />
    </div>
  );
}