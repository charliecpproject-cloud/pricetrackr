import { describe, expect, it } from "vitest";
import { taxHintMessage, taxIncludedEstimate } from "./taxHint";

describe("taxIncludedEstimate", () => {
  it("adds the tax and rounds down", () => {
    expect(taxIncludedEstimate(158, 8)).toBe(170);
    expect(taxIncludedEstimate(100, 10)).toBe(110);
    expect(taxIncludedEstimate(1000, 8)).toBe(1080);
  });

  it("returns null for unusable input", () => {
    expect(taxIncludedEstimate(Number.NaN, 8)).toBeNull();
    expect(taxIncludedEstimate(-1, 8)).toBeNull();
    expect(taxIncludedEstimate(100, 31)).toBeNull();
  });
});

describe("taxHintMessage", () => {
  it("explains a 税抜 price", () => {
    const text = taxHintMessage(158, 8, "excl");
    expect(text).toContain("8%");
    expect(text).toContain("170");
    expect(text).toContain("未確認");
  });

  it("explains a 税不明 price", () => {
    const text = taxHintMessage(158, 8, "unknown");
    expect(text).toContain("不明");
    expect(text).toContain("170");
  });

  it("has nothing to say for 税込 or a 0% rate", () => {
    expect(taxHintMessage(158, 8, "incl")).toBeNull();
    expect(taxHintMessage(158, 0, "excl")).toBeNull();
  });
});
