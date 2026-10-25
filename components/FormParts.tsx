import type { ReactNode } from "react";
import { Plus } from "lucide-react";

export const labelCls =
  "mb-1.5 flex items-center text-sm font-medium text-stone-700";
export const controlCls =
  "h-12 w-full rounded-xl border border-line bg-panel px-3 text-base focus:outline-none focus:ring-2 focus:ring-teal-600";

type Kind = "required" | "optional" | "either";
const badgeBase = "ml-2 rounded px-1.5 py-0.5 text-xs";

export function Badge({ kind }: { kind: Kind }) {
  if (kind === "optional") {
    return (
      <span className={`${badgeBase} bg-chip font-medium text-stone-500`}>
        任意
      </span>
    );
  }
  return (
    <span className={`${badgeBase} bg-rose-100 font-bold text-rose-700`}>
      {kind === "either" ? "どちらか必須" : "必須"}
    </span>
  );
}

export function Field({
  label,
  kind,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  kind: Kind;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className={labelCls} htmlFor={htmlFor}>
        {label}
        <Badge kind={kind} />
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

// The "＋ 新規" checkbox used next to branch and product fields.
export function NewToggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`flex h-12 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border px-3 text-sm font-medium ${
        checked
          ? "border-teal-600 bg-teal-50 text-teal-700"
          : "border-line bg-panel text-stone-600"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-teal-600"
      />
      <Plus className="h-4 w-4" />
      新規
    </label>
  );
}
