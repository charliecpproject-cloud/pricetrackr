import { describe, it, expect } from "vitest";
import {
  normalizeAttributes,
  duplicateAttributeName,
  variationKey,
  variationLabel,
  parseAttributes,
} from "./variation";

describe("normalizeAttributes", () => {
  it("trims, converts full-width characters and drops incomplete rows", () => {
    expect(
      normalizeAttributes([
        { name: " サイズ ", value: "Ｍ" },
        { name: "", value: "x" },
        { name: "色", value: "  " },
      ])
    ).toEqual([{ name: "サイズ", value: "M" }]);
  });
});

describe("variationKey", () => {
  const a = [
    { name: "タイプ", value: "パンツ" },
    { name: "サイズ", value: "M" },
  ];
  it("ignores row order, letter case and full-width characters", () => {
    expect(
      variationKey([
        { name: "サイズ", value: "ｍ" },
        { name: " タイプ ", value: "パンツ" },
      ])
    ).toBe(variationKey(a));
  });
  it("differs when a value differs", () => {
    expect(
      variationKey([
        { name: "タイプ", value: "パンツ" },
        { name: "サイズ", value: "L" },
      ])
    ).not.toBe(variationKey(a));
  });
  it("differs when an attribute is missing", () => {
    expect(variationKey([{ name: "タイプ", value: "パンツ" }])).not.toBe(variationKey(a));
  });
});

describe("duplicateAttributeName", () => {
  it("finds a repeated name", () => {
    expect(
      duplicateAttributeName([
        { name: "サイズ", value: "M" },
        { name: "サイズ", value: "L" },
      ])
    ).toBe("サイズ");
  });
  it("returns null when names are unique", () => {
    expect(
      duplicateAttributeName([
        { name: "サイズ", value: "M" },
        { name: "タイプ", value: "パンツ" },
      ])
    ).toBeNull();
  });
});

describe("variationLabel", () => {
  it("lists the rows in the order entered", () => {
    expect(
      variationLabel([
        { name: "タイプ", value: "パンツ" },
        { name: "サイズ", value: "M" },
      ])
    ).toBe("タイプ：パンツ / サイズ：M");
  });
});

describe("parseAttributes", () => {
  it("reads valid rows and ignores bad data", () => {
    expect(parseAttributes([{ name: "サイズ", value: "M" }, { name: 1 }, null])).toEqual([
      { name: "サイズ", value: "M" },
    ]);
    expect(parseAttributes(null)).toEqual([]);
    expect(parseAttributes("x")).toEqual([]);
  });
});