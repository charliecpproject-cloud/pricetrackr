"use client";

import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import { deleteCounterUnit, setCounterUnitEnabled } from "./actions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function UnitRow({
  unit,
  label,
  enabled,
  usedCount,
  required,
}: {
  unit: string;
  label: string;
  enabled: boolean;
  usedCount: number | null; // null = could not be counted
  required: boolean; // 個: cannot be hidden or removed
}) {
  const [, toggleAction] = useToastedActionState(setCounterUnitEnabled, initialState);
  const [, deleteFormAction, deleting] = useToastedActionState(deleteCounterUnit, initialState);

  const canDelete = !required && usedCount === 0;
  const note = required
    ? "必須"
    : usedCount === null
      ? "使用数不明"
      : usedCount === 0
        ? "未使用"
        : `容量${usedCount}件で使用中`;

  return (
    <li className="flex items-center justify-between gap-2 rounded-xl border border-line bg-panel px-3 py-2">
      <form action={toggleAction} className="min-w-0 flex-1">
        <input type="hidden" name="unit" value={unit} />
        <label className="flex min-w-0 cursor-pointer items-center gap-3 text-base text-stone-900">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={enabled}
            disabled={required}
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
            className="h-5 w-5 shrink-0 accent-teal-600"
          />
          <span className="min-w-0">
            <span className="break-words">{label}</span>
            <span className="ml-2 text-xs text-stone-500">{note}</span>
          </span>
        </label>
      </form>
      {canDelete && (
        <form
          action={deleteFormAction}
          onSubmit={(e) => {
            if (!window.confirm(`「${label}」を削除しますか？`)) e.preventDefault();
          }}
        >
          <input type="hidden" name="unit" value={unit} />
          <button
            type="submit"
            disabled={deleting}
            className="h-10 shrink-0 px-3 text-sm font-medium text-red-600 disabled:opacity-50"
          >
            削除
          </button>
        </form>
      )}
    </li>
  );
}