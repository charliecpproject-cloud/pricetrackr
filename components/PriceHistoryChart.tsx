"use client";

import { useState, type PointerEvent } from "react";
import { formatDate } from "@/lib/dateTime";
import { formatYen } from "@/lib/prices/format";
import { TAX_BADGE_LABEL } from "@/lib/prices/tax";
import type { HistoryView } from "@/lib/prices/history";

const W = 320;
const H = 130;
const PAD_X = 10;
const PAD_Y = 14;
const MAX_DOTS = 40;

function percentText(percent: number): { text: string; tone: string } {
  if (percent > 0) {
    return {
      text: `最新の価格は平均より${percent}%高いです`,
      tone: "text-red-600",
    };
  }
  if (percent < 0) {
    return {
      text: `最新の価格は平均より${Math.abs(percent)}%安いです`,
      tone: "text-teal-700",
    };
  }
  return { text: "最新の価格は平均と同じです", tone: "text-stone-600" };
}

// A small hand-drawn line chart of the prices over time. Tap or drag across it
// to read a point. The dashed line is the average.
export default function PriceHistoryChart({
  view,
  scope,
  chainName,
}: {
  view: HistoryView;
  scope: "all" | "chain";
  chainName?: string;
}) {
  const { points } = view;
  const last = points.length - 1;
  const [selected, setSelected] = useState(last);
  const index = Math.min(selected, last);
  const current = points[index];

  const title =
    scope === "chain"
      ? `価格の推移（${chainName || "このチェーン"}のみ）`
      : "価格の推移（全チェーン）";

  const times = points.map((p) => new Date(p.observedAt).getTime());
  const t0 = times[0];
  const span = times[last] - t0;
  const range = view.max - view.min;

  const xOf = (i: number) =>
    span === 0 ? W / 2 : PAD_X + ((times[i] - t0) / span) * (W - PAD_X * 2);
  const yOf = (price: number) =>
    range === 0
      ? H / 2
      : PAD_Y + (1 - (price - view.min) / range) * (H - PAD_Y * 2);

  const path = points
    .map(
      (p, i) =>
        `${i === 0 ? "M" : "L"}${xOf(i).toFixed(1)} ${yOf(p.price).toFixed(1)}`,
    )
    .join(" ");
  const yAverage = yOf(view.average);
  const xSelected = xOf(index);
  const showAllDots = points.length <= MAX_DOTS;

  function pick(e: PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    if (box.width === 0) return;
    const x = ((e.clientX - box.left) / box.width) * W;
    let best = 0;
    let bestDistance = Infinity;
    points.forEach((_, i) => {
      const distance = Math.abs(xOf(i) - x);
      if (distance < bestDistance) {
        best = i;
        bestDistance = distance;
      }
    });
    setSelected(best);
  }

  const percent =
    view.percentVsAverage === null ? null : percentText(view.percentVsAverage);

  return (
    <section className="rounded-2xl border border-line bg-panel p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-stone-900">{title}</h2>
        <span className="rounded-md bg-chip px-1.5 py-0.5 text-xs text-stone-600">
          {TAX_BADGE_LABEL[view.taxBasis]}の価格
        </span>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-3 w-full select-none"
        style={{ touchAction: "pan-y" }}
        role="img"
        aria-label={`${title}。最安${formatYen(view.min)}、平均${formatYen(view.average)}、最高${formatYen(view.max)}`}
        onPointerDown={pick}
        onPointerMove={(e) => {
          if (e.buttons > 0) pick(e);
        }}
      >
        <line
          x1={PAD_X}
          x2={W - PAD_X}
          y1={yAverage}
          y2={yAverage}
          className="stroke-stone-400"
          strokeWidth={1}
          strokeDasharray="4 4"
          vectorEffect="non-scaling-stroke"
        />
        <line
          x1={xSelected}
          x2={xSelected}
          y1={4}
          y2={H - 4}
          className="stroke-stone-400"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={path}
          className="fill-none stroke-teal-600"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => {
          if (!showAllDots && i !== last && i !== index) return null;
          const isSelected = i === index;
          return (
            <circle
              key={i}
              cx={xOf(i)}
              cy={yOf(p.price)}
              r={isSelected ? 6 : i === last ? 4.5 : 3}
              className={
                isSelected
                  ? "fill-teal-600 stroke-stone-900"
                  : "fill-teal-600 stroke-transparent"
              }
              strokeWidth={2}
            />
          );
        })}
      </svg>

      <div className="mt-1 flex justify-between text-xs text-stone-500">
        <span>{formatDate(points[0].observedAt)}</span>
        <span>点線は平均</span>
        <span>{formatDate(points[last].observedAt)}</span>
      </div>

      <p className="mt-2 text-sm tabular-nums text-stone-700">
        {formatDate(current.observedAt)} ・ {formatYen(current.price)}
        {current.chainName ? ` ・ ${current.chainName}` : ""}
      </p>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        {[
          { label: "過去最安", value: view.min },
          { label: "平均", value: view.average },
          { label: "最高", value: view.max },
        ].map((item) => (
          <div key={item.label}>
            <p className="text-xs text-stone-500">{item.label}</p>
            <p className="text-base font-bold tabular-nums text-stone-900">
              {formatYen(item.value)}
            </p>
          </div>
        ))}
      </div>

      {percent && (
        <p className={`mt-3 text-sm font-medium ${percent.tone}`}>
          {percent.text}
        </p>
      )}
      {view.leftOut > 0 && (
        <p className="mt-1 text-xs text-stone-500">
          税の扱いが違う{view.leftOut}件は含めていません
        </p>
      )}
    </section>
  );
}
