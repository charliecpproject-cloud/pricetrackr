"use client";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";

import { Button } from "@/components/ui/button";
import { Field, controlCls } from "@/components/FormParts";
import { CATEGORY_LABEL, STORE_CATEGORIES } from "@/lib/stores/category";
import {
  deleteShop,
  deleteStoreChain,
  updateShop,
  updateStoreChain,
} from "./manageActions";

type State = { error: string | null; message: string | null };
const initial: State = { error: null, message: null };

function Messages({ state }: { state: State }) {
  return (
    <>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && (
        <p className="text-sm text-teal-700">{state.message}</p>
      )}
    </>
  );
}

export function ChainEditor({
  chain,
}: {
  chain: { id: string; name: string; category: string | null };
}) {
  const [state, formAction, pending] = useToastedActionState(
    updateStoreChain,
    initial,
  );

  return (
    <div className="rounded-xl bg-panel-soft p-3">
      <p className="text-sm font-bold text-stone-800">
        チェーンの名前・カテゴリ
      </p>
      <form action={formAction} className="mt-3 space-y-4">
        <input type="hidden" name="id" value={chain.id} />
        <Field
          label="チェーン名"
          kind="required"
          htmlFor={`chain-name-${chain.id}`}
        >
          <input
            id={`chain-name-${chain.id}`}
            name="name"
            required
            maxLength={100}
            defaultValue={chain.name}
            className={controlCls}
          />
        </Field>
        <Field
          label="カテゴリ"
          kind="optional"
          htmlFor={`chain-category-${chain.id}`}
        >
          <select
            id={`chain-category-${chain.id}`}
            name="category"
            defaultValue={chain.category ?? ""}
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
        <Messages state={state} />
        <Button type="submit" disabled={pending} className="h-12 w-full">
          {pending ? "保存中…" : "保存"}
        </Button>
      </form>
    </div>
  );
}

export function ChainDeleteButton({
  id,
  shopCount,
}: {
  id: string;
  shopCount: number;
}) {
  const [state, formAction, pending] = useToastedActionState(
    deleteStoreChain,
    initial,
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          const extra =
            shopCount > 0 ? `登録されている支店${shopCount}件も` : "";
          if (
            !window.confirm(
              `このチェーンと${extra}削除しますか？この操作は元に戻せません。`,
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
          このチェーンを削除
        </button>
      </form>
      <Messages state={state} />
    </div>
  );
}

export function ShopRow({
  shop,
}: {
  shop: {
    id: string;
    name: string;
    region: string | null;
    address: string | null;
  };
}) {
  const [saveState, saveAction, saving] = useToastedActionState(
    updateShop,
    initial,
  );
  const [deleteState, deleteAction, deleting] = useToastedActionState(
    deleteShop,
    initial,
  );

  return (
    <li className="rounded-xl border border-line p-3">
      <form action={saveAction} className="space-y-4">
        <input type="hidden" name="id" value={shop.id} />
        <Field label="支店名" kind="required" htmlFor={`shop-name-${shop.id}`}>
          <input
            id={`shop-name-${shop.id}`}
            name="name"
            required
            maxLength={100}
            defaultValue={shop.name}
            className={controlCls}
          />
        </Field>
        <Field label="住所" kind="optional" htmlFor={`shop-address-${shop.id}`}>
          <input
            id={`shop-address-${shop.id}`}
            name="address"
            maxLength={200}
            defaultValue={shop.address ?? ""}
            className={controlCls}
          />
        </Field>
        <Field label="地域" kind="optional" htmlFor={`shop-region-${shop.id}`}>
          <input
            id={`shop-region-${shop.id}`}
            name="region"
            maxLength={200}
            defaultValue={shop.region ?? ""}
            className={controlCls}
          />
        </Field>
        <Messages state={saveState} />
        <Button type="submit" disabled={saving} className="h-12 w-full">
          {saving ? "保存中…" : "保存"}
        </Button>
      </form>

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (
            !window.confirm(
              "この支店を削除しますか？この操作は元に戻せません。",
            )
          ) {
            e.preventDefault();
          }
        }}
        className="mt-1"
      >
        <input type="hidden" name="id" value={shop.id} />
        <button
          type="submit"
          disabled={deleting}
          className="h-11 text-sm font-medium text-red-600 disabled:opacity-50"
        >
          この支店を削除
        </button>
      </form>
      <Messages state={deleteState} />
    </li>
  );
}
