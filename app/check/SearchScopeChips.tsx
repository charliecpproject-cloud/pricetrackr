"use client";

import { SEARCH_SCOPES, type SearchScope } from "@/lib/search/scope";

// Quick choice of what the search looks at. With text in the search box,
// picking another button runs the search again straight away.
export default function SearchScopeChips({ current }: { current: SearchScope }) {
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">検索する対象</legend>
      <div className="flex flex-wrap gap-2">
        {SEARCH_SCOPES.map((s) => (
          <label
            key={s.key}
            className="flex h-9 cursor-pointer items-center rounded-full border border-line bg-panel px-3.5 text-sm text-stone-600 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600"
          >
            <input
              type="radio"
              name="scope"
              value={s.key}
              defaultChecked={current === s.key}
              onChange={(e) => {
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
  );
}