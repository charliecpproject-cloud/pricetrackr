"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import ProductFields from "@/components/ProductFields";
import { createProduct } from "@/app/products/productActions";

const initialState: { error: string | null; message?: string | null } = {
  error: null,
  message: null,
};

export default function ProductForm() {
  const [state, formAction, pending] = useActionState(createProduct, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <ProductFields />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="text-sm text-teal-700">{state.message}</p>}

      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}