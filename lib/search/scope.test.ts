import { describe, expect, it } from "vitest";
import { parseSearchScope, searchPlaceholder } from "./scope";

describe("parseSearchScope", () => {
  it("accepts the known scopes", () => {
    expect(parseSearchScope("category")).toBe("category");
    expect(parseSearchScope("name")).toBe("name");
  });

  it("falls back to all", () => {
    expect(parseSearchScope(undefined)).toBe("all");
    expect(parseSearchScope("nope")).toBe("all");
    expect(parseSearchScope(["brand", "name"])).toBe("brand");
  });
});

describe("searchPlaceholder", () => {
  it("names the field that is searched", () => {
    expect(searchPlaceholder("category")).toContain("カテゴリ");
    expect(searchPlaceholder("all")).toContain("商品名");
  });
});