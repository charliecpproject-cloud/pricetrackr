import { priceAge } from "@/lib/dateTime";

const TONE = {
  fresh: "text-stone-500",
  aging: "text-amber-700",
  old: "font-medium text-red-600",
} as const;

// How old a price is (3日前, 2か月前): grey normally, amber after 30 days, red after 90 days.
export default function PriceAge({ iso, className = "" }: { iso: string; className?: string }) {
  const age = priceAge(iso);
  if (!age) return null;
  return <span className={`text-xs ${TONE[age.level]} ${className}`}>{age.label}</span>;
}