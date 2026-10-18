import { describe, expect, it } from "vitest";
import { formatActivityTime } from "./format";

const now = new Date("2026-10-18T05:00:00Z"); // 14:00 JST on the 18th

describe("formatActivityTime", () => {
  it("today", () => {
    expect(formatActivityTime("2026-10-18T01:30:00Z", now)).toBe("今日 10:30");
  });

  it("uses the Japan date, not the UTC date", () => {
    expect(formatActivityTime("2026-10-17T16:00:00Z", now)).toBe("今日 01:00");
  });

  it("yesterday", () => {
    expect(formatActivityTime("2026-10-17T10:00:00Z", now)).toBe("昨日 19:00");
  });

  it("older", () => {
    expect(formatActivityTime("2026-10-10T00:00:00Z", now)).toBe("10/10 09:00");
  });

  it("returns an empty text for a bad date", () => {
    expect(formatActivityTime("nope", now)).toBe("");
  });
});