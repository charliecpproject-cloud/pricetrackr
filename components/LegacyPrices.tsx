import { formatDateTime } from "@/lib/dateTime";
import { saleLabel } from "@/lib/stores/category";
import type { LegacyPackage } from "@/lib/prices/loadLegacy";
import PriceAge from "@/components/PriceAge";
import PriceDisplay from "@/components/PriceDisplay";
import UnitPriceSummary from "@/components/UnitPriceSummary";
import LegacyAdminButtons from "@/components/LegacyAdminButtons";

// Prices of products that were merged into this one. They are not part of the latest price,
// 最安 or the price range. Only admins see the buttons.
export default function LegacyPrices({
  items,
  taxRate,
  isAdmin,
}: {
  items: LegacyPackage[];
  taxRate: number | null;
  isAdmin: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-lg font-bold text-stone-900">旧価格</h2>
        <p className="text-sm text-stone-500">
          統合された商品の価格です。最新価格や最安の比較には含まれません。
        </p>
      </div>

      {items.map((item) => (
        <div
          key={item.packageId}
          className="rounded-2xl border border-line bg-panel p-4 shadow-sm"
        >
          <p className="font-bold text-stone-900">旧「{item.productName}」</p>
          <p className="text-sm text-stone-500">
            {item.label} ・ 価格の記録{item.entries}件
          </p>

          <ul className="mt-2 divide-y divide-stone-100">
            {item.rows.map((r) => (
              <li
                key={r.chainId}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3"
              >
                <div className="min-w-0">
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
                    taxRate={taxRate}
                    taxBasis={r.taxBasis}
                    size="md"
                  />
                  <UnitPriceSummary summary={r.unitSummary} />
                </div>
              </li>
            ))}
          </ul>

          {isAdmin && (
            <LegacyAdminButtons
              packageId={item.packageId}
              label={item.label}
              entries={item.entries}
            />
          )}
        </div>
      ))}
    </section>
  );
}