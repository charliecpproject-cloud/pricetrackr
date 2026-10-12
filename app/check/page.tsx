import Link from "next/link";
import { Search } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatJst, packageLabel } from "@/lib/prices/format";
import { bestCouponPercent, couponPrice } from "@/lib/prices/coupon";
import PriceDisplay from "@/components/PriceDisplay";

type ChainPrice = {
  chainId: string;
  chainName: string;
  price: number;
  observedAt: string;
  isSale: boolean;
  couponPercents: number[];
  effective: number;
};

export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  // Keep the search term short and free of characters that break the filter.
  const term = (q ?? "").trim().slice(0, 50).replace(/[,()%_*\\]/g, "");

  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from("products")
    .select(
      "id, name_en, name_ja, brand, product_packages (id, package_size, package_unit)"
    )
    .order("name_en", { ascending: true })
    .limit(20);
  if (term) {
    query = query.or(
      `name_en.ilike.%${term}%,name_ja.ilike.%${term}%,brand.ilike.%${term}%`
    );
  }
  const { data: products, error: productsError } = await query;
  if (productsError) {
    console.error("Products fetch error:", productsError.message, productsError.code);
  }

  const packageIds = (products ?? []).flatMap((p: any) =>
    ([p.product_packages].flat().filter(Boolean) as any[]).map((pkg) => pkg.id as string)
  );

  // For every package: the latest price at each chain.
  const latest = new Map<string, Map<string, ChainPrice>>();
  if (packageIds.length > 0) {
    const { data: observations, error: obsError } = await supabase
      .from("price_observations")
      .select(
        "product_package_id, price, observed_at, created_at, is_sale, store_chain_id, store_chains (name, coupon_percents)"
      )
      .in("product_package_id", packageIds)
      .order("observed_at", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(500);
    if (obsError) {
      console.error("Observations fetch error:", obsError.message, obsError.code);
    }

    for (const obs of (observations ?? []) as any[]) {
      const perPackage =
        latest.get(obs.product_package_id) ?? new Map<string, ChainPrice>();
      if (!perPackage.has(obs.store_chain_id)) {
        const chain = [obs.store_chains].flat()[0];
        const price = Number(obs.price);
        const percents: number[] = chain?.coupon_percents ?? [];
        const percent = bestCouponPercent(percents);
        perPackage.set(obs.store_chain_id, {
          chainId: obs.store_chain_id,
          chainName: chain?.name ?? "",
          price,
          observedAt: obs.observed_at,
          isSale: !!obs.is_sale,
          couponPercents: percents,
          effective: percent === null ? price : couponPrice(price, percent),
        });
      }
      latest.set(obs.product_package_id, perPackage);
    }
  }

  const cards = (products ?? []).flatMap((product: any) => {
    const name = product.name_ja || product.name_en || "名称未設定";
    const sub = [product.name_ja ? product.name_en : null, product.brand]
      .filter(Boolean)
      .join(" ・ ");
    const pkgs = [product.product_packages].flat().filter(Boolean) as any[];
    return pkgs.map((pkg) => ({
      id: pkg.id as string,
      name: name as string,
      sub,
      size: packageLabel(pkg.package_size, pkg.package_unit),
      rows: Array.from(latest.get(pkg.id)?.values() ?? []).sort(
        (a, b) => a.effective - b.effective
      ),
    }));
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-stone-900">価格確認</h1>

      <form action="/check" method="get" className="relative">
        <input
          name="q"
          type="search"
          defaultValue={term}
          placeholder="商品名・ブランドで検索"
          className="h-12 w-full rounded-xl border border-stone-200 bg-white pl-11 pr-24 text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
        />
        <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-stone-400" />
        <button
          type="submit"
          className="absolute right-1.5 top-1.5 h-9 rounded-lg bg-teal-600 px-4 text-sm font-medium text-white"
        >
          検索
        </button>
      </form>

      {cards.length === 0 ? (
        <p className="text-stone-500">見つかりませんでした</p>
      ) : (
        <div className="space-y-4">
          {cards.map((card) => (
            <Link
              key={card.id}
              href={`/check/${card.id}`}
              className="block rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-lg font-bold text-stone-900">{card.name}</p>
                  {card.sub && <p className="text-sm text-stone-500">{card.sub}</p>}
                </div>
                <span className="shrink-0 rounded-full bg-stone-100 px-2.5 py-1 text-sm font-medium text-stone-700">
                  {card.size}
                </span>
              </div>

              {card.rows.length === 0 ? (
                <p className="mt-3 text-sm text-stone-500">まだ価格がありません</p>
              ) : (
                <ul className="mt-3 divide-y divide-stone-100">
                  {card.rows.map((r, i) => (
                    <li
                      key={r.chainId}
                      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3"
                    >
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-medium text-stone-900">
                          {r.chainName}
                          {r.isSale && (
                            <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-xs font-bold text-amber-700">
                              特売
                            </span>
                          )}
                          {card.rows.length > 1 && i === 0 && (
                            <span className="rounded-md bg-teal-100 px-1.5 py-0.5 text-xs font-bold text-teal-700">
                              最安
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-stone-500">{formatJst(r.observedAt)}</p>
                      </div>
                      <PriceDisplay
                        price={r.price}
                        couponPercents={r.couponPercents}
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