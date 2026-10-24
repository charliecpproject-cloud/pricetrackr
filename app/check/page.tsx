import Link from "next/link";
import { ChevronDown, Heart, Search, SlidersHorizontal } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { packageLabel } from "@/lib/prices/format";
import { formatDateTime } from "@/lib/dateTime";
import PriceAge from "@/components/PriceAge";
import { effectivePrice } from "@/lib/prices/coupon";
import { parseStoredTiers, type BulkTier } from "@/lib/prices/bulk";
import { searchProductIds } from "@/lib/search/products";
import { parseSearchScope, searchPlaceholder } from "@/lib/search/scope";
import SearchScopeChips from "./SearchScopeChips";
import SearchSuggestions from "./SearchSuggestions";
import { loadVisibleSuggestions } from "@/lib/search/loadSuggestions";
import { findSimilarProducts } from "@/lib/search/similar";
import SearchEmptyHelp from "@/components/SearchEmptyHelp";
import CategoryFilter from "./CategoryFilter";
import PeriodFilter from "./PeriodFilter";
import { pointUseMultiplierOf } from "@/lib/prices/points";
import { controlCls, labelCls } from "@/components/FormParts";
import PriceDisplay from "@/components/PriceDisplay";
import { isCheapest, parseTaxBasis, type TaxBasis } from "@/lib/prices/tax";
import { unitPriceSummary } from "@/lib/prices/unitLines";
import UnitPriceSummary from "@/components/UnitPriceSummary";
import {
  countActive,
  hasActivePeriod,
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
import { getViewer } from "@/lib/auth/viewer";
import FavoriteButton from "@/components/FavoriteButton";
import AddPriceButton from "@/components/AddPriceButton";
import VariationTabs from "@/components/VariationTabs";
import CheckScrollMemory from "@/components/CheckScrollMemory";
import { defaultGroupIndex, groupByVariation } from "@/lib/prices/groupCards";
import { loadFavorites } from "@/lib/prices/loadFavorites";
import { favoriteLevel, type FavoriteLevel } from "@/lib/prices/favorites";

const RECENT_COUNT = 3; // products shown when there is no search and no filter
const PAGE_SIZE = 20; // products shown at first, and added by each 「もっと見る」
const MAX_LIMIT = 100;

// How a 容量 block looks: a favorite gets a soft rose border and a faint tint; a related package
// (another size of the same variation as a favorite) gets half of that tint.
const CARD_TONE: Record<FavoriteLevel, string> = {
  favorite: "border-rose-200 bg-gradient-to-r from-rose-50 to-transparent",
  related: "border-line bg-gradient-to-r from-rose-50/50 to-transparent",
  none: "border-line",
};

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
  bulkTiers: BulkTier[];
  bonusPoints: number | null;
  effective: number;
  taxBasis: TaxBasis;
};

type LatestMap = Map<string, Map<string, ChainPrice>>;

// One 容量 (size) of a product with its latest price per chain.
type SizeCard = {
  id: string;
  productId: string;
  name: string;
  sub: string;
  size: string;
  sizeValue: number;
  unit: string;
  variationId: string | null;
  variationLabel: string | null;
  taxRate: number | null;
  favorite: FavoriteLevel;
  rows: ChainPrice[];
};

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

// One 容量 inside a product card: the size, the heart, 価格を追加 and the latest price per chain.
// The block is a link to the detail page; the heart and the button sit on top of it, never inside.
function SizeBlock({
  card,
  loggedIn,
  emptyText,
}: {
  card: SizeCard;
  loggedIn: boolean;
  emptyText: string;
}) {
  return (
    <div className="relative">
      <div className="absolute bottom-3 left-4 z-10">
        <AddPriceButton
          packageId={card.id}
          chainId={card.rows[0]?.chainId ?? null}
          disabled={!loggedIn}
          compact
        />
      </div>
      <Link
        href={`/check/${card.id}`}
        className={`block rounded-xl border bg-panel p-3 pb-14 shadow-sm transition hover:shadow-md ${CARD_TONE[card.favorite]}`}
      >
        <div className={`flex items-center ${loggedIn ? "pl-9" : ""}`}>
          <span className="rounded-full bg-chip px-2.5 py-1 text-sm font-medium text-stone-700">
            {card.size}
          </span>
        </div>

        {card.rows.length === 0 ? (
          <p className="mt-3 text-sm text-stone-500">{emptyText}</p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100">
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
                    {formatDateTime(r.observedAt)}
                    <PriceAge iso={r.observedAt} className="ml-1.5" />
                    {r.bonusPoints ? (
                      <span className="ml-2 text-amber-700">+{r.bonusPoints}ポイント</span>
                    ) : null}
                  </p>
                </div>
                <div className="ml-auto flex max-w-full flex-col items-end gap-1">
                  <PriceDisplay
                    price={r.price}
                    couponPercents={r.couponPercents}
                    memberPercent={r.memberPercent}
                    isMemberPrice={r.isMemberPrice}
                    regularLabel={r.isSale ? `${saleLabel(r.category)}価格` : undefined}
                    pointUseMultiplier={r.pointUseMultiplier}
                    bulkTiers={r.bulkTiers}
                    taxRate={card.taxRate}
                    taxBasis={r.taxBasis}
                    size="md"
                  />
                  <UnitPriceSummary
                    summary={unitPriceSummary({
                      enteredPrice: r.price,
                      couponPercents: r.couponPercents,
                      memberPercent: r.memberPercent,
                      isMemberPrice: r.isMemberPrice,
                      bulkTiers: r.bulkTiers,
                      size: card.sizeValue,
                      unit: card.unit,
                      hideSinglePiece: true,
                      regularLabel: r.isSale ? `${saleLabel(r.category)}価格` : undefined,
                    })}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Link>
      {loggedIn && (
        <div className="absolute left-1.5 top-2 z-10">
          <FavoriteButton packageId={card.id} level={card.favorite} />
        </div>
      )}
    </div>
  );
}

export const metadata = { title: "価格確認" };

export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<RawParams>;
}) {
  const rawParams = await searchParams;
  const viewer = await getViewer();
  const loggedIn = viewer.loggedIn;
  const parsedFilters = parseFilters(rawParams);
  // The favorites filter needs an account: visitors have no favorites.
  const f = loggedIn ? parsedFilters : { ...parsedFilters, favorites: false };
  // What to search: every field (default), or only the name, brand, category or barcode.
  const scope = parseSearchScope((rawParams as unknown as Record<string, unknown>).scope);
  const term = f.q;
  // 「もっと見る」: how many products to show (20 more with each tap, up to 100).
  const limitRaw = Number(Array.isArray(rawParams.limit) ? rawParams.limit[0] : rawParams.limit);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(MAX_LIMIT, Math.max(PAGE_SIZE, Math.floor(limitRaw)))
    : PAGE_SIZE;
  const activeCount = countActive(f) + (scope !== "all" ? 1 : 0);

  const supabase = await createSupabaseServerClient();

  // The admin's search suggestions, loaded while the other queries run.
  const suggestionsPromise = loadVisibleSuggestions(supabase);

  // The account's favorite packages, loaded while the other queries run.
  const favoritesPromise = loggedIn
    ? loadFavorites(supabase)
    : Promise.resolve({ ids: new Set<string>(), groups: new Set<string>() });

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

  const favorites = await favoritesPromise;
  const suggestions = await suggestionsPromise;
  const onlyFavorites = f.favorites;
  const since = rangeStart(f);
  const until = rangeEnd(f);
  const categoryChainIds = f.categories.length > 0
    ? chains.filter((c) => c.category !== null && f.categories.includes(c.category)).map((c) => c.id)
    : null;

  // Any filter on the prices themselves changes which products can match.
  const hasPriceFilter =
    f.chainId !== null ||
    f.categories.length > 0 ||
    f.sale !== "all" ||
    hasActivePeriod(f) ||
    f.min !== null ||
    f.max !== null;

  // Prices, newest first, with the chain / sale / date filters applied.
  async function fetchObservations(packageIds: string[] | null): Promise<any[]> {
    if (categoryChainIds && categoryChainIds.length === 0) return [];

    let query = supabase
      .from("price_observations")
      .select(
        `product_package_id, price, observed_at, created_at, is_sale, store_chain_id, is_member_price, bonus_points, tax_basis, bulk_tiers,
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
      const bulkTiers = parseStoredTiers(obs.bulk_tiers);
      const pointUseMultiplier = pointUseMultiplierOf(
        chain?.point_use_enabled,
        chain?.point_use_multiplier
      );
      const effective = effectivePrice(price, {
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
          bulkTiers,
          effective,
          taxBasis: parseTaxBasis(obs.tax_basis),
        });
      }
      latest.set(obs.product_package_id, perPackage);
    }
    return latest;
  }

  // Search: name, alias, brand, category, memo, variations, barcodes and sizes (search_products).
  const matchedIds = term ? await searchProductIds(supabase, term, Math.max(50, limit + 1), scope) : [];
  const nameFilter = `id.in.(${matchedIds.join(",") || "00000000-0000-0000-0000-000000000000"})`;

  let products: any[] = [];
  let latest: LatestMap = new Map();

  const isDefaultView = !term && !hasPriceFilter && !onlyFavorites;

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
  } else if (hasPriceFilter || onlyFavorites) {
    // Find the matching prices first, then load only the packages they belong to.
    // With the favorites filter the packages are the favorites, so a favorite without
    // a matching price is still listed.
    const favoriteIdList = Array.from(favorites.ids).slice(0, 200);
    if (!onlyFavorites || favoriteIdList.length > 0) {
      latest = buildLatest(await fetchObservations(onlyFavorites ? favoriteIdList : null));
    }
    const ids = onlyFavorites ? favoriteIdList : Array.from(latest.keys()).slice(0, 200);
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
        .limit(onlyFavorites ? 100 : limit + 1);
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
      .limit(limit + 1);
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

  // One product more than shown was loaded: it tells whether 「もっと見る」 is needed.
  const hasMore = !isDefaultView && !onlyFavorites && products.length > limit;
  if (hasMore) products = products.slice(0, limit);

  // One entry per 容量 ...
  const cards: SizeCard[] = products
    .flatMap((product: any) => {
      const name = product.name_ja || product.name_en || "名称未設定";
      const sub = [product.name_ja ? product.name_en : null, product.brand]
        .filter(Boolean)
        .join(" ・ ");
      const pkgs = [product.product_packages].flat().filter(Boolean) as any[];
      return pkgs.map((pkg): SizeCard => {
        const variationObj = Array.isArray(pkg.product_variations)
          ? pkg.product_variations[0]
          : pkg.product_variations ?? null;
        const variationText = variationObj?.attributes
          ? variationLabel(parseAttributes(variationObj.attributes))
          : null;

        return {
          id: pkg.id as string,
          productId: product.id as string,
          name: name as string,
          sub,
          size: packageLabel(pkg.package_size, pkg.package_unit),
          sizeValue: Number(pkg.package_size),
          unit: String(pkg.package_unit),
          variationId: (pkg.variation_id as string | null) ?? null,
          variationLabel: variationText,
          taxRate: (product.tax_rate as number | null) ?? null,
          favorite: favoriteLevel(
            pkg.id as string,
            product.id as string,
            pkg.variation_id as string | null,
            favorites.ids,
            favorites.groups
          ),
          rows: Array.from(latest.get(pkg.id)?.values() ?? []).sort(
            (a, b) =>
              new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
          ),
        };
      });
    })
    .filter((card) => !hasPriceFilter || card.rows.length > 0);

  // ... and the 容量 of one product are shown together in one card (variation chips inside).
  const productMap = new Map<string, { id: string; name: string; sub: string; items: SizeCard[] }>();
  for (const card of cards) {
    const entry = productMap.get(card.productId) ?? {
      id: card.productId,
      name: card.name,
      sub: card.sub,
      items: [],
    };
    entry.items.push(card);
    productMap.set(card.productId, entry);
  }
  const productCards = Array.from(productMap.values());
  const emptyPriceText = f.period === "all" ? "まだ価格がありません" : "この期間の価格がありません";

  // A search that matched no product name at all: offer similar names and 「この名前で商品を追加」.
  const noMatch = term !== "" && matchedIds.length === 0;
  const similar = noMatch ? await findSimilarProducts(supabase, term, scope) : [];

  // The 「もっと見る」 link: the same search and filters, 20 more products.
  const moreParams = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (key === "limit" || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) moreParams.append(key, item);
  }
  moreParams.set("limit", String(Math.min(MAX_LIMIT, limit + PAGE_SIZE)));
  const moreHref = `/check?${moreParams.toString()}`;

  const clearHref = term ? `/check?q=${encodeURIComponent(term)}` : "/check";

  return (
    <div className="space-y-6">
      <CheckScrollMemory />
      <h1 className="text-2xl font-bold text-stone-900">価格確認</h1>

      <form action="/check" className="space-y-3">
        <SearchSuggestions terms={suggestions} active={term} />

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
            <SearchScopeChips key={scope} current={scope}>
              {loggedIn && (
                <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-line bg-panel px-3 text-sm text-stone-600 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600">
                  <input
                    type="checkbox"
                    name="fav"
                    value="1"
                    defaultChecked={f.favorites}
                    className="sr-only"
                  />
                  <Heart className="h-4 w-4" />
                  お気に入りのみ
                </label>
              )}
            </SearchScopeChips>
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

            <CategoryFilter key={f.categories.join(",")} selected={f.categories} />

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

            <PeriodFilter key={`${f.period}-${f.from}-${f.to}`} period={f.period} from={f.from} to={f.to} />

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

      {productCards.length === 0 && noMatch ? (
        <SearchEmptyHelp term={term} similar={similar} canAdd={loggedIn} searchPath="/check" />
      ) : productCards.length === 0 ? (
        <p className="text-stone-500">
          {onlyFavorites && favorites.ids.size === 0
            ? "お気に入りがまだありません。商品名の横のハートをタップして登録できます。"
            : hasPriceFilter
              ? "条件に合う価格がありません"
              : "見つかりませんでした"}
        </p>
      ) : (
        <div className="space-y-4">
          {productCards.map((pc) => {
            const groups = groupByVariation(pc.items);
            const tabs = groups.map((g) => ({
              key: g.key,
              label: g.label,
              content: (
                <div className="space-y-3">
                  {g.items.map((card) => (
                    <SizeBlock
                      key={card.id}
                      card={card}
                      loggedIn={loggedIn}
                      emptyText={emptyPriceText}
                    />
                  ))}
                </div>
              ),
            }));
            // One variation only: its name is shown as text, not as a chip.
            const single = groups.length === 1 ? groups[0] : null;
            const onlyVariation = single && single.key !== "none" ? single.label : null;
            return (
              <div
                key={pc.id}
                className="rounded-2xl border border-line bg-panel p-4 shadow-sm"
              >
                <p className="text-lg font-bold text-stone-900">{pc.name}</p>
                {pc.sub && <p className="text-sm text-stone-500">{pc.sub}</p>}
                {onlyVariation && <p className="text-sm text-stone-500">{onlyVariation}</p>}
                <div className="mt-3">
                  <VariationTabs groups={tabs} initialIndex={defaultGroupIndex(groups)} memoryKey={pc.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    {hasMore && limit < MAX_LIMIT && (
        <Link
          href={moreHref}
          scroll={false}
          className="flex h-12 items-center justify-center rounded-xl border border-line bg-panel text-base font-medium text-stone-700 hover:bg-panel-soft"
        >
          もっと見る
        </Link>
      )}
      {hasMore && limit >= MAX_LIMIT && (
        <p className="text-center text-xs text-stone-500">
          先頭の{limit}件を表示しています。検索や絞り込みで探せます。
        </p>
      )}
    </div>
  );
}