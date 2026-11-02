"use client";

import { useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { labelCls } from "@/components/FormParts";

// A filter group with its heading and a small ⓘ button. The helper sentence is hidden until
// the button is tapped, which keeps the filter panel short. as="fieldset" is for radio groups
// (the heading is a legend); as="div" is for everything else.
export default function FilterGroup({
  title,
  tip,
  as = "fieldset",
  children,
}: {
  title: string;
  tip: string;
  as?: "fieldset" | "div";
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const button = (
    <button
      type="button"
      aria-label={`${title}の説明`}
      aria-expanded={open}
      onClick={() => setOpen((v) => !v)}
      className={`-my-1 ml-1 flex h-8 w-8 items-center justify-center rounded-full transition active:scale-95 ${
        open ? "text-teal-700" : "text-stone-400"
      }`}
    >
      <Info className="h-4 w-4" />
    </button>
  );
  const tipBox = open ? (
    <p className="mb-2 rounded-lg bg-chip px-3 py-2 text-xs text-stone-600">
      {tip}
    </p>
  ) : null;

  if (as === "div") {
    return (
      <div>
        <p className={labelCls}>
          {title}
          {button}
        </p>
        {tipBox}
        {children}
      </div>
    );
  }
  return (
    <fieldset className="min-w-0">
      <legend className={labelCls}>
        {title}
        {button}
      </legend>
      {tipBox}
      {children}
    </fieldset>
  );
}
