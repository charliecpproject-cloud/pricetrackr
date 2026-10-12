"use client";

import { useActionState } from "react";
import { addShop } from "./actions";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

type Chain = {
  id: string;
  name: string;
};

export default function ShopForm({ chains }: { chains: Chain[] }) {
  // 初期状態: エラーメッセージなし
  const initialState = { error: null as string | null };
  const [state, formAction] = useActionState(addShop, initialState);

  return (
    <Card className="max-w-xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-xl">支店を追加</CardTitle>
      </CardHeader>
      <CardContent>
        {state.error && (
          <p className="text-red-500 mb-2">{state.error}</p>
        )}
        <form action={formAction} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="store_chain_id">チェーン</Label>
            <select
              id="store_chain_id"
              name="store_chain_id"
              required
              className="border rounded p-2 w-full"
            >
              <option value="">チェーンを選択</option>
              {chains.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="name">支店名</Label>
            <Input
              id="name"
              name="name"
              placeholder="支店名"
              required
            />
          </div>

          <div>
            <Label htmlFor="address">住所（任意）</Label>
            <Input
              id="address"
              name="address"
              placeholder="住所（任意）"
            />
          </div>

          <div>
            <Label htmlFor="region">地域（任意）</Label>
            <Input
              id="region"
              name="region"
              placeholder="地域（任意）"
            />
          </div>

          <Button type="submit" className="self-start">
            追加
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
