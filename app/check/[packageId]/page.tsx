import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatJst, packageLabel } from "@/lib/prices/format";
import PriceDisplay from "@/components/PriceDisplay";
import DeleteObservationButton from "@/components/DeleteObservationButton";
import { deletePriceObservation } from "./actions";
import { parseAttributes, variationLabel } from "@/lib/products/variation";

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

  const { data: pkg, error: pkgError } = await supabase
    .from("product_packages")
    .select(
      "id, package_size, package_unit, products (name_en, name_ja, brand), product_variations (attributes)"
    )
    .eq("id", packageId)
    .single();
  if (pkgError) {
    console.error("Package fetch error:", pkgError.message, pkgError.code);
  }
  if (!pkg) {
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
      "id, price, observed_at, created_at, is_sale, is_member_price, bonus_points, notes, store_chains (name, coupon_percents, member_discount_percent), shops (name)"
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
      price: obs.price as number | string,
      observedAt: obs.observed_at as string,
      isSale: !!obs.is_sale,
      notes: (obs.notes as string | null) ?? "",
      isMemberPrice: !!obs.is_member_price,
      bonusPoints: (obs.bonus_points as number | null) ?? null,
      memberPercent: (chain?.member_discount_percent as number | null | undefined) ?? null,
      chainName: (chain?.name as string | undefined) ?? "",
      branchName: (branch?.name as string | undefined) ?? "",
      couponPercents: (chain?.coupon_percents as number[] | undefined) ?? [],
    };
  });
  const latest = rows[0];

  return (
    <div className="space-y-6">
      <Link href="/check" className="inline-block text-sm font-medium text-teal-700">
        ← 検索に戻る
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">{name}</h1>
        {variationText && (
          <p className="text-sm text-stone-500">{variationText}</p>
        )}
        <p className="mt-1 text-sm text-stone-500">
          {[product.brand, packageLabel(pkg.package_size, pkg.package_unit)]
            .filter(Boolean)
            .join(" ・ ")}
        </p>
      </div>

      {latest ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-stone-500">最新価格</p>
          <div className="mt-1">
            <PriceDisplay price={latest.price} couponPercents={latest.couponPercents} memberPercent={latest.memberPercent} isMemberPrice={latest.isMemberPrice} size="lg" />
          </div>
          <p className="mt-2 text-sm text-stone-500">
            {latest.chainName}
            {latest.branchName ? `（${latest.branchName}）` : ""} ・ {formatJst(latest.observedAt)}{latest.bonusPoints ? <span className="ml-2 text-amber-700">+{latest.bonusPoints}ポイント</span> : null}
          </p>
        </div>
      ) : (
        <p className="text-stone-500">まだ価格がありません</p>
      )}

      {rows.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold text-stone-900">価格の履歴</h2>
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
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
                        特売
                      </span>
                    )}
                  </p>
                  <PriceDisplay price={r.price} couponPercents={r.couponPercents} memberPercent={r.memberPercent} isMemberPrice={r.isMemberPrice} size="md" />
                </div>
                <p className="mt-1 text-xs text-stone-500">{formatJst(r.observedAt)}{r.bonusPoints ? <span className="ml-2 text-amber-700">+{r.bonusPoints}ポイント</span> : null}</p>
                {r.notes && <p className="mt-2 text-sm text-stone-700">{r.notes}</p>}
                <div className="mt-2">
                  <DeleteObservationButton
                    id={r.id}
                    packageId={packageId}
                    action={deletePriceObservation}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
