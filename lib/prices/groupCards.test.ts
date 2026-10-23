import { describe, expect, it } from "vitest";
import { defaultGroupIndex, groupByVariation, sortBySize } from "./groupCards";

function item(
  id: string,
  variationId: string | null,
  variationLabel: string | null,
  sizeValue: number,
  unit: string,
  favorite = "none"
) {
  return { id, variationId, variationLabel, sizeValue, unit, favorite };
}

describe("sortBySize", () => {
  it("sorts small to large across ml and L", () => {
    const sorted = sortBySize([
      item("2l", null, null, 2, "L"),
      item("500", null, null, 500, "ml"),
      item("1l", null, null, 1, "L"),
    ]);
    expect(sorted.map((i) => i.id)).toEqual(["500", "1l", "2l"]);
  });

  it("puts measures before counter words", () => {
    const sorted = sortBySize([
      item("pack", null, null, 6, "パック"),
      item("g", null, null, 200, "g"),
    ]);
    expect(sorted.map((i) => i.id)).toEqual(["g", "pack"]);
  });
});

describe("groupByVariation", () => {
  it("makes one group per variation, no-variation last", () => {
    const groups = groupByVariation([
      item("a", "v2", "ice", 500, "ml"),
      item("b", null, null, 1, "個"),
      item("c", "v1", "hot", 500, "ml"),
      item("d", "v1", "hot", 1, "L"),
    ]);
    expect(groups.map((g) => g.key)).toEqual(["v1", "v2", "none"]);
    expect(groups.map((g) => g.label)).toEqual(["hot", "ice", "バリエーションなし"]);
    expect(groups[0].items.map((i) => i.id)).toEqual(["c", "d"]);
  });

  it("gives a variation without a label a fallback name", () => {
    const groups = groupByVariation([item("a", "v1", null, 1, "個")]);
    expect(groups[0].label).toBe("バリエーション");
  });
});

describe("defaultGroupIndex", () => {
  it("selects the group with a favorite, else the first", () => {
    const withFavorite = groupByVariation([
      item("a", "v1", "hot", 1, "個"),
      item("b", "v2", "ice", 1, "個", "favorite"),
    ]);
    expect(defaultGroupIndex(withFavorite)).toBe(1);
    const without = groupByVariation([
      item("a", "v1", "hot", 1, "個"),
      item("b", "v2", "ice", 1, "個", "related"),
    ]);
    expect(defaultGroupIndex(without)).toBe(0);
  });
});