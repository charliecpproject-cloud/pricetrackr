import { describe, it, expect } from "vitest";
import { parsePriceYen, toObservedAt } from "./schema";

describe("parsePriceYen", () => {
  it("should parse valid inputs correctly", () => {
    expect(parsePriceYen("205")).toBe(205);
    expect(parsePriceYen("２０５円")).toBe(205);
    expect(parsePriceYen("¥1,280")).toBe(1280);
    expect(parsePriceYen(" 98.5 ")).toBe(98.5);
  });

  it("should return null for invalid inputs", () => {
    const invalidInputs = ["0", "-5", "abc", "", "1000001", "1.234"];
    for (const input of invalidInputs) {
      expect(parsePriceYen(input)).toBeNull();
    }
  });
});

describe("toObservedAt", () => {
  it("should convert a valid datetime-local string", () => {
    expect(toObservedAt("2026-10-11T14:35")).toBe("2026-10-11T14:35:00+09:00");
  });

  it("should return null for invalid datetime strings", () => {
    const invalidDates = [
      "2026-10-11", // missing time
      "2026-13-40T10:00", // invalid month/day
      "2026-02-31T10:00", // invalid day
      "", // empty
      "2099-01-01T00:00", // more than 1 day in the future
    ];
    for (const dt of invalidDates) {
      expect(toObservedAt(dt)).toBeNull();
    }
  });
});
