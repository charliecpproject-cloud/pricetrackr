import { describe, expect, it } from "vitest";
import { countCategories, suggestCategories } from "./category";

const cats = [
  { name: "飲料", count: 5 },
  { name: "飲料品", count: 1 },
  { name: "飲み物", count: 1 },
  { name: "パン", count: 3 },
  { name: "肉", count: 2 },
];

describe("suggestCategories", () => {
  it("finds whole-term and single-kanji matches, and only those", () => {
    expect(suggestCategories("飲料品", cats).map((c) => c.name)).toEqual([
      "飲料品",
      "飲料",
      "飲み物",
    ]);
  });

  it("returns the most used categories for an empty term", () => {
    const names = suggestCategories("", cats).map((c) => c.name);
    // most used first; categories with the same count are in name order
    expect(names.slice(0, 3)).toEqual(["飲料", "パン", "肉"]);
    expect(names).toHaveLength(5);
  });

  it("returns at most 10", () => {
    const many = Array.from({ length: 15 }, (_, i) => ({ name: `飲${i}`, count: i }));
    expect(suggestCategories("飲", many)).toHaveLength(10);
  });
});

describe("countCategories", () => {
  it("groups the same category and ignores empty values", () => {
    const result = countCategories(["パン", "パン", " パン ", null, "", "飲料"]);
    expect(result).toContainEqual({ name: "パン", count: 3 });
    expect(result).toContainEqual({ name: "飲料", count: 1 });
    expect(result).toHaveLength(2);
  });
});