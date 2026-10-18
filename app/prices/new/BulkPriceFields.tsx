import { Badge, controlCls, labelCls } from "@/components/FormParts";

// "The entered price already includes a bulk discount" + percent + quantity.
// Shown only when the chosen chain has the bulk option.
export default function BulkPriceFields({
  chain,
  checked,
  onCheckedChange,
  percent,
  onPercentChange,
  quantity,
  onQuantityChange,
}: {
  chain: { id: string; bulkEnabled: boolean } | undefined;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  percent: string;
  onPercentChange: (value: string) => void;
  quantity: string;
  onQuantityChange: (value: string) => void;
}) {
  if (!chain || !chain.bulkEnabled) return null;

  return (
    <div className="space-y-3 rounded-xl bg-rose-50 p-3 text-sm text-stone-800">
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          name="is_bulk_price"
          checked={checked}
          onChange={(e) => onCheckedChange(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-rose-600"
        />
        <span>
          入力した価格は、まとめ買い割引後の1個あたりの価格です
          <Badge kind="optional" />
          <span className="mt-0.5 block text-xs text-stone-500">
            特定の商品を決まった個数以上まとめて買うと安くなる価格のときにチェックします。
          </span>
        </span>
      </label>

      {checked && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="bulk_percent" className={labelCls}>
              割引率（%） <Badge kind="required" />
            </label>
            <input
              id="bulk_percent"
              name="bulk_percent"
              type="text"
              inputMode="numeric"
              required
              value={percent}
              onChange={(e) => onPercentChange(e.target.value)}
              placeholder="例：20"
              className={controlCls}
            />
          </div>
          <div>
            <label htmlFor="bulk_quantity" className={labelCls}>
              個数（以上） <Badge kind="required" />
            </label>
            <input
              id="bulk_quantity"
              name="bulk_quantity"
              type="text"
              inputMode="numeric"
              required
              value={quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
              placeholder="例：10"
              className={controlCls}
            />
          </div>
        </div>
      )}
    </div>
  );
}