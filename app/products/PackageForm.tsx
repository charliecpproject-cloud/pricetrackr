"use client";

import { useActionState } from "react";
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

type Props = {
  products: ProductOption[];
};

export default function PackageForm({ products }: Props) {
  const initialState = { error: null as string | null };
  const [state, formAction] = useActionState(addPackage, initialState);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">商品にパッケージを追加</CardTitle>
      </CardHeader>
      <CardContent>
        {state.error && <p className="text-red-600 mb-2">{state.error}</p>}

        <form action={formAction} className="grid grid-cols-1 gap-3">
          <div>
            <Label htmlFor="product_id">商品</Label>
            <select
              id="product_id"
              name="product_id"
              required
              className="border rounded p-2"
            >
              <option value="">商品を選択</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_ja || p.name_en || "Unnamed Product"}
                </option>
              ))}
            </select>
          </div>

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
