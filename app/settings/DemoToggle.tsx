"use client";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";

import { Button } from "@/components/ui/button";
import { setDemoMode } from "./actions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function DemoToggle({ demoMode }: { demoMode: boolean }) {
  const [state, formAction, pending] = useToastedActionState(
    setDemoMode,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="demo_mode" value={demoMode ? "off" : "on"} />
      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full text-base"
      >
        {pending
          ? "変更中…"
          : demoMode
            ? "デモモードをオフにする"
            : "デモモードをオンにする"}
      </Button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && (
        <p className="text-sm text-teal-700">{state.message}</p>
      )}
    </form>
  );
}
