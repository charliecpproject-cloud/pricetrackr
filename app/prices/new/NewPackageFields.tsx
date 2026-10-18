"use client";

import { useState } from "react";
import { Field, controlCls } from "@/components/FormParts";
import ProductFields from "@/components/ProductFields";

export type ProductOption = {
  id: string;
  label: string;
  variations: { id: string; label: string }[];
};

const UNITS = [
  { value: "ml", label: "ml" },
  { value: "L", label: "L" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "count", label: "個" },
  { value: "sheet", label: "枚" },
  { value: "bag", label: "袋" },
];

// controlCls is full width; the unit dropdown must stay small.
const unitCls = controlCls.replace("w-full", "w-24 shrink-0");

export default function NewPackageFields({
  products,
  defaultProductId = "",
}: {
  products: ProductOption[];
  defaultProductId?: string;
}) {
  const [productId, setProductId] = useState(defaultProductId);
  const [variationId, setVariationId] = useState("");

  const product = products.find((p) => p.id === productId);
  const needsVariation = !!product && product.variations.length > 0;

  return (
    <div className="space-y-4 rounded-xl border border-teal-200 bg-teal-50/50 p-3">
      <input type="hidden" name="new_package" value="1" />

      <Field
        label="商品"
        kind="required"
        htmlFor="np_product_id"
        hint="新しい容量だけを追加する場合は、既存の商品を選んでください。"
      >
        <select
          id="np_product_id"
          name="np_product_id"
          value={productId}
          onChange={(e) => {
            setProductId(e.target.value);
            setVariationId("");
          }}
          className={controlCls}
        >
          <option value="">新しい商品として登録</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </Field>

      {productId === "" ? (
        <ProductFields prefix="np_" />
      ) : needsVariation ? (
        <Field label="バリエーション" kind="required" htmlFor="np_variation_id">
          <select
            id="np_variation_id"
            name="np_variation_id"
            required
            value={variationId}
            onChange={(e) => setVariationId(e.target.value)}
            className={controlCls}
          >
            <option value="">バリエーションを選択</option>
            {product.variations.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <Field label="容量" kind="required" htmlFor="np_size">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <input
              id="np_size"
              name="np_size"
              type="text"
              inputMode="decimal"
              required
              placeholder="例：500"
              className={controlCls}
            />
          </div>
          <select
            name="np_unit"
            required
            defaultValue=""
            aria-label="単位"
            className={unitCls}
          >
            <option value="">単位</option>
            {UNITS.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </Field>
    </div>
  );
}