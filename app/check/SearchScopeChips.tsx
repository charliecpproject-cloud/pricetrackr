"use client";

import { useState, type ReactNode } from "react";
import { SEARCH_SCOPES, type SearchScope } from "@/lib/search/scope";

// What the search looks at, as one connected group of buttons with a short hint line under it.
// Inside the 絞り込み panel; `children` (the お気に入りのみ button) sit on the same line.
// With text in the search box, picking another button runs the search again straight away.
export default function SearchScopeChips({
  current,
  children,
}: {
  current: SearchScope;
  children?: ReactNode;
}) {
  const [selected, setSelected] = useState<SearchScope>(current);
  const hint = SEARCH_SCOPES.find((s) => s.key === selected)?.hint ?? "";

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <fieldset className="min-w-0">
          <legend className="sr-only">検索する対象</legend>
          <div className="inline-flex h-9 overflow-hidden rounded-xl border border-line bg-panel">
            {SEARCH_SCOPES.map((s, i) => (
              <label
                key={s.key}
                className={`flex cursor-pointer items-center px-3 text-sm text-stone-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-teal-600 ${
                  i > 0 ? "border-l border-line" : ""
                }`}
              >
                <input
                  type="radio"
                  name="scope"
                  value={s.key}
                  defaultChecked={current === s.key}
                  onChange={(e) => {
                    setSelected(s.key);
                    const form = e.currentTarget.form;
                    const box = form?.elements.namedItem("q") as HTMLInputElement | null;
                    if (form && box && box.value.trim() !== "") form.requestSubmit();
                  }}
                  className="sr-only"
                />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>
        {children}
      </div>
      <p className="text-xs text-stone-500">{hint}</p>
    </div>
  );
}