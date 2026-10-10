"use client";

import { useActionState } from "react";
import { addProduct } from "./actions";

export default function ProductForm() {
  const initialState = { error: null as string | null };
  const [state, formAction] = useActionState(addProduct, initialState);

  return (
    <div className="border rounded p-4 mb-6">
      <h2 className="text-xl font-semibold mb-3">Add New Product</h2>

      {state.error && (
        <p className="text-red-600 mb-2">{state.error}</p>
      )}

      <form action={formAction} className="grid grid-cols-1 gap-3">
        <input
          type="text"
          name="name_ja"
          placeholder="名前 (日本語) (任意)"
          className="border rounded p-2"
        />
        <input
          type="text"
          name="name_en"
          placeholder="Name (English) (任意)"
          className="border rounded p-2"
        />
        <input
          type="text"
          name="brand"
          placeholder="Brand (任意)"
          className="border rounded p-2"
        />
        <input
          type="text"
          name="category"
          placeholder="Category (任意)"
          className="border rounded p-2"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
        >
          Add Product
        </button>
      </form>
    </div>
  );
}
