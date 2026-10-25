import BackToSearchLink from "@/components/BackToSearchLink";
import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { packageLabel } from "@/lib/prices/format";
import { formatDateTime } from "@/lib/dateTime";
import PriceAge from "@/components/PriceAge";
import PriceDisplay from "@/components/PriceDisplay";
import { parseTaxBasis } from "@/lib/prices/tax";
import { parseCategory, saleLabel } from "@/lib/stores/category";
import { parseStoredTiers } from "@/lib/prices/bulk";
import { pointUseMultiplierOf } from "@/lib/prices/points";
import { unitPriceSummary } from "@/lib/prices/unitLines";
import UnitPriceSummary from "@/components/UnitPriceSummary";
import DeleteObservationButton from "@/components/DeleteObservationButton";
import { deletePriceObservation } from "./actions";
import { getViewer } from "@/lib/auth/viewer";
import FavoriteButton from "@/components/FavoriteButton";
import AddPriceButton from "@/components/AddPriceButton";
import { loadFavorites } from "@/lib/prices/loadFavorites";
import { favoriteLevel } from "@/lib/prices/favorites";
import { parseAttributes, variationLabel } from "@/lib/products/variation";
import { loadLegacyPrices } from "@/lib/prices/loadLegacy";
import LegacyPrices from "@/components/LegacyPrices";
import PriceHistoryChart from "@/components/PriceHistoryChart";
import { buildHistory, type HistoryRow } from "@/lib/prices/history";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const { packageId } = await params;
  if (!z.string().uuid().safeParse(packageId).success)
    return { title: "価格確認" };

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("product_packages")
    .select("products (name_ja, name_en)")
    .eq("id", packageId)
    .maybeSingle();
  const product: any = [data?.products].flat()[0] ?? {};
  return { title: product.name_ja || product.name_en || "価格確認" };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ packageId: string }>;
}) {
  const { packageId } = await params;
  if (!z.string().uuid().safeParse(packageId).success) {
    notFound();
  }

  const supabase = await createSupabaseServerClient();
  const viewer = await getViewer();
  const readOnly = !viewer.loggedIn;

  const { data: pkg, error: pkgError } = await supabase
    .from("product_packages")
    .select(
      "id, product_id, variation_id, package_size, package_unit, products (name_en, name_ja, brand, memo, tax_rate), product_variations (attributes)",
    )
    .eq("id", packageId)
    .single();
  if (pkgError) {
    console.error("Package fetch error:", pkgError.message, pkgError.code);
  }
  if (!pkg) {
    // An old link to a 容量 of a product that was merged into another: go to the new product.
    if (viewer.loggedIn) {
      const { data: target } = await supabase.rpc("merged_package_target", {
        p_package: packageId,
      });
      if (typeof target === "string") redirect(`/check/${target}`);
    }
    notFound();
  }

  const product: any = [pkg.products].flat()[0] ?? {};
  const name = product.name_ja || product.name_en || "名称未設定";

  // Variation handling
  const variation = [pkg.product_variations].flat()[0];
  const variationText =
    variation && variation.attributes
      ? variationLabel(parseAttributes(variation.attributes))
      : null;

  const { data: observations, error: obsError } = await supabase
    .from("price_observations")
    .select(
      "id, store_chain_id, price, observed_at, created_at, is_sale, is_member_price, bonus_points, tax_basis, bulk_tiers, notes, store_chains (name, category, coupon_percents, member_discount_percent, point_use_enabled, point_use_multiplier), shops (name)",
    )
    .eq("product_package_id", packageId)
    .order("observed_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(20);
  if (obsError) {
    console.error("Observations fetch error:", obsError.message, obsError.code);
  }

  const rows = ((observations ?? []) as any[]).map((obs) => {
    const chain = [obs.store_chains].flat()[0];
    const branch = [obs.shops].flat()[0];
    return {
      id: obs.id as string,
      chainId: (obs.store_chain_id as string | null) ?? null,
      price: obs.price as number | string,
      observedAt: obs.observed_at as string,
      isSale: !!obs.is_sale,
      notes: (obs.notes as string | null) ?? "",
      isMemberPrice: !!obs.is_member_price,
      bonusPoints: (obs.bonus_points as number | null) ?? null,
      bulkTiers: parseStoredTiers(obs.bulk_tiers),
      taxBasis: parseTaxBasis(obs.tax_basis),
      unitSummary: unitPriceSummary({
        enteredPrice: Number(obs.price),
        couponPercents: chain?.coupon_percents ?? [],
        memberPercent: chain?.member_discount_percent ?? null,
        isMemberPrice: !!obs.is_member_price,
        bulkTiers: parseStoredTiers(obs.bulk_tiers),
        size: Number(pkg.package_size),
        regularLabel: obs.is_sale
          ? `${saleLabel(parseCategory(chain?.category))}価格`
          : undefined,
        unit: pkg.package_unit,
      }),
      memberPercent:
        (chain?.member_discount_percent as number | null | undefined) ?? null,
      pointUseMultiplier: pointUseMultiplierOf(
        chain?.point_use_enabled,
        chain?.point_use_multiplier,
      ),
      chainName: (chain?.name as string | undefined) ?? "",
      category: parseCategory(chain?.category),
      branchName: (branch?.name as string | undefined) ?? "",
      couponPercents: (chain?.coupon_percents as number[] | undefined) ?? [],
    };
  });
  const latest = rows[0];

  // The charts use the whole history of this package (the list below shows only the newest 20).
  const { data: historyData, error: historyError } = await supabase
    .from("price_observations")
    .select(
      "price, observed_at, tax_basis, store_chain_id, store_chains (name)",
    )
    .eq("product_package_id", packageId)
    .order("observed_at", { ascending: false })
    .limit(500);
  if (historyError) {
    console.error(
      "History fetch error:",
      historyError.message,
      historyError.code,
    );
  }
  const historyRows: HistoryRow[] = ((historyData ?? []) as any[]).map((o) => ({
    observedAt: o.observed_at as string,
    price: Number(o.price),
    taxBasis: parseTaxBasis(o.tax_basis),
    chainId: (o.store_chain_id as string | null) ?? null,
    chainName: ([o.store_chains].flat()[0]?.name as string | undefined) ?? "",
  }));
  const historyAll = buildHistory(historyRows);
  const historyChain = latest?.chainId
    ? buildHistory(historyRows, { chainId: latest.chainId })
    : null;
  // The chain chart only differs from the first one when 2 or more chains have prices.
  const chainCount = new Set(historyRows.map((r) => r.chainId)).size;
  // Prices of products that were merged into this one (visitors see none).
  const legacy = readOnly
    ? []
    : await loadLegacyPrices(supabase, pkg.product_id as string);

  // The heart in the header (visitors have no favorites and see no heart).
  const favorites = readOnly ? null : await loadFavorites(supabase);
  const favoriteState = favorites
    ? favoriteLevel(
        pkg.id as string,
        pkg.product_id as string,
        pkg.variation_id as string | null,
        favorites.ids,
        favorites.groups,
      )
    : null;

  return (
    <div className="space-y-6">
      <BackToSearchLink>← 検索に戻る</BackToSearchLink>

      <div>
        <div className="flex items-center gap-1">
          {favoriteState && (
            <span className="-ml-2.5 shrink-0">
              <FavoriteButton
                packageId={pkg.id as string}
                level={favoriteState}
              />
            </span>
          )}
          <h1 className="min-w-0 text-2xl font-bold text-stone-900">{name}</h1>
        </div>
        {variationText && (
          <p className="text-sm text-stone-500">{variationText}</p>
        )}
        <p className="mt-1 text-sm text-stone-500">
          {[product.brand, packageLabel(pkg.package_size, pkg.package_unit)]
            .filter(Boolean)
            .join(" ・ ")}
        </p>
        {product.memo && (
          <div className="mt-4 rounded-md border border-line bg-panel p-3 shadow-sm">
            <h3 className="text-sm font-medium text-stone-900 mb-1">メモ</h3>
            <p className="whitespace-pre-wrap text-sm text-stone-700">
              {product.memo}
            </p>
          </div>
        )}
      </div>

      <AddPriceButton
        packageId={packageId}
        chainId={latest?.chainId ?? null}
        disabled={readOnly}
      />

      {latest ? (
        <div className="rounded-2xl border border-line bg-panel p-5 shadow-sm">
          <p className="text-sm text-stone-500">最新価格</p>
          <div className="mt-1">
            <PriceDisplay
              price={latest.price}
              couponPercents={latest.couponPercents}
              memberPercent={latest.memberPercent}
              isMemberPrice={latest.isMemberPrice}
              regularLabel={
                latest.isSale ? `${saleLabel(latest.category)}価格` : undefined
              }
              pointUseMultiplier={latest.pointUseMultiplier}
              bulkTiers={latest.bulkTiers}
              taxRate={product.tax_rate ?? null}
              taxBasis={latest.taxBasis}
              size="lg"
              align="start"
            />
            <UnitPriceSummary summary={latest.unitSummary} align="start" />
          </div>
          <p className="mt-2 text-sm text-stone-500">
            {latest.chainName}
            {latest.branchName ? `（${latest.branchName}）` : ""} ・{" "}
            {formatDateTime(latest.observedAt)}
            <PriceAge iso={latest.observedAt} className="ml-1.5" />
            {latest.bonusPoints ? (
              <span className="ml-2 text-amber-700">
                +{latest.bonusPoints}ポイント
              </span>
            ) : null}
          </p>
        </div>
      ) : (
        <p className="text-stone-500">まだ価格がありません</p>
      )}

      {historyAll && <PriceHistoryChart view={historyAll} scope="all" />}
      {historyChain && chainCount > 1 && (
        <PriceHistoryChart
          view={historyChain}
          scope="chain"
          chainName={latest?.chainName}
        />
      )}

      {rows.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-stone-900">価格の履歴</h2>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-line bg-panel p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="flex flex-wrap items-center gap-2 font-medium text-stone-900">
                    {r.chainName}
                    {r.branchName && (
                      <span className="text-sm font-normal text-stone-500">
                        （{r.branchName}）
                      </span>
                    )}
                    {r.isSale && (
                      <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                        {saleLabel(r.category)}
                      </span>
                    )}
                  </p>
                  <PriceDisplay
                    price={r.price}
                    couponPercents={r.couponPercents}
                    memberPercent={r.memberPercent}
                    isMemberPrice={r.isMemberPrice}
                    regularLabel={
                      r.isSale ? `${saleLabel(r.category)}価格` : undefined
                    }
                    pointUseMultiplier={r.pointUseMultiplier}
                    bulkTiers={r.bulkTiers}
                    taxRate={product.tax_rate ?? null}
                    taxBasis={r.taxBasis}
                    size="md"
                    className="ml-auto"
                  />
                </div>
                <p className="mt-1 text-xs text-stone-500">
                  {formatDateTime(r.observedAt)}
                  <PriceAge iso={r.observedAt} className="ml-1.5" />
                  {r.bonusPoints ? (
                    <span className="ml-2 text-amber-700">
                      +{r.bonusPoints}ポイント
                    </span>
                  ) : null}
                </p>
                <UnitPriceSummary summary={r.unitSummary} align="start" />
                {r.notes && (
                  <p className="mt-2 text-sm text-stone-700">{r.notes}</p>
                )}
                <div className="mt-2">
                  <DeleteObservationButton
                    id={r.id}
                    packageId={packageId}
                    action={deletePriceObservation}
                    disabled={readOnly}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <LegacyPrices
        items={legacy}
        taxRate={product.tax_rate ?? null}
        isAdmin={viewer.isAdmin}
      />
    </div>
  );
}
