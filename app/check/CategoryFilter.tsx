"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Coins,
  Hammer,
  Pill,
  Shirt,
  ShoppingCart,
  Store,
  Tag,
  type LucideIcon,
} from "lucide-react";
import { labelCls } from "@/components/FormParts";
import {
  CATEGORY_LABEL,
  STORE_CATEGORIES,
  type StoreCategory,
} from "@/lib/stores/category";

const ICON: Record<StoreCategory, LucideIcon> = {
  supermarket: ShoppingCart,
  drugstore: Pill,
  convenience: Store,
  discount: Hammer,
  hundred_yen: Coins,
  apparel: Shirt,
  other: Tag,
};

// Shown as buttons from the start. Any other category appears as a button once it is checked.
const ALWAYS_SHOWN: StoreCategory[] = ["supermarket", "drugstore"];

// Short names for the buttons.
const BUTTON_LABEL: Record<StoreCategory, string> = {
  ...CATEGORY_LABEL,
  drugstore: "薬局",
};

// Store categories as buttons that work like checkboxes. Nothing checked = all categories.
// The checked ones are sent as cat=... (once each) when the filter form is submitted.
export default function CategoryFilter({
  selected: initial,
}: {
  selected: StoreCategory[];
}) {
  const [selected, setSelected] = useState<StoreCategory[]>(initial);
  const [open, setOpen] = useState(false);

  const toggle = (category: StoreCategory) =>
    setSelected((current) =>
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category],
    );

  const shown = STORE_CATEGORIES.filter(
    (c) => ALWAYS_SHOWN.includes(c) || selected.includes(c),
  );

  return (
    <div>
      <p className={labelCls}>店舗のカテゴリ</p>

      {selected.map((c) => (
        <input key={c} type="hidden" name="cat" value={c} />
      ))}

      <div className="flex flex-wrap gap-2">
        {shown.map((c) => {
          const Icon = ICON[c];
          const checked = selected.includes(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={checked}
              onClick={() => toggle(c)}
              className={`flex h-11 items-center gap-2 rounded-xl border px-3 text-sm transition active:scale-[0.98] ${
                checked
                  ? "border-teal-600 bg-teal-50 font-bold text-teal-700"
                  : "border-line bg-panel text-stone-600"
              }`}
            >
              <Icon className="h-4 w-4" />
              {BUTTON_LABEL[c]}
              {checked && <Check className="h-4 w-4" />}
            </button>
          );
        })}

        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`flex h-11 items-center gap-1.5 rounded-xl border border-line bg-panel px-3 text-sm text-stone-600 transition active:scale-[0.98] ${
            open ? "ring-2 ring-teal-600" : ""
          }`}
        >
          その他
          <ChevronDown
            className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`}
          />
        </button>
      </div>

      {open && (
        <div className="mt-2 space-y-1 rounded-xl border border-line bg-panel p-2">
          {STORE_CATEGORIES.map((c) => {
            const Icon = ICON[c];
            return (
              <label
                key={c}
                className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 text-sm text-stone-800 hover:bg-panel-soft"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(c)}
                  onChange={() => toggle(c)}
                  className="h-5 w-5 shrink-0 accent-teal-600"
                />
                <Icon className="h-4 w-4 shrink-0 text-stone-500" />
                {CATEGORY_LABEL[c]}
              </label>
            );
          })}
        </div>
      )}

      <p className="mt-1.5 text-xs text-stone-500">
        {selected.length === 0
          ? "選ばない場合は、すべてのカテゴリが対象です。"
          : "選んだカテゴリの店舗だけを対象にします。"}
      </p>
    </div>
  );
}
