import Link from "next/link";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatJst, packageLabel } from "@/lib/prices/format";
import { effectivePrice } from "@/lib/prices/coupon";
import { searchProductIds } from "@/lib/search/products";
import { parseSearchScope, searchPlaceholder } from "@/lib/search/scope";
import SearchScopeChips from "./SearchScopeChips";
import { pointUseMultiplierOf } from "@/lib/prices/points";
import { controlCls, labelCls } from "@/components/FormParts";
import PriceDisplay from "@/components/PriceDisplay";
import { isCheapest, parseTaxBasis, type TaxBasis } from "@/lib/prices/tax";
import {
  countActive,
  inPriceRange,
  parseFilters,
  rangeEnd,
  rangeStart,
  type RawParams,
} from "@/lib/prices/filters";
import {
  CATEGORY_LABEL,
  STORE_CATEGORIES,
  groupByCategory,
  parseCategory,
  saleLabel,
  type StoreCategory,
} from "@/lib/stores/category";
import { variationLabel, parseAttributes } from "@/lib/products/variation";

const RECENT_COUNT = 3; // products shown when there is no search and no filter

type ChainPrice = {
  chainId: string;
  chainName: string;
  category: StoreCategory | null;
  price: number;
  observedAt: string;
  isSale: boolean;
  couponPercents: number[];
  memberPercent: number | null;
  isMemberPrice: boolean;
  pointUseMultiplier: number | null;
  bulkPercent: number | null;
  bulkQuantity: number | null;
  bonusPoints: number | null;
  effective: number;
  taxBasis: TaxBasis;
};

type LatestMap = Map<string, Map<string, ChainPrice>>;

// A small round choice (radio) used in the filter panel.
function Chip({
  name,
  value,
  label,
  checked,
}: {
  name: string;
  value: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex h-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-panel px-3 text-sm text-stone-600 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600">
      <input
        type="radio"
        name={name}
        value={value}
        defaultChecked={checked}
        className="sr-only"
      />
      {label}
    </label>
  );
}

export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const rawParams = await searchParams;
  const f = parseFilters(rawParams);
  // What to search: every field (default), or only the name, brand, category or barcode.
  const scope = parseSearchScope((rawParams as unknown as Record<string, unknown>).scope);
  const term = f.q;
  const activeCount = countActive(f);

  const supabase = await createSupabaseServerClient();

  // Chains for the store and category filters (a small list).
  const { data: chainRows, error: chainsError } = await supabase
    .from("store_chains")
    .select("id, name, category")
    .order("name", { ascending: true });
  if (chainsError) {
    console.error("Chains fetch error:", chainsError.message, chainsError.code);
  }
  const chains = (chainRows ?? []).map((c: any) => ({
    id: c.id as string,
    name: c.name as string,
    category: parseCategory(c.category),
  }));
  const chainGroups = groupByCategory(chains);

  const since = rangeStart(f);
  const until = rangeEnd(f);
  const categoryChainIds = f.category
    ? chains.filter((c) => c.category === f.category).map((c) => c.id)
    : null;

  // Any filter on the prices themselves changes which products can match.
  const hasPriceFilter =
    f.chainId !== null ||
    f.category !== null ||
    f.sale !== "all" ||
    since !== null ||
    until !== null ||
    f.min !== null ||
    f.max !== null;

  // Prices, newest first, with the chain / sale / date filters applied.
  async function fetchObservations(packageIds: string[] | null): Promise<any[]> {
    if (categoryChainIds && categoryChainIds.length === 0) return [];

    let query = supabase
      .from("price_observations")
      .select(
        `product_package_id, price, observed_at, created_at, is_sale, store_chain_id, is_member_price, bonus_points, tax_basis, bulk_percent, bulk_quantity,
         store_chains (name, category, coupon_percents, member_discount_percent, point_use_enabled, point_use_multiplier)`
      )
      .order("observed_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(1000);

    if (packageIds) query = query.in("product_package_id", packageIds);
    if (f.chainId) query = query.eq("store_chain_id", f.chainId);
    if (categoryChainIds) query = query.in("store_chain_id", categoryChainIds);
    if (f.sale === "sale") query = query.eq("is_sale", true);
    if (f.sale === "regular") query = query.eq("is_sale", false);
    if (since) query = query.gte("observed_at", since);
    if (until) query = query.lte("observed_at", until);

    const { data, error } = await query;
    if (error) {
      console.error("Observations fetch error:", error.message, error.code);
      return [];
    }
    return (data ?? []) as any[];
  }

  // For every package: the latest matching price at each chain.
  function buildLatest(observations: any[]): LatestMap {
    const latest: LatestMap = new Map();
    for (const obs of observations) {
      const chain = [obs.store_chains].flat()[0];
      const price = Number(obs.price);
      const percents: number[] = chain?.coupon_percents ?? [];
      const memberPercent: number | null = chain?.member_discount_percent ?? null;
      const isMemberPrice = !!obs.is_member_price;
      const bulkPercent = (obs.bulk_percent as number | null) ?? null;
      const bulkQuantity = (obs.bulk_quantity as number | null) ?? null;
      const pointUseMultiplier = pointUseMultiplierOf(
        chain?.point_use_enabled,
        chain?.point_use_multiplier
      );
      const effective = bulkPercent !== null ? price : effectivePrice(price, {
        couponPercents: percents,
        memberPercent,
        isMemberPrice,
      });
      // The price range applies to the price shown (after coupon or membership).
      if (!inPriceRange(effective, f)) continue;

      const perPackage =
        latest.get(obs.product_package_id) ?? new Map<string, ChainPrice>();
      if (!perPackage.has(obs.store_chain_id)) {
        perPackage.set(obs.store_chain_id, {
          chainId: obs.store_chain_id,
          chainName: chain?.name ?? "",
          category: parseCategory(chain?.category),
          price,
          observedAt: obs.observed_at,
          isSale: !!obs.is_sale,
          couponPercents: percents,
          memberPercent,
          isMemberPrice,
          bonusPoints: (obs.bonus_points as number | null) ?? null,
          pointUseMultiplier,
          bulkPercent,
          bulkQuantity,
          effective,
          taxBasis: parseTaxBasis(obs.tax_basis),
        });
      }
      latest.set(obs.product_package_id, perPackage);
    }
    return latest;
  }

  // Search: name, alias, brand, category, memo, variations, barcodes and sizes (search_products).
  const matchedIds = term ? await searchProductIds(supabase, term, 50, scope) : [];
  const nameFilter = `id.in.(${matchedIds.join(",") || "00000000-0000-0000-0000-000000000000"})`;

  let products: any[] = [];
  let latest: LatestMap = new Map();

  const isDefaultView = !term && !hasPriceFilter;

  if (isDefaultView) {
    // No search and no filter: only the most recently added products.
    const { data, error } = await supabase
      .from("products")
      .select(
        `id, name_en, name_ja, brand, tax_rate,
         product_packages (
           id,
           package_size,
           package_unit,
           variation_id,
           product_variations (id, attributes)
         )`
      )
      .order("created_at", { ascending: false })
      .limit(RECENT_COUNT);
    if (error) {
      console.error("Products fetch error:", error.message, error.code);
    }
    products = (data ?? []) as any[];

    const recentPackageIds = products.flatMap((p: any) =>
      ([p.product_packages].flat().filter(Boolean) as any[]).map((pkg) => pkg.id as string)
    );
    if (recentPackageIds.length > 0) {
      latest = buildLatest(await fetchObservations(recentPackageIds));
    }
  } else if (hasPriceFilter) {
    // Find the matching prices first, then load only the packages they belong to.
    latest = buildLatest(await fetchObservations(null));
    const ids = Array.from(latest.keys()).slice(0, 200);
    if (ids.length > 0) {
      let query = supabase
        .from("products")
        .select(
          `id, name_en, name_ja, brand, tax_rate,
           product_packages!inner (
             id,
             package_size,
             package_unit,
             variation_id,
             product_variations (id, attributes)
           )`
        )
        .in("product_packages.id", ids)
        .order("name_en", { ascending: true })
        .limit(20);
      if (term) query = query.or(nameFilter);
      const { data, error } = await query;
      if (error) {
        console.error("Products fetch error:", error.message, error.code);
      }
      products = (data ?? []) as any[];
    }
  } else {
    let query = supabase
      .from("products")
      .select(
        `id, name_en, name_ja, brand, tax_rate,
         product_packages (
           id,
           package_size,
           package_unit,
           variation_id,
           product_variations (id, attributes)
         )`
      )
      .order("name_en", { ascending: true })
      .limit(20);
    if (term) query = query.or(nameFilter);
    const { data, error } = await query;
    if (error) {
      console.error("Products fetch error:", error.message, error.code);
    }
    products = (data ?? []) as any[];

    const packageIds = products.flatMap((p: any) =>
      ([p.product_packages].flat().filter(Boolean) as any[]).map((pkg) => pkg.id as string)
    );
    if (packageIds.length > 0) {
      latest = buildLatest(await fetchObservations(packageIds));
    }
  }

  const cards = products
    .flatMap((product: any) => {
      const name = product.name_ja || product.name_en || "名称未設定";
      const sub = [product.name_ja ? product.name_en : null, product.brand]
        .filter(Boolean)
        .join(" ・ ");
      const pkgs = [product.product_packages].flat().filter(Boolean) as any[];
      return pkgs.map((pkg) => {
        const variationObj = Array.isArray(pkg.product_variations)
          ? pkg.product_variations[0]
          : pkg.product_variations ?? null;
        const variationText = variationObj?.attributes
          ? variationLabel(parseAttributes(variationObj.attributes))
          : null;

        return {
          id: pkg.id as string,
          name: name as string,
          sub,
          size: packageLabel(pkg.package_size, pkg.package_unit),
          variationLabel: variationText,
          taxRate: (product.tax_rate as number | null) ?? null,
          rows: Array.from(latest.get(pkg.id)?.values() ?? []).sort(
            (a, b) =>
              new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
          ),
        };
      });
    })
    .filter((card) => !hasPriceFilter || card.rows.length > 0);

  const clearHref = term ? `/check?q=${encodeURIComponent(term)}` : "/check";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">価格確認</h1>

      <form action="/check" className="space-y-3">
        <SearchScopeChips key={scope} current={scope} />

        <div className="relative">
          <input
            name="q"
            type="search"
            defaultValue={term}
            placeholder={searchPlaceholder(scope)}
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
            絞り込み
            {activeCount > 0 && (
              <span className="rounded-full bg-teal-600 px-2 py-0.5 text-xs font-bold text-white">
                {activeCount}
              </span>
            )}
            <ChevronDown className="ml-auto h-4 w-4 text-stone-400" />
          </summary>

          <div className="mt-4 space-y-5">
            <div>
              <label htmlFor="f_chain" className={labelCls}>
                店舗（チェーン）
              </label>
              <select
                id="f_chain"
                name="chain"
                defaultValue={f.chainId ?? ""}
                className={controlCls}
              >
                <option value="">すべて</option>
                {chainGroups.map((g) => (
                  <optgroup key={g.key} label={g.label}>
                    {g.items.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="f_cat" className={labelCls}>
                店舗のカテゴリ
              </label>
              <select
                id="f_cat"
                name="cat"
                defaultValue={f.category ?? ""}
                className={controlCls}
              >
                <option value="">すべて</option>
                {STORE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>

            <fieldset className="min-w-0">
              <legend className={labelCls}>価格の種類</legend>
              <div className="grid grid-cols-3 gap-2">
                <Chip name="sale" value="all" label="すべて" checked={f.sale === "all"} />
                <Chip
                  name="sale"
                  value="regular"
                  label="通常"
                  checked={f.sale === "regular"}
                />
                <Chip
                  name="sale"
                  value="sale"
                  label="特売・セール"
                  checked={f.sale === "sale"}
                />
              </div>
            </fieldset>

            <div>
              <p className={labelCls}>価格帯（円）</p>
              <div className="flex items-center gap-2">
                <input
                  name="min"
                  inputMode="numeric"
                  aria-label="価格の下限"
                  placeholder="下限"
                  defaultValue={f.min ?? ""}
                  className={controlCls}
                />
                <span className="text-stone-500">〜</span>
                <input
                  name="max"
                  inputMode="numeric"
                  aria-label="価格の上限"
                  placeholder="上限"
                  defaultValue={f.max ?? ""}
                  className={controlCls}
                />
              </div>
              <p className="mt-1.5 text-xs text-stone-500">
                クーポン・会員価格の適用後の価格で絞り込みます。税抜・税込は区別しません。
              </p>
            </div>

            <fieldset className="min-w-0">
              <legend className={labelCls}>期間</legend>
              <div className="grid grid-cols-4 gap-2">
                <Chip name="period" value="all" label="全期間" checked={f.period === "all"} />
                <Chip name="period" value="week" label="1週間" checked={f.period === "week"} />
                <Chip name="period" value="month" label="1か月" checked={f.period === "month"} />
                <Chip
                  name="period"
                  value="quarter"
                  label="3か月"
                  checked={f.period === "quarter"}
                />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <input
                  name="from"
                  type="date"
                  aria-label="開始日"
                  defaultValue={f.from ?? ""}
                  className={controlCls}
                />
                <span className="text-stone-500">〜</span>
                <input
                  name="to"
                  type="date"
                  aria-label="終了日"
                  defaultValue={f.to ?? ""}
                  className={controlCls}
                />
              </div>
              <p className="mt-1.5 text-xs text-stone-500">
                日付を入れた場合は、上の期間より日付が優先されます。
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
                <Link href={clearHref} className="shrink-0 text-sm font-medium text-teal-700">
                  条件をクリア
                </Link>
              )}
            </div>
          </div>
        </details>
      </form>

      {isDefaultView && (
        <div>
          <h2 className="text-lg font-bold text-stone-900">最近追加した商品</h2>
          <p className="mt-1 text-sm text-stone-500">
            新しい順に{RECENT_COUNT}件を表示しています。ほかの商品は、検索か絞り込みで探せます。
          </p>
        </div>
      )}

      {cards.length === 0 ? (
        <p className="text-stone-500">
          {hasPriceFilter ? "条件に合う価格がありません" : "見つかりませんでした"}
        </p>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/check/${card.id}`}
              className="block rounded-2xl border border-line bg-panel p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-stone-900">{card.name}</p>
                  {card.sub && <p className="text-sm text-stone-500">{card.sub}</p>}
                  {card.variationLabel && (
                    <p className="text-sm text-stone-500">{card.variationLabel}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-chip px-2.5 py-1 text-sm font-medium text-stone-700">
                  {card.size}
                </span>
              </div>

              {card.rows.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">まだ価格がありません</p>
              ) : (
                <ul className="mt-3 divide-y divide-stone-100">
                  {card.rows.map((r) => (
                    <li
                      key={r.chainId}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3"
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-medium text-stone-900">
                          {r.chainName}
                          {r.isSale && (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                              {saleLabel(r.category)}
                            </span>
                          )}
                          {isCheapest(r, card.rows) && (
                            <span className="rounded-md bg-teal-100 px-1.5 py-0.5 text-xs font-bold text-teal-700">
                              最安
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-stone-500">
                          {formatJst(r.observedAt)}
                          {r.bonusPoints ? (
                            <span className="ml-2 text-amber-700">
                              +{r.bonusPoints}ポイント
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <PriceDisplay
                        price={r.price}
                        couponPercents={r.couponPercents}
                        memberPercent={r.memberPercent}
                        isMemberPrice={r.isMemberPrice}
                        pointUseMultiplier={r.pointUseMultiplier}
                        bulkPercent={r.bulkPercent}
                        bulkQuantity={r.bulkQuantity}
                        taxRate={card.taxRate}
                        taxBasis={r.taxBasis}
                        size="md"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}