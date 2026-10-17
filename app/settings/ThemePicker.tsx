"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { THEMES, type ThemeId } from "@/lib/themes/themes";
import { setTheme } from "./themeActions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function ThemePicker({ current }: { current: ThemeId }) {
  const [state, formAction, pending] = useActionState(setTheme, initialState);

  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        {THEMES.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-panel p-3 has-[:checked]:border-teal-600 has-[:checked]:ring-2 has-[:checked]:ring-teal-600"
          >
            <input
              type="radio"
              name="theme"
              value={t.id}
              defaultChecked={t.id === current}
              className="sr-only"
            />
            <span
              aria-hidden="true"
              className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg border"
              style={{ background: t.previewBackground, borderColor: t.previewBorder }}
            >
              <span
                className="h-6 w-10 rounded-md border"
                style={{ background: t.previewPanel, borderColor: t.previewBorder }}
              />
            </span>
            <span className="min-w-0">
              <span className="block font-bold text-stone-900">{t.label}</span>
              <span className="block text-sm text-stone-500">{t.description}</span>
            </span>
          </label>
        ))}
      </div>
      <Button type="submit" disabled={pending} className="h-12 w-full text-base">
        {pending ? "変更中…" : "このテーマにする"}
      </Button>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="text-sm text-teal-700">{state.message}</p>}
    </form>
  );
}