import { describe, expect, it } from "vitest";
import { originalPrice, parseBulkPercent, parseBulkQuantity } from "./bulk";

describe("originalPrice", () => {
  it("reverses a clean discount", () => {
    expect(originalPrice(800, 20)).toBe(1000);
    expect(originalPrice(1200, 25)).toBe(1600);
  });

  it("rounds up, like the coupon example (2838 at 15% is 2412)", () => {
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