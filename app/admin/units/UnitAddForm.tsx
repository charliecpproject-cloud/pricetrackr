"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge, controlCls, labelCls } from "@/components/FormParts";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import { addCounterUnit } from "./actions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function UnitAddForm() {
  const [state, formAction, pending] = useToastedActionState(addCounterUnit, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Empty the box after a word was added.
  useEffect(() => {
    if (state.message) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div>
        <label htmlFor="unit_word" className={labelCls}>
          数える言葉 <Badge kind="required" />
        </label>
        <input
          id="unit_word"
          name="word"
          required
          maxLength={8}
          placeholder="例：切れ"
          className={controlCls}
        />
        <p className="mt-1 text-xs text-stone-500">
          8文字まで。文字だけ（数字・記号・空白は使えません）。登録後は名前を変えられません。
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "追加中…" : "言葉を追加"}
      </Button>
    </form>
  );
}