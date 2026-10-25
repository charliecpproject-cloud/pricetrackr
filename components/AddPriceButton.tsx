import Link from "next/link";
import { PlusCircle } from "lucide-react";

// Opens 価格入力 with the 商品・容量 (and the chain, when known) already chosen.
// For visitors (demo mode) it is shown greyed out and does nothing.
export default function AddPriceButton({
  packageId,
  chainId,
  disabled = false,
  compact = false,
}: {
  packageId: string;
  chainId?: string | null;
  disabled?: boolean;
  compact?: boolean;
}) {
  const size = compact ? "h-9 px-3" : "h-10 px-4";
  const base = `inline-flex items-center gap-1.5 rounded-xl border text-sm font-medium ${size}`;

  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className={`${base} border-line bg-chip text-stone-400`}
      >
        <PlusCircle className="h-4 w-4" aria-hidden="true" />
        価格を追加
      </span>
    );
  }

  const query = new URLSearchParams({ package: packageId });
  if (chainId) query.set("chain", chainId);
  return (
    <Link
      href={`/prices/new?${query.toString()}`}
      className={`${base} border-teal-600 bg-teal-50 text-teal-700 active:scale-95`}
    >
      <PlusCircle className="h-4 w-4" aria-hidden="true" />
      価格を追加
    </Link>
  );
}
