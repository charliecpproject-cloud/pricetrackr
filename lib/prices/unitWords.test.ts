import { describe, expect, it } from "vitest";
import { counterLabel, isCounterUnit, isMeasureUnit } from "./unitWords";

describe("isMeasureUnit", () => {
  it("knows ml, L, g and kg only", () => {
    for (const unit of ["ml", "L", "g", "kg"]) expect(isMeasureUnit(unit)).toBe(true);
    for (const unit of ["count", "本", "", "l", "KG"]) expect(isMeasureUnit(unit)).toBe(false);
  });
});

describe("counterLabel", () => {
  it("maps the old keys to their words", () => {
    expect(counterLabel("count")).toBe("個");
    expect(counterLabel("sheet")).toBe("枚");
    expect(counterLabel("bag")).toBe("袋");
  });

  it("shows any other word as it is", () => {
    expect(counterLabel("本")).toBe("本");
    expect(counterLabel("パック")).toBe("パック");
    expect(counterLabel("toString")).toBe("toString");
  });
});

describe("isCounterUnit", () => {
  it("accepts counter words, old keys included", () => {
    for (const unit of ["count", "sheet", "bag", "本", "パック", "切れ"]) {
      expect(isCounterUnit(unit)).toBe(true);
    }
  });

  it("refuses measures, empty and too long units", () => {
    for (const unit of ["ml", "kg", "", "  ", "123456789"]) {
      expect(isCounterUnit(unit)).toBe(false);
    }
  });
});