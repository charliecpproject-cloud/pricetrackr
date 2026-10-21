import { Badge, controlCls, labelCls } from "@/components/FormParts";
import { BULK_MAX_TIERS, type BulkMode, type BulkTier } from "@/lib/prices/bulk";

export type BulkRow = { quantity: string; mode: BulkMode; percent: string; total: string };

const MIN_ROWS = 2;

const blankRow = (): BulkRow => ({ quantity: "", mode: "percent", percent: "", total: "" });

export function emptyBulkRows(): BulkRow[] {
  return Array.from({ length: MIN_ROWS }, blankRow);
}

// Form rows from stored tiers, padded to at least two rows.
export function rowsFromTiers(tiers: BulkTier[]): BulkRow[] {
  const rows = tiers.slice(0, BULK_MAX_TIERS).map(
    (t): BulkRow =>
      t.kind === "total"
        ? { quantity: String(t.quantity), mode: "total", percent: "", total: String(t.total) }
        : { quantity: String(t.quantity), mode: "percent", percent: String(t.percent), total: "" }
  );
  while (rows.length < MIN_ROWS) rows.push(blankRow());
  return rows;
}

const MODES: { value: BulkMode; label: string }[] = [
  { value: "percent", label: "割引率" },
  { value: "total", label: "合計金額" },
];

// "This chain has bulk discount tiers" + up to 3 rows. Each row is either a percent off
// ("10個以上 20%引") or a bundle price ("5個で550円"). The entered price is the regular
// 1-item price. Shown only when the chosen chain has the bulk option. The first row is
// required, the others may stay empty. Field names carry the row number (bulk_quantity_0 ...).
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

  const update = (index: number, patch: Partial<BulkRow>) =>
    onTiersChange(tiers.map((row, i) => (i === index ? { ...row, ...patch } : row)));

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
            決まった個数以上まとめて買うと安くなるときにチェックします。「10個以上 20%引」のような割引率か、「5個で550円」のような合計金額を、最大{BULK_MAX_TIERS}段階まで入力できます。
          </span>
        </span>
      </label>

      {checked && (
        <div className="space-y-3">
          {tiers.map((row, i) => (
            <div key={i} className="space-y-2 rounded-xl border border-line bg-panel p-2.5">
              <input type="hidden" name={`bulk_mode_${i}`} value={row.mode} />
              <div className="flex gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    aria-pressed={row.mode === m.value}
                    onClick={() => update(i, { mode: m.value })}
                    className={`h-9 flex-1 rounded-lg border px-2 text-sm ${
                      row.mode === m.value
                        ? "border-teal-600 bg-teal-50 font-bold text-teal-700"
                        : "border-line bg-panel text-stone-600"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`bulk_quantity_${i}`} className={labelCls}>
                    {row.mode === "total" ? "個数（個で）" : "個数（以上）"}
                    <Badge kind={i === 0 ? "required" : "optional"} />
                  </label>
                  <input
                    id={`bulk_quantity_${i}`}
                    name={`bulk_quantity_${i}`}
                    type="text"
                    inputMode="numeric"
                    required={i === 0}
                    value={row.quantity}
                    onChange={(e) => update(i, { quantity: e.target.value })}
                    placeholder={i === 0 ? "例：5" : "例：10"}
                    className={controlCls}
                  />
                </div>
                {row.mode === "total" ? (
                  <div>
                    <label htmlFor={`bulk_total_${i}`} className={labelCls}>
                      合計金額（円）
                      <Badge kind={i === 0 ? "required" : "optional"} />
                    </label>
                    <input
                      id={`bulk_total_${i}`}
                      name={`bulk_total_${i}`}
                      type="text"
                      inputMode="numeric"
                      required={i === 0}
                      value={row.total}
                      onChange={(e) => update(i, { total: e.target.value })}
                      placeholder={i === 0 ? "例：550" : "例：1000"}
                      className={controlCls}
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor={`bulk_percent_${i}`} className={labelCls}>
                      割引率（%）
                      <Badge kind={i === 0 ? "required" : "optional"} />
                    </label>
                    <input
                      id={`bulk_percent_${i}`}
                      name={`bulk_percent_${i}`}
                      type="text"
                      inputMode="numeric"
                      required={i === 0}
                      value={row.percent}
                      onChange={(e) => update(i, { percent: e.target.value })}
                      placeholder={i === 0 ? "例：10" : "例：20"}
                      className={controlCls}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
          {tiers.length < BULK_MAX_TIERS && (
            <button
              type="button"
              onClick={() => onTiersChange([...tiers, blankRow()])}
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