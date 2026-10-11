"use client";

import { useActionState } from "react";
import { addStoreChain } from "./actions";

export default function StoreForm() {
  // 初期状態: エラーメッセージなし
  const initialState = { error: null as string | null };
  const [state, formAction] = useActionState(addStoreChain, initialState);

  return (
    <div>
      {state.error && <p className="text-red-500 mb-2">{state.error}</p>}
      <form action={formAction} className="flex flex-col max-w-sm">
        <input
          type="text"
          name="name"
          placeholder="Store chain name"
          className="border rounded p-2 mb-2"
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
        >
          Add
        </button>
      </form>
    </div>
  );
}
