import { describe, expect, it } from "vitest";
import { parseSort, sortProductCards, type SortableCard } from "./sort";

type Card = SortableCard & { name: string };
type Item = SortableCard["items"][number];

const row = (effective: number, observedAt: string) => ({
  effective,
  observedAt,
});
const item = (favorite: Item["favorite"], rows: Item["rows"]): Item => ({
  favorite,
  rows,
});
const card = (name: string, items: Item[]): Card => ({ name, items });
const names = (cards: Card[]) => cards.map((c) => c.name);

describe("parseSort", () => {
  it("reads the three sorts", () => {
    expect(parseSort("cheap")).toBe("cheap");
    expect(parseSort("recent")).toBe("recent");
    expect(parseSort("fav")).toBe("fav");
  });

  it("takes the first of a repeated value and ignores anything else", () => {
    expect(parseSort(["cheap", "fav"])).toBe("cheap");
    for (const raw of ["", "name", "x", undefined, null, 5, []]) {
      expect(parseSort(raw)).toBeNull();
    }
  });
});

describe("sortProductCards", () => {
  const cards = [
    card("none", [item("none", [])]),
    card("pricey", [item("none", [row(300, "2026-10-01T00:00:00+00:00")])]),
    card("cheapest", [
      item("none", [row(500, "2026-09-01T00:00:00+00:00")]),
      item("none", [row(100, "2026-08-01T00:00:00+00:00")]),
    ]),
    card("newest", [item("none", [row(200, "2026-10-20T00:00:00+00:00")])]),
  ];

  it("cheap: the lowest price of any size first, no price last", () => {
    expect(names(sortProductCards(cards, "cheap"))).toEqual([
      "cheapest",
      "newest",
      "pricey",
      "none",
    ]);
  });

  it("recent: the newest price first, no price last", () => {
    expect(names(sortProductCards(cards, "recent"))).toEqual([
      "newest",
      "pricey",
      "cheapest",
      "none",
    ]);
  });

  it("fav: favorites, then related, then the rest, keeping the order inside each", () => {
    const list = [
      card("a", [item("none", [])]),
      card("b", [item("related", [])]),
      card("c", [item("none", []), item("favorite", [])]),
      card("d", [item("none", [])]),
      card("e", [item("favorite", [])]),
    ];
    expect(names(sortProductCards(list, "fav"))).toEqual([
      "c",
      "e",
      "b",
      "a",
      "d",
    ]);
  });

  it("keeps the order of equal products and does not change the list", () => {
    const same = [
      card("x", [item("none", [row(100, "2026-10-01T00:00:00+00:00")])]),
      card("y", [item("none", [row(100, "2026-10-01T00:00:00+00:00")])]),
    ];
    expect(names(sortProductCards(same, "cheap"))).toEqual(["x", "y"]);
    expect(names(sortProductCards(same, "recent"))).toEqual(["x", "y"]);
    expect(names(cards)).toEqual(["none", "pricey", "cheapest", "newest"]);
  });
});
