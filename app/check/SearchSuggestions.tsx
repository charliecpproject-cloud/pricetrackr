import Link from "next/link";

// The admin's "おすすめ" words as quick-search chips: tapping one searches that word in every
// field. The chip of the word currently searched is highlighted. The chips wrap onto more lines
// when there are many (never a sideways scroll); a very long word is cut with … so it cannot
// stretch the row.
export default function SearchSuggestions({
  terms,
  active,
}: {
  terms: string[];
  active: string;
}) {
  if (terms.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-stone-500">おすすめ</span>
      {terms.map((term) => (
        <Link
          key={term}
          href={`/check?q=${encodeURIComponent(term)}`}
          className={`inline-flex h-8 max-w-full items-center rounded-full border px-3 text-sm ${
            active === term
              ? "border-teal-600 bg-teal-50 font-bold text-teal-700"
              : "border-line bg-panel text-stone-600"
          }`}
        >
          <span className="truncate">{term}</span>
        </Link>
      ))}
    </div>
  );
}
