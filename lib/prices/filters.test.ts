import { describe, expect, it } from "vitest";
import { countActive, inPriceRange, parseFilters, rangeEnd, rangeStart } from "./filters";

describe("parseFilters", () => {
  it("returns defaults for an empty URL", () => {
    const f = parseFilters({});
    expect(f.sale).toBe("all");
    expect(f.period).toBe("all");
    expect(f.chainId).toBeNull();
    expect(countActive(f)).toBe(0);
  });
  it("ignores invalid values", () => {
    const f = parseFilters({
      chain: "nope",
      cat: "スーパー",
      sale: "x",
      min: "abc",
      from: "2026-02-31",
    });
    expect(f.chainId).toBeNull();
    expect(f.category).toBeNull();
    expect(f.sale).toBe("all");
    expect(f.min).toBeNull();
    expect(f.from).toBeNull();
  });
  it("swaps a reversed price range and reads full-width digits", () => {
    const f = parseFilters({ min: "５００", max: "100" });
    expect([f.min, f.max]).toEqual([100, 500]);
  });
});

describe("date range", () => {
  const now = new Date("2026-10-16T00:00:00Z");
  it("uses the quick period when no dates are typed", () => {
    const f = parseFilters({ period: "week" });
    expect(rangeStart(f, now)).toBe("2026-10-09T00:00:00.000Z");
  });
  it("lets typed dates replace the quick period", () => {
    const f = parseFilters({ period: "week", from: "2026-09-01", to: "2026-09-30" });
    expect(rangeStart(f, now)).toBe("2026-09-01T00:00:00+09:00");
    expect(rangeEnd(f)).toBe("2026-09-30T23:59:59+09:00");
  });
  it("does not fall back to the period when only an end date is typed", () => {
    const f = parseFilters({ period: "week", to: "2026-09-30" });
    expect(rangeStart(f, now)).toBeNull();
  });
});

describe("price range and count", () => {
  it("checks both ends", () => {
    const f = parseFilters({ min: "100", max: "200" });
    expect(inPriceRange(150, f)).toBe(true);
    expect(inPriceRange(99, f)).toBe(false);
    expect(inPriceRange(201, f)).toBe(false);
  });
  it("counts each group once", () => {
    const f = parseFilters({ sale: "sale", min: "1", max: "9", period: "month" });
    expect(countActive(f)).toBe(3);
  });
});