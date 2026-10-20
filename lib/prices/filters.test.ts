import { describe, expect, it } from "vitest";
import {
  countActive,
  hasActivePeriod,
  inPriceRange,
  parseFilters,
  rangeEnd,
  rangeStart,
} from "./filters";

describe("parseFilters", () => {
  it("returns defaults for an empty URL", () => {
    const f = parseFilters({});
    expect(f.sale).toBe("all");
    expect(f.period).toBe("quarter");
    expect(f.chainId).toBeNull();
    expect(f.categories).toEqual([]);
    expect(countActive(f)).toBe(0);
  });
  it("ignores invalid values", () => {
    const f = parseFilters({
      chain: "nope",
      cat: "スーパー",
      sale: "x",
      min: "abc",
      period: "all",
      from: "2026-02-31",
    });
    expect(f.chainId).toBeNull();
    expect(f.categories).toEqual([]);
    expect(f.sale).toBe("all");
    expect(f.min).toBeNull();
    expect(f.from).toBeNull();
  });
  it("reads several categories, in list order, without duplicates", () => {
    const f = parseFilters({ cat: ["drugstore", "supermarket", "drugstore", "nope"] });
    expect(f.categories).toEqual(["supermarket", "drugstore"]);
    expect(countActive(f)).toBe(1);
  });
  it("still reads a single category", () => {
    expect(parseFilters({ cat: "apparel" }).categories).toEqual(["apparel"]);
  });
  it("uses 3か月 for an unknown period", () => {
    expect(parseFilters({ period: "x" }).period).toBe("quarter");
  });
  it("swaps a reversed price range and reads full-width digits", () => {
    const f = parseFilters({ min: "５００", max: "100" });
    expect([f.min, f.max]).toEqual([100, 500]);
  });
});

describe("date range", () => {
  const now = new Date("2026-10-16T00:00:00Z");
  it("uses 3か月 by default", () => {
    expect(rangeStart(parseFilters({}), now)).toBe("2026-07-18T00:00:00.000Z");
  });
  it("uses the quick period", () => {
    const f = parseFilters({ period: "week" });
    expect(rangeStart(f, now)).toBe("2026-10-09T00:00:00.000Z");
  });
  it("uses typed dates with 全期間", () => {
    const f = parseFilters({ period: "all", from: "2026-09-01", to: "2026-09-30" });
    expect(rangeStart(f, now)).toBe("2026-09-01T00:00:00+09:00");
    expect(rangeEnd(f)).toBe("2026-09-30T23:59:59+09:00");
  });
  it("ignores typed dates when a quick period is chosen", () => {
    const f = parseFilters({ period: "week", from: "2026-09-01", to: "2026-09-30" });
    expect([f.from, f.to]).toEqual([null, null]);
    expect(rangeStart(f, now)).toBe("2026-10-09T00:00:00.000Z");
  });
  it("has no start when 全期間 has only an end date", () => {
    const f = parseFilters({ period: "all", to: "2026-09-30" });
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
  it("does not count the default period, but counts the others", () => {
    expect(hasActivePeriod(parseFilters({ period: "quarter" }))).toBe(false);
    expect(hasActivePeriod(parseFilters({ period: "all" }))).toBe(true);
    expect(hasActivePeriod(parseFilters({ period: "week" }))).toBe(true);
  });
});