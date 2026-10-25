"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// A small label-style row that opens and closes its content. The content
// stays in the page while closed (only hidden), so its inputs are still
// sent with the form.
export default function Collapsible({
  title,
  badge,
  summary,
  children,
}: {
  title: string;
  badge?: ReactNode;
  summary?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex items-center py-1.5 text-sm font-medium text-stone-700"
      >
        {title}
        {badge}
        <ChevronDown
          className={`ml-1 h-4 w-4 shrink-0 text-stone-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
        {!open && summary ? (
          <span className="ml-2 min-w-0 truncate text-teal-700">{summary}</span>
        ) : null}
      </button>
      <div className={open ? "mt-1 space-y-3" : "hidden"}>{children}</div>
    </div>
  );
}
