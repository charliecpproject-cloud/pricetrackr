"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

// A section that is closed by default. The content stays in the page while
// closed (only hidden), so its inputs are still sent with the form.
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
    <div className="rounded-xl border border-stone-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-12 w-full items-center gap-2 px-4 text-left text-base text-stone-800"
      >
        <span className="font-medium">{title}</span>
        {badge}
        {!open && summary ? (
          <span className="ml-1 min-w-0 truncate text-sm font-medium text-teal-700">
            {summary}
          </span>
        ) : null}
        <ChevronDown
          className={`ml-auto h-5 w-5 shrink-0 text-stone-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      <div className={open ? "space-y-3 border-t border-stone-100 p-4" : "hidden"}>
        {children}
      </div>
    </div>
  );
}