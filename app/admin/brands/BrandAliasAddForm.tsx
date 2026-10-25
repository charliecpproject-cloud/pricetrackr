"use client";

import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import { controlCls } from "@/components/FormParts";
import { addBrandAliases } from "./actions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function BrandAliasAddForm({ brand }: { brand: string }) {
  const [state, formAction, pending] = useToastedActionState(
    addBrandAliases,
    initialState,
  );

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="brand" value={brand} />
      <div className="flex gap-2">
        <input
          name="aliases"
          required
          maxLength={200}
          aria-label={`${brand}の別名`}
          placeholder="別名を追加（カンマで複数）"
          className={controlCls}
        />
        <button
          type="submit"
          disabled={pending}
          className="h-12 shrink-0 rounded-xl bg-teal-600 px-4 text-sm font-medium text-white disabled:opacity-50"
        >
          追加
        </button>
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
    </form>
  );
}
