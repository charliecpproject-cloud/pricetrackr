import { describe, expect, it } from "vitest";
import { parsePriceInput, priceChange } from "./previous";

const prev = { price: 2000, taxBasis: "incl" as const };

describe("parsePriceInput", () => {
  it("reads plain, comma, full-width and yen text", () => {
    expect(parsePriceInput("198")).toBe(198);
    expect(parsePriceInput("1,998")).toBe(1998);
    expect(parsePriceInput("１９９８")).toBe(1998);
    expect(parsePriceInput("¥198")).toBe(198);
    expect(parsePriceInput("19.8")).toBe(19.8);
  });

  it("returns NaN for empty or invalid text", () => {
    expect(parsePriceInput("")).toBeNaN();
    expect(parsePriceInput("  ")).toBeNaN();
    expect(parsePriceInput("abc")).toBeNaN();
  });
});

describe("priceChange", () => {
  it("up", () => {
    expect(priceChange(2064, "incl", prev)).toEqual({
      kind: "up",
      percent: 3.2,
    });
  });

  it("down", () => {
    expect(priceChange(1918, "incl", prev)).toEqual({
      kind: "down",
      percent: 4.1,
    });
  });

  it("same", () => {
    expect(priceChange(2000, "incl", prev)).toEqual({ kind: "same" });
    expect(priceChange(2000.1, "incl", prev)).toEqual({ kind: "same" });
  });

  it("does not compare different tax bases", () => {
    expect(priceChange(2064, "excl", prev)).toEqual({ kind: "mismatch" });
    expect(priceChange(2064, "unknown", prev)).toEqual({ kind: "mismatch" });
  });

  it("compares two unknown bases", () => {
    expect(
      priceChange(2100, "unknown", { price: 2000, taxBasis: "unknown" }),
    ).toEqual({
      kind: "up",
      percent: 5,
    });
  });

  it("shows nothing for an empty or invalid price", () => {
    expect(priceChange(NaN, "incl", prev)).toEqual({ kind: "none" });
    expect(priceChange(0, "incl", prev)).toEqual({ kind: "none" });
  });
});
