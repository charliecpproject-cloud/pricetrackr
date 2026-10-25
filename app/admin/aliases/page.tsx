import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import { countCategories } from "@/lib/products/category";
import AliasAddForm from "./AliasAddForm";
import AliasRow from "./AliasRow";

type AliasRecord = {
  id: string;
  canonical: string;
  alias: string;
  enabled: boolean;
};

export const metadata = { title: "検索の別名" };

export default async function AliasesPage() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect("/");

  const supabase = await createSupabaseServerClient();
  const [aliasesResult, productsResult] = await Promise.all([
    supabase
      .from("search_aliases")
      .select("id, canonical, alias, enabled")
      .order("canonical", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("products").select("category, brand").limit(5000),
  ]);
  if (aliasesResult.error) {
    console.error(
      "Aliases fetch error:",
      aliasesResult.error.message,
      aliasesResult.error.code,
    );
  }

  const aliases = (aliasesResult.data ?? []) as AliasRecord[];
  const products = (productsResult.data ?? []) as {
    category: string | null;
    brand: string | null;
  }[];

  // Words that already exist as categories (with the number of products) or brands.
  const categoryCounts = countCategories(products.map((p) => p.category));
  const countByCategory = new Map(
    categoryCounts.map((c) => [c.name.toLowerCase(), c.count]),
  );
  const suggestions = Array.from(
    new Set([
      ...categoryCounts.map((c) => c.name),
      ...products.map((p) => (p.brand ?? "").trim()).filter(Boolean),
    ]),
  ).sort((a, b) => a.localeCompare(b, "ja"));

  const groups = new Map<string, AliasRecord[]>();
  for (const a of aliases) {
    const list = groups.get(a.canonical) ?? [];
    list.push(a);
    groups.set(a.canonical, list);
  }

  const cardCls = "rounded-2xl border border-line bg-panel p-4 shadow-sm";

  return (
    <div className="space-y-6">
      <Link
        href="/admin"
        className="inline-block text-sm font-medium text-teal-700"
      >
        ← 管理者ツールに戻る
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">検索の別名</h1>
        <p className="mt-1 text-sm text-stone-500">
          言葉（例：ベビーフード）に別名（例：離乳食、baby
          food）を登録すると、別名で検索しても、その言葉の商品が見つかります。別名そのものを含む商品も、これまでどおり見つかります。
        </p>
      </div>

      <section className={cardCls}>
        <h2 className="mb-3 text-lg font-bold text-stone-900">別名を追加</h2>
        <AliasAddForm suggestions={suggestions} />
      </section>

      {groups.size === 0 ? (
        <p className="text-stone-500">まだ別名がありません。</p>
      ) : (
        <div className="space-y-4">
          {Array.from(groups.entries()).map(([canonical, rows]) => {
            const count = countByCategory.get(canonical.toLowerCase());
            return (
              <section key={canonical} className={cardCls}>
                <h2 className="text-lg font-bold text-stone-900">
                  {canonical}
                </h2>
                {count !== undefined && (
                  <p className="text-xs text-stone-500">
                    カテゴリ ・ 商品{count}件
                  </p>
                )}
                <ul className="mt-3 space-y-2">
                  {rows.map((r) => (
                    <AliasRow
                      key={r.id}
                      id={r.id}
                      alias={r.alias}
                      enabled={r.enabled}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-xs text-stone-500">
        チェックを外すと、その別名は使われません。別名の登録は管理者だけができます。
      </p>
    </div>
  );
}
