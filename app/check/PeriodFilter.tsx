"use client";

import { useState } from "react";
import { controlCls, labelCls } from "@/components/FormParts";
import type { Period } from "@/lib/prices/filters";

// 全期間 is on the right. The date range is shown only when 全期間 is selected.
const OPTIONS: { value: Period; label: string }[] = [
  { value: "week", label: "1週間" },
  { value: "month", label: "1か月" },
  { value: "quarter", label: "3か月" },
  { value: "all", label: "全期間" },
];

export default function PeriodFilter({
  period: initial,
  from,
  to,
}: {
  period: Period;
  from: string | null;
  to: string | null;
}) {
  const [period, setPeriod] = useState<Period>(initial);

  return (
    <fieldset className="min-w-0">
      <legend className={labelCls}>期間</legend>
      <div className="grid grid-cols-4 gap-2">
        {OPTIONS.map((o) => (
          <label
            key={o.value}
            className="flex h-10 cursor-pointer items-center justify-center rounded-xl border border-line bg-panel px-3 text-sm text-stone-600 has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:font-bold has-[:checked]:text-teal-700 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-teal-600"
          >
            <input
              type="radio"
              name="period"
              value={o.value}
              checked={period === o.value}
              onChange={() => setPeriod(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>

      {period === "all" && (
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <input
              name="from"
              type="date"
              aria-label="開始日"
              defaultValue={from ?? ""}
              className={controlCls}
            />
            <span className="text-stone-500">〜</span>
            <input
              name="to"
              type="date"
              aria-label="終了日"
              defaultValue={to ?? ""}
              className={controlCls}
            />
          </div>
          <p className="mt-1.5 text-xs text-stone-500">
            日付で期間を指定できます。空欄のときは、すべての期間が対象です。
          </p>
        </div>
      )}
    </fieldset>
  );
}
