"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, controlCls } from "@/components/FormParts";
import { addShop } from "./actions";

type Chain = {
  id: string;
  name: string;
};

export default function ShopForm({
  chains,
  selectedChainId,
}: {
  chains: Chain[];
  selectedChainId?: string;
}) {
  const initialState = { error: null as string | null };
  const [state, formAction, pending] = useActionState(addShop, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="チェーン" kind="required" htmlFor="shop_chain_id">
        <select
          id="shop_chain_id"
          name="store_chain_id"
          required
          defaultValue={selectedChainId ?? ""}
          className={controlCls}
        >
          <option value="">チェーンを選択</option>
          {chains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="支店名" kind="required" htmlFor="shop_name">
        <input
          id="shop_name"
          name="name"
          required
          maxLength={100}
          placeholder="例：練馬店"
          className={controlCls}
        />
      </Field>
      <Field label="住所" kind="optional" htmlFor="shop_address">
        <input id="shop_address" name="address" maxLength={200} className={controlCls} />
      </Field>
      <Field label="地域" kind="optional" htmlFor="shop_region">
        <input id="shop_region" name="region" maxLength={200} className={controlCls} />
      </Field>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}