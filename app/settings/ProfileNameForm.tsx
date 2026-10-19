"use client";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";

import { Button } from "@/components/ui/button";
import { Badge, controlCls, labelCls } from "@/components/FormParts";
import { setDisplayName } from "./profileActions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function ProfileNameForm({ current }: { current: string }) {
  const [state, formAction, pending] = useToastedActionState(setDisplayName, initialState);

  return (
    <form action={formAction} className="space-y-2 pt-2">
      <label htmlFor="display_name" className={labelCls}>
        表示名 <Badge kind="optional" />
      </label>
      <input
        id="display_name"
        name="display_name"
        defaultValue={current}
        maxLength={30}
        placeholder="例：たろう"
        className={controlCls}
      />
      <p className="text-xs text-stone-500">
        ホームのあいさつなどに「○○さん」と表示します。ほかの人と同じ名前でもかまいません。
      </p>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="text-sm text-teal-700">{state.message}</p>}
      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}