import type { createSupabaseServerClient } from "@/lib/supabase/server";
import { packageLabel } from "@/lib/prices/format";
import { parseAttributes, variationLabel } from "@/lib/products/variation";
import { parseCategory, type StoreCategory } from "@/lib/stores/category";
import { parseStoredTiers, type BulkTier } from "@/lib/prices/bulk";
import { parseTaxBasis, type TaxBasis } from "@/lib/prices/tax";
import { pointUseMultiplierOf } from "@/lib/prices/points";
import { unitPriceSummary } from "@/lib/prices/unitLines";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

// The latest legacy price of one store chain.
export type LegacyPriceRow = {
  chainId: string;
  chainName: string;
  branchName: string;
  category: StoreCategory | null;
  price: number;
  observedAt: string;
  isSale: boolean;
  isMemberPrice: boolean;
  couponPercents: number[];
  memberPercent: number | null;
  pointUseMultiplier: number | null;
  bulkTiers: BulkTier[];
  bonusPoints: number | null;
  taxBasis: TaxBasis;
  unitSummary: ReturnType<typeof unitPriceSummary>;
};

// One legacy 容量 (of an old product that was merged into this one).
export type LegacyPackage = {
  packageId: string;
  productName: string;
  label: string;
  entries: number;
  rows: LegacyPriceRow[];
};

export async function loadLegacyPrices(
  supabase: Supabase,
  productId: string,
): Promise<LegacyPackage[]> {
  const { data: pkgData, error: pkgError } = await supabase.rpc(
    "legacy_packages",
    {
      p_product_id: productId,
    },
  );
  if (pkgError) {
    console.error("Legacy packages error:", pkgError.message, pkgError.code);
    return [];
  }
  const pkgs = (pkgData ?? []) as any[];
  if (pkgs.length === 0) return [];

  const { data: obsData, error: obsError } = await supabase.rpc(
    "legacy_observations",
    {
      p_package_ids: pkgs.map((p) => p.package_id as string),
    },
  );
  if (obsError) {
    console.error(
      "Legacy observations error:",
      obsError.message,
      obsError.code,
    );
    return [];
  }
  const observations = (obsData ?? []) as any[];

  const chainIds = Array.from(
    new Set(
      observations.map((o) => o.store_chain_id as string).filter(Boolean),
    ),
  );
  const shopIds = Array.from(
    new Set(
      observations
        .map((o) => o.shop_id as string | null)
        .filter((x): x is string => !!x),
    ),
  );
  const [chainsResult, shopsResult] = await Promise.all([
    chainIds.length > 0
      ? supabase
          .from("store_chains")
          .select(
            "id, name, category, coupon_percents, member_discount_percent, point_use_enabled, point_use_multiplier",
          )
          .in("id", chainIds)
      : Promise.resolve({ data: [] as any[], error: null }),
    shopIds.length > 0
      ? supabase.from("shops").select("id, name").in("id", shopIds)
      : Promise.resolve({ data: [] as any[], error: null }),
  ]);
  const chains = new Map(
    ((chainsResult.data ?? []) as any[]).map((c) => [c.id as string, c]),
  );
  const shops = new Map(
    ((shopsResult.data ?? []) as any[]).map((s) => [s.id as string, s]),
  );

  return pkgs.map((p): LegacyPackage => {
    const size = Number(p.package_size);
    const unit = String(p.package_unit);
    const variationText = p.variation_attributes
      ? variationLabel(parseAttributes(p.variation_attributes))
      : null;

    // The observations are newest first: the first one of a chain is its latest price.
    const seen = new Set<string>();
    const rows: LegacyPriceRow[] = [];
    for (const o of observations) {
      if (o.product_package_id !== p.package_id) continue;
      const chainId = o.store_chain_id as string;
      if (seen.has(chainId)) continue;
      seen.add(chainId);

      const chain = chains.get(chainId);
      const category = parseCategory(chain?.category);
      const couponPercents: number[] = chain?.coupon_percents ?? [];
      const memberPercent: number | null =
        chain?.member_discount_percent ?? null;
      const bulkTiers = parseStoredTiers(o.bulk_tiers);
      rows.push({
        chainId,
        chainName: (chain?.name as string | undefined) ?? "",
        branchName:
          (o.shop_id ? shops.get(o.shop_id as string)?.name : "") ?? "",
        category,
        price: Number(o.price),
        observedAt: o.observed_at as string,
        isSale: !!o.is_sale,
        isMemberPrice: !!o.is_member_price,
        couponPercents,
        memberPercent,
        pointUseMultiplier: pointUseMultiplierOf(
          chain?.point_use_enabled,
          chain?.point_use_multiplier,
        ),
        bulkTiers,
        bonusPoints: (o.bonus_points as number | null) ?? null,
        taxBasis: parseTaxBasis(o.tax_basis),
        unitSummary: unitPriceSummary({
          enteredPrice: Number(o.price),
          couponPercents,
          memberPercent,
          isMemberPrice: !!o.is_member_price,
          bulkTiers,
          size,
          unit,
        }),
      });
    }

    return {
      packageId: p.package_id as string,
      productName: (p.loser_name as string | null) || "名称未設定",
      label: [variationText, packageLabel(size, unit)]
        .filter(Boolean)
        .join(" ・ "),
      entries: Number(p.price_entries),
      rows,
    };
  });
}
