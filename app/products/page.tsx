import Link from "next/link";
import { Search } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { packageLabel } from "@/lib/prices/format";
import { parseAttributes, variationLabel } from "@/lib/products/variation";
import ProductForm from "./ProductForm";
import ProductMemoEditor from "./ProductMemoEditor";
import ProductCardTools from "./ProductCardTools";
import { ProductDialogsProvider } from "./ProductDialogs";
import ReadOnlyFieldset from "@/components/ReadOnlyFieldset";
import { getViewer } from "@/lib/auth/viewer";
import { normalizeBarcode } from "@/lib/products/barcode";
import { searchProductIds } from "@/lib/search/products";
import { findSimilarProducts } from "@/lib/search/similar";
import SearchEmptyHelp from "@/components/SearchEmptyHelp";
import { loadCounterUnits } from "@/lib/prices/counterUnits";
import type { CounterUnitOption } from "@/lib/prices/unitWords";

const PAGE_SIZE = 20; // search results
const ALL_LIMIT = 300; // すべての商品

const PRODUCT_SELECT =
  "id, name_ja, name_en, brand, category, memo, tax_rate, product_variations (id, attributes), product_packages (id, variation_id, package_size, package_unit), product_barcodes (code, package_id)";

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
  tax_rate?: number | null;
  product_variations: Variation[] | null;
  product_packages: Package[] | null;
  product_barcodes?: { code: string; package_id: string | null }[] | null;
};

const chipCls =
  "rounded-full bg-chip px-2.5 py-1 text-sm font-medium text-stone-700";
const sectionCls = "rounded-2xl border border-line bg-panel p-4";
const summaryCls = "cursor-pointer text-base font-semibold text-stone-900";
const linkBtnCls =
  "flex h-12 items-center justify-center rounded-xl border border-line bg-panel text-base font-medium text-stone-700 hover:bg-panel-soft";

export const metadata = { title: "商品" };

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; all?: string; barcode?: string }>;
}) {
  const { q, all, barcode } = await searchParams;
  // A barcode that was scanned but not found: the add form opens with it filled in.
  const newBarcode = normalizeBarcode(barcode ?? "") ?? "";
  // Keep the search term short and free of characters that break the filter.
  const term = (q ?? "").trim().slice(0, 50).replace(/[,()%_*\\]/g, "");
  const showAll = all === "1" && !term;
  // The default view shows only the add section; a list appears for a search or すべての商品.
  const showList = term !== "" || showAll;

  const supabase = await createSupabaseServerClient();
  const viewer = await getViewer();
  const readOnly = !viewer.loggedIn;
  const isAdmin = viewer.isAdmin;

  // Search: name, alias, brand, category, memo, variations, barcodes and sizes (search_products).
  const matchedIds = term ? await searchProductIds(supabase, term, PAGE_SIZE) : null;
  const searchFilter = `id.in.(${(matchedIds ?? []).join(",") || "00000000-0000-0000-0000-000000000000"})`;

  const base = supabase.from("products").select(PRODUCT_SELECT);
  const listQuery = term
    ? base
        .or(searchFilter)
        .order("name_ja", { ascending: true })
        .limit(PAGE_SIZE)
    : base.order("name_ja", { ascending: true }).limit(ALL_LIMIT);

  // The list and the (light) attribute-name data are fetched at the same time.
  // Nothing is loaded for the default view (only the add section is shown).
  const [listResult, variationsResult, counterUnits] = await Promise.all([
    showList ? listQuery : Promise.resolve({ data: [] as Product[], error: null }),
    showList
      ? supabase.from("product_variations").select("attributes")
      : Promise.resolve({ data: [] as { attributes: unknown }[], error: null }),
    showList ? loadCounterUnits(supabase) : Promise.resolve([] as CounterUnitOption[]),
  ]);

  if (listResult.error) console.error("Products fetch error:", listResult.error);
  if (variationsResult.error)
    console.error("Variations fetch error:", variationsResult.error);

  const rawList: Product[] = (listResult.data as any) ?? [];
  // A search shows the best match first.
  const productList = matchedIds
    ? [...rawList].sort((a, b) => matchedIds.indexOf(a.id) - matchedIds.indexOf(b.id))
    : rawList;
  const variationRows = variationsResult.data ?? [];

  // Number of price records per package, for the delete buttons.
  // null = could not be loaded (the buttons then say 件数不明, never a wrong 0件).
  let priceCounts: Record<string, number> | null = {};
  if (readOnly) {
    priceCounts = null;
  } else {
    const packageIds = productList.flatMap((p) =>
      (p.product_packages ?? []).map((k) => k.id)
    );
    if (packageIds.length > 0) {
      const { data, error } = await supabase.rpc("package_price_counts", {
        p_package_ids: packageIds,
      });
      if (error) {
        console.error("Price counts error:", error.message, error.code);
        priceCounts = null;
      } else {
        const counts: Record<string, number> = {};
        for (const row of (data ?? []) as { package_id: string; entry_count: number | string }[]) {
          counts[row.package_id] = Number(row.entry_count);
        }
        priceCounts = counts;
      }
    }
  }

  /** 全バリエーションで使用されている属性名の集合（入力候補用） */
  const attributeNameSet = new Set<string>();
  variationRows.forEach((v) => {
    parseAttributes(v.attributes).forEach((a) => attributeNameSet.add(a.name));
  });
  const attributeNames = Array.from(attributeNameSet).sort();

  // A search with no result: similar names and a button to add the typed name.
  const similar = term && productList.length === 0 ? await findSimilarProducts(supabase, term) : [];

  const heading = term ? `「${term}」の検索結果` : "すべての商品";

  return (
    <ProductDialogsProvider attributeNames={attributeNames} counterUnits={counterUnits}>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-stone-900">商品</h1>

        <form action="/products" className="relative">
          <input
            name="q"
            type="search"
            defaultValue={term}
            placeholder="商品名・ブランド・カテゴリ・バーコードなどで検索"
            className="h-12 w-full rounded-xl border border-line bg-panel pl-11 pr-24 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-stone-400" />
          <button
            type="submit"
            className="absolute right-1.5 top-1.5 h-9 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white"
          >
            検索
          </button>
        </form>

        <div className="space-y-3">
          {showAll ? (
            <Link href="/products" className={linkBtnCls}>
              商品一覧を閉じる
            </Link>
          ) : (
            <Link href="/products?all=1" className={linkBtnCls}>
              すべての商品を表示
            </Link>
          )}

          <details open={newBarcode !== "" || !showList} className={sectionCls}>
            <summary className={summaryCls}>商品を追加</summary>
            <div className="mt-4">
              <ReadOnlyFieldset readOnly={readOnly}>
                <ProductForm defaultBarcode={newBarcode} />
              </ReadOnlyFieldset>
            </div>
          </details>
        </div>

        {showList && (
          <h2 className="text-lg font-bold text-stone-900">{heading}</h2>
        )}

        {!showList ? null : productList.length === 0 && term ? (
          <SearchEmptyHelp term={term} similar={similar} canAdd={!readOnly} searchPath="/products" />
        ) : productList.length === 0 ? (
          <p className="text-stone-500">
            {term ? "見つかりませんでした" : "まだ商品がありません。"}
          </p>
        ) : (
          <div className="space-y-4">
            {productList.map((product) => {
              const variations = product.product_variations ?? [];
              const packages = product.product_packages ?? [];
              const loosePackages = packages.filter((pkg) => !pkg.variation_id);

              return (
                <div
                  key={product.id}
                  className="rounded-2xl border border-line bg-panel p-4 shadow-sm"
                >
                  <p className="text-lg font-bold text-stone-900">
                    {product.name_ja || product.name_en || "商品名なし"}
                  </p>
                  {product.name_ja && product.name_en && (
                    <p className="text-sm text-stone-500">{product.name_en}</p>
                  )}
                  <p className="text-sm text-stone-500">
                    {product.brand ?? "ブランドなし"} ・ {product.category ?? "カテゴリなし"}
                  </p>

                  {product.memo && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-stone-600">
                      {product.memo}
                    </p>
                  )}

                  {variations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {variations.map((variation) => {
                        const label = variationLabel(parseAttributes(variation.attributes));
                        const pkgs = packages.filter(
                          (pkg) => pkg.variation_id === variation.id
                        );
                        return (
                          <div key={variation.id} className="space-y-1">
                            <p className="text-sm font-medium text-stone-800">{label}</p>
                            {pkgs.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {pkgs.map((pkg) => (
                                  <span key={pkg.id} className={chipCls}>
                                    {packageLabel(pkg.package_size, pkg.package_unit)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {loosePackages.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {variations.length > 0 && (
                        <p className="text-sm font-medium text-stone-800">バリエーションなし</p>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {loosePackages.map((pkg) => (
                          <span key={pkg.id} className={chipCls}>
                            {packageLabel(pkg.package_size, pkg.package_unit)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <ReadOnlyFieldset readOnly={readOnly}>
                    <ProductMemoEditor productId={product.id} memo={product.memo ?? null} />
                  </ReadOnlyFieldset>
                  <ReadOnlyFieldset readOnly={readOnly}>
                    <ProductCardTools
                      product={product}
                      isAdmin={isAdmin}
                      priceCounts={priceCounts}
                    />
                  </ReadOnlyFieldset>
                </div>
              );
            })}
          </div>
        )}

        {term && productList.length === PAGE_SIZE && (
          <p className="text-center text-xs text-stone-500">
            先頭の{PAGE_SIZE}件を表示しています。検索語を足して絞り込めます。
          </p>
        )}
        {showAll && productList.length === ALL_LIMIT && (
          <p className="text-center text-xs text-stone-500">
            先頭の{ALL_LIMIT}件を表示しています。検索で絞り込めます。
          </p>
        )}
      </div>
    </ProductDialogsProvider>
  );
}