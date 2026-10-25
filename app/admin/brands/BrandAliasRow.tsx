"use client";

import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import { deleteBrandAlias, mergeBrands } from "./actions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function BrandAliasRow({
  id,
  brand,
  alias,
  inUse,
}: {
  id: string;
  brand: string;
  alias: string;
  inUse: number;
}) {
  const [, deleteAction, deleting] = useToastedActionState(
    deleteBrandAlias,
    initialState,
  );
  const [, mergeAction, merging] = useToastedActionState(
    mergeBrands,
    initialState,
  );

  return (
    <li className="rounded-xl border border-line bg-panel px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 break-words text-base text-stone-900">
          {alias}
        </span>
        <form
          action={deleteAction}
          onSubmit={(e) => {
            if (!window.confirm(`別名「${alias}」を削除しますか？`))
              e.preventDefault();
          }}
        >
          <input type="hidden" name="id" value={id} />
          <button
            type="submit"
            disabled={deleting}
            className="h-10 shrink-0 px-3 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            削除
          </button>
        </form>
      </div>
      {inUse > 0 && (
        <form
          action={mergeAction}
          onSubmit={(e) => {
            if (
              !window.confirm(
                `「${alias}」の商品${inUse}件を「${brand}」にまとめますか？`,
              )
            ) {
              e.preventDefault();
            }
          }}
          className="mt-1 flex items-center justify-between gap-2"
        >
          <input type="hidden" name="from" value={alias} />
          <input type="hidden" name="to" value={brand} />
          <p className="text-xs text-amber-700">
            この名前の商品が{inUse}件あります
          </p>
          <button
            type="submit"
            disabled={merging}
            className="h-9 shrink-0 rounded-lg border border-line px-3 text-sm font-medium text-teal-700 disabled:opacity-50"
          >
            まとめる
          </button>
        </form>
      )}
    </li>
  );
}
