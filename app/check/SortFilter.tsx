import FilterGroup from "@/components/FilterGroup";
import type { SortKey } from "@/lib/prices/sort";

const chipCls =
  "flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-xl border border-line bg-panel px-1 text-xs text-stone-600 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600";

// The order of the products: the standard order, cheapest first, newest price first, or
// favorites first (favorites need an account, so visitors do not see that choice).
export default function SortFilter({
  current,
  loggedIn,
}: {
  current: SortKey | null;
  loggedIn: boolean;
}) {
  const options: { value: string; label: string }[] = [
    { value: "", label: "標準" },
    { value: "cheap", label: "安い順" },
    { value: "recent", label: "新しい順" },
  ];
  if (loggedIn) options.push({ value: "fav", label: "お気に入り" });

  return (
    <FilterGroup
      title="並び順"
      tip="安い順は、各商品の一番安い価格（「価格の比べ方」で選んだ価格）で並べます。サイズ違いの単価は計算しません。新しい順は、価格が新しい商品が先頭です。お気に入りは、ハートを付けた商品が先頭です。並べ替えは、検索結果の先頭100件が対象です。"
    >
      <div className={`grid gap-2 ${loggedIn ? "grid-cols-4" : "grid-cols-3"}`}>
        {options.map((o) => (
          <label key={o.value} className={chipCls}>
            <input
              type="radio"
              name="sort"
              value={o.value}
              defaultChecked={(current ?? "") === o.value}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </FilterGroup>
  );
}
