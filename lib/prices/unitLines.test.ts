import { describe, expect, it } from "vitest";
import { isSinglePiece, unitPriceLines } from "./unitLines";
import { unitPriceText } from "./unit";

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

describe("unitPriceLines", () => {
  const base = { enteredPrice: 1000, bulkTiers: [], size: 500, unit: "ml" };
  const per = (price: number) => unitPriceText(price, 500, "ml");

  it("gives one unlabeled line without a discount or tiers", () => {
    expect(unitPriceLines(base)).toEqual([{ label: null, text: per(1000) }]);
  });

  it("gives the same single line when the chain has no coupon or membership", () => {
    expect(unitPriceLines({ ...base, couponPercents: [], memberPercent: null })).toEqual([
      { label: null, text: per(1000) },
    ]);
  });

  it("adds a coupon line next to the line without the coupon", () => {
    expect(unitPriceLines({ ...base, couponPercents: [5, 10] })).toEqual([
      { label: "通常", text: per(1000) },
      { label: "10%クーポン", text: per(900) },
    ]);
  });

  it("uses the membership percent when it is larger than the coupon", () => {
    expect(unitPriceLines({ ...base, couponPercents: [5], memberPercent: 8 })).toEqual([
      { label: "通常", text: per(1000) },
      { label: "会員8%引", text: per(920) },
    ]);
  });

  it("adds no discount line when the entered price is already a member price", () => {
    expect(unitPriceLines({ ...base, couponPercents: [10], isMemberPrice: true })).toEqual([
      { label: null, text: per(1000) },
    ]);
  });

  it("adds a line for the best percent tier", () => {
    const lines = unitPriceLines({
      ...base,
      bulkTiers: [
        { kind: "percent", quantity: 10, percent: 20 },
        { kind: "percent", quantity: 20, percent: 25 },
      ],
    });
    expect(lines).toEqual([
      { label: "通常", text: per(1000) },
      { label: "まとめ買い25%引", text: per(750) },
    ]);
  });

  it("adds a line for a bundle price, per item", () => {
    const lines = unitPriceLines({
      ...base,
      enteredPrice: 120,
      bulkTiers: [{ kind: "total", quantity: 5, total: 550 }],
    });
    expect(lines).toEqual([
      { label: "通常", text: per(120) },
      { label: "まとめ買い5個で¥550", text: per(110) },
    ]);
  });

  it("picks the tier with the lowest price per item, whatever its kind", () => {
    const lines = unitPriceLines({
      ...base,
      bulkTiers: [
        { kind: "percent", quantity: 10, percent: 20 }, // 800 each
        { kind: "total", quantity: 10, total: 7000 }, // 700 each
      ],
    });
    expect(lines[1]).toEqual({ label: "まとめ買い10個で¥7,000", text: per(700) });
  });

  it("gives three lines with a coupon and a tier, each from the regular price", () => {
    const lines = unitPriceLines({
      ...base,
      couponPercents: [10],
      bulkTiers: [{ kind: "percent", quantity: 10, percent: 20 }],
    });
    expect(lines).toEqual([
      { label: "通常", text: per(1000) },
      { label: "10%クーポン", text: per(900) },
      { label: "まとめ買い20%引", text: per(800) },
    ]);
  });

  it("gives nothing for a single piece when hidden, and a line when not hidden", () => {
    const single = { ...base, enteredPrice: 298, size: 1, unit: "count", couponPercents: [10] };
    expect(unitPriceLines({ ...single, hideSinglePiece: true })).toEqual([]);
    expect(unitPriceLines(single)).toHaveLength(2);
  });

  it("gives nothing for an empty unit", () => {
    expect(unitPriceLines({ ...base, unit: "" })).toEqual([]);
  });
});