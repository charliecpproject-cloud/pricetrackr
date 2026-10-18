"use client";

import { useActionState, useState } from "react";
import { updateChainCoupons } from "./couponActions";
import { Button } from "@/components/ui/button";

const COUPON_OPTIONS = [5, 10, 15];
const initial: { error: string | null; message: string | null } = {
  error: null,
  message: null,
};

const boxCls =
  "flex h-12 items-center gap-2 rounded-lg border border-line bg-panel px-3 text-base";
const legendCls = "mb-2 text-sm font-medium text-stone-700";

export default function ChainOptionsForm({
  chainId,
  couponPercents,
  memberPercent,
  hasBonusPoints,
  pointUseEnabled,
  pointUseMultiplier,
  bulkEnabled,
}: {
  chainId: string;
  couponPercents: number[];
  memberPercent: number | null;
  hasBonusPoints: boolean;
  pointUseEnabled: boolean;
  pointUseMultiplier: number;
  bulkEnabled: boolean;
}) {
  const [state, formAction, pending] = useActionState(updateChainCoupons, initial);
  const [memberOn, setMemberOn] = useState(memberPercent !== null);
  const [pointOn, setPointOn] = useState(pointUseEnabled);

  return (
    <form action={formAction} className="mt-3 space-y-4 rounded-xl bg-panel-soft p-3">
      <input type="hidden" name="chainId" value={chainId} />

      <fieldset>
        <legend className={legendCls}>クーポン（使える割合にチェック）</legend>
        <div className="flex flex-wrap gap-3">
          {COUPON_OPTIONS.map((p) => (
            <label key={p} className={boxCls}>
              <input
                type="checkbox"
                name="coupon_percents"
                value={p}
                defaultChecked={couponPercents.includes(p)}
                className="h-5 w-5 accent-rose-600"
              />
              {p}%
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendCls}>会員価格（会員・現金払いの割引）</legend>
        <div className="flex flex-wrap items-center gap-3">
          <label className={boxCls}>
            <input
              type="checkbox"
              name="member_enabled"
              checked={memberOn}
              onChange={(e) => setMemberOn(e.target.checked)}
              className="h-5 w-5 accent-indigo-600"
            />
            会員価格あり
          </label>
          <label className="flex items-center gap-2 text-base text-stone-700">
            割引率
            <input
              type="number"
              name="member_discount_percent"
              min={1}
              max={30}
              defaultValue={memberPercent ?? 3}
              disabled={!memberOn}
              className="h-12 w-20 rounded-lg border border-line bg-panel px-3 text-base disabled:opacity-40"
            />
            %
          </label>
        </div>
      </fieldset>

      <fieldset>
        <legend className={legendCls}>感謝デー（ポイントの価値が上がる日）</legend>
        <div className="flex flex-wrap items-center gap-3">
          <label className={boxCls}>
            <input
              type="checkbox"
              name="point_use_enabled"
              checked={pointOn}
              onChange={(e) => setPointOn(e.target.checked)}
              className="h-5 w-5 accent-amber-600"
            />
            ウェル活
          </label>
          <label className="flex items-center gap-2 text-base text-stone-700">
            倍率
            <input
              type="number"
              name="point_use_multiplier"
              min={1}
              max={10}
              step={0.01}
              defaultValue={pointUseMultiplier}
              disabled={!pointOn}
              className="h-12 w-24 rounded-lg border border-line bg-panel px-3 text-base disabled:opacity-40"
            />
            倍
          </label>
        </div>
        <p className="mt-2 text-xs text-stone-500">
          ポイント1点を倍率の円として使える日の設定です。価格に必要なポイント数を表示します（日付は判定しません）。
        </p>
      </fieldset>

      <fieldset>
        <legend className={legendCls}>ポイント</legend>
        <label className={boxCls}>
          <input
            type="checkbox"
            name="has_bonus_points"
            defaultChecked={hasBonusPoints}
            className="h-5 w-5 accent-amber-600"
          />
          ボーナスポイントあり
        </label>
      </fieldset>

      <fieldset>
        <legend className={legendCls}>まとめ買い割引（特定の商品を○個以上で割引）</legend>
        <label className={boxCls}>
          <input
            type="checkbox"
            name="bulk_enabled"
            defaultChecked={bulkEnabled}
            className="h-5 w-5 accent-rose-600"
          />
          まとめ買い割引あり
        </label>
        <p className="mt-2 text-xs text-stone-500">
          オンにすると、価格入力で「まとめ買い割引後の価格」「割引率」「個数」を入力できます。割引は対象の商品だけなので、商品ごとに価格入力のときに選びます。
        </p>
      </fieldset>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="text-sm text-teal-700">{state.message}</p>}

      <Button type="submit" disabled={pending} className="h-12 w-full">
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}