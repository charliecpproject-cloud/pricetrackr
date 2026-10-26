import { labelCls } from "@/components/FormParts";

const chipCls =
  "flex h-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-panel px-3 text-sm text-stone-600 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600";

const OPTIONS = [
  { value: "discounted", label: "割引後" },
  { value: "normal", label: "通常価格" },
] as const;

// Which price decides the 最安 badge and the price range: the price after coupon or
// membership (割引後), or the price as entered (通常価格).
export default function CompareFilter({
  current,
}: {
  current: "discounted" | "normal";
}) {
  return (
    <fieldset className="min-w-0">
      <legend className={labelCls}>価格の比べ方</legend>
      <div className="grid grid-cols-2 gap-2">
        {OPTIONS.map((o) => (
          <label key={o.value} className={chipCls}>
            <input
              type="radio"
              name="cmp"
              value={o.value}
              defaultChecked={current === o.value}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      <p className="mt-1.5 text-xs text-stone-500">
        最安の表示と価格帯の絞り込みに使う価格です。通常価格は、入力した価格のままで比べます。
      </p>
    </fieldset>
  );
}
