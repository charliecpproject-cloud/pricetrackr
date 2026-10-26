import { describe, expect, it } from "vitest";
import { countActive, parseFilters } from "./filters";

describe("compare option (cmp)", () => {
  it("compares the discounted price by default", () => {
    expect(parseFilters({}).compare).toBe("discounted");
  });

  it("reads cmp=normal", () => {
    expect(parseFilters({ cmp: "normal" }).compare).toBe("normal");
  });

  it("ignores any other value", () => {
    expect(parseFilters({ cmp: "something" }).compare).toBe("discounted");
    expect(parseFilters({ cmp: "discounted" }).compare).toBe("discounted");
  });

  it("counts as an active filter only when it is not the default", () => {
    expect(countActive(parseFilters({}))).toBe(0);
    expect(countActive(parseFilters({ cmp: "discounted" }))).toBe(0);
    expect(countActive(parseFilters({ cmp: "normal" }))).toBe(1);
  });
});
