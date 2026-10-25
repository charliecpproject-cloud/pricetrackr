import { describe, expect, it } from "vitest";
import { resolveBrand, suggestBrands } from "./brand";

const brands = [
  { name: "PASCO", count: 12 },
  { name: "キッコーマン", count: 5 },
  { name: "カルビー", count: 3 },
];
const aliases = [{ brand: "PASCO", alias: "パスコ" }];

describe("resolveBrand", () => {
  it("returns an empty text for a blank input", () => {
    expect(resolveBrand("   ", brands, aliases)).toBe("");
  });
  it("turns an alias into its brand", () => {
    expect(resolveBrand("パスコ", brands, aliases)).toBe("PASCO");
    expect(resolveBrand("  パスコ  ", brands, aliases)).toBe("PASCO");
  });
  it("uses the existing spelling of a brand", () => {
    expect(resolveBrand("pasco", brands, aliases)).toBe("PASCO");
    expect(resolveBrand("ＰＡＳＣＯ", brands, aliases)).toBe("PASCO");
  });
  it("keeps a new brand as typed", () => {
    expect(resolveBrand("  ヤマザキ  ", brands, aliases)).toBe("ヤマザキ");
  });
});

describe("suggestBrands", () => {
  it("suggests the brand of a matching alias first", () => {
    expect(suggestBrands("パス", brands, aliases)[0].name).toBe("PASCO");
  });
  it("lists the most used brands when nothing is typed", () => {
    expect(suggestBrands("", brands, aliases)[0].name).toBe("PASCO");
  });
  it("does not list a brand twice", () => {
    const names = suggestBrands("pasco", brands, aliases).map((b) => b.name);
    expect(names.filter((n) => n === "PASCO")).toHaveLength(1);
  });
});
