import { describe, expect, it } from "vitest";
import { buildHistory, type HistoryRow } from "./history";
import type { TaxBasis } from "./tax";

function row(
  observedAt: string,
  price: number,
  taxBasis: TaxBasis = "incl",
  chainId = "a",
): HistoryRow {
  return {
    observedAt,
    price,
    taxBasis,
    chainId,
    chainName: chainId.toUpperCase(),
  };
}

describe("buildHistory", () => {
  it("returns null for no price or a single price", () => {
    expect(buildHistory([])).toBeNull();
    expect(buildHistory([row("2026-10-01T03:00:00Z", 200)])).toBeNull();
  });

  it("sorts oldest first and finds lowest, highest, average and the percent", () => {
    const view = buildHistory([
      row("2026-10-01T03:00:00Z", 200),
      row("2026-10-10T03:00:00Z", 180),
      row("2026-10-05T03:00:00Z", 220),
    ]);
    expect(view?.points.map((p) => p.price)).toEqual([200, 220, 180]);
    expect(view?.latest.price).toBe(180);
    expect(view?.min).toBe(180);
    expect(view?.max).toBe(220);
    expect(view?.average).toBe(200);
    expect(view?.percentVsAverage).toBe(-10);
  });

  it("rounds the percent to a whole number and gives 0 for the same price", () => {
    const higher = buildHistory([
      row("2026-10-01T03:00:00Z", 100),
      row("2026-10-02T03:00:00Z", 100),
      row("2026-10-03T03:00:00Z", 130),
    ]);
    expect(higher?.percentVsAverage).toBe(18);
    const same = buildHistory([
      row("2026-10-01T03:00:00Z", 100),
      row("2026-10-02T03:00:00Z", 100),
      row("2026-10-03T03:00:00Z", 100),
    ]);
    expect(same?.percentVsAverage).toBe(0);
  });

  it("leaves out prices with another tax basis and counts them", () => {
    const view = buildHistory([
      row("2026-10-01T03:00:00Z", 200, "incl"),
      row("2026-10-02T03:00:00Z", 150, "excl"),
      row("2026-10-03T03:00:00Z", 220, "incl"),
    ]);
    expect(view?.taxBasis).toBe("incl");
    expect(view?.points.map((p) => p.price)).toEqual([200, 220]);
    expect(view?.leftOut).toBe(1);
    expect(view?.average).toBe(210);
    expect(view?.percentVsAverage).toBeNull();
  });

  it("gives no percent when the newest price has an unknown tax basis", () => {
    const view = buildHistory([
      row("2026-10-01T03:00:00Z", 100, "unknown"),
      row("2026-10-02T03:00:00Z", 110, "unknown"),
      row("2026-10-03T03:00:00Z", 120, "unknown"),
    ]);
    expect(view?.taxBasis).toBe("unknown");
    expect(view?.average).toBe(110);
    expect(view?.percentVsAverage).toBeNull();
  });

  it("can be limited to one chain", () => {
    const rows = [
      row("2026-10-01T03:00:00Z", 200, "incl", "a"),
      row("2026-10-02T03:00:00Z", 150, "incl", "b"),
      row("2026-10-03T03:00:00Z", 210, "incl", "a"),
      row("2026-10-04T03:00:00Z", 160, "incl", "b"),
    ];
    const all = buildHistory(rows);
    expect(all?.latest.chainId).toBe("b");
    expect(all?.min).toBe(150);
    expect(all?.max).toBe(210);
    expect(all?.average).toBe(180);
    expect(all?.percentVsAverage).toBe(-11);

    const onlyA = buildHistory(rows, { chainId: "a" });
    expect(onlyA?.points.map((p) => p.price)).toEqual([200, 210]);
    expect(onlyA?.latest.price).toBe(210);
    expect(onlyA?.average).toBe(205);
    expect(onlyA?.percentVsAverage).toBeNull();
  });
});
