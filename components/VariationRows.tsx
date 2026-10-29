"use client";

import { useState } from "react";
import { controlCls } from "@/components/FormParts";

export const MAX_ATTRIBUTE_ROWS = 8;

// Name and value rows of one variation (サイズ：M, 色：赤, ...). Rows left empty are ignored on save.
export default function VariationRows({
  nameKey,
  valueKey,
  initialRows = 2,
}: {
  nameKey: string;
  valueKey: string;
  initialRows?: number;
}) {
  const [rows, setRows] = useState(() =>
    Array.from({ length: initialRows }, (_, id) => ({
      id,
      name: "",
      value: "",
    })),
  );
  const [nextId, setNextId] = useState(initialRows);

  const change = (rowId: number, patch: { name?: string; value?: string }) =>
    setRows((cur) => cur.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <div key={row.id} className="flex gap-2">
          <input
            name={nameKey}
            aria-label="名前"
            value={row.name}
            onChange={(e) => change(row.id, { name: e.target.value })}
            maxLength={30}
            placeholder="例：サイズ"
            className={controlCls}
          />
          <input
            name={valueKey}
            aria-label="値"
            value={row.value}
            onChange={(e) => change(row.id, { value: e.target.value })}
            maxLength={30}
            placeholder="例：M"
            className={controlCls}
          />
          <button
            type="button"
            aria-label="この行を削除"
            disabled={rows.length <= 1}
            onClick={() => setRows((cur) => cur.filter((r) => r.id !== row.id))}
            className="h-12 w-12 shrink-0 rounded-xl border border-line text-stone-500 disabled:opacity-40"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={rows.length >= MAX_ATTRIBUTE_ROWS}
        onClick={() => {
          setRows((cur) => [...cur, { id: nextId, name: "", value: "" }]);
          setNextId((n) => n + 1);
        }}
        className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-stone-600 disabled:opacity-40"
      >
        行を追加
      </button>
    </div>
  );
}
