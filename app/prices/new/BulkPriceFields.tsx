import { Badge, controlCls, labelCls } from "@/components/FormParts";
import { BULK_MAX_TIERS, type BulkTier } from "@/lib/prices/bulk";

export type BulkRow = { quantity: string; percent: string };

const MIN_ROWS = 2;

export function emptyBulkRows(): BulkRow[] {
  return Array.from({ length: MIN_ROWS }, () => ({ quantity: "", percent: "" }));
}

// Form rows from stored tiers, padded to at least two rows.
export function rowsFromTiers(tiers: BulkTier[]): BulkRow[] {
  const rows = tiers
    .slice(0, BULK_MAX_TIERS)
    .map((t) => ({ quantity: String(t.quantity), percent: String(t.percent) }));
  while (rows.length < MIN_ROWS) rows.push({ quantity: "", percent: "" });
  return rows;
}

// "This chain has bulk discount tiers" + up to 3 rows of quantity and percent.
// The entered price is the regular 1-item price. Shown only when the chosen chain
// has the bulk option. The first row is required, the others may stay empty.
export default function BulkPriceFields({
  chain,
  checked,
  onCheckedChange,
  tiers,
  onTiersChange,
}: {
  chain: { id: string; bulkEnabled: boolean } | undefined;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  tiers: BulkRow[];
  onTiersChange: (rows: BulkRow[]) => void;
}) {
  if (!chain || !chain.bulkEnabled) return null;

  const update = (index: number, field: keyof BulkRow, value: string) =>
    onTiersChange(tiers.map((row, i) => (i === index ? { ...row, [field]: value } : row)));

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
          まとめ買い割引があります（入力した価格は1個の通常価格です）
          <Badge kind="optional" />
          <span className="mt-0.5 block text-xs text-stone-500">
            決まった個数以上まとめて買うと安くなるときにチェックします。個数と割引率を最大{BULK_MAX_TIERS}段階まで入力できます。
          </span>
        </span>
      </label>

      {checked && (
        <div className="space-y-3">
          {tiers.map((row, i) => (
            <div key={i} className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor={`bulk_quantity_${i}`} className={labelCls}>
                  個数（以上）
                  <Badge kind={i === 0 ? "required" : "optional"} />
                </label>
                <input
                  id={`bulk_quantity_${i}`}
                  name="bulk_quantity"
                  type="text"
                  inputMode="numeric"
                  required={i === 0}
                  value={row.quantity}
                  onChange={(e) => update(i, "quantity", e.target.value)}
                  placeholder={i === 0 ? "例：10" : "例：20"}
                  className={controlCls}
                />
              </div>
              <div>
                <label htmlFor={`bulk_percent_${i}`} className={labelCls}>
                  割引率（%）
                  <Badge kind={i === 0 ? "required" : "optional"} />
                </label>
                <input
                  id={`bulk_percent_${i}`}
                  name="bulk_percent"
                  type="text"
                  inputMode="numeric"
                  required={i === 0}
                  value={row.percent}
                  onChange={(e) => update(i, "percent", e.target.value)}
                  placeholder={i === 0 ? "例：20" : "例：25"}
                  className={controlCls}
                />
              </div>
            </div>
          ))}
          {tiers.length < BULK_MAX_TIERS && (
            <button
              type="button"
              onClick={() => onTiersChange([...tiers, { quantity: "", percent: "" }])}
              className="h-10 rounded-xl border border-line bg-panel px-3 text-sm font-medium text-stone-700 active:scale-95"
            >
              ＋ 段階を追加
            </button>
          )}
        </div>
      )}
    </div>
  );
}