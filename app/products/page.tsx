import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { packageLabel } from "@/lib/prices/format";
import { parseAttributes, variationLabel } from "@/lib/products/variation";
import ProductForm from "./ProductForm";
import ProductMemoEditor from "./ProductMemoEditor";
import ProductCardTools from "./ProductCardTools";
import { ProductDialogsProvider } from "./ProductDialogs";
import ReadOnlyFieldset from "@/components/ReadOnlyFieldset";
import RadioChip from "@/components/RadioChip";
import { controlCls, labelCls } from "@/components/FormParts";
import { getViewer } from "@/lib/auth/viewer";
import { normalizeBarcode } from "@/lib/products/barcode";
import { searchProductIds } from "@/lib/search/products";
import { findSimilarProducts } from "@/lib/search/similar";
import SearchEmptyHelp from "@/components/SearchEmptyHelp";
import { loadCounterUnits } from "@/lib/prices/counterUnits";
import {
  countActiveProductFilters,
  filterList,
  parseProductFilters,
  sortList,
  topValues,
  type ProductFilters,
  type RawParams,
} from "@/lib/products/listFilters";

const PAGE_SIZE = 20; // products shown at first, and added by each 「もっと見る」
const ALL_LIMIT = 300; // すべての商品 and the most that is ever loaded
const SEARCH_FETCH = 100; // search matches that filters and sorting work on
const TOP_VALUES = 30; // categories and brands offered in the filter dropdowns

const PRODUCT_SELECT =
  "id, name_ja, name_en, brand, category, memo, tax_rate, created_at, product_variations (id, attributes), product_packages (id, variation_id, package_size, package_unit), product_barcodes (code, package_id)";

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
  created_at?: string | null;
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
  searchParams: Promise<RawParams>;
}) {
  const params = await searchParams;
  const one = (key: string): string => {
    const value = params[key];
    return (Array.isArray(value) ? value[0] : value) ?? "";
  };

  // A barcode that was scanned but not found: the add form opens with it filled in.
  const newBarcode = normalizeBarcode(one("barcode")) ?? "";
  // A name typed in a search that found nothing (「この名前で商品を追加」): fills 商品名.
  const newName = one("name").trim().slice(0, 100);
  // Keep the search term short and free of characters that break the filter.
  const term = one("q")
    .trim()
    .slice(0, 50)
    .replace(/[,()%_*\\]/g, "");
  const showAll = one("all") === "1" && !term;

  const supabase = await createSupabaseServerClient();
  const viewer = await getViewer();
  const readOnly = !viewer.loggedIn;
  const isAdmin = viewer.isAdmin;

  // Visitors have no price record counts, so the price filter does not apply to them.
  const parsedFilters = parseProductFilters(params);
  const f: ProductFilters = readOnly
    ? { ...parsedFilters, prices: "all" }
    : parsedFilters;
  const activeCount = countActiveProductFilters(f);

  // The default view shows only the add section; a list appears for a search, すべての商品,
  // or any filter or sort.
  const showList = term !== "" || showAll || activeCount > 0;

  const pageSize = showAll ? ALL_LIMIT : PAGE_SIZE;
  const limitRaw = Number(one("limit"));
  const limit =
    Number.isFinite(limitRaw) && limitRaw > 0
      ? Math.min(ALL_LIMIT, Math.max(pageSize, Math.floor(limitRaw)))
      : pageSize;

  // Search: name, alias, brand, category, memo, variations, barcodes and sizes (search_products).
  const matchedIds = term
    ? await searchProductIds(supabase, term, SEARCH_FETCH)
    : null;
  const searchFilter = `id.in.(${(matchedIds ?? []).join(",") || "00000000-0000-0000-0000-000000000000"})`;

  function listQuery() {
    let query = supabase.from("products").select(PRODUCT_SELECT);
    if (term) query = query.or(searchFilter);
    if (f.category) query = query.eq("category", f.category);
    if (f.brand) query = query.eq("brand", f.brand);
    return query.order("name_ja", { ascending: true }).limit(ALL_LIMIT);
  }

  // The list, the (light) attribute-name data, the units and the category and brand lists of the
  // filters are fetched at the same time. Nothing of the list is loaded for the default view.
  const [listResult, variationsResult, counterUnits, optionsResult] =
    await Promise.all([
      showList
        ? listQuery()
        : Promise.resolve({ data: [] as Product[], error: null }),
      showList
        ? supabase.from("product_variations").select("attributes")
        : Promise.resolve({
            data: [] as { attributes: unknown }[],
            error: null,
          }),
      loadCounterUnits(supabase),
      supabase.from("products").select("category, brand").limit(5000),
    ]);

  if (listResult.error)
    console.error("Products fetch error:", listResult.error);
  if (variationsResult.error)
    console.error("Variations fetch error:", variationsResult.error);
  if (optionsResult.error)
    console.error("Filter options fetch error:", optionsResult.error);

  const variationRows = variationsResult.data ?? [];
  const optionRows = (optionsResult.data ?? []) as {
    category: string | null;
    brand: string | null;
  }[];
  const categories = topValues(
    optionRows.map((r) => r.category),
    TOP_VALUES,
    f.category,
  );
  const brands = topValues(
    optionRows.map((r) => r.brand),
    TOP_VALUES,
    f.brand,
  );

  const rawList: Product[] = (listResult.data as any) ?? [];
  // A search shows the best match first.
  const ordered = matchedIds
    ? [...rawList].sort(
        (a, b) => matchedIds.indexOf(a.id) - matchedIds.indexOf(b.id),
      )
    : rawList;

  // Number of price records per package, for the delete buttons and the price filter.
  // null = could not be loaded (the buttons then say 件数不明, never a wrong 0件).
  let priceCounts: Record<string, number> | null = {};
  if (readOnly) {
    priceCounts = null;
  } else {
    const packageIds = ordered.flatMap((p) =>
      (p.product_packages ?? []).map((k) => k.id),
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
        for (const row of (data ?? []) as {
          package_id: string;
          entry_count: number | string;
        }[]) {
          counts[row.package_id] = Number(row.entry_count);
        }
        priceCounts = counts;
      }
    }
  }

  // 最近価格が入った順: the time of the newest price entry of each product, from the newest
  // 1000 entries (a product whose last price is older than that has no date and goes last).
  const latestByProduct = new Map<string, string>();
  if (f.sort === "price" && ordered.length > 0) {
    const productOfPackage = new Map<string, string>();
    for (const product of ordered) {
      for (const pkg of product.product_packages ?? [])
        productOfPackage.set(pkg.id, product.id);
    }
    const { data, error } = await supabase
      .from("price_observations")
      .select("product_package_id, created_at")
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) {
      console.error("Latest prices fetch error:", error.message, error.code);
    }
    for (const row of (data ?? []) as {
      product_package_id: string;
      created_at: string;
    }[]) {
      const productId = productOfPackage.get(row.product_package_id);
      if (productId && !latestByProduct.has(productId))
        latestByProduct.set(productId, row.created_at);
    }
  }

  // Variation and price filters and the sort work on what was loaded; then 20 are shown.
  const counts = priceCounts;
  const entries = ordered.map((product) => ({
    product,
    name: product.name_ja || product.name_en || "",
    createdAt: product.created_at ?? "",
    variationCount: (product.product_variations ?? []).length,
    hasPrices:
      counts === null
        ? null
        : (product.product_packages ?? []).some((p) => (counts[p.id] ?? 0) > 0),
    latestPriceAt: latestByProduct.get(product.id) ?? null,
  }));
  const sorted = sortList(filterList(entries, f), f.sort);
  const hasMore = sorted.length > limit;
  const productList = sorted.slice(0, limit).map((e) => e.product);

  /** 全バリエーションで使用されている属性名の集合（入力候補用） */
  const attributeNameSet = new Set<string>();
  variationRows.forEach((v) => {
    parseAttributes(v.attributes).forEach((a) => attributeNameSet.add(a.name));
  });
  const attributeNames = Array.from(attributeNameSet).sort();

  // A search with no result and no filter: similar names and a button to add the typed name.
  const similar =
    term && productList.length === 0 && activeCount === 0
      ? await findSimilarProducts(supabase, term)
      : [];

  const heading = term
    ? `「${term}」の検索結果`
    : activeCount > 0
      ? "絞り込み結果"
      : "すべての商品";

  // The 「もっと見る」 link: the same search and filters, 20 more products.
  const moreParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === "limit" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value])
      moreParams.append(key, item);
  }
  moreParams.set("limit", String(Math.min(ALL_LIMIT, limit + PAGE_SIZE)));
  const moreHref = `/products?${moreParams.toString()}`;

  const clearHref = term
    ? `/products?q=${encodeURIComponent(term)}`
    : "/products";
  const formKey = [term, f.category, f.brand, f.prices, f.variations, f.sort]
    .map((v) => v ?? "")
    .join("|");

  return (
    <ProductDialogsProvider
      attributeNames={attributeNames}
      counterUnits={counterUnits}
    >
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-stone-900">商品</h1>

        <form key={formKey} action="/products" className="space-y-3">
          {showAll && <input type="hidden" name="all" value="1" />}

          <div className="relative">
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
          </div>

          <details
            open={activeCount > 0}
            className="rounded-2xl border border-line bg-panel p-4 shadow-sm"
          >
            <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-stone-700 [&::-webkit-details-marker]:hidden">
              <SlidersHorizontal className="h-4 w-4" />
              絞り込み・並べ替え
              {activeCount > 0 && (
                <span className="rounded-full bg-teal-600 px-2 py-0.5 text-xs font-bold text-white">
                  {activeCount}
                </span>
              )}
              <ChevronDown className="ml-auto h-4 w-4 text-stone-400" />
            </summary>

            <div className="mt-4 space-y-5">
              <div>
                <label htmlFor="f_category" className={labelCls}>
                  カテゴリ
                </label>
                <select
                  id="f_category"
                  name="cat"
                  defaultValue={f.category ?? ""}
                  className={controlCls}
                >
                  <option value="">すべて</option>
                  {categories.options.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.value}（{c.count}）
                    </option>
                  ))}
                </select>
                {categories.total > TOP_VALUES && (
                  <p className="mt-1.5 text-xs text-stone-500">
                    商品の多い{TOP_VALUES}
                    件を表示しています。ほかのカテゴリは検索で探せます。
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="f_brand" className={labelCls}>
                  ブランド
                </label>
                <select
                  id="f_brand"
                  name="brand"
                  defaultValue={f.brand ?? ""}
                  className={controlCls}
                >
                  <option value="">すべて</option>
                  {brands.options.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.value}（{b.count}）
                    </option>
                  ))}
                </select>
                {brands.total > TOP_VALUES && (
                  <p className="mt-1.5 text-xs text-stone-500">
                    商品の多い{TOP_VALUES}
                    件を表示しています。ほかのブランドは検索で探せます。
                  </p>
                )}
              </div>

              {!readOnly && (
                <fieldset className="min-w-0">
                  <legend className={labelCls}>価格の記録</legend>
                  <div className="grid grid-cols-3 gap-2">
                    <RadioChip
                      name="pr"
                      value="all"
                      label="すべて"
                      checked={f.prices === "all"}
                    />
                    <RadioChip
                      name="pr"
                      value="with"
                      label="あり"
                      checked={f.prices === "with"}
                    />
                    <RadioChip
                      name="pr"
                      value="without"
                      label="なし"
                      checked={f.prices === "without"}
                    />
                  </div>
                </fieldset>
              )}

              <fieldset className="min-w-0">
                <legend className={labelCls}>バリエーション</legend>
                <div className="grid grid-cols-3 gap-2">
                  <RadioChip
                    name="var"
                    value="all"
                    label="すべて"
                    checked={f.variations === "all"}
                  />
                  <RadioChip
                    name="var"
                    value="with"
                    label="あり"
                    checked={f.variations === "with"}
                  />
                  <RadioChip
                    name="var"
                    value="without"
                    label="なし"
                    checked={f.variations === "without"}
                  />
                </div>
              </fieldset>

              <fieldset className="min-w-0">
                <legend className={labelCls}>並び順</legend>
                <div className="grid grid-cols-2 gap-2">
                  <RadioChip
                    name="sort"
                    value=""
                    label="標準"
                    checked={f.sort === null}
                  />
                  <RadioChip
                    name="sort"
                    value="name"
                    label="名前順"
                    checked={f.sort === "name"}
                  />
                  <RadioChip
                    name="sort"
                    value="new"
                    label="追加が新しい順"
                    checked={f.sort === "new"}
                  />
                  <RadioChip
                    name="sort"
                    value="price"
                    label="最近価格が入った順"
                    checked={f.sort === "price"}
                  />
                </div>
                <p className="mt-1.5 text-xs text-stone-500">
                  標準は、検索のときは一致の高い順、それ以外は名前順です。
                </p>
              </fieldset>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  className="h-12 flex-1 rounded-xl bg-teal-600 text-base font-medium text-white"
                >
                  この条件で検索
                </button>
                {activeCount > 0 && (
                  <Link
                    href={clearHref}
                    className="shrink-0 text-sm font-medium text-teal-700"
                  >
                    条件をクリア
                  </Link>
                )}
              </div>
            </div>
          </details>
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

          <details
            open={newBarcode !== "" || newName !== "" || !showList}
            className={sectionCls}
          >
            <summary className={summaryCls}>商品を追加</summary>
            <div className="mt-4">
              <ReadOnlyFieldset readOnly={readOnly}>
                <ProductForm
                  key={`${newBarcode}|${newName}`}
                  defaultBarcode={newBarcode}
                  defaultName={newName}
                  counterUnits={counterUnits}
                />
              </ReadOnlyFieldset>
            </div>
          </details>
        </div>

        {showList && (
          <h2 className="text-lg font-bold text-stone-900">{heading}</h2>
        )}

        {!showList ? null : productList.length === 0 &&
          term &&
          activeCount === 0 ? (
          <SearchEmptyHelp
            term={term}
            similar={similar}
            canAdd={!readOnly}
            searchPath="/products"
          />
        ) : productList.length === 0 ? (
          <p className="text-stone-500">
            {term || activeCount > 0
              ? "条件に合う商品がありません"
              : "まだ商品がありません。"}
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
                    {product.brand ?? "ブランドなし"} ・{" "}
                    {product.category ?? "カテゴリなし"}
                  </p>

                  {product.memo && (
                    <p className="mt-3 whitespace-pre-wrap text-sm text-stone-600">
                      {product.memo}
                    </p>
                  )}

                  {variations.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {variations.map((variation) => {
                        const label = variationLabel(
                          parseAttributes(variation.attributes),
                        );
                        const pkgs = packages.filter(
                          (pkg) => pkg.variation_id === variation.id,
                        );
                        return (
                          <div key={variation.id} className="space-y-1">
                            <p className="text-sm font-medium text-stone-800">
                              {label}
                            </p>
                            {pkgs.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {pkgs.map((pkg) => (
                                  <span key={pkg.id} className={chipCls}>
                                    {packageLabel(
                                      pkg.package_size,
                                      pkg.package_unit,
                                    )}
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
                        <p className="text-sm font-medium text-stone-800">
                          バリエーションなし
                        </p>
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
                    <ProductMemoEditor
                      productId={product.id}
                      memo={product.memo ?? null}
                    />
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

        {showList && hasMore && limit < ALL_LIMIT && (
          <Link
            href={moreHref}
            scroll={false}
            className="flex h-12 items-center justify-center rounded-xl border border-line bg-panel text-base font-medium text-stone-700 hover:bg-panel-soft"
          >
            もっと見る
          </Link>
        )}
        {showList &&
          (hasMore ? limit >= ALL_LIMIT : rawList.length >= ALL_LIMIT) && (
            <p className="text-center text-xs text-stone-500">
              先頭の{ALL_LIMIT}件を対象にしています。検索や絞り込みで探せます。
            </p>
          )}
      </div>
    </ProductDialogsProvider>
  );
}
