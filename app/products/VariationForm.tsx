"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge, Field, controlCls, labelCls } from "@/components/FormParts";
import { addVariation } from "@/app/products/variationActions";

type Product = {
  id: string;
  label: string;
};

type Props = {
  products: Product[];
  attributeNames: string[];
};

type Row = {
  id: string;
  name: string;
  value: string;
};

export default function VariationForm({ products, attributeNames }: Props) {
  const [actionState, formAction, pending] = useActionState(addVariation, {
    error: null,
    message: null,
  });

  // Row management (controlled)
  const idCounter = useRef(0);
  const generateId = () => {
    idCounter.current += 1;
    return `row-${idCounter.current}`;
  };

  const createEmptyRow = () => ({
    id: generateId(),
    name: "",
    value: "",
  });

  const [rows, setRows] = useState<Row[]>([createEmptyRow(), createEmptyRow()]);

  // Reset rows after successful submission
  useEffect(() => {
    if (actionState.message) {
      setRows([createEmptyRow(), createEmptyRow()]);
    }
  }, [actionState.message]);

  const handleNameChange = (id: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name: value } : r)));
  };

  const handleValueChange = (id: string, value: string) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, value: value } : r)));
  };

  const addRow = () => {
    if (rows.length >= 8) return;
    setRows((prev) => [...prev, createEmptyRow()]);
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-stone-500">
        サイズや種類など、価格履歴を別々に管理したい違いがある場合に入力します。登録しない場合は、商品単位で価格を管理します。
      </p>

      <Field label="商品" kind="required" htmlFor="variation_product_id">
        <select
          name="product_id"
          id="variation_product_id"
          required
          className={controlCls}
        >
          <option value="">商品を選択</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      <div>
        <p className={labelCls}>
          属性（名前と値）
          <Badge kind="required" />
        </p>
        {rows.map((row) => (
          <div key={row.id} className="mb-2 flex gap-2">
            <input
              type="text"
              name="attr_name"
              aria-label="名前"
              placeholder="例：サイズ"
              list="attribute-names"
              maxLength={30}
              value={row.name}
              onChange={(e) => handleNameChange(row.id, e.target.value)}
              className={controlCls}
              required
            />
            <input
              type="text"
              name="attr_value"
              aria-label="値"
              placeholder="例：M"
              maxLength={30}
              value={row.value}
              onChange={(e) => handleValueChange(row.id, e.target.value)}
              className={controlCls}
              required
            />
            <button
              type="button"
              onClick={() => removeRow(row.id)}
              aria-label="この行を削除"
              disabled={rows.length <= 1}
              className="h-12 w-12 shrink-0 rounded-xl border border-stone-200 text-stone-500 disabled:opacity-40"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          disabled={rows.length >= 8}
          className="h-10 rounded-xl border border-stone-200 px-4 text-sm font-medium text-stone-600 disabled:opacity-40"
        >
          行を追加
        </button>
      </div>

      <datalist id="attribute-names">
        {attributeNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {actionState.error && <p className="text-sm text-red-600">{actionState.error}</p>}
      {actionState.message && <p className="text-sm text-teal-700">{actionState.message}</p>}

      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}