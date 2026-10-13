"use client";

import { useActionState } from "react";
import { useState, useEffect } from "react";
import { addPackage } from "./actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
  const [state, formAction] = useActionState(addPackage, initialState);

  // 選択中の商品 ID とバリエーション ID を管理
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedVariationId, setSelectedVariationId] = useState<string>("");

  // 商品が変わったらバリエーション選択をリセット
  useEffect(() => {
    setSelectedVariationId("");
  }, [selectedProductId]);

  // 現在選択されている商品のバリエーションだけを抽出
  const productVariations = variations.filter(
    (v) => v.productId === selectedProductId
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">
          商品にパッケージを追加
        </CardTitle>
      </CardHeader>
      <CardContent>
        {state.error && <p className="text-red-600 mb-2">{state.error}</p>}

        <form action={formAction} className="grid grid-cols-1 gap-3">
          {/* 商品選択 */}
          <div>
            <Label htmlFor="product_id">商品</Label>
            <select
              id="product_id"
              name="product_id"
              required
              className="border rounded p-2"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">商品を選択</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_ja || p.name_en || "Unnamed Product"}
                </option>
              ))}
            </select>
          </div>

          {/* バリエーション選択（商品にバリエーションがある場合のみ表示） */}
          {productVariations.length > 0 && (
            <div>
              <Label htmlFor="variation_id">バリエーション</Label>
              <select
                id="variation_id"
                name="variation_id"
                required
                className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base"
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
            </div>
          )}

          {/* 容量入力 */}
          <div>
            <Label htmlFor="package_size">容量</Label>
            <Input
              id="package_size"
              type="number"
              name="package_size"
              placeholder="例: 500"
              step="any"
              min="0"
              required
            />
          </div>

          {/* 単位選択 */}
          <div>
            <Label htmlFor="package_unit">単位</Label>
            <select
              id="package_unit"
              name="package_unit"
              required
              className="h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base"
            >
              <option value="">単位を選択</option>
              <option value="ml">ml</option>
              <option value="L">L</option>
              <option value="g">g</option>
              <option value="kg">kg</option>
              <option value="count">個</option>
              <option value="sheet">枚</option>
              <option value="bag">袋</option>
            </select>
          </div>

          <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
            追加
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
