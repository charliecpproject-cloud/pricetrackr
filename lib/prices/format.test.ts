import { describe, it, expect } from "vitest";
import { packageLabel } from "./format";

describe("packageLabel", () => {
  it('returns "44枚" for unit "sheet"', () => {
    expect(packageLabel(44, "sheet")).toBe("44枚");
  });

  it('returns "1袋" for unit "bag"', () => {
    expect(packageLabel(1, "bag")).toBe("1袋");
  });
});
