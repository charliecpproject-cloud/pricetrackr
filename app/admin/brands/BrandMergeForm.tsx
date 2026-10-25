"use client";

import { Button } from "@/components/ui/button";
import { Badge, controlCls, labelCls } from "@/components/FormParts";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import { mergeBrands } from "./actions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function BrandMergeForm({
  brands,
}: {
  brands: { name: string; count: number }[];
}) {
  const [state, formAction, pending] = useToastedActionState(
    mergeBrands,
    initialState,
  );

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const data = new FormData(e.currentTarget);
        if (
          !window.confirm(
            `「${data.get("from")}」の商品を「${data.get("to")}」にまとめますか？\n元の名前は別名として残ります。`,
          )
        ) {
          e.preventDefault();
        }
      }}
      className="space-y-4"
    >
      <datalist id="brand-merge-targets">
        {brands.map((b) => (
          <option key={b.name} value={b.name} />
        ))}
      </datalist>

      <div>
        <label htmlFor="merge_from" className={labelCls}>
          まとめるブランド（この名前をやめる） <Badge kind="required" />
        </label>
        <select
          id="merge_from"
          name="from"
          required
          defaultValue=""
          className={controlCls}
        >
          <option value="">選んでください</option>
          {brands.map((b) => (
            <option key={b.name} value={b.name}>
              {b.name}（{b.count}件）
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="merge_to" className={labelCls}>
          残すブランド <Badge kind="required" />
        </label>
        <input
          id="merge_to"
          name="to"
          list="brand-merge-targets"
          required
          maxLength={100}
          autoComplete="off"
          placeholder="例：PASCO"
          className={controlCls}
        />
        <p className="mt-1 text-xs text-stone-500">
          すでにあるブランドを入力すると、その表記にそろえます。まとめたあと、元の名前は別名になり、検索や入力で自動的に置き換わります。
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "まとめています…" : "まとめる"}
      </Button>
    </form>
  );
}
