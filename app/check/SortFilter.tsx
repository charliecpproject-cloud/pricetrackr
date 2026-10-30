import { labelCls } from "@/components/FormParts";
import RadioChip from "@/components/RadioChip";
import type { SortKey } from "@/lib/prices/sort";

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
    { value: "recent", label: "新しい価格順" },
  ];
  if (loggedIn) options.push({ value: "fav", label: "お気に入りが先頭" });

  return (
    <fieldset className="min-w-0">
      <legend className={labelCls}>並び順</legend>
      <div className="grid grid-cols-2 gap-2">
        {options.map((o) => (
          <RadioChip
            key={o.value}
            name="sort"
            value={o.value}
            label={o.label}
            checked={(current ?? "") === o.value}
          />
        ))}
      </div>
      <p className="mt-1.5 text-xs text-stone-500">
        安い順は、各商品の一番安い価格（「価格の比べ方」で選んだ価格）で並べます。サイズ違いの単価は計算しません。並べ替えは、検索結果の先頭100件が対象です。
      </p>
    </fieldset>
  );
}
