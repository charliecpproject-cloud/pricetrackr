import Link from "next/link";
import { PlusCircle } from "lucide-react";

// Opens 価格入力 with this product chosen: its 容量 (with the variation names) are listed there.
export default function AddPriceToProductLink({
  productId,
}: {
  productId: string;
}) {
  return (
    <Link
      href={`/prices/new?product=${productId}`}
      className="mt-3 flex h-11 items-center justify-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50 text-sm font-medium text-teal-700 active:scale-[0.99]"
    >
      <PlusCircle className="h-4 w-4" aria-hidden="true" />
      価格を追加
    </Link>
  );
}
