"use client";

import { useActionState } from "react";
import { updateProductMemo } from "@/app/products/memoActions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function ProductMemoEditor({
  productId,
  memo,
}: {
  productId: string;
  memo: string | null;
}) {
  const [state, formAction, pending] = useActionState(updateProductMemo, initialState);

  return (
    <details className="mt-3 rounded-xl bg-panel-soft p-3">
      <summary className="cursor-pointer text-sm font-medium text-teal-700">
        メモを編集
      </summary>
      <form action={formAction} className="mt-3 space-y-3">
        <input type="hidden" name="product_id" value={productId} />
        <Textarea
          key={memo ?? ""}
          name="memo"
          defaultValue={memo ?? ""}
          rows={3}
          maxLength={1000}
          placeholder="例：月曜は特売になりやすい"
          className="text-base"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.message && <p className="text-sm text-teal-700">{state.message}</p>}
        <Button type="submit" disabled={pending} className="h-12 w-full">
          {pending ? "保存中…" : "保存"}
        </Button>
      </form>
    </details>
  );
}