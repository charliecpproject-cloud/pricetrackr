import { describe, expect, it } from "vitest";
import { normalizeBarcode, parseBarcodes } from "./barcode";

describe("normalizeBarcode", () => {
  it("keeps a normal EAN-13", () => {
    expect(normalizeBarcode("4901234567894")).toBe("4901234567894");
  });

  it("converts full-width digits and removes spaces and hyphens", () => {
    expect(normalizeBarcode("４９０１ 2345-67894")).toBe("4901234567894");
  });

  it("stores a 12-digit UPC-A as 13 digits", () => {
    expect(normalizeBarcode("036000291452")).toBe("0036000291452");
  });

  it("upper-cases letters", () => {
    expect(normalizeBarcode("abc123")).toBe("ABC123");
  });

  it("rejects unusable text", () => {
    expect(normalizeBarcode("12")).toBeNull();
    expect(normalizeBarcode("ab cd!")).toBeNull();
    expect(normalizeBarcode("")).toBeNull();
  });
});

describe("parseBarcodes", () => {
  it("skips empty values and removes duplicates", () => {
    expect(parseBarcodes(["4901234567894", "", "  ", "4901 234567894", null])).toEqual({
      ok: true,
      codes: ["4901234567894"],
    });
  });

  it("reports an invalid code", () => {
    const result = parseBarcodes(["12"]);
    expect(result.ok).toBe(false);
  });

  it("allows at most 10 codes", () => {
    const many = Array.from({ length: 11 }, (_, i) => `49012345678${String(i).padStart(2, "0")}`);
    expect(parseBarcodes(many).ok).toBe(false);
  });
});