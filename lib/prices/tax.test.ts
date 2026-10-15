import { describe, expect, it } from "vitest";
import { canCompare, parseTaxBasis } from "./tax";

describe("parseTaxBasis", () => {
  it("accepts the three known values", () => {
    expect(parseTaxBasis("excl")).toBe("excl");
    expect(parseTaxBasis("incl")).toBe("incl");
    expect(parseTaxBasis("unknown")).toBe("unknown");
  });
  it("falls back to unknown", () => {
    expect(parseTaxBasis(null)).toBe("unknown");
    expect(parseTaxBasis("10%")).toBe("unknown");
  });
});

describe("canCompare", () => {
  it("is false for a single price", () => {
    expect(canCompare(["incl"])).toBe(false);
  });
  it("is true when all share the same known basis", () => {
    expect(canCompare(["incl", "incl"])).toBe(true);
    expect(canCompare(["excl", "excl", "excl"])).toBe(true);
  });
  it("is false when mixed or unknown", () => {
    expect(canCompare(["incl", "excl"])).toBe(false);
    expect(canCompare(["unknown", "unknown"])).toBe(false);
  });
});