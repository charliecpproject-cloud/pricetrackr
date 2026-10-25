import { describe, expect, it } from "vitest";
import { matchesSearch, normalizeForSearch, searchTokens } from "./normalize";

describe("normalizeForSearch", () => {
  it("ignores width and case", () => {
    expect(normalizeForSearch("ＡＢＣ　Def")).toBe("abc def");
  });

  it("treats hiragana and katakana alike", () => {
    expect(normalizeForSearch("ぱん")).toBe("パン");
    expect(normalizeForSearch("ﾊﾟﾝ")).toBe("パン");
  });
});

describe("searchTokens", () => {
  it("splits on spaces and removes duplicates", () => {
    expect(searchTokens("牛乳  1000 牛乳")).toEqual(["牛乳", "1000"]);
    expect(searchTokens("   ")).toEqual([]);
  });
});

describe("matchesSearch", () => {
  const text = "明治おいしい牛乳（明治） — 1000ml";

  it("needs every word, in any order", () => {
    expect(matchesSearch(text, "牛乳 明治")).toBe(true);
    expect(matchesSearch(text, "1000ML 牛乳")).toBe(true);
    expect(matchesSearch(text, "牛乳 雪印")).toBe(false);
  });

  it("finds kana across hiragana and katakana", () => {
    expect(matchesSearch("食パン", "ぱん")).toBe(true);
  });

  it("matches everything for an empty query", () => {
    expect(matchesSearch(text, "")).toBe(true);
  });
});
