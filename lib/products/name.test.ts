import { describe, it, expect } from "vitest";
import { hasJapanese, splitProductName, displayName } from "./name";

describe("hasJapanese", () => {
  it("detects hiragana, katakana, kanji and half-width katakana", () => {
    expect(hasJapanese("ぱん")).toBe(true);
    expect(hasJapanese("パン")).toBe(true);
    expect(hasJapanese("食パン")).toBe(true);
    expect(hasJapanese("ﾊﾟﾝ")).toBe(true);
    expect(hasJapanese("PASCO 超熟")).toBe(true);
  });
  it("is false for Latin text", () => {
    expect(hasJapanese("Pampers Premium")).toBe(false);
    expect(hasJapanese("")).toBe(false);
  });
});

describe("splitProductName", () => {
  it("puts a Japanese name in name_ja", () => {
    expect(splitProductName("牛乳", null)).toEqual({ name_ja: "牛乳", name_en: null });
  });
  it("puts an English name in name_en", () => {
    expect(splitProductName("Milk", null)).toEqual({ name_ja: null, name_en: "Milk" });
  });
  it("puts the other name in the opposite column", () => {
    expect(splitProductName("牛乳", "Milk")).toEqual({ name_ja: "牛乳", name_en: "Milk" });
    expect(splitProductName("Milk", "牛乳")).toEqual({ name_ja: "牛乳", name_en: "Milk" });
  });
  it("drops an other name that equals the main name", () => {
    expect(splitProductName("Milk", " milk ")).toEqual({ name_ja: null, name_en: "Milk" });
    expect(splitProductName("牛乳", "")).toEqual({ name_ja: "牛乳", name_en: null });
  });
});

describe("displayName", () => {
  it("prefers Japanese, then English, then a placeholder", () => {
    expect(displayName({ name_ja: "牛乳", name_en: "Milk" })).toBe("牛乳");
    expect(displayName({ name_ja: null, name_en: "Milk" })).toBe("Milk");
    expect(displayName({})).toBe("名称未設定");
  });
});