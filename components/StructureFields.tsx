"use client";

import { useState } from "react";
import { controlCls } from "@/components/FormParts";
import VariationRows from "@/components/VariationRows";
import {
  unitDropdownOptions,
  type CounterUnitOption,
} from "@/lib/prices/unitWords";
import {
  MAX_PACKAGES_PER_GROUP,
  MAX_VARIATIONS,
} from "@/lib/products/structure";

// controlCls is full width; the unit dropdown must stay small.
const unitCls = controlCls.replace("w-full", "w-24 shrink-0");
const addBtnCls =
  "h-10 rounded-xl border border-line px-4 text-sm font-medium text-stone-600 disabled:opacity-40";
const removeBtnCls =
  "h-12 w-12 shrink-0 rounded-xl border border-line text-stone-500 disabled:opacity-40";

// Rows of 容量 (size and unit). Rows left empty are ignored on save.
function PackageRows({
  sizeKey,
  unitKey,
  counterUnits,
}: {
  sizeKey: string;
  unitKey: string;
  counterUnits: CounterUnitOption[];
}) {
  const [rows, setRows] = useState([0]);
  const [nextId, setNextId] = useState(1);
  const options = unitDropdownOptions(counterUnits);

  return (
    <div className="space-y-2">
      {rows.map((id) => (
        <div key={id} className="flex gap-2">
          <div className="min-w-0 flex-1">
            <input
              name={sizeKey}
              type="text"
              inputMode="decimal"
              aria-label="容量"
              placeholder="例：500"
              className={controlCls}
            />
          </div>
          <select
            name={unitKey}
            defaultValue=""
            aria-label="単位"
            className={unitCls}
          >
            <option value="">単位</option>
            {options.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label="この行を削除"
            disabled={rows.length <= 1}
            onClick={() => setRows((cur) => cur.filter((r) => r !== id))}
            className={removeBtnCls}
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={rows.length >= MAX_PACKAGES_PER_GROUP}
        onClick={() => {
          setRows((cur) => [...cur, nextId]);
          setNextId((n) => n + 1);
        }}
        className={addBtnCls}
      >
        ＋ 容量を追加
      </button>
    </div>
  );
}

// Variations and 容量 of a new product. Without variations there are loose 容量 rows; with
// variations every card has its own attribute rows and its own 容量 rows (slots 0 to 4).
export default function StructureFields({
  counterUnits,
}: {
  counterUnits: CounterUnitOption[];
}) {
  const [slots, setSlots] = useState<number[]>([]);

  const addVariation = () => {
    const free = Array.from({ length: MAX_VARIATIONS }, (_, i) => i).find(
      (i) => !slots.includes(i),
    );
    if (free !== undefined) setSlots((cur) => [...cur, free]);
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-stone-500">
        容量やバリエーションを、商品と一緒に登録できます。空のままなら商品だけを追加します。
      </p>

      {slots.length === 0 ? (
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-700">容量</p>
          <PackageRows
            sizeKey="st_loose_size"
            unitKey="st_loose_unit"
            counterUnits={counterUnits}
          />
        </div>
      ) : (
        slots.map((slot, index) => (
          <div
            key={slot}
            className="space-y-3 rounded-xl border border-line bg-panel-soft p-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-bold text-stone-800">
                バリエーション {index + 1}
              </p>
              <button
                type="button"
                onClick={() => setSlots((cur) => cur.filter((s) => s !== slot))}
                className="h-9 rounded-lg border border-line px-3 text-sm text-stone-600"
              >
                削除
              </button>
            </div>
            <VariationRows
              nameKey={`st_v${slot}_attr_name`}
              valueKey={`st_v${slot}_attr_value`}
            />
            <p className="text-sm font-medium text-stone-700">
              このバリエーションの容量
            </p>
            <PackageRows
              sizeKey={`st_v${slot}_size`}
              unitKey={`st_v${slot}_unit`}
              counterUnits={counterUnits}
            />
          </div>
        ))
      )}

      <button
        type="button"
        disabled={slots.length >= MAX_VARIATIONS}
        onClick={addVariation}
        className={addBtnCls}
      >
        ＋ バリエーションを追加
      </button>
    </div>
  );
}
