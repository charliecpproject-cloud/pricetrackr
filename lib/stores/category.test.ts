import { describe, expect, it } from "vitest";
import { groupByCategory, saleLabel } from "./category";

describe("saleLabel", () => {
  it("is 特売 for supermarkets and drugstores", () => {
    expect(saleLabel("supermarket")).toBe("特売");
    expect(saleLabel("drugstore")).toBe("特売");
  });
  it("is セール for everything else", () => {
    expect(saleLabel("apparel")).toBe("セール");
    expect(saleLabel("convenience")).toBe("セール");
    expect(saleLabel(null)).toBe("セール");
  });
});

describe("groupByCategory", () => {
  it("follows the category list order and puts uncategorized last", () => {
    const groups = groupByCategory([
      { id: 1, category: null },
      { id: 2, category: "apparel" as const },
      { id: 3, category: "supermarket" as const },
      { id: 4, category: "supermarket" as const },
    ]);
    expect(groups.map((g) => g.label)).toEqual([
      "スーパー",
      "アパレル",
      "未分類",
    ]);
    expect(groups[0].items.map((i) => i.id)).toEqual([3, 4]);
  });
});
