import { describe, expect, it } from "vitest";
import {
  parseDisplayCount,
  parseSuggestionTerms,
  visibleSuggestions,
} from "./suggestions";

describe("parseDisplayCount", () => {
  it("accepts 1 to 10, also full-width", () => {
    expect(parseDisplayCount("3")).toBe(3);
    expect(parseDisplayCount("５")).toBe(5);
    expect(parseDisplayCount("10")).toBe(10);
  });

  it("rejects everything else", () => {
    for (const bad of ["0", "11", "-1", "2.5", "abc", "", null, undefined]) {
      expect(parseDisplayCount(bad as string | null | undefined)).toBeNull();
    }
  });
});

describe("parseSuggestionTerms", () => {
  it("splits on commas, full-width commas, 、 and line breaks, keeping the order", () => {
    const result = parseSuggestionTerms("ベビーフード, おむつ，牛乳、洗剤\nティッシュ");
    expect(result).toEqual({
      ok: true,
      terms: ["ベビーフード", "おむつ", "牛乳", "洗剤", "ティッシュ"],
    });
  });

  it("tidies spaces and drops empty parts", () => {
    expect(parseSuggestionTerms("  baby   food ,, , diapers ,")).toEqual({
      ok: true,
      terms: ["baby food", "diapers"],
    });
  });

  it("drops repeats, ignoring case and full-width letters", () => {
    expect(parseSuggestionTerms("Milk, milk, ｍｉｌｋ, 牛乳, 牛乳")).toEqual({
      ok: true,
      terms: ["Milk", "牛乳"],
    });
  });

  it("accepts an empty list", () => {
    expect(parseSuggestionTerms("")).toEqual({ ok: true, terms: [] });
    expect(parseSuggestionTerms(" , ,\n")).toEqual({ ok: true, terms: [] });
  });

  it("refuses a term that is too long", () => {
    expect(parseSuggestionTerms("あ".repeat(30)).ok).toBe(true);
    expect(parseSuggestionTerms("あ".repeat(31)).ok).toBe(false);
  });

  it("refuses characters the search box removes", () => {
    for (const bad of ["a(b", "100%", "a_b", "a*b", "a\\b", "a)b"]) {
      expect(parseSuggestionTerms(bad).ok).toBe(false);
    }
  });

  it("refuses more than 30 terms", () => {
    const many = Array.from({ length: 31 }, (_, i) => `語${i}`).join(",");
    expect(parseSuggestionTerms(many).ok).toBe(false);
    const thirty = Array.from({ length: 30 }, (_, i) => `語${i}`).join(",");
    expect(parseSuggestionTerms(thirty).ok).toBe(true);
  });
});

describe("visibleSuggestions", () => {
  const terms = ["a", "b", "c", "d", "e"];

  it("shows the first terms up to the count", () => {
    expect(visibleSuggestions(terms, 3)).toEqual(["a", "b", "c"]);
    expect(visibleSuggestions(terms, 5)).toEqual(terms);
  });

  it("shows everything when the count is larger than the list", () => {
    expect(visibleSuggestions(terms, 10)).toEqual(terms);
    expect(visibleSuggestions([], 3)).toEqual([]);
  });

  it("shows nothing for a count below 1", () => {
    expect(visibleSuggestions(terms, 0)).toEqual([]);
    expect(visibleSuggestions(terms, Number.NaN)).toEqual([]);
  });
});