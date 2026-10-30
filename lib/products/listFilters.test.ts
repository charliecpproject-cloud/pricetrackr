import { describe, expect, it } from "vitest";
import {
  countActiveProductFilters,
  filterList,
  parseProductFilters,
  sortList,
  topValues,
  type ListItem,
} from "./listFilters";

describe("parseProductFilters", () => {
  it("returns defaults for an empty URL", () => {
    const f = parseProductFilters({});
    expect(f).toEqual({
      category: null,
      brand: null,
      prices: "all",
      variations: "all",
      sort: null,
    });
    expect(countActiveProductFilters(f)).toBe(0);
  });

  it("reads the values", () => {
    const f = parseProductFilters({
      cat: " パン ",
      brand: "PASCO",
      pr: "without",
      var: "with",
      sort: "price",
    });
    expect(f).toEqual({
      category: "パン",
      brand: "PASCO",
      prices: "without",
      variations: "with",
      sort: "price",
    });
    expect(countActiveProductFilters(f)).toBe(5);
  });

  it("ignores invalid values and takes the first of a repeated one", () => {
    const f = parseProductFilters({
      cat: ["a", "b"],
      brand: "  ",
      pr: "x",
      var: "yes",
      sort: "cheap",
    });
    expect(f.category).toBe("a");
    expect(f.brand).toBeNull();
    expect(f.prices).toBe("all");
    expect(f.variations).toBe("all");
    expect(f.sort).toBeNull();
  });

  it("cuts a very long text", () => {
    expect(
      parseProductFilters({ cat: "あ".repeat(300) }).category,
    ).toHaveLength(100);
  });
});

describe("topValues", () => {
  const values = ["b", "b", "a", "c", "c", "c", null, " ", ""];

  it("counts, skips empty values and orders by name", () => {
    expect(topValues(values)).toEqual({
      options: [
        { value: "a", count: 1 },
        { value: "b", count: 2 },
        { value: "c", count: 3 },
      ],
      total: 3,
    });
  });

  it("keeps the most used when there are too many", () => {
    const result = topValues(values, 2);
    expect(result.options.map((o) => o.value)).toEqual(["b", "c"]);
    expect(result.total).toBe(3);
  });

  it("still lists the value from the URL", () => {
    expect(topValues(values, 2, "a").options.map((o) => o.value)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(topValues(values, 2, "zzz").options.at(-1)).toEqual({
      value: "zzz",
      count: 0,
    });
  });
});

const item = (name: string, extra: Partial<ListItem> = {}): ListItem => ({
  name,
  createdAt: "2026-01-01T00:00:00+00:00",
  variationCount: 0,
  hasPrices: false,
  latestPriceAt: null,
  ...extra,
});
const names = (list: ListItem[]) => list.map((i) => i.name);

describe("filterList", () => {
  const list = [
    item("a", { variationCount: 2, hasPrices: true }),
    item("b", { variationCount: 0, hasPrices: true }),
    item("c", { variationCount: 1, hasPrices: false }),
    item("d", { variationCount: 0, hasPrices: null }),
  ];
  const all = { prices: "all", variations: "all" } as const;

  it("keeps everything by default", () => {
    expect(names(filterList(list, all))).toEqual(["a", "b", "c", "d"]);
  });

  it("filters by variations", () => {
    expect(names(filterList(list, { ...all, variations: "with" }))).toEqual([
      "a",
      "c",
    ]);
    expect(names(filterList(list, { ...all, variations: "without" }))).toEqual([
      "b",
      "d",
    ]);
  });

  it("filters by price records and skips products whose records are not known", () => {
    expect(names(filterList(list, { ...all, prices: "with" }))).toEqual([
      "a",
      "b",
      "d",
    ]);
    expect(names(filterList(list, { ...all, prices: "without" }))).toEqual([
      "c",
      "d",
    ]);
  });
});

describe("sortList", () => {
  const list = [
    item("banana", { createdAt: "2026-03-01T00:00:00+00:00" }),
    item("apple", {
      createdAt: "2026-05-01T00:00:00+00:00",
      latestPriceAt: "2026-06-01T00:00:00+00:00",
    }),
    item("cherry", {
      createdAt: "2026-04-01T00:00:00+00:00",
      latestPriceAt: "2026-07-01T00:00:00+00:00",
    }),
  ];

  it("keeps the order with null and does not change the list", () => {
    expect(names(sortList(list, null))).toEqual(["banana", "apple", "cherry"]);
    expect(names(list)).toEqual(["banana", "apple", "cherry"]);
  });

  it("sorts by name", () => {
    expect(names(sortList(list, "name"))).toEqual([
      "apple",
      "banana",
      "cherry",
    ]);
  });

  it("sorts the newest added first", () => {
    expect(names(sortList(list, "new"))).toEqual(["apple", "cherry", "banana"]);
  });

  it("sorts the newest price first, products without a price last", () => {
    expect(names(sortList(list, "price"))).toEqual([
      "cherry",
      "apple",
      "banana",
    ]);
  });
});
