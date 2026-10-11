"use client";

import { useActionState } from "react";
import { addShop } from "./actions";

type Chain = {
  id: string;
  name: string;
};

export default function ShopForm({ chains }: { chains: Chain[] }) {
  const initialState = { error: null as string | null };
  const [state, formAction] = useActionState(addShop, initialState);

  return (
    <div>
      {state.error && <p className="text-red-500 mb-2">{state.error}</p>}
      <form action={formAction} className="flex flex-col max-w-sm">
        <select
          name="store_chain_id"
          required
          className="border rounded p-2 mb-2"
        >
          <option value="">チェーンを選択</option>
          {chains.map((chain) => (
            <option key={chain.id} value={chain.id}>
              {chain.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          name="name"
          placeholder="Shop name"
          className="border rounded p-2 mb-2"
          required
        />

        <input
          type="text"
          name="address"
          placeholder="Address (optional)"
          className="border rounded p-2 mb-2"
        />

        <input
          type="text"
          name="region"
          placeholder="Region (optional)"
          className="border rounded p-2 mb-2"
        />

        <button
          type="submit"
          className="bg-blue-600 text-white rounded p-2 hover:bg-blue-700"
        >
          Add Shop
        </button>
      </form>
    </div>
  );
}
