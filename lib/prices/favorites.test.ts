import { describe, expect, it } from "vitest";
import { favoriteGroupKey, favoriteLevel } from "./favorites";

// The favorite: pants-type diapers, 70 pieces.
const favoriteIds = new Set(["pants-70"]);
const favoriteGroups = new Set([favoriteGroupKey("diaper", "pants")]);

describe("favoriteLevel", () => {
  it("is favorite for the favorite package itself", () => {
    expect(
      favoriteLevel("pants-70", "diaper", "pants", favoriteIds, favoriteGroups),
    ).toBe("favorite");
  });

  it("is related for another size of the same product and variation", () => {
    expect(
      favoriteLevel("pants-50", "diaper", "pants", favoriteIds, favoriteGroups),
    ).toBe("related");
    expect(
      favoriteLevel("pants-90", "diaper", "pants", favoriteIds, favoriteGroups),
    ).toBe("related");
  });

  it("is none for another variation of the same product", () => {
    expect(
      favoriteLevel("tape-50", "diaper", "tape", favoriteIds, favoriteGroups),
    ).toBe("none");
  });

  it("is none for another product", () => {
    expect(
      favoriteLevel("milk-1", "milk", null, favoriteIds, favoriteGroups),
    ).toBe("none");
  });

  it("treats a missing variation as one group", () => {
    const ids = new Set(["milk-1000"]);
    const groups = new Set([favoriteGroupKey("milk", null)]);
    expect(favoriteLevel("milk-500", "milk", undefined, ids, groups)).toBe(
      "related",
    );
    expect(favoriteLevel("milk-1000", "milk", null, ids, groups)).toBe(
      "favorite",
    );
  });

  it("is none when there are no favorites", () => {
    expect(
      favoriteLevel("pants-70", "diaper", "pants", new Set(), new Set()),
    ).toBe("none");
  });
});
