import { describe, expect, it } from "vitest";
import { priceAge } from "./dateTime";

// 2026-10-23 12:00 in Japan
const now = new Date("2026-10-23T03:00:00Z");

describe("priceAge", () => {
  it("counts days in Japan time", () => {
    // 2026-10-23 01:00 JST is still today
    expect(priceAge("2026-10-22T16:00:00Z", now)).toEqual({ label: "今日", level: "fresh" });
    expect(priceAge("2026-10-22T10:00:00Z", now)).toEqual({ label: "昨日", level: "fresh" });
    expect(priceAge("2026-10-20T03:00:00Z", now)).toEqual({ label: "3日前", level: "fresh" });
  });

  it("switches to months and changes colour level", () => {
    expect(priceAge("2026-09-23T03:00:00Z", now)).toEqual({ label: "1か月前", level: "fresh" });
    expect(priceAge("2026-09-22T03:00:00Z", now)).toEqual({ label: "1か月前", level: "aging" });
    expect(priceAge("2026-08-24T03:00:00Z", now)).toEqual({ label: "2か月前", level: "aging" });
    expect(priceAge("2026-07-23T03:00:00Z", now)).toEqual({ label: "3か月前", level: "old" });
  });

  it("switches to years and handles bad input", () => {
    expect(priceAge("2025-10-23T03:00:00Z", now)).toEqual({ label: "1年前", level: "old" });
    expect(priceAge("2026-10-25T03:00:00Z", now)).toEqual({ label: "今日", level: "fresh" });
    expect(priceAge("not a date", now)).toBeNull();
  });
});