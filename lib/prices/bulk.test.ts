import { describe, expect, it } from "vitest";
import {
  bestBulkTier,
  bulkEquivalentPercent,
  bulkItemPrice,
  bulkTierPrice,
  bulkTiersToJson,
  parseBulkPercent,
  parseBulkQuantity,
  parseBulkTiers,
  parseBulkTotal,
  parseStoredTiers,
  type BulkTier,
} from "./bulk";

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

describe("parseBulkTotal", () => {
  it("accepts whole yen, also full-width, with a yen sign, 円 or commas", () => {
    expect(parseBulkTotal("550")).toBe(550);
    expect(parseBulkTotal("５５０円")).toBe(550);
    expect(parseBulkTotal("¥1,200")).toBe(1200);
  });

  it("rejects zero, decimals, text, empty and too large", () => {
    for (const bad of ["0", "5.5", "abc", "", "1000001", null]) {
      expect(parseBulkTotal(bad)).toBeNull();
    }
  });
});

describe("bulkTierPrice", () => {
  it("applies the percent to the regular price, rounding down like coupons", () => {
    expect(bulkTierPrice(1000, 20)).toBe(800);
    expect(bulkTierPrice(298, 10)).toBe(268);
  });
});

describe("bulkItemPrice", () => {
  it("uses the percent for a percent tier", () => {
    expect(
      bulkItemPrice(1000, { kind: "percent", quantity: 10, percent: 20 }),
    ).toBe(800);
  });

  it("divides a bundle price by the quantity, with one decimal", () => {
    expect(bulkItemPrice(120, { kind: "total", quantity: 5, total: 550 })).toBe(
      110,
    );
    expect(bulkItemPrice(200, { kind: "total", quantity: 3, total: 500 })).toBe(
      166.7,
    );
  });
});

describe("bulkEquivalentPercent", () => {
  it("is the percent of a percent tier", () => {
    expect(
      bulkEquivalentPercent(1000, {
        kind: "percent",
        quantity: 10,
        percent: 20,
      }),
    ).toBe(20);
  });

  it("works out the discount of a bundle price, rounded down", () => {
    // 5 x 120 = 600; 550 is 8.33% less
    expect(
      bulkEquivalentPercent(120, { kind: "total", quantity: 5, total: 550 }),
    ).toBe(8);
    expect(
      bulkEquivalentPercent(100, { kind: "total", quantity: 10, total: 710 }),
    ).toBe(29);
  });

  it("is null when the bundle is not cheaper", () => {
    expect(
      bulkEquivalentPercent(100, { kind: "total", quantity: 5, total: 500 }),
    ).toBeNull();
    expect(
      bulkEquivalentPercent(100, { kind: "total", quantity: 5, total: 600 }),
    ).toBeNull();
  });
});

describe("bestBulkTier", () => {
  it("picks the tier with the lowest price per item, whatever its kind", () => {
    const percent: BulkTier = { kind: "percent", quantity: 10, percent: 20 }; // 800 each
    const total: BulkTier = { kind: "total", quantity: 10, total: 7000 }; // 700 each
    expect(bestBulkTier(1000, [percent, total])).toEqual(total);
    expect(bestBulkTier(1000, [total, percent])).toEqual(total);
  });

  it("is null without tiers", () => {
    expect(bestBulkTier(1000, [])).toBeNull();
  });
});

describe("parseBulkTiers", () => {
  const row = (
    quantity: string,
    percent: string,
    total = "",
    mode = "percent",
  ) => ({
    quantity,
    mode,
    percent,
    total,
  });

  it("returns the tiers sorted by quantity", () => {
    expect(parseBulkTiers([row("20", "25"), row("10", "20")])).toEqual({
      ok: true,
      tiers: [
        { kind: "percent", quantity: 10, percent: 20 },
        { kind: "percent", quantity: 20, percent: 25 },
      ],
    });
  });

  it("reads a bundle price row and ignores the other field", () => {
    expect(parseBulkTiers([row("5", "20", "550", "total")])).toEqual({
      ok: true,
      tiers: [{ kind: "total", quantity: 5, total: 550 }],
    });
  });

  it("mixes percent and bundle rows", () => {
    const result = parseBulkTiers([
      row("10", "20"),
      row("5", "", "550", "total"),
    ]);
    expect(result).toEqual({
      ok: true,
      tiers: [
        { kind: "total", quantity: 5, total: 550 },
        { kind: "percent", quantity: 10, percent: 20 },
      ],
    });
  });

  it("skips empty rows, so one tier is enough", () => {
    expect(parseBulkTiers([row("10", "20"), row("", "")])).toEqual({
      ok: true,
      tiers: [{ kind: "percent", quantity: 10, percent: 20 }],
    });
  });

  it("refuses no tiers at all", () => {
    expect(parseBulkTiers([row("", "")]).ok).toBe(false);
    expect(parseBulkTiers([]).ok).toBe(false);
  });

  it("refuses half-filled or invalid rows", () => {
    expect(parseBulkTiers([row("10", "")]).ok).toBe(false);
    expect(parseBulkTiers([row("", "20")]).ok).toBe(false);
    expect(parseBulkTiers([row("1", "20")]).ok).toBe(false);
    expect(parseBulkTiers([row("10", "100")]).ok).toBe(false);
    expect(parseBulkTiers([row("5", "", "", "total")]).ok).toBe(false);
    expect(parseBulkTiers([row("5", "", "0", "total")]).ok).toBe(false);
  });

  it("refuses a repeated quantity, even in different modes", () => {
    expect(parseBulkTiers([row("10", "20"), row("10", "25")]).ok).toBe(false);
    expect(
      parseBulkTiers([row("10", "20"), row("10", "", "700", "total")]).ok,
    ).toBe(false);
  });

  it("refuses more than 3 tiers", () => {
    const result = parseBulkTiers([
      row("5", "10"),
      row("10", "20"),
      row("20", "25"),
      row("30", "30"),
    ]);
    expect(result.ok).toBe(false);
  });
});

describe("parseStoredTiers", () => {
  it("reads percent tiers and bundle prices, sorted by quantity", () => {
    expect(
      parseStoredTiers([
        { quantity: 20, percent: 25 },
        { quantity: 5, total: 550 },
        { quantity: 10, percent: 20 },
      ]),
    ).toEqual([
      { kind: "total", quantity: 5, total: 550 },
      { kind: "percent", quantity: 10, percent: 20 },
      { kind: "percent", quantity: 20, percent: 25 },
    ]);
  });

  it("returns an empty list for anything that is not a list", () => {
    expect(parseStoredTiers(null)).toEqual([]);
    expect(parseStoredTiers("x")).toEqual([]);
    expect(parseStoredTiers({})).toEqual([]);
  });

  it("drops unusable items", () => {
    expect(
      parseStoredTiers([
        { quantity: 10, percent: 20 },
        { quantity: 1, percent: 20 },
        { quantity: 5, total: 0 },
        { quantity: 5 },
        { quantity: "x" },
        null,
      ]),
    ).toEqual([{ kind: "percent", quantity: 10, percent: 20 }]);
  });
});

describe("bulkTiersToJson", () => {
  it("stores {quantity, percent} or {quantity, total} and reads back the same", () => {
    const tiers: BulkTier[] = [
      { kind: "total", quantity: 5, total: 550 },
      { kind: "percent", quantity: 10, percent: 20 },
    ];
    const json = bulkTiersToJson(tiers);
    expect(json).toEqual([
      { quantity: 5, total: 550 },
      { quantity: 10, percent: 20 },
    ]);
    expect(parseStoredTiers(json)).toEqual(tiers);
  });
});
