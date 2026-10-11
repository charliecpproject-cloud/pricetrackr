"use client";

import { useActionState } from "react";
import { addPackage } from "./actions";

type ProductOption = {
  id: string;
  name_ja: string | null;
  name_en: string | null;
};

type Props = {
  products: ProductOption[];
};

export default function PackageForm({ products }: Props) {
  const initialState = { error: null as string | null };
  const [state, formAction] = useActionState(addPackage, initialState);

  return (
    <div className="border rounded p-4 mb-6">
      <h2 className="text-xl font-semibold mb-3">Add Package to Product</h2>

      {state.error && <p className="text-red-600 mb-2">{state.error}</p>}

      <form action={formAction} className="grid grid-cols-1 gap-3">
        <select name="product_id" required className="border rounded p-2">
          <option value="">Select product</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name_ja || p.name_en || "Unnamed Product"}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="package_size"
          placeholder="Package size (e.g., 500)"
          step="any"
          min="0"
          required
          className="border rounded p-2"
        />

        <input
          type="text"
          name="package_unit"
          placeholder="Unit (e.g., ml, g)"
          required
          className="border rounded p-2"
        />

        <button
          type="submit"
          className="bg-green-600 text-white rounded p-2 hover:bg-green-700"
        >
          Add Package
        </button>
      </form>
    </div>
  );
}
