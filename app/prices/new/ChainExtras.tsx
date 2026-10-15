import { Badge, controlCls, labelCls } from "@/components/FormParts";

type Chain = {
  id: string;
  name: string;
  memberPercent: number | null;
  hasBonusPoints: boolean;
};

// "The entered price is already the membership price" checkbox.
// Shown only when the chosen chain has a membership price.
export function MemberPriceCheck({ chain }: { chain: Chain | undefined }) {
  if (!chain || chain.memberPercent === null) return null;

  return (
    <label className="flex items-start gap-3 rounded-xl bg-indigo-50 p-3 text-sm text-stone-800">
      <input
        type="checkbox"
        name="is_member_price"
        className="mt-0.5 h-5 w-5 shrink-0 accent-indigo-600"
      />
      <span>
        入力した価格は会員価格です（会員・現金払い {chain.memberPercent}%引き後）
        <Badge kind="optional" />
        <span className="mt-0.5 block text-xs text-stone-500">
          チェックしない場合は通常価格として扱い、会員価格は自動で計算して表示します。
        </span>
      </span>
    </label>
  );
}

// Bonus points field. Shown only when the chosen chain gives bonus points.
export function BonusPointsField({ chain }: { chain: Chain | undefined }) {
  if (!chain || !chain.hasBonusPoints) return null;

  return (
    <div>
      <label htmlFor="bonus_points" className={labelCls}>
        ボーナスポイント
        <Badge kind="optional" />
      </label>
      <input
        id="bonus_points"
        name="bonus_points"
        type="text"
        inputMode="numeric"
        placeholder="例：50"
        className={controlCls}
      />
    </div>
  );
}