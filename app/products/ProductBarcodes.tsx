"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import BarcodeInput from "@/components/BarcodeInput";
import { addBarcode, deleteBarcode } from "@/app/products/barcodeActions";

type State = { error: string | null; message?: string | null };
const initial: State = { error: null, message: null };

function BarcodeRow({ id, code }: { id: string; code: string }) {
  const [state, formAction, pending] = useActionState(deleteBarcode, initial);

  return (
    <li className="rounded-xl border border-line bg-panel p-2 pl-3">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 break-all text-sm tabular-nums text-stone-800">{code}</span>
        <form
          action={formAction}
          onSubmit={(e) => {
            if (!window.confirm(`バーコード ${code} を削除しますか？`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="barcode_id" value={id} />
          <button
            type="submit"
            disabled={pending}
            className="h-10 px-3 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            削除
          </button>
        </form>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </li>
  );
}

export default function ProductBarcodes({
  productId,
  barcodes,
}: {
  productId: string;
  barcodes: { id: string; code: string }[];
}) {
  const [state, formAction, pending] = useActionState(addBarcode, initial);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-stone-800">バーコード</h4>
      {barcodes.length === 0 ? (
        <p className="text-xs text-stone-500">まだ登録されていません。</p>
      ) : (
        <ul className="space-y-2">
          {barcodes.map((b) => (
            <BarcodeRow key={b.id} id={b.id} code={b.code} />
          ))}
        </ul>
      )}
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="product_id" value={productId} />
        <BarcodeInput id={`barcode-add-${productId}`} name="code" />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.message && <p className="text-sm text-teal-700">{state.message}</p>}
        <Button type="submit" disabled={pending} className="h-11 w-full">
          {pending ? "追加中…" : "バーコードを追加"}
        </Button>
      </form>
    </div>
  );
}