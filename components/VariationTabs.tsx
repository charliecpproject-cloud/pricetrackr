"use client";

import { useEffect, useState, type ReactNode } from "react";

export type TabGroup = { key: string; label: string; content: ReactNode };

// The variation chips of a product card on 価格確認. The blocks themselves are drawn on the
// server and passed in; this component only remembers which chip is selected.
// With a single group there are no chips.
export default function VariationTabs({
  groups,
  initialIndex = 0,
  memoryKey,
}: {
  groups: TabGroup[];
  initialIndex?: number;
  memoryKey?: string;
}) {
  const [selected, setSelected] = useState(
    Math.max(0, Math.min(initialIndex, groups.length - 1)),
  );
  const current = groups[selected] ?? groups[0];

  // The chip chosen last time (same session), so coming back from a detail page shows it again.
  useEffect(() => {
    if (!memoryKey) return;
    try {
      const saved = sessionStorage.getItem(`check:tab:${memoryKey}`);
      const index = groups.findIndex((g) => g.key === saved);
      if (index >= 0) setSelected(index);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoryKey]);
  if (!current) return null;

  return (
    <div>
      {groups.length > 1 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {groups.map((group, index) => (
            <button
              key={group.key}
              type="button"
              aria-pressed={index === selected}
              onClick={() => {
                setSelected(index);
                if (memoryKey) {
                  try {
                    sessionStorage.setItem(`check:tab:${memoryKey}`, group.key);
                  } catch {
                    // ignore
                  }
                }
              }}
              className={`h-9 rounded-full border px-3.5 text-sm transition active:scale-95 ${
                index === selected
                  ? "border-teal-600 bg-teal-50 font-bold text-teal-700"
                  : "border-line bg-panel text-stone-600"
              }`}
            >
              {group.label}
            </button>
          ))}
        </div>
      )}
      {current.content}
    </div>
  );
}
