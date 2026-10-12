"use client";

import { useActionState } from "react";
import { updateChainCoupons } from "./couponActions";
import { Button } from "@/components/ui/button";

const OPTIONS = [5, 10, 15];
const initial: { error: string | null; message: string | null } = {
  error: null,
  message: null,
};

export default function CouponForm({
  chainId,
  current,
}: {
  chainId: string;
  current: number[];
}) {
  const [state, formAction, pending] = useActionState(updateChainCoupons, initial);

  return (
    <form action={formAction} className="mt-3 rounded-xl bg-stone-50 p-3">
      <input type="hidden" name="chainId" value={chainId} />
      <p className="mb-2 text-sm font-medium text-stone-700">
        クーポン（使える割合にチェック）
      </p>
      <div className="flex flex-wrap gap-3">
        {OPTIONS.map((p) => (
          <label
            key={p}
            className="flex h-12 items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 text-base"
          >
            <input
              type="checkbox"
              name="coupon_percents"
              value={p}
              defaultChecked={current.includes(p)}
              className="h-5 w-5 accent-rose-600"
            />
            {p}%
          </label>
        ))}
      </div>
      {state.error && <p className="mt-2 text-sm text-red-600">{state.error}</p>}
      {state.message && <p className="mt-2 text-sm text-teal-700">{state.message}</p>}
      <Button type="submit" disabled={pending} className="mt-3 h-12 w-full">
        {pending ? "保存中…" : "保存"}
      </Button>
    </form>
  );
}