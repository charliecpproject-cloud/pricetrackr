import { describe, it, expect } from "vitest";
import { packageLabel } from "./format";

describe("packageLabel", () => {
  it('returns "44枚" for unit "sheet"', () => {
    expect(packageLabel(44, "sheet")).toBe("44枚");
  });

  it('returns "1袋" for unit "bag"', () => {
    expect(packageLabel(1, "bag")).toBe("1袋");
  });

  it('returns "2個" for unit "count"', () => {
    expect(packageLabel(2, "count")).toBe("2個");
  });

  it("shows other counter words without a space", () => {
    expect(packageLabel(6, "本")).toBe("6本");
    expect(packageLabel(1, "パック")).toBe("1パック");
    expect(packageLabel(3, "切れ")).toBe("3切れ");
  });

  it("shows measures with a space", () => {
    expect(packageLabel(500, "ml")).toBe("500 ml");
    expect(packageLabel(1.5, "L")).toBe("1.5 L");
    expect(packageLabel("1000.0", "ml")).toBe("1000 ml");
  });
});