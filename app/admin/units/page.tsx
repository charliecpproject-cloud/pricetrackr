import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getViewer } from "@/lib/auth/viewer";
import { MAX_COUNTER_WORDS } from "@/lib/prices/counterWord";
import UnitAddForm from "./UnitAddForm";
import UnitRow from "./UnitRow";

type UnitRecord = { unit: string; label: string; enabled: boolean };

export const metadata = { title: "単位の言葉" };

export default async function UnitsPage() {
  const viewer = await getViewer();
  if (!viewer.isAdmin) redirect("/");

  const supabase = await createSupabaseServerClient();
  const [unitsResult, usageResult] = await Promise.all([
    supabase
      .from("counter_units")
      .select("unit, label, enabled")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.rpc("counter_unit_usage"),
  ]);
  if (unitsResult.error) {
    console.error("Counter units fetch error:", unitsResult.error.message, unitsResult.error.code);
  }
  if (usageResult.error) {
    console.error("Counter unit usage error:", usageResult.error.message, usageResult.error.code);
  }

  const units = (unitsResult.data ?? []) as UnitRecord[];
  const usageKnown = !usageResult.error;
  const usage = new Map<string, number>();
  for (const row of (usageResult.data ?? []) as { unit: string; package_count: number | string }[]) {
    usage.set(row.unit, Number(row.package_count));
  }

  const cardCls = "rounded-2xl border border-line bg-panel p-4 shadow-sm";

  return (
    <div className="space-y-6">
      <Link href="/admin" className="inline-block text-sm font-medium text-teal-700">
        ← 管理者ツールに戻る
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-stone-900">単位の言葉</h1>
        <p className="mt-1 text-sm text-stone-500">
          容量の単位に使う「数える言葉」（個・枚・本・パックなど）を管理します。チェックを入れた言葉が、価格入力と商品の単位の選択肢に表示されます。ml・L・g・kg は固定です。
        </p>
      </div>

      <section className={cardCls}>
        <h2 className="mb-3 text-lg font-bold text-stone-900">言葉を追加</h2>
        <UnitAddForm />
      </section>

      <section className={cardCls}>
        <h2 className="text-lg font-bold text-stone-900">
          登録されている言葉
          <span className="ml-2 text-sm font-normal text-stone-500">
            {units.length} / {MAX_COUNTER_WORDS}
          </span>
        </h2>
        {units.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">言葉を読み込めませんでした。</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {units.map((u) => (
              <UnitRow
                key={u.unit}
                unit={u.unit}
                label={u.label}
                enabled={u.enabled}
                usedCount={usageKnown ? (usage.get(u.unit) ?? 0) : null}
                required={u.unit === "count"}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-stone-500">
        使われていない言葉は削除できます。容量で使われている言葉は、非表示にすると新しい容量では選べなくなります（すでにある容量はそのまま表示されます）。件数には、管理者が削除して非表示になっている容量も含まれます。個は必須のため、非表示にも削除にもできません。
      </p>
    </div>
  );
}