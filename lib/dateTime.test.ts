import { describe, expect, it } from "vitest";
import { formatDateTime } from "./dateTime";

const now = new Date("2026-10-18T05:00:00Z"); // 14:00 JST on the 18th

describe("formatDateTime", () => {
  it("today", () => {
    expect(formatDateTime("2026-10-18T01:30:00Z", now)).toBe("今日 10:30");
  });

  it("uses the Japan date, not the UTC date", () => {
    expect(formatDateTime("2026-10-17T16:00:00Z", now)).toBe("今日 01:00");
  });

  it("yesterday", () => {
    expect(formatDateTime("2026-10-17T10:00:00Z", now)).toBe("昨日 19:00");
  });

  it("older in the same year has no year", () => {
    expect(formatDateTime("2026-10-10T00:00:00Z", now)).toBe("10/10 09:00");
  });

  it("another year shows the year", () => {
    expect(formatDateTime("2025-12-20T10:19:00Z", now)).toBe("2025/12/20 19:19");
  });

  it("returns an empty text for a bad date", () => {
    expect(formatDateTime("nope", now)).toBe("");
  });
});