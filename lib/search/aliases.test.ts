import { describe, expect, it } from "vitest";
import { expandQuery, matchesSearchWithAliases } from "./aliases";

const aliases = [
  { alias: "離乳食", canonical: "ベビーフード" },
  { alias: "baby food", canonical: "ベビーフード" },
];

describe("expandQuery", () => {
  it("adds the word of an alias", () => {
    expect(expandQuery("baby food", aliases)).toEqual(["baby food", "ベビーフード"]);
  });

  it("keeps the other words and ignores case, width and kana", () => {
    expect(expandQuery("ＢＡＢＹ　ＦＯＯＤ りんご", aliases)).toEqual([
      "baby food リンゴ",
      "ベビーフード リンゴ",
    ]);
  });

  it("returns the query unchanged when no alias is in it", () => {
    expect(expandQuery("牛乳", aliases)).toEqual(["牛乳"]);
  });
});

describe("matchesSearchWithAliases", () => {
  it("finds the word through an alias and still finds the alias text itself", () => {
    expect(matchesSearchWithAliases("ベビーフード りんご", "baby food", aliases)).toBe(true);
    expect(matchesSearchWithAliases("Baby spoon", "baby food", aliases)).toBe(false);
    expect(matchesSearchWithAliases("baby food puree", "baby food", aliases)).toBe(true);
  });
});