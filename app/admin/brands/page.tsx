import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import { countCategories, normalize } from "@/lib/products/category";
import BrandMergeForm from "./BrandMergeForm";
import BrandAliasAddForm from "./BrandAliasAddForm";
import BrandAliasRow from "./BrandAliasRow";

type AliasRecord = { id: string; brand: string; alias: string };
type ProductRow = { id: string; name_ja: string | null; name_en: string | null; brand: string | null };
type BrandCard = { name: string; count: number; aliases: AliasRecord[] };

export const metadata = { title: "ブランドの管理" };

export default async function BrandsPage() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect("/");

  const supabase = await createSupabaseServerClient();
  const [productsResult, aliasesResult] = await Promise.all([
    supabase.from("products").select("id, name_ja, name_en, brand").limit(5000),
    supabase
      .from("brand_aliases")
      .select("id, brand, alias")
      .order("brand", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);
  if (productsResult.error) {
    console.error("Products fetch error:", productsResult.error.message, productsResult.error.code);
  }
  if (aliasesResult.error) {
    console.error("Brand aliases fetch error:", aliasesResult.error.message, aliasesResult.error.code);
  }

  const products = (productsResult.data ?? []) as ProductRow[];
  const aliases = (aliasesResult.data ?? []) as AliasRecord[];

  // Brands in use (with the number of products), plus brands that only have aliases.
  const brands = countCategories(products.map((p) => p.brand));
  const countByKey = new Map(brands.map((b) => [normalize(b.name), b.count]));
  const cards = new Map<string, BrandCard>();
  for (const b of brands) cards.set(normalize(b.name), { name: b.name, count: b.count, aliases: [] });
  for (const a of aliases) {
    const key = normalize(a.brand);
    const card = cards.get(key) ?? { name: a.brand, count: 0, aliases: [] };
    card.aliases.push(a);
    cards.set(key, card);
  }
  const list = Array.from(cards.values()).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name, "ja")
  );

  // Products that look the same once aliases are applied (same name and same brand).
  const brandOfAlias = new Map(aliases.map((a) => [normalize(a.alias), a.brand]));
  const groups = new Map<string, string[]>();
  for (const p of products) {
    const name = (p.name_ja || p.name_en || "").trim();
    if (!name) continue;
    const rawBrand = p.brand ?? "";
    const brandKey = normalize(brandOfAlias.get(normalize(rawBrand)) ?? rawBrand);
    const key = `${normalize(name)}|${brandKey}`;
    const label = p.brand ? `${name}（${p.brand}）` : name;
    groups.set(key, [...(groups.get(key) ?? []), label]);
  }
  const duplicates = Array.from(groups.values()).filter((g) => g.length > 1);

  const cardCls = "rounded-2xl border border-line bg-panel p-4 shadow-sm";

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-block text-sm font-medium text-teal-700">
        ← 管理者ツールに戻る
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">ブランドの管理</h1>
        <p className="mt-1 text-sm text-stone-500">
          同じブランドの別の書き方（例：PASCO とパスコ）を1つにまとめます。別名を登録すると、商品を登録するときに自動で正しい名前になり、検索でも見つかります。
        </p>
      </div>

      <section className={cardCls}>
        <h2 className="mb-3 text-lg font-bold text-stone-900">ブランドをまとめる</h2>
        <BrandMergeForm
          brands={list
            .filter((b) => b.count > 0)
            .map((b) => ({ name: b.name, count: b.count }))
            .sort((a, b) => a.name.localeCompare(b.name, "ja"))}
        />
      </section>

      {duplicates.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <h2 className="font-bold">同じ商品かもしれないもの</h2>
          <p className="mt-1">
            商品名とブランドが同じ（別名をそろえたあと）商品です。商品の統合は、次の機能で対応します。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {duplicates.map((g, i) => (
              <li key={i} className="break-words">
                {g.join(" / ")}
              </li>
            ))}
          </ul>
        </section>
      )}

      {list.length === 0 ? (
        <p className="text-stone-500">まだブランドがありません。</p>
      ) : (
        <div className="space-y-4">
          {list.map((b) => (
            <section key={normalize(b.name)} className={cardCls}>
              <h2 className="text-lg font-bold text-stone-900">{b.name}</h2>
              <p className="text-xs text-stone-500">商品{b.count}件</p>
              {b.aliases.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {b.aliases.map((a) => (
                    <BrandAliasRow
                      key={a.id}
                      id={a.id}
                      brand={b.name}
                      alias={a.alias}
                      inUse={countByKey.get(normalize(a.alias)) ?? 0}
                    />
                  ))}
                </ul>
              )}
              <BrandAliasAddForm brand={b.name} />
            </section>
          ))}
        </div>
      )}

      <p className="text-xs text-stone-500">ブランドの管理は管理者だけができます。</p>
    </div>
  );
}