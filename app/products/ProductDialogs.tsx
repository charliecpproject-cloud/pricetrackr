"use client";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, controlCls } from "@/components/FormParts";
import { addVariation } from "@/app/products/variationActions";
import { addPackage } from "@/app/products/actions";
import EditPackageForm, {
  titleFor,
  type EditablePackage,
} from "@/app/products/EditPackageForm";
import {
  unitDropdownOptions,
  type CounterUnitOption,
} from "@/lib/prices/unitWords";

export type DialogProduct = {
  id: string;
  name: string;
  variations: { id: string; label: string }[];
};

type Dialog =
  | { kind: "variation" | "package"; product: DialogProduct }
  | { kind: "editPackage"; product: DialogProduct; pkg: EditablePackage }
  | null;

type Api = {
  openAddVariation: (product: DialogProduct) => void;
  openAddPackage: (product: DialogProduct) => void;
  openEditPackage: (product: DialogProduct, pkg: EditablePackage) => void;
};

const Ctx = createContext<Api | null>(null);

export function useProductDialogs(): Api {
  const api = useContext(Ctx);
  if (!api)
    throw new Error(
      "useProductDialogs must be used inside ProductDialogsProvider",
    );
  return api;
}

// controlCls is full width; the unit dropdown must stay small.
const unitCls = controlCls.replace("w-full", "w-24 shrink-0");

type VariationState = { error: string | null; message?: string | null };
const variationInitial: VariationState = { error: null, message: null };
type PackageState = { error: string | null };
const packageInitial: PackageState = { error: null };

function AddPackageForm({
  product,
  counterUnits,
  onDone,
}: {
  product: DialogProduct;
  counterUnits: CounterUnitOption[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useToastedActionState<
    PackageState,
    FormData
  >(addPackage, packageInitial);

  // A new state object without an error means the package was added.
  useEffect(() => {
    if (state !== packageInitial && !state.error) onDone();
  }, [state, onDone]);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="product_id" value={product.id} />

      {product.variations.length > 0 && (
        <Field label="バリエーション" kind="required" htmlFor="dlg_variation">
          <select
            id="dlg_variation"
            name="variation_id"
            required
            defaultValue=""
            className={controlCls}
          >
            <option value="">バリエーションを選択</option>
            {product.variations.map((v) => (
              <option key={v.id} value={v.id}>
                {v.label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="容量" kind="required" htmlFor="dlg_size">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <input
              id="dlg_size"
              name="package_size"
              type="text"
              inputMode="decimal"
              required
              placeholder="例：1500"
              className={controlCls}
            />
          </div>
          <select
            name="package_unit"
            required
            defaultValue=""
            aria-label="単位"
            className={unitCls}
          >
            <option value="">単位</option>
            {unitDropdownOptions(counterUnits).map((u) => (
              <option key={u.value} value={u.value}>
                {u.label}
              </option>
            ))}
          </select>
        </div>
      </Field>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full text-base"
      >
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}

function AddVariationForm({
  product,
  attributeNames,
  onDone,
}: {
  product: DialogProduct;
  attributeNames: string[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useToastedActionState(
    addVariation,
    variationInitial,
  );
  const [rows, setRows] = useState([{ id: 0, name: "", value: "" }]);
  const [nextId, setNextId] = useState(1);

  useEffect(() => {
    if (state.message) onDone();
  }, [state, onDone]);

  const change = (rowId: number, patch: { name?: string; value?: string }) =>
    setRows((cur) => cur.map((r) => (r.id === rowId ? { ...r, ...patch } : r)));

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="product_id" value={product.id} />
      <datalist id="dlg-attr-names">
        {attributeNames.map((n) => (
          <option key={n} value={n} />
        ))}
      </datalist>

      {rows.map((row) => (
        <div key={row.id} className="flex gap-2">
          <input
            name="attr_name"
            aria-label="名前"
            list="dlg-attr-names"
            value={row.name}
            onChange={(e) => change(row.id, { name: e.target.value })}
            maxLength={30}
            placeholder="例：サイズ"
            className={controlCls}
          />
          <input
            name="attr_value"
            aria-label="値"
            value={row.value}
            onChange={(e) => change(row.id, { value: e.target.value })}
            maxLength={30}
            placeholder="例：M"
            className={controlCls}
          />
          <button
            type="button"
            aria-label="この行を削除"
            disabled={rows.length <= 1}
            onClick={() => setRows((cur) => cur.filter((r) => r.id !== row.id))}
            className="h-12 w-12 shrink-0 rounded-xl border border-line text-stone-500 disabled:opacity-40"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        disabled={rows.length >= 8}
        onClick={() => {
          setRows((cur) => [...cur, { id: nextId, name: "", value: "" }]);
          setNextId((n) => n + 1);
        }}
        className="h-10 rounded-xl border border-line px-4 text-sm font-medium text-stone-600 disabled:opacity-40"
      >
        行を追加
      </button>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <Button
        type="submit"
        disabled={pending}
        className="h-12 w-full text-base"
      >
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}

export function ProductDialogsProvider({
  attributeNames,
  counterUnits,
  children,
}: {
  attributeNames: string[];
  counterUnits: CounterUnitOption[];
  children: ReactNode;
}) {
  const [dialog, setDialog] = useState<Dialog>(null);
  const close = useCallback(() => setDialog(null), []);

  const api = useMemo<Api>(
    () => ({
      openAddVariation: (product) => setDialog({ kind: "variation", product }),
      openAddPackage: (product) => setDialog({ kind: "package", product }),
      openEditPackage: (product, pkg) =>
        setDialog({ kind: "editPackage", product, pkg }),
    }),
    [],
  );

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog, close]);

  const title =
    dialog?.kind === "package" ? "容量を追加" : "バリエーションを追加";

  return (
    <Ctx.Provider value={api}>
      {children}
      {dialog && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-label={titleFor(dialog, title)}
        >
          <button
            type="button"
            aria-label="閉じる"
            onClick={close}
            className="absolute inset-0 bg-black/40"
          />
          <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-line bg-background p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl sm:rounded-3xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-stone-900">
                  {titleFor(dialog, title)}
                </h3>
                <p className="text-sm text-stone-500">{dialog.product.name}</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="閉じる"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {dialog.kind === "editPackage" ? (
              <EditPackageForm
                key={dialog.pkg.id}
                pkg={dialog.pkg}
                counterUnits={counterUnits}
                onDone={close}
              />
            ) : dialog.kind === "package" ? (
              <AddPackageForm
                key={dialog.product.id}
                product={dialog.product}
                counterUnits={counterUnits}
                onDone={close}
              />
            ) : (
              <AddVariationForm
                key={dialog.product.id}
                product={dialog.product}
                attributeNames={attributeNames}
                onDone={close}
              />
            )}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
