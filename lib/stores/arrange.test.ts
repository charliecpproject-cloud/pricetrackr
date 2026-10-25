import { describe, expect, it } from "vitest";
import { arrangeChains } from "./arrange";
import { parseCategory, type StoreCategory } from "./category";

const chain = (
  id: string,
  name: string,
  category: StoreCategory | null,
  entries: number,
  createdAt = "2026-01-01T00:00:00Z",
) => ({ id, name, category, entries, createdAt });

describe("arrangeChains", () => {
  it("orders categories by total use, uncategorized last, and chains by use", () => {
    const { sorted } = arrangeChains([
      chain("A", "ライフ", "supermarket", 5),
      chain("B", "西友", "supermarket", 20),
      chain("C", "マツキヨ", "drugstore", 30),
      chain("D", "未設定の店", null, 100),
      chain("E", "ココカラ", "drugstore", 1),
    ]);
    expect(sorted.map((c) => c.id)).toEqual(["C", "E", "B", "A", "D"]);
  });

  it("takes the most used chains for the short list", () => {
    const { topIds } = arrangeChains(
      [
        chain("A", "a", "supermarket", 5),
        chain("B", "b", "supermarket", 20),
        chain("C", "c", "drugstore", 30),
        chain("D", "d", null, 100),
      ],
      3,
    );
    expect(topIds).toEqual(["D", "C", "B"]);
  });

  it("fills the short list with the newest chains when few are used", () => {
    const { topIds } = arrangeChains(
      [
        chain("x", "old", null, 0, "2026-01-01T00:00:00Z"),
        chain("y", "new", null, 0, "2026-09-01T00:00:00Z"),
        chain("z", "used", null, 2),
      ],
      3,
    );
    expect(topIds).toEqual(["z", "y", "x"]);
  });
});

describe("parseCategory", () => {
  it("accepts known keys and rejects anything else", () => {
    expect(parseCategory("supermarket")).toBe("supermarket");
    expect(parseCategory("スーパー")).toBeNull();
    expect(parseCategory("")).toBeNull();
    expect(parseCategory(null)).toBeNull();
  });
});
