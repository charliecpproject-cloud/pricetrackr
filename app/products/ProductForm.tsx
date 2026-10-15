"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge, Field, controlCls } from "@/components/FormParts";
import { createProduct } from "@/app/products/productActions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function ProductForm() {
  const [state, formAction, pending] = useActionState(createProduct, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <p className="flex items-center text-sm text-stone-500">
        <Badge kind="required" />
        <span className="ml-1">は必ず入力してください。</span>
      </p>

      <Field
        label="商品名"
        kind="required"
        htmlFor="name"
        hint="日本語の名前があれば日本語で入力してください。英語名しかない場合は英語で入力できます。"
      >
        <input
          id="name"
          name="name"
          required
          maxLength={100}
          placeholder="例：超熟 食パン"
          className={controlCls}
        />
      </Field>

      <Field label="ブランド" kind="optional" htmlFor="brand">
        <input
          id="brand"
          name="brand"
          maxLength={100}
          placeholder="例：パスコ"
          className={controlCls}
        />
      </Field>

      <Field label="カテゴリ" kind="optional" htmlFor="category">
        <input
          id="category"
          name="category"
          maxLength={100}
          placeholder="例：パン"
          className={controlCls}
        />
      </Field>

      <Field label="メモ" kind="optional" htmlFor="memo">
        <Textarea
          id="memo"
          name="memo"
          rows={3}
          maxLength={1000}
          placeholder="例：月曜は特売になりやすい"
          className="text-base"
        />
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="text-sm text-teal-700">{state.message}</p>}

      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}