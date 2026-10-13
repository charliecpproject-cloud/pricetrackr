type Chain = {
  id: string;
  name: string;
  memberPercent: number | null;
  hasBonusPoints: boolean;
};

const controlCls =
  "h-12 w-full rounded-xl border border-stone-200 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-teal-600";

// Extra price fields that depend on the chosen chain's options.
export default function ChainExtras({ chain }: { chain: Chain | undefined }) {
  if (!chain || (chain.memberPercent === null && !chain.hasBonusPoints)) return null;

  return (
    <div className="mb-5 space-y-4">
      {chain.memberPercent !== null && (
        <label className="flex items-start gap-3 rounded-xl bg-indigo-50 p-3 text-base text-stone-800">
          <input
            type="checkbox"
            name="is_member_price"
            className="mt-1 h-5 w-5 accent-indigo-600"
          />
          <span>
            入力した価格は会員価格です（会員・現金払い {chain.memberPercent}%引き後）
            <span className="mt-0.5 block text-xs text-stone-500">
              チェックしない場合は通常価格として扱い、会員価格は自動で計算して表示します。
            </span>
          </span>
        </label>
      )}
      {chain.hasBonusPoints && (
        <div>
          <label
            htmlFor="bonus_points"
            className="mb-1.5 block text-sm font-medium text-stone-700"
          >
            ボーナスポイント（任意）
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
      )}
    </div>
  );
}