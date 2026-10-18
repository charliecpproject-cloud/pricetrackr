"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, controlCls } from "@/components/FormParts";
import CategoryField from "@/components/CategoryField";
import { updateProduct, updateVariation } from "@/app/products/productActions";
import { deletePackage, deleteProduct, deleteVariation } from "@/app/products/deleteActions";
import { useProductDialogs } from "@/app/products/ProductDialogs";
import { packageLabel } from "@/lib/prices/format";
import { parseAttributes, variationLabel, type Attribute } from "@/lib/products/variation";

type Product = {
  id: string;
  name_ja: string | null;
  name_en: string | null;
  brand: string | null;
  category: string | null;
  product_variations?: unknown;
  product_packages?: unknown;
};

type PackageRow = {
  id: string;
  variation_id: string | null;
  package_size: number;
  package_unit: string;
};

type State = { error: string | null; message?: string | null };
const initial: State = { error: null, message: null };

// null = the number of price records could not be loaded.
type Count = number | null;

const countText = (count: Count) => (count === null ? "件数不明" : `${count}件`);

// The line of a delete confirmation that tells what happens to price records.
function priceLine(count: Count, isAdmin: boolean): string {
  if (count === null) return "価格の記録：件数を取得できませんでした";
  if (count === 0) return "価格の記録：0件（そのまま削除されます）";
  if (isAdmin) {
    return `価格の記録：${count}件\n【管理者の上書き削除】記録は残りますが、画面には表示されなくなります。`;
  }
  return `価格の記録：${count}件`;
}

const isOverride = (count: Count, isAdmin: boolean) =>
  isAdmin && count !== null && count > 0;

// A regular user cannot delete when records exist: skip the dialog, the server explains.
const blockedForUser = (count: Count, isAdmin: boolean) =>
  !isAdmin && count !== null && count > 0;

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
        <CategoryField
          id={`category-${product.id}`}
          name="category"
          defaultValue={product.category ?? ""}
        />
      </Field>
      <Messages state={state} />
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}

function VariationDeleteForm({
  id,
  packageCount,
  priceCount,
  isAdmin,
}: {
  id: string;
  packageCount: number;
  priceCount: Count;
  isAdmin: boolean;
}) {
  const [state, formAction, pending] = useActionState(deleteVariation, initial);
  const target =
    packageCount > 0 ? `このバリエーションと容量${packageCount}件` : "このバリエーション";
  const override = isOverride(priceCount, isAdmin);

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (blockedForUser(priceCount, isAdmin)) return;
          if (
            !window.confirm(
              `${target}を削除しますか？\n${priceLine(priceCount, isAdmin)}\nこの操作は元に戻せません。`
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="variation_id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className={`h-11 text-sm text-red-600 disabled:opacity-50 ${
            override ? "font-bold" : "font-medium"
          }`}
        >
          {override ? "このバリエーションを上書き削除" : "このバリエーションを削除"}
          （価格の記録 {countText(priceCount)}）
        </button>
      </form>
      <Messages state={state} />
    </div>
  );
}

function VariationEditForm({
  id,
  attributes,
  packageCount,
  priceCount,
  isAdmin,
}: {
  id: string;
  attributes: Attribute[];
  packageCount: number;
  priceCount: Count;
  isAdmin: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateVariation, initial);
  const [rows, setRows] = useState(() =>
    attributes.map((a, i) => ({ id: i, name: a.name, value: a.value }))
  );
  const [nextId, setNextId] = useState(attributes.length);

  const change = (rowId: number, patch: { name?: string; value?: string }) =>
    setRows((cur) => cur.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2 rounded-xl border border-line bg-panel p-3">
      <form action={formAction} className="space-y-3">
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
      <VariationDeleteForm
        id={id}
        packageCount={packageCount}
        priceCount={priceCount}
        isAdmin={isAdmin}
      />
    </div>
  );
}

function PackageRowItem({
  id,
  label,
  priceCount,
  isAdmin,
}: {
  id: string;
  label: string;
  priceCount: Count;
  isAdmin: boolean;
}) {
  const [state, formAction, pending] = useActionState(deletePackage, initial);
  const override = isOverride(priceCount, isAdmin);

  return (
    <li className="rounded-xl border border-line bg-panel p-2 pl-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm text-stone-800">{label}</p>
          <p className="text-xs text-stone-500">価格の記録 {countText(priceCount)}</p>
        </div>
        <form
          action={formAction}
          onSubmit={(e) => {
            if (blockedForUser(priceCount, isAdmin)) return;
            if (
              !window.confirm(
                `この容量（${label}）を削除しますか？\n${priceLine(priceCount, isAdmin)}\nこの操作は元に戻せません。`
              )
            ) {
              e.preventDefault();
            }
          }}
        >
          <input type="hidden" name="package_id" value={id} />
          <button
            type="submit"
            disabled={pending}
            className={`h-10 shrink-0 px-3 text-sm text-red-600 disabled:opacity-50 ${
              override ? "font-bold" : "font-medium"
            }`}
          >
            {override ? "上書き削除" : "削除"}
          </button>
        </form>
      </div>
      <Messages state={state} />
    </li>
  );
}

function ProductDeleteForm({
  id,
  name,
  priceCount,
}: {
  id: string;
  name: string;
  priceCount: Count;
}) {
  const [state, formAction, pending] = useActionState(deleteProduct, initial);
  const line =
    priceCount === null
      ? "価格の記録：件数を取得できませんでした"
      : priceCount === 0
        ? "価格の記録：0件"
        : `価格の記録：${priceCount}件は残りますが、画面には表示されなくなります。`;

  return (
    <div className="space-y-1 rounded-xl border border-red-200 p-3">
      <p className="text-sm font-bold text-stone-800">管理者メニュー</p>
      <p className="text-xs text-stone-500">
        価格の記録はデータベースに残りますが、画面には表示されなくなります。
      </p>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (
            !window.confirm(
              `「${name}」を削除しますか？\n容量・バリエーションも画面に表示されなくなります。\n${line}`
            )
          ) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={id} />
        <button
          type="submit"
          disabled={pending}
          className="h-11 text-sm font-medium text-red-600 disabled:opacity-50"
        >
          この商品を削除（価格の記録 {countText(priceCount)}）
        </button>
      </form>
      <Messages state={state} />
    </div>
  );
}

const addBtnCls =
  "flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-line bg-panel px-3 text-sm font-medium text-stone-700 hover:bg-panel-soft active:scale-[0.99]";

export default function ProductCardTools({
  product,
  isAdmin = false,
  priceCounts = null,
}: {
  product: Product;
  isAdmin?: boolean;
  // price records per package id; null = could not be loaded
  priceCounts?: Record<string, number> | null;
}) {
  const { openAddVariation, openAddPackage } = useProductDialogs();

  const variations = (
    [product.product_variations].flat().filter(Boolean) as { id: string; attributes: unknown }[]
  ).map((v) => ({ id: v.id, attributes: parseAttributes(v.attributes) }));
  const packages = [product.product_packages].flat().filter(Boolean) as PackageRow[];
  const variationLabels = new Map(variations.map((v) => [v.id, variationLabel(v.attributes)]));
  const productName = product.name_ja || product.name_en || "この商品";

  const packageCount = (pkgId: string): Count =>
    priceCounts === null ? null : (priceCounts[pkgId] ?? 0);
  const sumCount = (list: PackageRow[]): Count =>
    priceCounts === null ? null : list.reduce((sum, p) => sum + (priceCounts[p.id] ?? 0), 0);

  const dialogProduct = {
    id: product.id,
    name: productName,
    variations: variations.map((v) => ({ id: v.id, label: variationLabel(v.attributes) })),
  };

  return (
    <>
      <details className="mt-3 rounded-xl bg-panel-soft p-3">
        <summary className="cursor-pointer text-sm font-medium text-teal-700">商品を編集</summary>
        <div className="mt-3 space-y-6">
          <ProductEditForm product={product} />

          {variations.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-stone-800">バリエーションを編集</h4>
              {variations.map((v) => {
                const own = packages.filter((p) => p.variation_id === v.id);
                return (
                  <VariationEditForm
                    key={v.id}
                    id={v.id}
                    attributes={v.attributes}
                    packageCount={own.length}
                    priceCount={sumCount(own)}
                    isAdmin={isAdmin}
                  />
                );
              })}
              <p className="text-xs text-stone-500">
                {isAdmin
                  ? "価格の記録があるバリエーションは、管理者のみ上書き削除できます（記録は残り、非表示になります）。"
                  : "価格の記録があるバリエーションは削除できません。"}
              </p>
            </div>
          )}

          {packages.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-stone-800">容量を編集</h4>
              <ul className="space-y-2">
                {packages.map((p) => (
                  <PackageRowItem
                    key={p.id}
                    id={p.id}
                    isAdmin={isAdmin}
                    priceCount={packageCount(p.id)}
                    label={[
                      p.variation_id ? variationLabels.get(p.variation_id) : null,
                      packageLabel(p.package_size, p.package_unit),
                    ]
                      .filter(Boolean)
                      .join(" ・ ")}
                  />
                ))}
              </ul>
              <p className="text-xs text-stone-500">
                {isAdmin
                  ? "価格の記録がある容量は、管理者のみ上書き削除できます（記録は残り、非表示になります）。"
                  : "価格の記録がある容量は削除できません。"}
              </p>
            </div>
          )}

          {isAdmin && (
            <ProductDeleteForm id={product.id} name={productName} priceCount={sumCount(packages)} />
          )}
        </div>
      </details>

      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => openAddVariation(dialogProduct)} className={addBtnCls}>
          <Plus className="h-4 w-4" />
          バリエーションを追加
        </button>
        <button type="button" onClick={() => openAddPackage(dialogProduct)} className={addBtnCls}>
          <Plus className="h-4 w-4" />
          容量を追加
        </button>
      </div>
    </>
  );
}