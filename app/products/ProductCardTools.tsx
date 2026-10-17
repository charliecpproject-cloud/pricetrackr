"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, controlCls } from "@/components/FormParts";
import { updateProduct, updateVariation } from "@/app/products/productActions";
import { parseAttributes, variationLabel, type Attribute } from "@/lib/products/variation";

type Product = {
  id: string;
  name_ja: string | null;
  name_en: string | null;
  brand: string | null;
  category: string | null;
  product_variations?: unknown;
};

type State = { error: string | null; message?: string | null };
const initial: State = { error: null, message: null };

function Messages({ state }: { state: State }) {
  return (
    <>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="text-sm text-teal-700">{state.message}</p>}
    </>
  );
}

function ProductEditForm({ product }: { product: Product }) {
  const [state, formAction, pending] = useActionState(updateProduct, initial);
  const main = product.name_ja || product.name_en || "";
  const alias = product.name_ja ? (product.name_en ?? "") : "";

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={product.id} />
      <Field label="商品名" kind="required" htmlFor={`name-${product.id}`}>
        <input
          id={`name-${product.id}`}
          name="name"
          required
          maxLength={100}
          defaultValue={main}
          className={controlCls}
        />
      </Field>
      <Field
        label="英語名・別名"
        kind="optional"
        htmlFor={`other-${product.id}`}
        hint="英語名やニックネームなど、検索に使える別の呼び方を入力できます。"
      >
        <input
          id={`other-${product.id}`}
          name="other_name"
          maxLength={100}
          defaultValue={alias}
          className={controlCls}
        />
      </Field>
      <Field label="ブランド" kind="optional" htmlFor={`brand-${product.id}`}>
        <input
          id={`brand-${product.id}`}
          name="brand"
          maxLength={100}
          defaultValue={product.brand ?? ""}
          className={controlCls}
        />
      </Field>
      <Field label="カテゴリ" kind="optional" htmlFor={`category-${product.id}`}>
        <input
          id={`category-${product.id}`}
          name="category"
          maxLength={100}
          defaultValue={product.category ?? ""}
          className={controlCls}
        />
      </Field>
      <Messages state={state} />
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}
function VariationEditForm({ id, attributes }: { id: string; attributes: Attribute[] }) {
  const [state, formAction, pending] = useActionState(updateVariation, initial);
  const [rows, setRows] = useState(() =>
    attributes.map((a, i) => ({ id: i, name: a.name, value: a.value }))
  );
  const [nextId, setNextId] = useState(attributes.length);

  const change = (rowId: number, patch: { name?: string; value?: string }) =>
    setRows((cur) => cur.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-xl border border-line bg-panel p-3"
    >
      <input type="hidden" name="variation_id" value={id} />
      <p className="text-sm font-medium text-stone-700">{variationLabel(attributes)}</p>
      {rows.map((row) => (
        <div key={row.id} className="flex gap-2">
          <input
            name="attr_name"
            aria-label="名前"
            value={row.name}
            onChange={(e) => change(row.id, { name: e.target.value })}
            maxLength={30}
            placeholder="例：サイズ"
            className={controlCls}
          />
          <input
            name="attr_value"
            aria-label="値"
            value={row.value}
            onChange={(e) => change(row.id, { value: e.target.value })}
            maxLength={30}
            placeholder="例：M"
            className={controlCls}
          />
          <button
            type="button"
            aria-label="この行を削除"
            disabled={rows.length <= 1}
            onClick={() => setRows((cur) => cur.filter((r) => r.id !== row.id))}
            className="h-12 w-12 shrink-0 rounded-xl border border-line text-stone-500 disabled:opacity-40"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={rows.length >= 8}
        onClick={() => {
          setRows((cur) => [...cur, { id: nextId, name: "", value: "" }]);
          setNextId((n) => n + 1);
        }}
        className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-stone-600 disabled:opacity-40"
      >
        行を追加
      </button>
      <Messages state={state} />
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}

export default function ProductCardTools({ product }: { product: Product }) {
  const variations = (
    [product.product_variations].flat().filter(Boolean) as { id: string; attributes: unknown }[]
  ).map((v) => ({ id: v.id, attributes: parseAttributes(v.attributes) }));

  return (
    <details className="mt-3 rounded-xl bg-panel-soft p-3">
      <summary className="cursor-pointer text-sm font-medium text-teal-700">商品を編集</summary>
      <div className="mt-3 space-y-6">
        <ProductEditForm product={product} />
        {variations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-stone-800">バリエーションを編集</h4>
            {variations.map((v) => (
              <VariationEditForm key={v.id} id={v.id} attributes={v.attributes} />
            ))}
          </div>
        )}
      </div>
    </details>
  );
}