"use client";
import { useToastedActionState } from "@/lib/toast/useToastedActionState";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Collapsible from "@/components/Collapsible";
import { Badge } from "@/components/FormParts";
import ProductFields from "@/components/ProductFields";
import StructureFields from "@/components/StructureFields";
import { createProduct } from "@/app/products/productActions";
import type { CounterUnitOption } from "@/lib/prices/unitWords";

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
  counterUnits,
}: {
  defaultBarcode?: string;
  defaultName?: string;
  counterUnits: CounterUnitOption[];
}) {
  const router = useRouter();
  const [state, formAction, pending] = useToastedActionState(
    createProduct,
    initialState,
  );
  // The variation and 容量 rows keep their own state: a new key clears them after a save.
  const [structureKey, setStructureKey] = useState(0);

  useEffect(() => {
    if (state.message) setStructureKey((k) => k + 1);
  }, [state]);

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

      <Collapsible
        title="バリエーション・容量"
        badge={<Badge kind="optional" />}
      >
        <StructureFields key={structureKey} counterUnits={counterUnits} />
      </Collapsible>

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
