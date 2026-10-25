import type { UnitSummary } from "@/lib/prices/unitLines";

// One small grey line: "100mlあたり 通常 ¥59.6 ・ 10%クーポン ¥53.6 ・ まとめ買い20%引 ¥47.6".
// Each item stays together when the line wraps. The tax badge above the price carries the tax label.
export default function UnitPriceSummary({
  summary,
  align = "end",
}: {
  summary: UnitSummary | null;
  align?: "start" | "end";
}) {
  if (!summary) return null;
  return (
    <p
      className={`text-xs tabular-nums text-stone-500 ${align === "end" ? "text-right" : "text-left"}`}
    >
      {summary.per}
      {summary.items.map((item, i) => (
        <span key={item.label ?? "regular"}>
          {" "}
          <span className="whitespace-nowrap">
            {item.label ? `${item.label} ` : ""}
            {item.amount}
            {i < summary.items.length - 1 ? " ・" : ""}
          </span>
        </span>
      ))}
    </p>
  );
}
