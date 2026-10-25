"use client";

import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import { deleteAlias, setAliasEnabled } from "./actions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function AliasRow({
  id,
  alias,
  enabled,
}: {
  id: string;
  alias: string;
  enabled: boolean;
}) {
  const [, toggleAction] = useToastedActionState(setAliasEnabled, initialState);
  const [, deleteFormAction, deleting] = useToastedActionState(
    deleteAlias,
    initialState,
  );

  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border border-line bg-panel px-3 py-2">
      <form action={toggleAction} className="min-w-0 flex-1">
        <input type="hidden" name="id" value={id} />
        <label className="flex min-w-0 cursor-pointer items-center gap-3 text-base text-stone-900">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={enabled}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="h-5 w-5 shrink-0 accent-teal-600"
          />
          <span className="min-w-0 break-words">{alias}</span>
        </label>
      </form>
      <form
        action={deleteFormAction}
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
    </li>
  );
}
