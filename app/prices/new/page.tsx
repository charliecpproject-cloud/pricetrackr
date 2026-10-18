import Link from "next/link";
import { ScanLine } from "lucide-react";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { packageLabel } from "@/lib/prices/format";
import { parseAttributes, variationLabel } from "@/lib/products/variation";
import PriceForm from "./PriceForm";
import { getViewer } from "@/lib/auth/viewer";
import { getChainUsage } from "@/lib/stores/usage";
import { arrangeChains } from "@/lib/stores/arrange";
import { parseCategory } from "@/lib/stores/category";

export default async function NewPricePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string }>;
}) {
  const { product: productParam } = await searchParams;
  // A product chosen by a barcode scan (must be a valid id).
  const parsedProductId = z.string().uuid().safeParse(productParam);
  const focusProductId = parsedProductId.success ? parsedProductId.data : null;

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

  const packages: { id: string; productId: string; label: string; search: string }[] = [];
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
        productId: product.id as string,
        label: [title, variation?.label, packageLabel(pkg.package_size, pkg.package_unit)]
          .filter(Boolean)
          .join(" — "),
        search: [product.name_ja, product.name_en, product.brand, variation?.label]
          .filter(Boolean)
          .join(" "),
      });
    }
  }

  // Product chosen by a barcode scan: only its 容量 are listed.
  const focusProduct = focusProductId
    ? productOptions.find((p) => p.id === focusProductId)
    : undefined;
  const listedPackages = focusProduct
    ? packages.filter((p) => p.productId === focusProduct.id)
    : packages;
  const initialPackageId = focusProduct && listedPackages.length === 1 ? listedPackages[0].id : "";
  const startNew = !!focusProduct && listedPackages.length === 0;

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
        <Link
          href="/scan"
          className="mt-3 inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-panel px-3 text-sm font-medium text-stone-700 hover:bg-panel-soft"
        >
          <ScanLine className="h-4 w-4" />
          バーコードを読み取る
        </Link>
      </div>

      {focusProduct && (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-teal-50 px-3 py-2 text-sm text-teal-700">
          <span className="min-w-0">
            バーコードで選んだ商品：<span className="font-bold">{focusProduct.label}</span>
          </span>
          <Link href="/prices/new" className="shrink-0 font-medium underline">
            解除
          </Link>
        </div>
      )}

      <PriceForm
        key={focusProduct?.id ?? "all"}
        packages={listedPackages}
        products={productOptions}
        chains={chainOptions}
        branches={branchOptions}
        readOnly={readOnly}
        initialPackageId={initialPackageId}
        startNew={startNew}
        defaultProductId={focusProduct?.id ?? ""}
      />
    </div>
  );
}