"use client";

import { useState } from "react";
import { Badge, Field, controlCls } from "@/components/FormParts";
import Collapsible from "@/components/Collapsible";
import ProductFields from "@/components/ProductFields";
import VariationRows from "@/components/VariationRows";
import {
  unitDropdownOptions,
  type CounterUnitOption,
} from "@/lib/prices/unitWords";

export type ProductOption = {
  id: string;
  label: string;
  variations: { id: string; label: string }[];
};

// controlCls is full width; the unit dropdown must stay small.
const unitCls = controlCls.replace("w-full", "w-24 shrink-0");

// Value of the variation dropdown that means "type a new variation".
const NEW_VARIATION = "__new__";

const hintCls = "text-xs text-stone-500";

export default function NewPackageFields({
  products,
  defaultProductId = "",
  counterUnits,
}: {
  products: ProductOption[];
  defaultProductId?: string;
  counterUnits: CounterUnitOption[];
}) {
  const [productId, setProductId] = useState(defaultProductId);
  const [variationId, setVariationId] = useState("");

  const product = products.find((p) => p.id === productId);
  const needsVariation = !!product && product.variations.length > 0;
  const creatingVariation = variationId === NEW_VARIATION;

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
        <>
          <ProductFields prefix="np_" />
          <Collapsible title="バリエーション" badge={<Badge kind="optional" />}>
            <p className={hintCls}>
              サイズ・味・色など、同じ商品の違いを入力します。下の容量は、このバリエーションのものになります。
            </p>
            <VariationRows nameKey="np_attr_name" valueKey="np_attr_value" />
          </Collapsible>
        </>
      ) : needsVariation ? (
        <>
          <Field
            label="バリエーション"
            kind="required"
            htmlFor="np_variation_id"
          >
            <select
              id="np_variation_id"
              name={creatingVariation ? undefined : "np_variation_id"}
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
              <option value={NEW_VARIATION}>＋ 新しいバリエーション</option>
            </select>
          </Field>
          {creatingVariation && (
            <div className="space-y-2">
              <p className={hintCls}>
                新しいバリエーションを追加します。下の容量は、このバリエーションのものになります。
              </p>
              <VariationRows nameKey="np_attr_name" valueKey="np_attr_value" />
            </div>
          )}
        </>
      ) : (
        <Collapsible title="バリエーション" badge={<Badge kind="optional" />}>
          <p className={hintCls}>
            入力すると、この商品に新しいバリエーションを追加し、下の容量はそのバリエーションのものになります。
          </p>
          <VariationRows nameKey="np_attr_name" valueKey="np_attr_value" />
        </Collapsible>
      )}

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
            {unitDropdownOptions(counterUnits).map((u) => (
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
