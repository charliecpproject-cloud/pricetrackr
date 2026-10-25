import Link from "next/link";
import { Plus } from "lucide-react";
import type { SimilarProduct } from "@/lib/search/similar";

// Shown when a search found nothing: similar names to tap, and a button to add the typed name.
export default function SearchEmptyHelp({
  term,
  similar,
  canAdd,
  searchPath,
}: {
  term: string;
  similar: SimilarProduct[];
  canAdd: boolean;
  searchPath: "/check" | "/products";
}) {
  return (
    <div className="space-y-4">
      <p className="text-stone-500">「{term}」は見つかりませんでした</p>

      {similar.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-stone-700">もしかして：</p>
          <div className="flex flex-wrap gap-2">
            {similar.map((item) => (
              <Link
                key={item.id}
                href={`${searchPath}?q=${encodeURIComponent(item.name)}`}
                className="rounded-full border border-line bg-panel px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-panel-soft"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {canAdd && (
        <Link
          href={`/products?name=${encodeURIComponent(term)}`}
          className="flex h-12 items-center justify-center gap-1.5 rounded-xl border border-teal-600 bg-teal-50 text-base font-medium text-teal-700"
        >
          <Plus className="h-4 w-4" />
          この名前で商品を追加
        </Link>
      )}
    </div>
  );
}
