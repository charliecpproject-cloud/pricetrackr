"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field, controlCls } from "@/components/FormParts";
import { CATEGORY_LABEL, STORE_CATEGORIES } from "@/lib/stores/category";
import { addStoreChain } from "./actions";

export default function StoreForm() {
  const initialState = { error: null as string | null };
  const [state, formAction, pending] = useActionState(addStoreChain, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <Field label="チェーン名" kind="required" htmlFor="new_chain_name">
        <input
          id="new_chain_name"
          name="name"
          required
          maxLength={100}
          placeholder="例：ライフ"
          className={controlCls}
        />
      </Field>
      <Field label="カテゴリ" kind="optional" htmlFor="new_chain_category">
        <select
          id="new_chain_category"
          name="category"
          defaultValue=""
          className={controlCls}
        >
          <option value="">未分類</option>
          {STORE_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </Field>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}