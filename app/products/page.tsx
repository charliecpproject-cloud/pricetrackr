import { Search } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { packageLabel } from "@/lib/prices/format";
import { parseAttributes, variationLabel } from "@/lib/products/variation";
import ProductForm from "./ProductForm";
import PackageForm from "./PackageForm";
import VariationForm from "./VariationForm";
import ProductMemoEditor from "./ProductMemoEditor";
import ProductCardTools from "./ProductCardTools";
import ReadOnlyFieldset from "@/components/ReadOnlyFieldset";
import { getViewer } from "@/lib/auth/viewer";

const PAGE_SIZE = 20;

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
  product_variations: Variation[] | null;
  product_packages: Package[] | null;
};

const chipCls =
  "rounded-full bg-chip px-2.5 py-1 text-sm font-medium text-stone-700";
const sectionCls = "rounded-2xl border border-line bg-panel p-4";
const summaryCls = "cursor-pointer text-base font-semibold text-stone-900";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  // Keep the search term short and free of characters that break the filter.
  const term = (q ?? "").trim().slice(0, 50).replace(/[,()%_*\\]/g, "");

  const supabase = await createSupabaseServerClient();
  const readOnly = !(await getViewer()).loggedIn;

  let listQuery = supabase
    .from("products")
    .select(
      "id, name_ja, name_en, brand, category, memo, product_variations (id, attributes), product_packages (id, variation_id, package_size, package_unit)"
    )
    .order("name_ja", { ascending: true })
    .limit(PAGE_SIZE);
  if (term) {
    listQuery = listQuery.or(
      `name_en.ilike.%${term}%,name_ja.ilike.%${term}%,brand.ilike.%${term}%`
    );
  }

  // The list and the (light) dropdown data are fetched at the same time.
  const [listResult, optionsResult, variationsResult] = await Promise.all([
    listQuery,
    supabase
      .from("products")
      .select("id, name_ja, name_en")
      .order("name_ja", { ascending: true }),
    supabase.from("product_variations").select("id, product_id, attributes"),
  ]);

  if (listResult.error) console.error("Products fetch error:", listResult.error);
  if (optionsResult.error) console.error("Options fetch error:", optionsResult.error);
  if (variationsResult.error)
    console.error("Variations fetch error:", variationsResult.error);

  const productList: Product[] = (listResult.data as any) ?? [];
  const productRows = optionsResult.data ?? [];
  const variationRows = variationsResult.data ?? [];

  /** 商品一覧（VariationForm 用） */
  const productOptions = productRows.map((p) => ({
    id: p.id,
    label: p.name_ja || p.name_en || "商品名なし",
  }));

  /** Variation の一覧（PackageForm 用） */
  const variationList = variationRows.map((v) => ({
    id: v.id,
    productId: v.product_id,
    label: variationLabel(parseAttributes(v.attributes)),
  }));

  /** 全バリエーションで使用されている属性名の集合 */
  const attributeNameSet = new Set<string>();
  variationRows.forEach((v) => {
    parseAttributes(v.attributes).forEach((a) => attributeNameSet.add(a.name));
  });
  const attributeNames = Array.from(attributeNameSet).sort();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">商品</h1>

      <form action="/products" className="relative">
        <input
          name="q"
          type="search"
          defaultValue={term}
          placeholder="商品名・ブランドで検索"
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

      {productList.length === 0 ? (
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
                  <ProductCardTools product={product} />
                </ReadOnlyFieldset>
              </div>
            );
          })}
        </div>
      )}

      {productList.length === PAGE_SIZE && (
        <p className="text-center text-xs text-stone-500">
          先頭の{PAGE_SIZE}件を表示しています。検索で絞り込めます。
        </p>
      )}

      <div className="space-y-3">
        <details className={sectionCls}>
          <summary className={summaryCls}>商品を追加</summary>
          <div className="mt-4">
            <ReadOnlyFieldset readOnly={readOnly}>
              <ProductForm />
            </ReadOnlyFieldset>
          </div>
        </details>

        <details className={sectionCls}>
          <summary className={summaryCls}>バリエーションを追加</summary>
          <div className="mt-4">
            <ReadOnlyFieldset readOnly={readOnly}>
              <VariationForm products={productOptions} attributeNames={attributeNames} />
            </ReadOnlyFieldset>
          </div>
        </details>

        <details className={sectionCls}>
          <summary className={summaryCls}>容量を追加</summary>
          <div className="mt-4">
            <ReadOnlyFieldset readOnly={readOnly}>
              <PackageForm products={productRows} variations={variationList} />
            </ReadOnlyFieldset>
          </div>
        </details>
      </div>
    </div>
  );
}