import { describe, expect, it } from "vitest";
import { isSinglePiece, unitPriceLines } from "./unitLines";
import { unitPriceText } from "./unit";

describe("isSinglePiece", () => {
  it("is true for 1 of a piece unit", () => {
    expect(isSinglePiece(1, "count")).toBe(true);
    expect(isSinglePiece(1, "sheet")).toBe(true);
    expect(isSinglePiece(1, "bag")).toBe(true);
  });

  it("is false for other sizes and for weight or volume units", () => {
    expect(isSinglePiece(2, "count")).toBe(false);
    expect(isSinglePiece(1, "ml")).toBe(false);
    expect(isSinglePiece(1, "g")).toBe(false);
  });
});

describe("unitPriceLines", () => {
  const base = { displayPrice: 396, enteredPrice: 396, bulkTiers: [], size: 1000, unit: "ml" };

  it("gives one unlabeled line without bulk tiers", () => {
    expect(unitPriceLines(base)).toEqual([
      { label: null, text: unitPriceText(396, 1000, "ml") },
    ]);
  });

  it("gives a regular line and a line for the biggest discount tier", () => {
    const lines = unitPriceLines({
      displayPrice: 1000,
      enteredPrice: 1000,
      bulkTiers: [
        { quantity: 10, percent: 20 },
        { quantity: 20, percent: 25 },
      ],
      size: 500,
      unit: "ml",
    });
    expect(lines).toEqual([
      { label: "通常", text: unitPriceText(1000, 500, "ml") },
      { label: "まとめ買い25%引", text: unitPriceText(750, 500, "ml") },
    ]);
  });

  it("uses the biggest percent, not the biggest quantity", () => {
    const lines = unitPriceLines({
      displayPrice: 1000,
      enteredPrice: 1000,
      bulkTiers: [
        { quantity: 5, percent: 30 },
        { quantity: 10, percent: 20 },
      ],
      size: 500,
      unit: "ml",
    });
    expect(lines[1]).toEqual({ label: "まとめ買い30%引", text: unitPriceText(700, 500, "ml") });
  });

  it("gives nothing for a single piece when hidden, and a line when not hidden", () => {
    const single = { ...base, displayPrice: 298, enteredPrice: 298, size: 1, unit: "count" };
    expect(unitPriceLines({ ...single, hideSinglePiece: true })).toEqual([]);
    expect(unitPriceLines(single)).toHaveLength(1);
  });

  it("gives nothing for an unknown unit", () => {
    expect(unitPriceLines({ ...base, unit: "box" })).toEqual([]);
  });
});