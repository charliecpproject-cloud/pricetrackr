import { useActionState, useEffect, useRef } from "react";
import { useToast } from "@/components/ToastProvider";

type ToastableState = { error: string | null; message?: string | null };

// The same as React's useActionState, and it also shows a toast when the action
// returns a result: red for an error, green for a message (or 保存しました).
// Use this instead of useActionState in every form that saves something.
export function useToastedActionState<State extends ToastableState, Payload = FormData>(
  action: (state: Awaited<State>, payload: Payload) => State | Promise<State>,
  initialState: Awaited<State>
) {
  const result = useActionState<State, Payload>(action, initialState);
  const state = result[0];
  const { showToast } = useToast();
  const initialRef = useRef<unknown>(initialState);

  useEffect(() => {
    if ((state as unknown) === initialRef.current) return; // no result yet
    const s = state as ToastableState;
    if (s.error) showToast(s.error, "error");
    else showToast(s.message || "保存しました", "success");
  }, [state, showToast]);

  return result;
}