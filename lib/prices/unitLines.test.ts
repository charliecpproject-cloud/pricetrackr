import { describe, expect, it } from "vitest";
import { isSinglePiece, unitPriceSummary } from "./unitLines";
import { formatYen } from "./format";
import { unitPrice } from "./unit";

describe("isSinglePiece", () => {
  it("is true for 1 of a counter word", () => {
    for (const unit of ["count", "sheet", "bag", "本", "パック"]) {
      expect(isSinglePiece(1, unit)).toBe(true);
    }
  });

  it("is false for other sizes and for measures", () => {
    expect(isSinglePiece(2, "count")).toBe(false);
    expect(isSinglePiece(1, "ml")).toBe(false);
    expect(isSinglePiece(1, "g")).toBe(false);
  });
});

describe("unitPriceSummary", () => {
  const base = { enteredPrice: 1000, bulkTiers: [], size: 500, unit: "ml" };
  // The text of a price per 100 ml for a 500 ml package.
  const per = (price: number) => formatYen(unitPrice(price, 500, "ml")!.amount);

  it("gives one unlabeled item without a discount or tiers", () => {
    expect(unitPriceSummary(base)).toEqual({
      per: "100mlあたり",
      items: [{ label: null, amount: per(1000) }],
    });
  });

  it("says あたり for liters, grams, kilograms and counter words", () => {
    expect(unitPriceSummary({ ...base, size: 1, unit: "L" })?.per).toBe("100mlあたり");
    expect(unitPriceSummary({ ...base, unit: "g" })?.per).toBe("100gあたり");
    expect(unitPriceSummary({ ...base, size: 2, unit: "kg" })?.per).toBe("100gあたり");
    expect(unitPriceSummary({ ...base, size: 6, unit: "count" })?.per).toBe("1個あたり");
    expect(unitPriceSummary({ ...base, size: 6, unit: "本" })?.per).toBe("1本あたり");
  });

  it("gives the same single item when the chain has no coupon or membership", () => {
    expect(unitPriceSummary({ ...base, couponPercents: [], memberPercent: null })?.items).toEqual([
      { label: null, amount: per(1000) },
    ]);
  });

  it("adds the best coupon next to the price without the coupon", () => {
    expect(unitPriceSummary({ ...base, couponPercents: [5, 10] })?.items).toEqual([
      { label: "通常", amount: per(1000) },
      { label: "10%クーポン", amount: per(900) },
    ]);
  });

  it("uses the membership percent when it is larger than the coupon", () => {
    expect(unitPriceSummary({ ...base, couponPercents: [5], memberPercent: 8 })?.items).toEqual([
      { label: "通常", amount: per(1000) },
      { label: "会員8%引", amount: per(920) },
    ]);
  });

  it("adds no discount item when the entered price is already a member price", () => {
    expect(unitPriceSummary({ ...base, couponPercents: [10], isMemberPrice: true })?.items).toEqual([
      { label: null, amount: per(1000) },
    ]);
  });

  it("adds the best percent tier", () => {
    const summary = unitPriceSummary({
      ...base,
      bulkTiers: [
        { kind: "percent", quantity: 10, percent: 20 },
        { kind: "percent", quantity: 20, percent: 25 },
      ],
    });
    expect(summary?.items).toEqual([
      { label: "通常", amount: per(1000) },
      { label: "まとめ買い25%引", amount: per(750) },
    ]);
  });

  it("adds a bundle price per item", () => {
    const summary = unitPriceSummary({
      ...base,
      enteredPrice: 120,
      bulkTiers: [{ kind: "total", quantity: 5, total: 550 }],
    });
    expect(summary?.items).toEqual([
      { label: "通常", amount: per(120) },
      { label: "まとめ買い5個で¥550", amount: per(110) },
    ]);
  });

  it("picks the tier with the lowest price per item, whatever its kind", () => {
    const summary = unitPriceSummary({
      ...base,
      bulkTiers: [
        { kind: "percent", quantity: 10, percent: 20 }, // 800 each
        { kind: "total", quantity: 10, total: 7000 }, // 700 each
      ],
    });
    expect(summary?.items[1]).toEqual({ label: "まとめ買い10個で¥7,000", amount: per(700) });
  });

  it("gives three items with a coupon and a tier, each from the regular price", () => {
    const summary = unitPriceSummary({
      ...base,
      couponPercents: [10],
      bulkTiers: [{ kind: "percent", quantity: 10, percent: 20 }],
    });
    expect(summary?.items).toEqual([
      { label: "通常", amount: per(1000) },
      { label: "10%クーポン", amount: per(900) },
      { label: "まとめ買い20%引", amount: per(800) },
    ]);
  });

  it("gives nothing for a single piece when hidden, and a summary when not hidden", () => {
    const single = { ...base, enteredPrice: 298, size: 1, unit: "count", couponPercents: [10] };
    expect(unitPriceSummary({ ...single, hideSinglePiece: true })).toBeNull();
    expect(unitPriceSummary(single)?.items).toHaveLength(2);
  });

  it("gives nothing for an empty unit", () => {
    expect(unitPriceSummary({ ...base, unit: "" })).toBeNull();
  });
});