import { describe, expect, it } from "vitest";
import { parseNewCounterWord } from "./counterWord";

describe("parseNewCounterWord", () => {
  it("accepts a counter word and trims it", () => {
    expect(parseNewCounterWord("ダース")).toEqual({ ok: true, word: "ダース" });
    expect(parseNewCounterWord("  切れ ")).toEqual({ ok: true, word: "切れ" });
  });

  it("turns half-width katakana into normal form", () => {
    expect(parseNewCounterWord("ﾊﾟｯｸ")).toEqual({ ok: true, word: "パック" });
  });

  it("refuses empty text, spaces, digits and symbols", () => {
    for (const bad of ["", "   ", "2本", "本 数", "本!", "本、"]) {
      expect(parseNewCounterWord(bad).ok).toBe(false);
    }
  });

  it("allows 8 characters and refuses 9", () => {
    expect(parseNewCounterWord("あいうえおかきく").ok).toBe(true);
    expect(parseNewCounterWord("あいうえおかきくけ").ok).toBe(false);
  });

  it("refuses measures and the old keys in any case", () => {
    for (const bad of ["ml", "ML", "L", "l", "g", "kg", "KG", "count", "Sheet", "bag"]) {
      expect(parseNewCounterWord(bad).ok).toBe(false);
    }
  });
});