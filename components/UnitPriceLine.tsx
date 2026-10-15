import { TAX_BADGE_LABEL, type TaxBasis } from "@/lib/prices/tax";

// Small grey unit-price line with the tax label of the price it comes from.
export default function UnitPriceLine({
  text,
  taxBasis,
}: {
  text: string | null;
  taxBasis: TaxBasis;
}) {
  if (!text) return null;
  return (
    <p className="text-sm tabular-nums text-stone-500">
      {text}
      <span className="ml-1 text-xs">（{TAX_BADGE_LABEL[taxBasis]}）</span>
    </p>
  );
}