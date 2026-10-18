import { describe, expect, it } from "vitest";
import { pointsNeeded, pointUseMultiplierOf } from "./points";

describe("pointsNeeded", () => {
  it("converts yen to points", () => {
    expect(pointsNeeded(1500, 1.5)).toBe(1000);
  });

  it("rounds up to whole points", () => {
    expect(pointsNeeded(199, 1.5)).toBe(133);
  });

  it("is not thrown off by float error", () => {
    expect(pointsNeeded(1200, 1.2)).toBe(1000);
  });

  it("returns null for unusable input", () => {
    expect(pointsNeeded(0, 1.5)).toBeNull();
    expect(pointsNeeded(Number.NaN, 1.5)).toBeNull();
    expect(pointsNeeded(1500, 0.5)).toBeNull();
  });
});

describe("pointUseMultiplierOf", () => {
  it("returns the multiplier only when enabled", () => {
    expect(pointUseMultiplierOf(true, 1.5)).toBe(1.5);
    expect(pointUseMultiplierOf(true, "1.50")).toBe(1.5);
    expect(pointUseMultiplierOf(false, 1.5)).toBeNull();
    expect(pointUseMultiplierOf(undefined, 1.5)).toBeNull();
    expect(pointUseMultiplierOf(true, 0)).toBeNull();
  });
});