import { describe, expect, it } from "vitest";
import { canCompare, isCheapest, parseTaxBasis, type TaxBasis } from "./tax";

describe("parseTaxBasis", () => {
  it("accepts the three known values", () => {
    expect(parseTaxBasis("excl")).toBe("excl");
    expect(parseTaxBasis("incl")).toBe("incl");
    expect(parseTaxBasis("unknown")).toBe("unknown");
  });
  it("falls back to unknown", () => {
    expect(parseTaxBasis(null)).toBe("unknown");
    expect(parseTaxBasis("10%")).toBe("unknown");
  });
});

describe("canCompare", () => {
  it("is false for a single price", () => {
    expect(canCompare(["incl"])).toBe(false);
  });
  it("is true when all share the same known basis", () => {
    expect(canCompare(["incl", "incl"])).toBe(true);
    expect(canCompare(["excl", "excl", "excl"])).toBe(true);
  });
  it("is false when mixed or unknown", () => {
    expect(canCompare(["incl", "excl"])).toBe(false);
    expect(canCompare(["unknown", "unknown"])).toBe(false);
  });
});

describe("isCheapest", () => {
  const now = new Date("2026-10-15T00:00:00+09:00");
  const row = (observedAt: string, taxBasis: TaxBasis, effective: number) => ({
    observedAt,
    taxBasis,
    effective,
  });
  const a = row("2026-10-01T00:00:00+09:00", "incl", 100);
  const b = row("2026-09-01T00:00:00+09:00", "incl", 120);
  const old = row("2026-01-01T00:00:00+09:00", "incl", 50);

  it("marks the cheapest of recent prices with the same known basis", () => {
    expect(isCheapest(a, [a, b], now)).toBe(true);
    expect(isCheapest(b, [a, b], now)).toBe(false);
  });
  it("ignores prices older than 6 months", () => {
    expect(isCheapest(old, [old, a, b], now)).toBe(false);
    expect(isCheapest(a, [old, a, b], now)).toBe(true);
  });
  it("is false when only one recent price remains", () => {
    expect(isCheapest(a, [old, a], now)).toBe(false);
  });
  it("is false when the basis is mixed", () => {
    const c = row("2026-10-02T00:00:00+09:00", "excl", 90);
    expect(isCheapest(c, [a, c], now)).toBe(false);
  });
});