"use client";

import { useEffect, useRef, useState } from "react";
import { controlCls } from "@/components/FormParts";
import { suggestBrandNames } from "@/app/products/brandActions";
import type { CategoryCount } from "@/lib/products/category";

// Brand text box with a tap-to-fill suggestion list underneath.
export default function BrandField({
  id,
  name,
  defaultValue = "",
  placeholder,
}: {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef(0);
  const [term, setTerm] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<CategoryCount[]>([]);

  useEffect(() => {
    if (!open) return;
    const requestId = ++requestRef.current;
    const timer = setTimeout(async () => {
      try {
        const result = await suggestBrandNames(term);
        if (requestRef.current === requestId) setItems(result);
      } catch {
        if (requestRef.current === requestId) setItems([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [term, open]);

  const pick = (value: string) => {
    if (inputRef.current) inputRef.current.value = value;
    setTerm(value);
    setOpen(false);
    setItems([]);
  };

  return (
    <div>
      <input
        ref={inputRef}
        id={id}
        name={name}
        maxLength={100}
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete="off"
        className={controlCls}
        onFocus={(e) => {
          setTerm(e.currentTarget.value);
          setOpen(true);
        }}
        onBlur={() => setOpen(false)}
        onInput={(e) => {
          setTerm(e.currentTarget.value);
          setOpen(true);
        }}
      />
      {open && items.length > 0 && (
        <ul
          aria-label="ブランドの候補"
          className="mt-2 max-h-60 overflow-y-auto rounded-xl border border-line bg-panel"
        >
          {items.map((c) => (
            <li key={c.name}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(c.name)}
                className="flex h-11 w-full items-center px-3 text-left text-sm text-stone-800 hover:bg-panel-soft"
              >
                {c.name} ({c.count})
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}