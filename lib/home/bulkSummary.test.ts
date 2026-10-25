import { describe, expect, it } from "vitest";
import { bulkFeedSummary } from "./bulkSummary";

describe("bulkFeedSummary", () => {
  it("returns null without tiers", () => {
    expect(bulkFeedSummary(1000, [])).toBeNull();
  });

  it("shows a single percent tier", () => {
    expect(
      bulkFeedSummary(1000, [{ kind: "percent", quantity: 10, percent: 20 }]),
    ).toEqual({
      text: "10個以上 20%引 ¥800",
      more: 0,
    });
  });

  it("picks the best of several percent tiers and counts the others", () => {
    expect(
      bulkFeedSummary(1000, [
        { kind: "percent", quantity: 10, percent: 5 },
        { kind: "percent", quantity: 20, percent: 20 },
      ]),
    ).toEqual({ text: "20個以上 20%引 ¥800", more: 1 });
  });

  it("shows a bundle price", () => {
    expect(
      bulkFeedSummary(200, [{ kind: "total", quantity: 5, total: 550 }]),
    ).toEqual({
      text: "5個で¥550",
      more: 0,
    });
  });

  it("compares a bundle price with a percent tier by price per item", () => {
    expect(
      bulkFeedSummary(200, [
        { kind: "percent", quantity: 10, percent: 10 },
        { kind: "total", quantity: 5, total: 750 },
      ]),
    ).toEqual({ text: "5個で¥750", more: 1 });
  });
});
