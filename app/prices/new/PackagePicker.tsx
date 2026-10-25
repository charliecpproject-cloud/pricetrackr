"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { X } from "lucide-react";
import {
  matchesSearchWithAliases,
  type SearchAlias,
} from "@/lib/search/aliases";
import { controlCls } from "@/components/FormParts";

type Pkg = { id: string; label: string; search: string };

const MAX_SHOWN = 20;

// Type-to-search list for 商品・容量. With nothing typed it shows the packages priced most
// recently; with a search it shows the best matches, recent ones first. The chosen package is
// sent with the form through a hidden input named product_package_id.
export default function PackagePicker({
  packages,
  aliases,
  recentIds,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  inputRef,
}: {
  packages: Pkg[];
  aliases: SearchAlias[];
  recentIds: string[];
  selectedId: string;
  onSelect: (id: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
}) {
  const rank = useMemo(
    () => new Map(recentIds.map((id, i) => [id, i])),
    [recentIds],
  );
  const keyword = search.trim();

  // The list floats over the form while the field is in use. It closes after a choice, a tap
  // outside the field and the list, or Escape.
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const matches = useMemo(() => {
    let list: Pkg[];
    if (keyword) {
      list = packages.filter((p) =>
        matchesSearchWithAliases(`${p.label} ${p.search}`, keyword, aliases),
      );
    } else {
      const recent = packages.filter((p) => rank.has(p.id));
      list = recent.length > 0 ? recent : packages;
    }
    return [...list].sort(
      (a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9),
    );
  }, [packages, aliases, keyword, rank]);

  const selected = packages.find((p) => p.id === selectedId);
  if (selected) {
    return (
      <div className="flex min-h-12 items-center justify-between gap-2 rounded-xl border border-teal-600 bg-teal-50 px-3 py-2">
        <input type="hidden" name="product_package_id" value={selected.id} />
        <span className="min-w-0 text-sm font-medium text-stone-900">
          {selected.label}
        </span>
        <button
          type="button"
          onClick={() => {
            onSelect("");
            onSearchChange("");
            setTimeout(() => inputRef.current?.focus(), 0);
          }}
          className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-sm font-medium text-teal-700"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          変更
        </button>
      </div>
    );
  }

  const shown = matches.slice(0, MAX_SHOWN);
  const heading = keyword
    ? `該当 ${matches.length}件`
    : recentIds.length > 0 && shown.length > 0 && rank.has(shown[0].id)
      ? "最近使った商品"
      : "商品";

  return (
    <div ref={boxRef} className="relative">
      <input
        id="package_search"
        ref={inputRef}
        type="search"
        value={search}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="商品名・ブランド・カテゴリなどで検索"
        autoComplete="off"
        className={controlCls}
      />
      {open && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-line bg-background shadow-lg">
          {/* The opaque layer above keeps the form text behind the list from showing through the theme's see-through panel colour. */}
          <div className="bg-panel">
            <p className="bg-panel-soft px-3 py-1.5 text-xs font-medium text-stone-500">
              {heading}
            </p>
            {shown.length === 0 ? (
              <p className="px-3 py-3 text-sm text-stone-500">
                該当する商品がありません。右の「新規」から登録できます。
              </p>
            ) : (
              <ul
                role="listbox"
                aria-label="商品・容量"
                className="max-h-[min(18rem,45dvh)] divide-y divide-stone-100 overflow-y-auto"
              >
                {shown.map((p) => (
                  <li key={p.id} role="option" aria-selected={false}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(p.id);
                        onSearchChange("");
                        setOpen(false);
                      }}
                      className="block w-full px-3 py-3 text-left text-sm text-stone-900 hover:bg-panel-soft active:bg-chip"
                    >
                      {p.label}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {matches.length > MAX_SHOWN && (
              <p className="px-3 py-2 text-xs text-stone-500">
                ほかに{matches.length - MAX_SHOWN}
                件あります。言葉を足して絞り込んでください。
              </p>
            )}
            {!keyword && shown.length > 0 && (
              <p className="px-3 py-2 text-xs text-stone-500">
                ほかの商品は名前を入力して検索できます。
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
