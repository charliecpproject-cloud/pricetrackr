"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge, controlCls, labelCls } from "@/components/FormParts";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import { addAliases } from "./actions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function AliasAddForm({ suggestions }: { suggestions: string[] }) {
  const [state, formAction, pending] = useToastedActionState(addAliases, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <datalist id="alias-word-suggestions">
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <div>
        <label htmlFor="alias_canonical" className={labelCls}>
          検索される言葉 <Badge kind="required" />
        </label>
        <input
          id="alias_canonical"
          name="canonical"
          list="alias-word-suggestions"
          required
          maxLength={50}
          placeholder="例：ベビーフード（カテゴリ・ブランド・商品名など）"
          className={controlCls}
        />
      </div>

      <div>
        <label htmlFor="alias_aliases" className={labelCls}>
          別名 <Badge kind="required" />
        </label>
        <Textarea
          id="alias_aliases"
          name="aliases"
          required
          rows={3}
          placeholder="例：離乳食, baby food"
          className="text-base"
        />
        <p className="mt-1 text-xs text-stone-500">
          カンマ（,）か改行で区切ると、まとめて追加できます。
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "追加中…" : "別名を追加"}
      </Button>
    </form>
  );
}