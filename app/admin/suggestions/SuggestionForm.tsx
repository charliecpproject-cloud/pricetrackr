"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge, controlCls, labelCls } from "@/components/FormParts";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import { MAX_DISPLAY_COUNT, MAX_TERMS } from "@/lib/search/suggestions";
import { saveSuggestions } from "./actions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function SuggestionForm({
  count,
  terms,
}: {
  count: number;
  terms: string[];
}) {
  const [state, formAction, pending] = useToastedActionState(
    saveSuggestions,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="display_count" className={labelCls}>
          表示する数 <Badge kind="required" />
        </label>
        <select
          id="display_count"
          name="display_count"
          defaultValue={String(count)}
          className={controlCls}
        >
          {Array.from({ length: MAX_DISPLAY_COUNT }, (_, i) => i + 1).map(
            (n) => (
              <option key={n} value={n}>
                {n}個
              </option>
            ),
          )}
        </select>
      </div>

      <div>
        <label htmlFor="suggestion_terms" className={labelCls}>
          言葉の一覧 <Badge kind="optional" />
        </label>
        <Textarea
          id="suggestion_terms"
          name="terms"
          rows={4}
          defaultValue={terms.join(", ")}
          placeholder="例：ベビーフード, おむつ, 牛乳"
          className="text-base"
        />
        <p className="mt-1 text-xs text-stone-500">
          カンマ（,）か改行で区切ります。先頭から順に、表示する数だけ表示されます。空にするとおすすめは表示されません（最大
          {MAX_TERMS}個、1つ30文字まで）。
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}
