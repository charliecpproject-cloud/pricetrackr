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
import type { SearchAlias } from "@/lib/search/aliases";
import { loadCounterUnits } from "@/lib/prices/counterUnits";

export const metadata = { title: "価格入力" };

export default async function NewPricePage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; package?: string; chain?: string }>;
}) {
  const {
    product: productParam,
    package: packageParam,
    chain: chainParam,
  } = await searchParams;
  // A product chosen by a barcode scan (must be a valid id).
  const parsedProductId = z.string().uuid().safeParse(productParam);
  const focusProductId = parsedProductId.success ? parsedProductId.data : null;

  const supabase = await createSupabaseServerClient();

  // Everything the page needs is fetched at the same time. The chain usage needs to know
  // whether anyone is logged in, so it starts as soon as the login check is done.
  const viewerPromise = getViewer();
  const usagePromise = viewerPromise.then((v) =>
    getChainUsage(supabase, v.loggedIn),
  );
  const [
    productsResult,
    chainsResult,
    shopsResult,
    aliasesResult,
    viewer,
    counterUnits,
    recentResult,
    usage,
  ] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id, name_en, name_ja, brand, category, tax_rate, product_variations (id, attributes), product_packages (id, variation_id, package_size, package_unit), product_barcodes (code)",
      )
      .order("name_en", { ascending: true }),
    supabase
      .from("store_chains")
      .select(
        "id, name, category, created_at, member_discount_percent, has_bonus_points, bulk_enabled",
      )
      .order("name", { ascending: true }),
    supabase
      .from("shops")
      .select("id, store_chain_id, name")
      .order("name", { ascending: true }),
    supabase
      .from("search_aliases")
      .select("alias, canonical")
      .eq("enabled", true),
    viewerPromise,
    loadCounterUnits(supabase),
    supabase
      .from("price_observations")
      .select("product_package_id, store_chain_id")
      .order("created_at", { ascending: false })
      .limit(60),
    usagePromise,
  ]);

  const { data: products, error: productsError } = productsResult;
  const { data: chains, error: chainsError } = chainsResult;
  const { data: shops, error: shopsError } = shopsResult;
  const aliases = (aliasesResult.data ?? []) as SearchAlias[];

  // The 10 packages priced most recently (newest first), for the product picker.
  const recentIds: string[] = [];
  for (const row of (recentResult.data ?? []) as {
    product_package_id: string;
  }[]) {
    if (!recentIds.includes(row.product_package_id))
      recentIds.push(row.product_package_id);
    if (recentIds.length >= 10) break;
  }

  if (productsError)
    console.error(
      "Products fetch error:",
      productsError.message,
      productsError.code,
    );
  if (chainsError)
    console.error("Chains fetch error:", chainsError.message, chainsError.code);
  if (shopsError)
    console.error("Shops fetch error:", shopsError.message, shopsError.code);

  const packages: {
    id: string;
    productId: string;
    label: string;
    search: string;
    taxRate: number | null;
  }[] = [];
  const productOptions: {
    id: string;
    label: string;
    variations: { id: string; label: string }[];
  }[] = [];

  for (const product of (products ?? []) as any[]) {
    const productName = product.name_ja || product.name_en || "名称未設定";
    const title = `${productName}${product.brand ? `（${product.brand}）` : ""}`;
    const variations = (
      [product.product_variations].flat().filter(Boolean) as any[]
    ).map((v) => ({
      id: v.id as string,
      label: variationLabel(parseAttributes(v.attributes)),
    }));
    const productPackages = [product.product_packages]
      .flat()
      .filter(Boolean) as any[];
    const barcodeText = (
      [product.product_barcodes].flat().filter(Boolean) as any[]
    )
      .map((b) => b.code as string)
      .join(" ");

    const taxRate: number | null =
      product.tax_rate == null ? null : Number(product.tax_rate);
    productOptions.push({ id: product.id as string, label: title, variations });

    const searchText = (variationText?: string) =>
      [
        product.name_ja,
        product.name_en,
        product.brand,
        product.category,
        variationText,
        barcodeText,
      ]
        .filter(Boolean)
        .join(" ");

    for (const pkg of productPackages) {
      const variation = variations.find((v) => v.id === pkg.variation_id);
      packages.push({
        id: pkg.id as string,
        productId: product.id as string,
        label: [
          title,
          variation?.label,
          packageLabel(pkg.package_size, pkg.package_unit),
        ]
          .filter(Boolean)
          .join(" — "),
        search: searchText(variation?.label),
        taxRate,
      });
    }

    // 一個: a product (or a variation) without any 容量 can still get a price.
    // The 1個 容量 is created when the first price is saved.
    const withoutPackage =
      variations.length === 0
        ? productPackages.length === 0
          ? [
              {
                variationId: null as string | null,
                label: undefined as string | undefined,
              },
            ]
          : []
        : variations
            .filter(
              (v) => !productPackages.some((p) => p.variation_id === v.id),
            )
            .map((v) => ({
              variationId: v.id as string | null,
              label: v.label as string | undefined,
            }));

    for (const target of withoutPackage) {
      packages.push({
        id: `default:${product.id}:${target.variationId ?? "-"}`,
        productId: product.id as string,
        label: [title, target.label, packageLabel(1, "count")]
          .filter(Boolean)
          .join(" — "),
        search: searchText(target.label),
        taxRate,
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
  const wantedPackage = z.string().uuid().safeParse(packageParam);
  const wantedPackageId = wantedPackage.success ? wantedPackage.data : null;
  const initialPackageId =
    wantedPackageId && listedPackages.some((p) => p.id === wantedPackageId)
      ? wantedPackageId
      : focusProduct && listedPackages.length === 1
        ? listedPackages[0].id
        : "";
  const startNew = !!focusProduct && listedPackages.length === 0;

  const readOnly = !viewer.loggedIn;

  const { sorted, topIds } = arrangeChains(
    (chains ?? []).map((chain: any) => ({
      id: chain.id as string,
      name: chain.name as string,
      category: parseCategory(chain.category),
      entries: usage.get(chain.id) ?? 0,
      createdAt: chain.created_at as string,
      memberPercent: (chain.member_discount_percent ?? null) as number | null,
      hasBonusPoints: !!chain.has_bonus_points,
    })),
  );
  const topSet = new Set(topIds);
  const bulkById = new Map(
    ((chains ?? []) as any[]).map((c) => [c.id as string, !!c.bulk_enabled]),
  );
  const chainOptions = sorted.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    isTop: topSet.has(c.id),
    memberPercent: c.memberPercent,
    hasBonusPoints: c.hasBonusPoints,
    bulkEnabled: bulkById.get(c.id) ?? false,
  }));

  const wantedChain = z.string().uuid().safeParse(chainParam);
  const linkedChainId =
    wantedChain.success && chainOptions.some((c) => c.id === wantedChain.data)
      ? wantedChain.data
      : "";

  // Last-used chain: the chain of the newest price entry (logged-in users only).
  const lastRow = (
    (recentResult.data ?? []) as { store_chain_id: string | null }[]
  )[0];
  const lastChainId =
    !readOnly &&
    lastRow?.store_chain_id &&
    chainOptions.some((c) => c.id === lastRow.store_chain_id)
      ? lastRow.store_chain_id
      : "";
  // A chain in the link (?chain=) wins over the last-used chain.
  const initialChainId = linkedChainId || lastChainId;

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
            バーコードで選んだ商品：
            <span className="font-bold">{focusProduct.label}</span>
          </span>
          <Link href="/prices/new" className="shrink-0 font-medium underline">
            解除
          </Link>
        </div>
      )}

      <PriceForm
        key={`${focusProduct?.id ?? "all"}-${initialPackageId}-${initialChainId}`}
        packages={listedPackages}
        products={productOptions}
        chains={chainOptions}
        branches={branchOptions}
        readOnly={readOnly}
        aliases={aliases}
        recentIds={recentIds}
        initialChainId={initialChainId}
        initialPackageId={initialPackageId}
        startNew={startNew}
        defaultProductId={focusProduct?.id ?? ""}
        counterUnits={counterUnits}
      />
    </div>
  );
}
