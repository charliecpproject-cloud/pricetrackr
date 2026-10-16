"use client";

import { useActionState, useEffect, useState } from "react";
import { addPackage } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, controlCls } from "@/components/FormParts";

type ProductOption = {
  id: string;
  name_ja: string | null;
  name_en: string | null;
};

type VariationOption = {
  id: string;
  productId: string;
  label: string;
};

type Props = {
  products: ProductOption[];
  variations: VariationOption[];
};

export default function PackageForm({ products, variations }: Props) {
  const initialState = { error: null as string | null };
  const [state, formAction, pending] = useActionState(addPackage, initialState);

  // 選択中の商品 ID とバリエーション ID を管理
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariationId, setSelectedVariationId] = useState<string>("");

  // 商品が変わったらバリエーション選択をリセット
  useEffect(() => {
    setSelectedVariationId("");
  }, [selectedProductId]);

  // 現在選択されている商品のバリエーションだけを抽出
  const productVariations = variations.filter((v) => v.productId === selectedProductId);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="商品" kind="required" htmlFor="package_product_id">
        <select
          id="package_product_id"
          name="product_id"
          required
          className={controlCls}
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
        >
          <option value="">商品を選択</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name_ja || p.name_en || "商品名なし"}
            </option>
          ))}
        </select>
      </Field>

      {/* バリエーション選択（商品にバリエーションがある場合のみ表示） */}
      {productVariations.length > 0 && (
        <Field label="バリエーション" kind="required" htmlFor="package_variation_id">
          <select
            id="package_variation_id"
            name="variation_id"
            required
            className={controlCls}
            value={selectedVariationId}
            onChange={(e) => setSelectedVariationId(e.target.value)}
          >
            <option value="">バリエーションを選択</option>
            {productVariations.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="容量" kind="required" htmlFor="package_size">
        <input
          id="package_size"
          type="number"
          name="package_size"
          inputMode="decimal"
          placeholder="例：500"
          step="any"
          min="0"
          required
          className={controlCls}
        />
      </Field>

      <Field label="単位" kind="required" htmlFor="package_unit">
        <select id="package_unit" name="package_unit" required className={controlCls}>
          <option value="">単位を選択</option>
          <option value="ml">ml</option>
          <option value="L">L</option>
          <option value="g">g</option>
          <option value="kg">kg</option>
          <option value="count">個</option>
          <option value="sheet">枚</option>
          <option value="bag">袋</option>
        </select>
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}