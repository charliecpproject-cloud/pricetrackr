import { describe, expect, it } from "vitest";
import { SEARCH_SCOPES, parseSearchScope, searchPlaceholder } from "./scope";

describe("parseSearchScope", () => {
  it("accepts the known scopes", () => {
    expect(parseSearchScope("category")).toBe("category");
    expect(parseSearchScope("name")).toBe("name");
  });

  it("falls back to all", () => {
    expect(parseSearchScope(undefined)).toBe("all");
    expect(parseSearchScope("nope")).toBe("all");
    expect(parseSearchScope("brand")).toBe("all");
    expect(parseSearchScope(["category", "name"])).toBe("category");
  });
});

describe("searchPlaceholder", () => {
  it("names the field that is searched", () => {
    expect(searchPlaceholder("category")).toContain("カテゴリ");
    expect(searchPlaceholder("all")).toContain("商品名");
  });
});

describe("SEARCH_SCOPES", () => {
  it("has a short hint for every scope, so it fits on one line", () => {
    for (const scope of SEARCH_SCOPES) {
      expect(scope.hint.length).toBeGreaterThan(0);
      expect([...scope.hint].length).toBeLessThanOrEqual(24);
    }
  });
});
