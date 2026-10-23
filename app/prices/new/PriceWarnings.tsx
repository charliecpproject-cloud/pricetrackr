import { formatDate } from "@/lib/dateTime";
import { formatYen } from "@/lib/prices/format";
import type { PreviousPrice } from "@/lib/prices/previous";
import type { PriceWarning } from "@/lib/prices/suspicious";

const oneDecimal = (n: number) => Math.round(n * 10) / 10;

function message(w: PriceWarning, reference: string): string {
  if (w.kind === "jump") {
    return `前回 ${reference} の約${oneDecimal(w.ratio)}倍です。桁や、1個かまとめての価格かを確認してください。`;
  }
  if (w.kind === "drop") {
    return `前回 ${reference} の約${oneDecimal(1 / w.ratio)}分の1です。桁や、1個かまとめての価格かを確認してください。`;
  }
  return `前回 ${reference} との差が消費税（${w.rate}%）とほぼ同じです。税抜き・税込みの選択が合っているか確認してください。`;
}

// Advice only: shown under the previous price, never blocks saving.
export default function PriceWarnings({
  warnings,
  previous,
}: {
  warnings: PriceWarning[];
  previous: PreviousPrice;
}) {
  if (warnings.length === 0) return null;
  const reference = `${formatYen(previous.price)}${
    previous.chainName ? `（${previous.chainName} ${formatDate(previous.observedAt)}）` : ""
  }`;
  return (
    <div
      role="status"
      className="space-y-1 rounded-xl border border-amber-500 bg-amber-50 px-3 py-2 text-sm text-amber-700"
    >
      {warnings.map((w) => (
        <p key={w.kind}>
          <span className="mr-1.5 font-bold">注意</span>
          {message(w, reference)}
        </p>
      ))}
      <p className="text-xs">このまま保存もできます。</p>
    </div>
  );
}