import { describe, expect, it } from "vitest";
import { similarSearchVariants } from "./variants";

describe("similarSearchVariants", () => {
  it("gives nothing for empty or very short input", () => {
    expect(similarSearchVariants("")).toEqual([]);
    expect(similarSearchVariants("a")).toEqual([]);
    expect(similarSearchVariants("牛乳")).toEqual([]);
    expect(similarSearchVariants("ab")).toEqual([]);
  });

  it("uses a prefix of a single longer word", () => {
    expect(similarSearchVariants("ヨーグルド")).toEqual(["ヨーグ"]);
    expect(similarSearchVariants("よーぐると")).toEqual(["ヨーグ"]);
    expect(similarSearchVariants("Milk")).toEqual(["mil"]);
  });

  it("tries each word of several words, then the prefixes", () => {
    expect(similarSearchVariants("明治 ヨーグルド")).toEqual([
      "明治",
      "ヨーグルド",
      "ヨーグ",
    ]);
    expect(similarSearchVariants("milk chocolat")).toEqual([
      "milk",
      "chocolat",
      "mil",
      "cho",
    ]);
  });

  it("returns at most 6", () => {
    expect(similarSearchVariants("aaaa bbbb cccc dddd")).toEqual([
      "aaaa",
      "bbbb",
      "cccc",
      "dddd",
      "aaa",
      "bbb",
    ]);
  });
});
