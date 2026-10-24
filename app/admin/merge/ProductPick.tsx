"use client";

import { useEffect, useRef, useState } from "react";
import { controlCls, labelCls } from "@/components/FormParts";
import { searchMergeProducts } from "./actions";
import type { MergeProduct } from "./types";

const sub = (p: MergeProduct) =>
  [p.brand, p.category].filter(Boolean).join(" ・ ") || "ブランド・カテゴリなし";

export default function ProductPick({
  id,
  label,
  hint,
  value,
  excludeId,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: MergeProduct | null;
  excludeId: string | null;
  onChange: (product: MergeProduct | null) => void;
}) {
  const requestRef = useRef(0);
  const [term, setTerm] = useState("");
  const [items, setItems] = useState<MergeProduct[]>([]);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const text = term.trim();
    if (value || text === "") return;
    const requestId = ++requestRef.current;
    const timer = setTimeout(async () => {
      try {
        const result = await searchMergeProducts(text);
        if (requestRef.current === requestId) {
          setItems(result);
          setSearched(true);
        }
      } catch {
        if (requestRef.current === requestId) {
          setItems([]);
          setSearched(true);
        }
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [term, value]);

  const visible = items.filter((p) => p.id !== excludeId);

  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      <p className="mb-2 text-xs text-stone-500">{hint}</p>

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel-soft p-3">
          <div className="min-w-0">
            <p className="break-words font-bold text-stone-900">{value.name}</p>
            <p className="break-words text-sm text-stone-500">{sub(value)}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setTerm("");
              setItems([]);
              setSearched(false);
            }}
            className="h-10 shrink-0 px-3 text-sm font-medium text-teal-700"
          >
            変更
          </button>
        </div>
      ) : (
        <div>
          <input
            id={id}
            type="search"
            value={term}
            onChange={(e) => {
              setTerm(e.target.value);
              if (e.target.value.trim() === "") {
                setItems([]);
                setSearched(false);
              }
            }}
            autoComplete="off"
            maxLength={100}
            placeholder="商品名・ブランドなどで検索"
            className={controlCls}
          />
          {term.trim() !== "" && searched && visible.length === 0 && (
            <p className="mt-2 text-sm text-stone-500">見つかりませんでした</p>
          )}
          {visible.length > 0 && (
            <ul className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-line bg-panel">
              {visible.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => onChange(p)}
                    className="block w-full px-3 py-2 text-left hover:bg-panel-soft"
                  >
                    <span className="block break-words text-sm font-medium text-stone-900">
                      {p.name}
                    </span>
                    <span className="block break-words text-xs text-stone-500">{sub(p)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}