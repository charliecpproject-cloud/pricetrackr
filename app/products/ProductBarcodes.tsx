"use client";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";

import { Button } from "@/components/ui/button";
import { controlCls } from "@/components/FormParts";
import BarcodeInput from "@/components/BarcodeInput";
import { addBarcode, deleteBarcode } from "@/app/products/barcodeActions";

type State = { error: string | null; message?: string | null };
const initial: State = { error: null, message: null };

function BarcodeRow({ code, packageLabel }: { code: string; packageLabel: string | null }) {
  const [state, formAction, pending] = useToastedActionState(deleteBarcode, initial);

  return (
    <li className="rounded-xl border border-line bg-panel p-2 pl-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="break-all text-sm tabular-nums text-stone-800">{code}</p>
          <p className="text-xs text-stone-500">
            {packageLabel ? `容量：${packageLabel}` : "容量：指定なし"}
          </p>
        </div>
        <form
          action={formAction}
          onSubmit={(e) => {
            if (!window.confirm(`バーコード ${code} を削除しますか？`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="barcode_code" value={code} />
          <button
            type="submit"
            disabled={pending}
            className="h-10 shrink-0 px-3 text-sm font-medium text-red-600 disabled:opacity-50"
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
  packages,
}: {
  productId: string;
  barcodes: { code: string; package_id?: string | null }[];
  packages: { id: string; label: string }[];
}) {
  const [state, formAction, pending] = useToastedActionState(addBarcode, initial);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-bold text-stone-800">バーコード</h4>
      {barcodes.length === 0 ? (
        <p className="text-xs text-stone-500">まだ登録されていません。</p>
      ) : (
        <ul className="space-y-2">
          {barcodes.map((b) => (
            <BarcodeRow
              key={b.code}
              code={b.code}
              packageLabel={packages.find((p) => p.id === b.package_id)?.label ?? null}
            />
          ))}
        </ul>
      )}
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="product_id" value={productId} />
        <BarcodeInput id={`barcode-add-${productId}`} name="code" />
        {packages.length > 0 && (
          <div>
            <select
              name="package_id"
              defaultValue=""
              aria-label="容量（任意）"
              className={controlCls}
            >
              <option value="">容量を指定しない</option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-stone-500">
              容量を選ぶと、読み取ったときにその容量が選ばれます（任意）。
            </p>
          </div>
        )}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.message && <p className="text-sm text-teal-700">{state.message}</p>}
        <Button type="submit" disabled={pending} className="h-11 w-full">
          {pending ? "追加中…" : "バーコードを追加"}
        </Button>
      </form>
    </div>
  );
}