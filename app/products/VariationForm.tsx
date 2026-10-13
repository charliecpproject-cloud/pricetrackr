"use client";

import React, { useState, useEffect, useRef } from "react";
import { useActionState } from "react";
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
  // Action state for server action
  const [actionState, formAction] = useActionState(
    addVariation,
    { error: null, message: null }
  );

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
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, name: value } : r))
    );
  };

  const handleValueChange = (id: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, value: value } : r))
    );
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
    <section className="p-4 bg-white rounded shadow">
      <h2 className="text-xl font-bold mb-2">バリエーションを追加</h2>

      <p className="text-sm mb-1">
        「サイズや種類など、価格を別々に管理したい違いがある場合に入力してください。」
      </p>
      <p className="text-sm mb-1">
        「バリエーションを登録すると、それぞれを別の商品として価格履歴を管理します。」
      </p>
      <p className="text-sm mb-4">
        「バリエーションを登録しない場合は、商品名単位で価格を管理します。」
      </p>

      {actionState.error && (
        <p className="text-red-600 mb-2">{actionState.error}</p>
      )}
      {actionState.message && (
        <p className="text-green-600 mb-2">{actionState.message}</p>
      )}

      <form action={formAction} method="post" className="space-y-4">
        {/* 商品選択 */}
        <div>
          <label htmlFor="product_id" className="block mb-1 font-medium">
            商品
          </label>
          <select
            name="product_id"
            id="product_id"
            required
            className="w-full border rounded p-2"
          >
            <option value="">商品を選択</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* 属性行 */}
        <div>
          {rows.map((row, index) => (
            <div
              key={row.id}
              className="flex items-center gap-2 mb-2"
            >
              <input
                type="text"
                name="attr_name"
                placeholder="例：サイズ"
                list="attribute-names"
                maxLength={30}
                value={row.name}
                onChange={(e) => handleNameChange(row.id, e.target.value)}
                className="flex-1 border rounded p-2"
                required
              />
              <input
                type="text"
                name="attr_value"
                placeholder="例：M"
                maxLength={30}
                value={row.value}
                onChange={(e) => handleValueChange(row.id, e.target.value)}
                className="flex-1 border rounded p-2"
                required
              />
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="text-red-600 hover:text-red-800"
                aria-label="行を削除"
                disabled={rows.length <= 1}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addRow}
            className="mt-2 text-blue-600 hover:underline"
            disabled={rows.length >= 8}
          >
            行を追加
          </button>
        </div>

        {/* データリスト */}
        <datalist id="attribute-names">
          {attributeNames.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        {/* 送信ボタン */}
        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            追加
          </button>
        </div>
      </form>
    </section>
  );
}
