import { describe, expect, it } from "vitest";
import { unitPrice, unitPriceText } from "./unit";

describe("unitPriceText", () => {
  it("shows liquids per 100 ml", () => {
    expect(unitPriceText(198, 500, "ml")).toBe("¥39.6 / 100ml");
    expect(unitPriceText(298, 1, "L")).toBe("¥29.8 / 100ml");
  });
  it("shows weights per 100 g", () => {
    expect(unitPriceText(500, 1, "kg")).toBe("¥50 / 100g");
    expect(unitPriceText(120, 200, "g")).toBe("¥60 / 100g");
  });
  it("shows counts, sheets and bags per piece", () => {
    expect(unitPriceText(300, 6, "count")).toBe("¥50 / 個");
    expect(unitPriceText(400, 200, "sheet")).toBe("¥2 / 枚");
    expect(unitPriceText(500, 10, "bag")).toBe("¥50 / 袋");
  });
  it("shows any other counter word per piece", () => {
    expect(unitPriceText(300, 6, "本")).toBe("¥50 / 本");
    expect(unitPriceText(240, 4, "パック")).toBe("¥60 / パック");
    expect(unitPriceText(500, 2, "玉")).toBe("¥250 / 玉");
  });
});

describe("unitPrice", () => {
  it("returns null for an empty or too long unit, or invalid sizes", () => {
    expect(unitPrice(100, 5, "")).toBeNull();
    expect(unitPrice(100, 5, "123456789")).toBeNull();
    expect(unitPrice(100, 0, "ml")).toBeNull();
    expect(unitPrice(Number.NaN, 5, "ml")).toBeNull();
  });
});