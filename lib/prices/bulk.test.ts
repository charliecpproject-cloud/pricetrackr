import { describe, expect, it } from "vitest";
import {
  bulkTierPrice,
  originalPrice,
  parseBulkPercent,
  parseBulkQuantity,
  parseBulkTiers,
  parseStoredTiers,
} from "./bulk";

describe("originalPrice (old, removed in Step 34e)", () => {
  it("reverses a clean discount", () => {
    expect(originalPrice(800, 20)).toBe(1000);
    expect(originalPrice(1200, 25)).toBe(1600);
  });

  it("rounds up", () => {
    expect(originalPrice(2412, 15)).toBe(2838);
    expect(originalPrice(790, 20)).toBe(988);
  });

  it("returns null for unusable input", () => {
    expect(originalPrice(800, 100)).toBeNull();
    expect(originalPrice(800, 0)).toBeNull();
    expect(originalPrice(Number.NaN, 20)).toBeNull();
    expect(originalPrice(-1, 20)).toBeNull();
  });
});

describe("parseBulkPercent", () => {
  it("accepts 1 to 99, also full-width", () => {
    expect(parseBulkPercent("20")).toBe(20);
    expect(parseBulkPercent("２５")).toBe(25);
    expect(parseBulkPercent("99")).toBe(99);
  });

  it("rejects everything else", () => {
    for (const bad of ["0", "100", "20.5", "abc", "", null]) {
      expect(parseBulkPercent(bad)).toBeNull();
    }
  });
});

describe("parseBulkQuantity", () => {
  it("accepts 2 to 999", () => {
    expect(parseBulkQuantity("10")).toBe(10);
    expect(parseBulkQuantity("2")).toBe(2);
  });

  it("rejects 1, 1000 and non-numbers", () => {
    for (const bad of ["1", "1000", "1.5", "x", null]) {
      expect(parseBulkQuantity(bad)).toBeNull();
    }
  });
});

describe("bulkTierPrice", () => {
  it("applies the percent to the regular price", () => {
    expect(bulkTierPrice(1000, 20)).toBe(800);
    expect(bulkTierPrice(1000, 25)).toBe(750);
  });

  it("rounds down, like coupons", () => {
    expect(bulkTierPrice(298, 10)).toBe(268);
  });
});

describe("parseBulkTiers", () => {
  it("returns the tiers sorted by quantity", () => {
    const result = parseBulkTiers([
      { quantity: "20", percent: "25" },
      { quantity: "10", percent: "20" },
    ]);
    expect(result).toEqual({
      ok: true,
      tiers: [
        { quantity: 10, percent: 20 },
        { quantity: 20, percent: 25 },
      ],
    });
  });

  it("skips empty rows, so one tier is enough", () => {
    const result = parseBulkTiers([
      { quantity: "10", percent: "20" },
      { quantity: "", percent: "" },
    ]);
    expect(result).toEqual({ ok: true, tiers: [{ quantity: 10, percent: 20 }] });
  });

  it("refuses no tiers at all", () => {
    expect(parseBulkTiers([{ quantity: "", percent: "" }]).ok).toBe(false);
    expect(parseBulkTiers([]).ok).toBe(false);
  });

  it("refuses half-filled or invalid rows", () => {
    expect(parseBulkTiers([{ quantity: "10", percent: "" }]).ok).toBe(false);
    expect(parseBulkTiers([{ quantity: "", percent: "20" }]).ok).toBe(false);
    expect(parseBulkTiers([{ quantity: "1", percent: "20" }]).ok).toBe(false);
    expect(parseBulkTiers([{ quantity: "10", percent: "100" }]).ok).toBe(false);
  });

  it("refuses a repeated quantity", () => {
    const result = parseBulkTiers([
      { quantity: "10", percent: "20" },
      { quantity: "10", percent: "25" },
    ]);
    expect(result.ok).toBe(false);
  });

  it("refuses more than 3 tiers", () => {
    const result = parseBulkTiers([
      { quantity: "5", percent: "10" },
      { quantity: "10", percent: "20" },
      { quantity: "20", percent: "25" },
      { quantity: "30", percent: "30" },
    ]);
    expect(result.ok).toBe(false);
  });
});

describe("parseStoredTiers", () => {
  it("reads a stored list, sorted by quantity", () => {
    expect(
      parseStoredTiers([
        { quantity: 20, percent: 25 },
        { quantity: 10, percent: 20 },
      ])
    ).toEqual([
      { quantity: 10, percent: 20 },
      { quantity: 20, percent: 25 },
    ]);
  });

  it("returns an empty list for anything that is not a list", () => {
    expect(parseStoredTiers(null)).toEqual([]);
    expect(parseStoredTiers("x")).toEqual([]);
    expect(parseStoredTiers({})).toEqual([]);
  });

  it("drops unusable items", () => {
    expect(
      parseStoredTiers([{ quantity: 10, percent: 20 }, { quantity: 1, percent: 20 }, { quantity: "x" }, null])
    ).toEqual([{ quantity: 10, percent: 20 }]);
  });
});