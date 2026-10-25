"use client";

import { useEffect, useRef, useState } from "react";
import { Calculator } from "lucide-react";
import { taxHintMessage } from "@/lib/prices/taxHint";
import type { TaxBasis } from "@/lib/prices/tax";

// A small calculator icon; tapping it shows the suggested tax-included price.
// It works inside a card that is a link: the tap does not open the link.
export default function TaxHint({
  price,
  rate,
  basis,
}: {
  price: number;
  rate: number;
  basis: TaxBasis;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const message = taxHintMessage(price, rate, basis);
  if (!message) return null;

  return (
    <span ref={ref} className="relative inline-flex">
      <button
        type="button"
        aria-label="税込の目安を見る"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-chip text-stone-600 active:scale-95"
      >
        <Calculator className="h-3.5 w-3.5" />
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute right-0 top-full z-30 mt-1 w-56 rounded-lg bg-black/85 p-2 text-left text-xs font-normal leading-relaxed text-white shadow-lg"
        >
          {message}
        </span>
      )}
    </span>
  );
}
