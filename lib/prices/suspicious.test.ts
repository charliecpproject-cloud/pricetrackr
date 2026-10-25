import { describe, expect, it } from "vitest";
import { suspiciousPrice } from "./suspicious";

const unknown = (price: number) => ({ price, taxBasis: "unknown" as const });
const incl = (price: number) => ({ price, taxBasis: "incl" as const });
const excl = (price: number) => ({ price, taxBasis: "excl" as const });

describe("suspiciousPrice: size of the change", () => {
  it("warns at 5x or more", () => {
    expect(suspiciousPrice(1000, "incl", incl(200))).toEqual([
      { kind: "jump", ratio: 5 },
    ]);
    expect(suspiciousPrice(19980, "incl", incl(1998))[0].kind).toBe("jump");
  });

  it("does not warn just below 5x", () => {
    expect(suspiciousPrice(980, "incl", incl(200))).toEqual([]);
  });

  it("warns at 1/5 or less", () => {
    expect(suspiciousPrice(200, "incl", incl(1000))).toEqual([
      { kind: "drop", ratio: 0.2 },
    ]);
  });

  it("does not warn for a normal change", () => {
    expect(suspiciousPrice(2064, "incl", incl(2000))).toEqual([]);
    expect(suspiciousPrice(1500, "incl", incl(2000))).toEqual([]);
  });
});

describe("suspiciousPrice: tax mix-up", () => {
  it("warns when the difference is the tax rate and the basis is unknown", () => {
    expect(suspiciousPrice(1080, "unknown", unknown(1000))).toEqual([
      { kind: "tax", rate: 8 },
    ]);
    expect(suspiciousPrice(1100, "incl", unknown(1000))).toEqual([
      { kind: "tax", rate: 10 },
    ]);
  });

  it("also warns for the inverse ratio", () => {
    expect(suspiciousPrice(1000, "unknown", unknown(1080))).toEqual([
      { kind: "tax", rate: 8 },
    ]);
  });

  it("does not warn when the tax choice explains it", () => {
    expect(suspiciousPrice(1100, "incl", excl(1000))).toEqual([]);
    expect(suspiciousPrice(1000, "excl", incl(1100))).toEqual([]);
  });

  it("does not warn when both bases are known and equal", () => {
    expect(suspiciousPrice(1080, "incl", incl(1000))).toEqual([]);
  });

  it("warns when the direction contradicts the tax choice", () => {
    expect(suspiciousPrice(1000, "incl", excl(1100))).toEqual([
      { kind: "tax", rate: 10 },
    ]);
  });

  it("allows small rounding differences", () => {
    expect(suspiciousPrice(214, "unknown", unknown(198))).toEqual([
      { kind: "tax", rate: 8 },
    ]);
  });
});

describe("suspiciousPrice: nothing to compare", () => {
  it("returns nothing without a previous price or with a bad price", () => {
    expect(suspiciousPrice(1000, "incl", null)).toEqual([]);
    expect(suspiciousPrice(NaN, "incl", incl(1000))).toEqual([]);
    expect(suspiciousPrice(0, "incl", incl(1000))).toEqual([]);
    expect(suspiciousPrice(1000, "incl", incl(0))).toEqual([]);
  });
});
