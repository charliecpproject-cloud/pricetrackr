import Image from "next/image";
import Link from "next/link";
import { ChevronRight, PlusCircle, ScanLine, Search, ShieldCheck } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import PriceDisplay from "@/components/PriceDisplay";
import { packageLabel } from "@/lib/prices/format";
import { parseTaxBasis, type TaxBasis } from "@/lib/prices/tax";
import { parseCategory, saleLabel } from "@/lib/stores/category";
import { formatActivityTime } from "@/lib/home/format";
import { greetingText } from "@/lib/home/greeting";

const shortcuts = [
  { href: "/prices/new", label: "価格入力", Icon: PlusCircle },
  { href: "/check", label: "価格確認", Icon: Search },
  { href: "/scan", label: "バーコード", Icon: ScanLine },
];

const FEED_SIZE = 6;

type Activity =
  | {
      kind: "price";
      key: string;
      at: string;
      href: string;
      name: string;
      sizeLabel: string;
      chainName: string;
      saleText: string;
      price: number | string;
      isSale: boolean;
      isMemberPrice: boolean;
      bulkPercent: number | null;
      bulkQuantity: number | null;
      taxBasis: TaxBasis;
    }
  | { kind: "product"; key: string; at: string; href: string; name: string };

export default async function HomePage() {
  const supabase = await createSupabaseServerClient();

  // Everything the page needs is fetched at the same time.
  const [viewer, observationsResult, productsResult] = await Promise.all([
    getViewer(),
    supabase
      .from("price_observations")
      .select(
        `id, price, created_at, is_sale, is_member_price, tax_basis, bulk_percent, bulk_quantity, product_package_id,
         store_chains (name, category),
         product_packages (package_size, package_unit, products (name_ja, name_en))`
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("products")
      .select("id, name_ja, name_en, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  if (observationsResult.error) {
    console.error("Home prices fetch error:", observationsResult.error.message);
  }
  if (productsResult.error) {
    console.error("Home products fetch error:", productsResult.error.message);
  }

  const priceItems: Activity[] = ((observationsResult.data ?? []) as any[]).map((o) => {
    const pkg = [o.product_packages].flat()[0];
    const product = [pkg?.products].flat()[0];
    const chain = [o.store_chains].flat()[0];
    return {
      kind: "price" as const,
      key: `price-${o.id}`,
      at: o.created_at as string,
      href: `/check/${o.product_package_id}`,
      name: product?.name_ja || product?.name_en || "名称未設定",
      sizeLabel: pkg ? packageLabel(pkg.package_size, pkg.package_unit) : "",
      chainName: chain?.name ?? "",
      saleText: saleLabel(parseCategory(chain?.category)),
      price: o.price as number | string,
      isSale: !!o.is_sale,
      isMemberPrice: !!o.is_member_price,
      bulkPercent: (o.bulk_percent as number | null) ?? null,
      bulkQuantity: (o.bulk_quantity as number | null) ?? null,
      taxBasis: parseTaxBasis(o.tax_basis),
    };
  });

  const productItems: Activity[] = ((productsResult.data ?? []) as any[]).map((p) => {
    const name = p.name_ja || p.name_en || "名称未設定";
    return {
      kind: "product" as const,
      key: `product-${p.id}`,
      at: p.created_at as string,
      href: `/products?q=${encodeURIComponent(name)}`,
      name,
    };
  });

  const activities = [...priceItems, ...productItems]
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
    .slice(0, FEED_SIZE);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4 rounded-3xl bg-gradient-to-br from-teal-600 to-teal-500 p-5 text-white shadow-sm">
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={48}
          height={48}
          className="rounded-xl bg-white"
        />
        <div className="min-w-0">
          <p className="text-sm text-white/80">PriceTrackr</p>
          <h1 className="text-xl font-bold">{greetingText(viewer.displayName)}</h1>
          {viewer.loggedIn && !viewer.displayName && (
            <Link href="/settings" className="mt-1 block text-xs text-white/90 underline">
              設定で表示名を登録すると、あいさつに使われます
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {shortcuts.map(({ href, label, Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-panel px-2 py-4 text-center shadow-sm transition hover:bg-panel-soft active:scale-[0.98]"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
              <Icon className="h-6 w-6" />
            </span>
            <span className="text-sm font-bold text-stone-900">{label}</span>
          </Link>
        ))}
      </div>

      <section className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
        <h2 className="text-lg font-bold text-stone-900">最近の更新</h2>
        {activities.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">
            まだ更新はありません。価格を記録すると、ここに表示されます。
          </p>
        ) : (
          <ul className="mt-2 divide-y divide-stone-100">
            {activities.map((a) => (
              <li key={a.key}>
                {a.kind === "price" ? (
                  <Link href={a.href} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900">
                        {a.name}
                        {a.sizeLabel && (
                          <span className="ml-2 rounded-full bg-chip px-2 py-0.5 text-xs font-medium text-stone-700">
                            {a.sizeLabel}
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {a.chainName} ・ {formatActivityTime(a.at)}
                        {a.isSale && (
                          <span className="ml-2 rounded-md bg-amber-100 px-1.5 py-0.5 font-bold text-amber-700">
                            {a.saleText}
                          </span>
                        )}
                      </p>
                    </div>
                    <PriceDisplay
                      price={a.price}
                      isMemberPrice={a.isMemberPrice}
                      bulkPercent={a.bulkPercent}
                      bulkQuantity={a.bulkQuantity}
                      taxBasis={a.taxBasis}
                      size="md"
                    />
                  </Link>
                ) : (
                  <Link href={a.href} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="font-medium text-stone-900">
                        <span className="mr-2 rounded-md bg-teal-100 px-1.5 py-0.5 text-xs font-bold text-teal-700">
                          新商品
                        </span>
                        {a.name}
                      </p>
                      <p className="mt-0.5 text-xs text-stone-500">
                        商品を追加 ・ {formatActivityTime(a.at)}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {viewer.isAdmin && (
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-2xl border border-line bg-panel p-4 shadow-sm transition hover:bg-panel-soft active:scale-[0.99]"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-stone-900">管理者ツール</span>
            <span className="block text-sm text-stone-500">商品の統合など</span>
          </span>
          <ChevronRight className="h-5 w-5 shrink-0 text-stone-400" />
        </Link>
      )}
    </div>
  );
}