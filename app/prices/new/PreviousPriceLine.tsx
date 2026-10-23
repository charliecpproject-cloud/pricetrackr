import { formatDate } from "@/lib/dateTime";
import { formatYen } from "@/lib/prices/format";
import {
  parsePriceInput,
  priceChange,
  type PreviousPrice,
  type PreviousPrices,
} from "@/lib/prices/previous";
import { TAX_BADGE_LABEL, type TaxBasis } from "@/lib/prices/tax";

function Line({
  label,
  prev,
  current,
  basis,
  showChain,
}: {
  label: string;
  prev: PreviousPrice;
  current: number;
  basis: TaxBasis;
  showChain: boolean;
}) {
  const change = priceChange(current, basis, prev);
  return (
    <p className="text-sm text-stone-600">
      <span className="font-medium">{label}</span>{" "}
      <span className="font-bold tabular-nums text-stone-900">{formatYen(prev.price)}</span>
      {showChain && prev.chainName ? ` ${prev.chainName}` : ""} {formatDate(prev.observedAt)}
      {change.kind === "up" && (
        <span className="ml-2 font-bold tabular-nums text-rose-600">▲ +{change.percent}%</span>
      )}
      {change.kind === "down" && (
        <span className="ml-2 font-bold tabular-nums text-teal-700">▼ -{change.percent}%</span>
      )}
      {change.kind === "same" && <span className="ml-2 text-stone-500">同じ価格</span>}
      {change.kind === "mismatch" && (
        <span className="ml-2 text-xs text-stone-500">
          税の扱いが違うため比較できません（前回は{TAX_BADGE_LABEL[prev.taxBasis]}）
        </span>
      )}
    </p>
  );
}

// 前回 ¥1,998 コストコ 昨日 ▲ +3.2%, and (when the chosen chain has its own earlier price that
// differs) the same for that chain. Info only: it never blocks saving.
export default function PreviousPriceLine({
  prices,
  priceText,
  basis,
  chainId,
}: {
  prices: PreviousPrices;
  priceText: string;
  basis: TaxBasis;
  chainId: string;
}) {
  const { latest, atChain } = prices;
  if (!latest) {
    return (
      <p className="rounded-xl bg-panel-soft px-3 py-2 text-sm text-stone-500">
        この容量の価格はまだありません
      </p>
    );
  }
  const current = parsePriceInput(priceText);
  const showSecond = !!atChain && atChain.chainId !== latest.chainId;

  return (
    <div aria-live="polite" className="space-y-0.5 rounded-xl bg-panel-soft px-3 py-2">
      <Line label="前回" prev={latest} current={current} basis={basis} showChain />
      {showSecond && atChain && (
        <Line label="同じチェーンの前回" prev={atChain} current={current} basis={basis} showChain={false} />
      )}
      {chainId && !atChain && (
        <p className="text-xs text-stone-500">このチェーンの価格はまだありません</p>
      )}
    </div>
  );
}