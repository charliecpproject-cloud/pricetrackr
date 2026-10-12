"use client";

import { useActionState } from "react";
import { addProduct } from "./actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function ProductForm() {
  const initialState = { error: null as string | null };
  const [state, formAction] = useActionState(addProduct, initialState);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl font-semibold">商品を追加</CardTitle>
      </CardHeader>
      <CardContent>
        {state.error && <p className="text-red-600 mb-2">{state.error}</p>}

        <form action={formAction} className="grid grid-cols-1 gap-3">
          <div>
            <Label htmlFor="name_ja">商品名（日本語）</Label>
            <Input
              id="name_ja"
              type="text"
              name="name_ja"
              placeholder="例: みかん"
            />
          </div>

          <div>
            <Label htmlFor="name_en">商品名（英語）</Label>
            <Input
              id="name_en"
              type="text"
              name="name_en"
              placeholder="例: Orange"
            />
          </div>

          <div>
            <Label htmlFor="brand">ブランド</Label>
            <Input
              id="brand"
              type="text"
              name="brand"
              placeholder="例: サントリー"
            />
          </div>

          <div>
            <Label htmlFor="category">カテゴリ</Label>
            <Input
              id="category"
              type="text"
              name="category"
              placeholder="例: 飲料"
            />
          </div>

          <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
            追加
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
