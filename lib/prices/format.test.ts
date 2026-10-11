import { describe, it, expect } from "vitest";
import { formatYen, formatJst, packageLabel } from "./format";

describe("formatYen", () => {
  it("formats integer values with thousands separators", () => {
    expect(formatYen(1280)).toBe("¥1,280");
  });

  it("keeps needed decimal part", () => {
    expect(formatYen(98.5)).toBe("¥98.5");
  });

  it("handles other integers", () => {
    expect(formatYen(205)).toBe("¥205");
  });
});

describe("formatJst", () => {
  it("converts UTC ISO to JST correctly", () => {
    // 2026-10-11T03:00:00+00:00 => 2026-10-11 12:00 JST
    expect(formatJst("2026-10-11T03:00:00+00:00")).toBe("2026/10/11 12:00");
  });

  it("handles ISO already in JST offset", () => {
    expect(formatJst("2026-10-11T14:35:00+09:00")).toBe("2026/10/11 14:35");
  });
});

describe("packageLabel", () => {
  it("formats integer size with unit", () => {
    expect(packageLabel(500, "ml")).toBe("500 ml");
  });

  it("removes trailing zeros from string input", () => {
    expect(packageLabel("1000.0", "ml")).toBe("1000 ml");
  });
});
