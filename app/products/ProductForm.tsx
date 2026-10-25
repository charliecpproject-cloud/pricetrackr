"use client";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import ProductFields from "@/components/ProductFields";
import { createProduct } from "@/app/products/productActions";

const initialState: {
  error: string | null;
  message?: string | null;
  productId?: string | null;
} = {
  error: null,
  message: null,
  productId: null,
};

export default function ProductForm({
  defaultBarcode = "",
  defaultName = "",
}: {
  defaultBarcode?: string;
  defaultName?: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useToastedActionState(
    createProduct,
    initialState,
  );

  // Opened from a barcode scan: continue with the price entry for the new product.
  useEffect(() => {
    if (defaultBarcode && state.productId) {
      router.push(`/prices/new?product=${state.productId}`);
    }
  }, [state, defaultBarcode, router]);

  return (
    <form action={formAction} className="space-y-4">
      <ProductFields
        defaultBarcode={defaultBarcode}
        defaultName={defaultName}
      />

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && (
        <p className="text-sm text-teal-700">{state.message}</p>
      )}

      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "追加中…" : "追加"}
      </Button>
    </form>
  );
}
