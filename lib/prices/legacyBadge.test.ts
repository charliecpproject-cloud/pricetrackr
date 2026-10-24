import { describe, expect, it } from "vitest";
import { legacyBadgeIds } from "./legacyBadge";

const now = new Date("2026-10-25T12:00:00+09:00");

describe("legacyBadgeIds", () => {
  it("shows the badge for legacy prices from the last 6 months", () => {
    const ids = legacyBadgeIds([{ product_id: "a", open_packages: 1, latest_at: "2026-05-01T00:00:00Z" }], now);
    expect(ids.has("a")).toBe(true);
  });
  it("hides it for older prices", () => {
    const ids = legacyBadgeIds([{ product_id: "a", open_packages: 2, latest_at: "2026-04-01T00:00:00Z" }], now);
    expect(ids.has("a")).toBe(false);
  });
  it("hides it when nothing is open or there is no date", () => {
    const ids = legacyBadgeIds(
      [
        { product_id: "a", open_packages: 0, latest_at: "2026-10-01T00:00:00Z" },
        { product_id: "b", open_packages: 1, latest_at: null },
      ],
      now
    );
    expect(ids.size).toBe(0);
  });
});