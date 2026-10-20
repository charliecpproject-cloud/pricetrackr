import UnitPriceLine from "@/components/UnitPriceLine";
import type { TaxBasis } from "@/lib/prices/tax";
import type { UnitLine } from "@/lib/prices/unitLines";

// One UnitPriceLine per unit price line (a bulk price has two: regular and bulk).
export default function UnitPriceLines({
  lines,
  taxBasis,
}: {
  lines: UnitLine[];
  taxBasis: TaxBasis;
}) {
  return (
    <>
      {lines.map((line) => (
        <UnitPriceLine
          key={line.label ?? "regular"}
          text={line.label ? `${line.label} ${line.text}` : line.text}
          taxBasis={taxBasis}
        />
      ))}
    </>
  );
}