"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Field, controlCls } from "@/components/FormParts";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";
import { updatePackage } from "@/app/products/packageEditActions";
import {
  unitDropdownOptions,
  type CounterUnitOption,
} from "@/lib/prices/unitWords";

export type EditablePackage = {
  id: string;
  size: number;
  unit: string;
  variationLabel: string | null;
};

export const EDIT_BUTTON_LABEL = "編集";
const EDIT_TITLE = "容量を編集";

// The title of the sheet: the edit title for the edit sheet, otherwise the given one.
export function titleFor(dialog: { kind: string }, addTitle: string): string {
  return dialog.kind === "editPackage" ? EDIT_TITLE : addTitle;
}

type State = { error: string | null; message?: string | null };
const initial: State = { error: null, message: null };

// controlCls is full width; the unit dropdown must stay small.
const unitCls = controlCls.replace("w-full", "w-24 shrink-0");

export default function EditPackageForm({
  pkg,
  counterUnits,
  onDone,
}: {
  pkg: EditablePackage;
  counterUnits: CounterUnitOption[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useToastedActionState(
    updatePackage,
    initial,
  );

  useEffect(() => {
    if (state.message) onDone();
  }, [state, onDone]);

  const options = unitDropdownOptions(counterUnits);
  const hasCurrent = options.some((u) => u.value === pkg.unit);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="package_id" value={pkg.id} />
      {pkg.variationLabel && (
        <p className="text-sm text-stone-600">{pkg.variationLabel}</p>
      )}

      <Field label="容量" kind="required" htmlFor="edit_pkg_size">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <input
              id="edit_pkg_size"
              name="package_size"
              type="text"
              inputMode="decimal"
              required
              defaultValue={String(pkg.size)}
              className={controlCls}
            />
          </div>
          <select
            name="package_unit"
            required
            defaultValue={pkg.unit}
            aria-label="単位"
            className={unitCls}
          >
            {!hasCurrent && <option value={pkg.unit}>{pkg.unit}</option>}
            {options.map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </Field>

      <p className="text-xs text-stone-500">
        価格の記録・バーコード・お気に入りはそのまま残ります。入力ミスの修正用です。内容量が実際に変わった場合は、新しい容量を追加してください。
      </p>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full text-base"
      >
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}
